// ============================================================
// RP ENGINE — A+ Autoregulation Layer (Workstream B, §3.5)
// ============================================================

const RP_STALE_BW_MS = 30 * 24 * 60 * 60 * 1000;        // 30 days
const RP_RECENCY_SESSIONS = 3;
const RP_RECENCY_WEIGHTS = [0.5, 0.3, 0.2];               // most recent first
const RP_HIGH_CONFIDENCE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

// ---- Bodyweight lookup ----------------------------------------

// Returns null when no measurements exist (caller shows bodyweight prompt).
// Returns { value: number, stale: boolean } otherwise.
// stale=true when the latest entry is >30 days before dateMs (§9.1 [N-12]).
function userBodyweightAt(dateMs) {
  const u = userData();
  if (!u) return null;

  const entries = (u.measurements || [])
    .filter(m => m.weight > 0)
    .map(m => ({
      dateMs: typeof m.date === "string" ? Date.parse(m.date) : Number(m.date),
      weight: m.weight,
    }))
    .filter(e => !isNaN(e.dateMs))
    .sort((a, b) => a.dateMs - b.dateMs);

  if (!entries.length) return null;

  const first = entries[0];
  const last  = entries[entries.length - 1];
  let value;

  if (dateMs <= first.dateMs) {
    value = first.weight;
  } else if (dateMs >= last.dateMs) {
    value = last.weight;
  } else {
    for (let i = 0; i < entries.length - 1; i++) {
      const a = entries[i], b = entries[i + 1];
      if (dateMs >= a.dateMs && dateMs <= b.dateMs) {
        const t = (dateMs - a.dateMs) / (b.dateMs - a.dateMs);
        value = a.weight + (b.weight - a.weight) * t;
        break;
      }
    }
    if (value === undefined) value = last.weight; // defensive
  }

  const stale = (dateMs - last.dateMs) > RP_STALE_BW_MS;
  return { value, stale };
}

// ---- Bodyweight e1RM ----------------------------------------

// For pullups / dips / push-ups: true load = bodyweight + added weight.
function bodyweightE1RM(set, userBwAtSessionTime) {
  const totalLoad = userBwAtSessionTime + (set.weight || 0);
  return calcE1RM(totalLoad, set.reps);
}

// ---- Recent e1RM with recency weighting ----------------------

// Returns { value, confidence, sampleSize, reason }
// confidence: "high" | "med" | "low" | "cold-start"
function recentE1RM(exId, opts) {
  opts = opts || {};
  const u = userData();
  if (!u) return { value: null, confidence: "cold-start", sampleSize: 0, reason: "no user" };

  const lib = LIB_BY_ID[exId];
  const isBw = lib ? !!lib.bodyweight : false;
  const N    = opts.sessions || RP_RECENCY_SESSIONS;
  const now  = opts.now     || Date.now();

  // Collect last N sessions that contain this exercise (newest first)
  const withEx = [];
  for (let i = u.sessions.length - 1; i >= 0 && withEx.length < N; i--) {
    const s = u.sessions[i];
    const exSets = (s.sets || []).filter(set => set.exId === exId);
    if (!exSets.length) continue;
    withEx.push({ session: s, sets: exSets });
  }

  if (!withEx.length) {
    return { value: null, confidence: "cold-start", sampleSize: 0, reason: "no history" };
  }

  // Best e1RM per session
  const sessionData = [];
  for (const { session, sets } of withEx) {
    let best = 0;
    for (const set of sets) {
      if (!set.reps || set.reps <= 0) continue;
      let e;
      if (isBw) {
        const sessionTime = session.finishedAt || session.startedAt || now;
        const bwData = userBodyweightAt(sessionTime);
        if (!bwData) continue; // can't compute without bodyweight at that time
        e = bodyweightE1RM(set, bwData.value);
      } else {
        if (!set.weight || set.weight <= 0) continue;
        e = calcE1RM(set.weight, set.reps);
      }
      if (e > best) best = e;
    }
    if (best > 0) {
      sessionData.push({ e1rm: best, finishedAt: session.finishedAt || now });
    }
  }

  if (!sessionData.length) {
    return { value: null, confidence: "cold-start", sampleSize: 0, reason: "no computable sets" };
  }

  // Recency-weighted average
  let weightedSum = 0, totalWeight = 0;
  sessionData.forEach((item, idx) => {
    const w = idx < RP_RECENCY_WEIGHTS.length
      ? RP_RECENCY_WEIGHTS[idx]
      : RP_RECENCY_WEIGHTS[RP_RECENCY_WEIGHTS.length - 1];
    weightedSum += item.e1rm * w;
    totalWeight += w;
  });
  const value = weightedSum / totalWeight;

  // Confidence classification (§3.5.1)
  const n = sessionData.length;
  const allRecent = sessionData.every(x => (now - x.finishedAt) < RP_HIGH_CONFIDENCE_WINDOW_MS);
  let confidence;
  if      (n >= 3 && allRecent) confidence = "high";
  else if (n >= 2 || allRecent) confidence = "med";
  else                          confidence = "low";

  return { value, confidence, sampleSize: n, reason: "history" };
}

// ---- Weight rounding ----------------------------------------

function rpRoundWeight(exId, w) {
  if (!w || w <= 0) return 0;
  const lib = LIB_BY_ID[exId];
  const incr = state.unit === "lbs" ? 5 : 2.5;
  // DB/KB: same plate increment (5 lbs / 2.5 kg), just round to nearest
  return Math.max(0, Math.round(w / incr) * incr);
}

// ---- Suggested weight (core A+ API, §3.5.2) -----------------

// Returns { weight, confidence, reason }
// reason: 'history' | 'cold-start' | 'needs-bodyweight' | 'needs-rpe-calibration'
// weight is null for any reason other than 'history' — no silent defaults (§1.1).
function suggestedWeight(exId, targetReps, targetRIR, opts) {
  opts = opts || {};
  const u = userData();
  if (!u || !u.rp || !u.rp.enabled) {
    return { weight: null, confidence: null, reason: "disabled" };
  }

  const lib = LIB_BY_ID[exId];
  if (!lib || lib.noRpe) {
    return { weight: null, confidence: null, reason: "not applicable" };
  }

  const now = opts.now || Date.now();

  // RPE calibration must fire once before suggestions start (§6 row 2)
  if (!u.rp.rpeCalibrationCompletedAt) {
    return { weight: null, confidence: null, reason: "needs-rpe-calibration" };
  }

  // Bodyweight exercises need current user bodyweight (§6 row 1)
  const isBw = !!lib.bodyweight;
  let bwData = null;
  if (isBw) {
    bwData = userBodyweightAt(now);
    if (!bwData) {
      return { weight: null, confidence: null, reason: "needs-bodyweight" };
    }
  }

  // e1RM from history
  const est = recentE1RM(exId, { now });

  if (est.confidence === "cold-start") {
    // Check for a user-provided cold-start anchor (§3.8)
    const anchor = u.rp.coldStartAnchors && u.rp.coldStartAnchors[exId];
    if (!anchor) {
      return { weight: null, confidence: "cold-start", reason: "cold-start" };
    }
    // Compute e1RM from anchor
    const anchorLoad = isBw
      ? (bwData ? bwData.value : 0) + (anchor.weight || 0)
      : anchor.weight;
    const anchorE1rm = calcE1RM(anchorLoad, anchor.reps);
    if (!anchorE1rm || anchorE1rm <= 0) {
      return { weight: null, confidence: "cold-start", reason: "cold-start" };
    }
    const rir  = targetRIR != null ? targetRIR : 2;
    const rawW = anchorE1rm / (1 + (targetReps + rir) / 30);
    return { weight: rpRoundWeight(exId, rawW), confidence: "low", reason: "history" };
  }

  if (!est.value || est.value <= 0) {
    return { weight: null, confidence: "cold-start", reason: "cold-start" };
  }

  // Solve Epley for target weight: weight = e1rm / (1 + (reps + RIR) / 30)
  const rir  = targetRIR != null ? targetRIR : 2;
  const rawW = est.value / (1 + (targetReps + rir) / 30);

  return { weight: rpRoundWeight(exId, rawW), confidence: est.confidence, reason: "history" };
}

// ---- RP Prompt Queue (session-level, not persisted, §9.1 [N-10]) ---

// Queue a prompt; silently drops duplicates (same type + exId).
function rpQueuePrompt(prompt) {
  if (!state._rpPromptQueue) state._rpPromptQueue = [];
  const dup = state._rpPromptQueue.some(
    p => p.type === prompt.type && p.exId === prompt.exId
  );
  if (!dup) state._rpPromptQueue.push(prompt);
}

// Return first pending prompt without removing it.
function rpPeekPrompt() {
  return (state._rpPromptQueue && state._rpPromptQueue[0]) || null;
}

// Remove one prompt from the front.
function rpDismissPromptType(type, exId) {
  if (!state._rpPromptQueue) return;
  state._rpPromptQueue = state._rpPromptQueue.filter(
    p => !(p.type === type && p.exId === exId)
  );
}

// ---- Inline prompt rendering --------------------------------

// Builds and returns a DOM element for a prompt card.
// type: 'rpe-calibration' | 'bodyweight' | 'cold-start'
function buildRpPromptEl(type, ex) {
  const exId   = ex ? (ex.exId || ex.name) : null;
  const exName = ex ? ex.name : "";

  const card = document.createElement("div");
  card.className = "rp-prompt rp-prompt-" + type;

  const q   = document.createElement("div");
  q.className = "rp-prompt-q";

  const ctx = document.createElement("div");
  ctx.className = "rp-prompt-ctx";

  const actions = document.createElement("div");
  actions.className = "rp-prompt-actions";

  if (type === "rpe-calibration") {
    q.textContent = "Set your effort scale";
    ctx.textContent =
      "RIR = Reps In Reserve. RIR 4 = 4 reps left. RIR 0 = failure. " +
      "Tap any RIR value after each set to calibrate your suggestions.";

    const saveBtn = document.createElement("button");
    saveBtn.className = "rp-prompt-save";
    saveBtn.textContent = "Got it — start tracking";
    saveBtn.onclick = () => {
      updateUser(u => {
        u.rp.rpeCalibrationCompletedAt = Date.now();
        u.rp.rpeCalibrationMethod = "self-reported";
      });
      rpDismissPromptType("rpe-calibration", null);
      renderWorkoutScreen();
    };

    const skipBtn = document.createElement("button");
    skipBtn.className = "rp-prompt-skip";
    skipBtn.textContent = "Skip for now";
    skipBtn.onclick = () => {
      rpDismissPromptType("rpe-calibration", null);
      renderWorkoutScreen();
    };

    actions.appendChild(saveBtn);
    actions.appendChild(skipBtn);

  } else if (type === "bodyweight") {
    q.textContent = "What's your current bodyweight?";
    ctx.textContent =
      "I need this to compute load on " + exName + ".";

    const inputRow = document.createElement("div");
    inputRow.className = "rp-prompt-input-row";

    const bwInput = document.createElement("input");
    bwInput.type = "number";
    bwInput.min = "50";
    bwInput.max = "500";
    bwInput.step = "1";
    bwInput.placeholder = state.unit === "lbs" ? "e.g. 185" : "e.g. 84";
    bwInput.className = "rp-prompt-number-input";

    const unitLabel = document.createElement("span");
    unitLabel.className = "rp-prompt-unit";
    unitLabel.textContent = state.unit;

    inputRow.appendChild(bwInput);
    inputRow.appendChild(unitLabel);

    const saveBtn = document.createElement("button");
    saveBtn.className = "rp-prompt-save";
    saveBtn.textContent = "Save";
    saveBtn.onclick = () => {
      const val = parseFloat(bwInput.value);
      if (!val || val <= 0) { bwInput.focus(); return; }
      updateUser(u => {
        if (!u.measurements) u.measurements = [];
        u.measurements.push({ date: new Date().toISOString().slice(0, 10), weight: val, unit: state.unit });
      });
      rpDismissPromptType("bodyweight", exId);
      renderWorkoutScreen();
    };

    const skipBtn = document.createElement("button");
    skipBtn.className = "rp-prompt-skip";
    skipBtn.textContent = "Skip for now";
    skipBtn.onclick = () => {
      rpDismissPromptType("bodyweight", exId);
      renderWorkoutScreen();
    };

    card.appendChild(q);
    card.appendChild(ctx);
    card.appendChild(inputRow);
    actions.appendChild(saveBtn);
    actions.appendChild(skipBtn);
    card.appendChild(actions);
    return card;

  } else if (type === "cold-start") {
    q.textContent = "First time logging " + exName;
    ctx.textContent = "Anchor today's weight so I can suggest next time.";

    const inputRow = document.createElement("div");
    inputRow.className = "rp-prompt-input-row";

    const wInput = document.createElement("input");
    wInput.type = "number";
    wInput.min = "0";
    wInput.step = state.unit === "lbs" ? "5" : "2.5";
    wInput.placeholder = "weight";
    wInput.className = "rp-prompt-number-input";

    const xSpan = document.createElement("span");
    xSpan.className = "rp-prompt-x";
    xSpan.textContent = "×";

    const rInput = document.createElement("input");
    rInput.type = "number";
    rInput.min = "1";
    rInput.max = "30";
    rInput.step = "1";
    rInput.placeholder = "reps";
    rInput.className = "rp-prompt-number-input rp-prompt-number-input-sm";

    inputRow.appendChild(wInput);
    inputRow.appendChild(xSpan);
    inputRow.appendChild(rInput);

    const saveBtn = document.createElement("button");
    saveBtn.className = "rp-prompt-save";
    saveBtn.textContent = "Save anchor";
    saveBtn.onclick = () => {
      const w = parseFloat(wInput.value);
      const r = parseInt(rInput.value, 10);
      if (!w || w <= 0 || !r || r <= 0) {
        if (!w || w <= 0) wInput.focus(); else rInput.focus();
        return;
      }
      updateUser(u => {
        if (!u.rp.coldStartAnchors) u.rp.coldStartAnchors = {};
        u.rp.coldStartAnchors[exId] = { weight: w, reps: r, dateMs: Date.now() };
      });
      rpDismissPromptType("cold-start", exId);
      renderWorkoutScreen();
    };

    const skipBtn = document.createElement("button");
    skipBtn.className = "rp-prompt-skip";
    skipBtn.textContent = "Skip — use gym default";
    skipBtn.onclick = () => {
      rpDismissPromptType("cold-start", exId);
      renderWorkoutScreen();
    };

    card.appendChild(q);
    card.appendChild(ctx);
    card.appendChild(inputRow);
    actions.appendChild(saveBtn);
    actions.appendChild(skipBtn);
    card.appendChild(actions);
    return card;
  }

  card.appendChild(q);
  card.appendChild(ctx);
  card.appendChild(actions);
  return card;
}

// ---- Suggestion chip ----------------------------------------

// Returns a DOM element showing "Suggested: X lbs — history" with a why chip.
function buildRpSuggestionChip(suggestion, unitStr) {
  const row = document.createElement("div");
  row.className = "rp-suggestion-row";

  const chip = document.createElement("div");
  chip.className = "rp-suggestion-chip rp-conf-" + (suggestion.confidence || "low");

  const label = document.createElement("span");
  label.className = "rp-suggestion-label";
  label.textContent = "Suggested";

  const val = document.createElement("span");
  val.className = "rp-suggestion-val";
  val.textContent = suggestion.weight + " " + (unitStr || "lbs");

  const why = document.createElement("span");
  why.className = "rp-suggestion-why";
  why.textContent = "Based on history";
  why.title = "Confidence: " + suggestion.confidence;

  chip.appendChild(label);
  chip.appendChild(val);
  chip.appendChild(why);
  row.appendChild(chip);
  return row;
}

// ---- Master: inject RP hint/prompt into a sets wrap element ---
// Called from renderSetsTable. Mutates wrap in place.
// _rpShownThisRender is a render-pass flag to enforce one prompt per view (§6).
function injectRpHint(wrap, ex, u) {
  if (!u || !u.rp || !u.rp.enabled) return;
  const exId = ex ? (ex.exId || ex.name) : null;
  if (!exId) return;
  const lib = LIB_BY_ID[exId];
  if (!lib || lib.noRpe) return;

  const draft = getDraft();
  const targetRIR = (draft && draft.targetRIR != null) ? draft.targetRIR : 2;
  const suggestion = suggestedWeight(exId, ex.reps, targetRIR);

  if (suggestion.reason === "history" && suggestion.weight != null) {
    const chip = buildRpSuggestionChip(suggestion, state.unit);
    wrap.insertBefore(chip, wrap.firstChild);
    // Stale BW banner (N-12 soft flag): if BW exercise and BW is stale, append note
    if (lib.bodyweight) {
      const bwData = userBodyweightAt(Date.now());
      if (bwData && bwData.stale) {
        const banner = document.createElement("div");
        banner.className = "rp-stale-bw-banner";
        banner.textContent = "Bodyweight may be outdated — update in Body tab for accuracy.";
        wrap.insertBefore(banner, chip.nextSibling);
      }
    }
    return;
  }

  // A prompt is needed. Only show the first one per render pass (§6: one per view).
  if (state._rpPromptShownThisRender) return;

  let promptType = null;
  if (suggestion.reason === "needs-rpe-calibration") promptType = "rpe-calibration";
  else if (suggestion.reason === "needs-bodyweight")  promptType = "bodyweight";
  else if (suggestion.reason === "cold-start")        promptType = "cold-start";

  if (!promptType) return;

  state._rpPromptShownThisRender = true;
  const promptEl = buildRpPromptEl(promptType, ex);
  wrap.insertBefore(promptEl, wrap.firstChild);
}

// ============================================================
// RP MESOCYCLE ENGINE — Workstream C (rp-redesign-plan.md §4)
// ============================================================

// Canonical MEV/MAV/MRV landmarks from RP Science (all 19 locked-vocab muscles).
// Values sourced from plan §4.3. Plausibility: chest MEV 8-10, MAV 12-16, MRV 20+ ✓
const RP_VOLUME_LANDMARKS = {
  "chest":       { mev: 8,  mav: 14, mrv: 22 },
  "upper chest": { mev: 4,  mav: 8,  mrv: 12 },
  "lats":        { mev: 10, mav: 16, mrv: 25 },
  "upper back":  { mev: 8,  mav: 14, mrv: 22 },
  "lower back":  { mev: 0,  mav: 6,  mrv: 12 },
  "traps":       { mev: 0,  mav: 8,  mrv: 16 },
  "front delts": { mev: 0,  mav: 6,  mrv: 12 },
  "side delts":  { mev: 8,  mav: 16, mrv: 26 },
  "rear delts":  { mev: 8,  mav: 14, mrv: 22 },
  "biceps":      { mev: 8,  mav: 14, mrv: 22 },
  "triceps":     { mev: 8,  mav: 14, mrv: 22 },
  "forearms":    { mev: 0,  mav: 10, mrv: 20 },
  "quads":       { mev: 8,  mav: 16, mrv: 22 },
  "hamstrings":  { mev: 6,  mav: 12, mrv: 20 },
  "glutes":      { mev: 0,  mav: 8,  mrv: 16 },
  "adductors":   { mev: 0,  mav: 6,  mrv: 12 },
  "calves":      { mev: 8,  mav: 14, mrv: 22 },
  "core":        { mev: 0,  mav: 10, mrv: 25 },
  "obliques":    { mev: 0,  mav: 8,  mrv: 16 }
};

// Muscle → training-day type mapping for split generation.
const RP_MUSCLE_DAY_TYPE = {
  "chest":       "push",   "upper chest": "push",
  "front delts": "push",   "side delts":  "push",   "triceps":  "push",
  "lats":        "pull",   "upper back":  "pull",   "traps":    "pull",
  "rear delts":  "pull",   "biceps":      "pull",   "forearms": "pull",
  "quads":       "legs",   "hamstrings":  "legs",   "glutes":   "legs",
  "adductors":   "legs",   "calves":      "legs",   "lower back":"legs",
  "core":        "legs",   "obliques":    "legs"
};

// Day-type patterns indexed by daysPerWeek (1..6)
const RP_SPLIT_PATTERNS = {
  1: ["full"],
  2: ["upper", "lower"],
  3: ["push", "pull", "legs"],
  4: ["upper", "lower", "push", "pull"],
  5: ["push", "pull", "legs", "upper", "lower"],
  6: ["push", "pull", "legs", "push", "pull", "legs"]
};

const RP_UPPER_MUSCLES = ["chest", "upper chest", "front delts", "side delts", "triceps",
                           "lats", "upper back", "traps", "rear delts", "biceps", "forearms"];
const RP_LOWER_MUSCLES = ["quads", "hamstrings", "glutes", "adductors", "calves",
                           "lower back", "core", "obliques"];
const RP_PUSH_MUSCLES  = ["chest", "upper chest", "front delts", "side delts", "triceps"];
const RP_PULL_MUSCLES  = ["lats", "upper back", "traps", "rear delts", "biceps", "forearms"];
const RP_LEGS_MUSCLES  = ["quads", "hamstrings", "glutes", "adductors", "calves", "lower back", "core", "obliques"];

function _rpMusclesForDayType(dayType) {
  if (dayType === "push")  return RP_PUSH_MUSCLES;
  if (dayType === "pull")  return RP_PULL_MUSCLES;
  if (dayType === "legs")  return RP_LEGS_MUSCLES;
  if (dayType === "upper") return RP_UPPER_MUSCLES;
  if (dayType === "lower") return RP_LOWER_MUSCLES;
  return [...RP_PUSH_MUSCLES, ...RP_PULL_MUSCLES, ...RP_LEGS_MUSCLES]; // "full"
}

// --- Helpers -------------------------------------------------------

function getActiveMesocycle(u) {
  if (!u || !u.rp || !u.rp.currentMesocycleId) return null;
  return (u.rp.mesocycles || []).find(m => m.id === u.rp.currentMesocycleId) || null;
}

function getMesocycle(u, mesoId) {
  return (u && u.rp && u.rp.mesocycles || []).find(m => m.id === mesoId) || null;
}

// Effective MEV/MAV/MRV for a muscle: user override > RP_VOLUME_LANDMARKS default.
function rpLandmarks(u, muscle) {
  const ul = u && u.rp && u.rp.volumeLandmarks;
  if (ul && ul[muscle]) return ul[muscle];
  return RP_VOLUME_LANDMARKS[muscle] || { mev: 0, mav: 0, mrv: 0 };
}

// --- startMesocycle ------------------------------------------------

// Creates (or restarts) a mesocycle for the current user.
// opts: { lengthWeeks, rirSchedule, repRangePreset, resensitize, daysPerWeek }
function startMesocycle(opts) {
  opts = opts || {};
  const lw    = opts.lengthWeeks || 5;                         // 4 accumulation + 1 deload
  const dpw   = opts.daysPerWeek || null;
  const rir   = opts.rirSchedule || [4, 3, 2, 1, "deload"].slice(0, lw);
  const repPreset = opts.repRangePreset || "balanced";  // "strength-leaning"|"balanced"|"pump"
  const repRangeSchedule = _buildRepRangeSchedule(lw, repPreset);

  let newMeso;
  updateUser(u => {
    // Close active mesocycle if any
    const active = getActiveMesocycle(u);
    if (active) active.finishedAt = Date.now();

    // Build exercise selection pool
    const daysPerWeek = dpw || u.daysPerWeek || 4;
    const prevSelection = active ? active.exerciseSelection : {};
    const selection = opts.resensitize
      ? chooseNewExercises(prevSelection, daysPerWeek)
      : _buildDefaultExerciseSelection(prevSelection, daysPerWeek);

    // Seed perMuscleVolume at MEV for week 1
    const perMuscleVolume = {};
    Object.keys(RP_VOLUME_LANDMARKS).forEach(muscle => {
      const lm = rpLandmarks(u, muscle);
      if (lm.mev > 0 || lm.mav > 0) {
        const startSets = Math.max(lm.mev, 0);
        perMuscleVolume[muscle] = [{ week: 1, plannedSets: startSets, completedSets: null }];
        // Pre-fill null slots for remaining weeks
        for (let w = 2; w <= lw; w++) {
          perMuscleVolume[muscle].push({ week: w, plannedSets: null, completedSets: null });
        }
      }
    });

    const id = "meso-" + Date.now();
    newMeso = {
      id,
      startedAt: Date.now(),
      finishedAt: null,
      lengthWeeks: lw,
      currentWeek: 1,
      rirSchedule: rir,
      repRangeSchedule,
      perMuscleVolume,
      exerciseSelection: selection,
      daysPerWeek
    };

    if (!u.rp.mesocycles) u.rp.mesocycles = [];
    u.rp.mesocycles.push(newMeso);
    u.rp.currentMesocycleId = id;

    // Generate week 1 program
    u.program = generateRpWeek(newMeso, 1, u);
    u.currentWeek = 1;
    u.templateId = "rp-hypertrophy";
  });
  return newMeso;
}

function _buildRepRangeSchedule(lengthWeeks, preset) {
  const presets = {
    "strength-leaning": [{ weeks: null, targetReps: [5, 8] }, { weeks: null, targetReps: [4, 6] }],
    "balanced":         [{ weeks: null, targetReps: [8, 12] }, { weeks: null, targetReps: [6, 10] }],
    "pump":             [{ weeks: null, targetReps: [12, 15] }, { weeks: null, targetReps: [10, 12] }]
  };
  const ranges = presets[preset] || presets["balanced"];
  // Assign half the accumulation weeks to each rep range
  const accumWeeks = lengthWeeks - 1; // last week = deload
  const split = Math.ceil(accumWeeks / 2);
  return [
    { weeks: Array.from({ length: split }, (_, i) => i + 1), targetReps: ranges[0].targetReps },
    { weeks: Array.from({ length: accumWeeks - split }, (_, i) => split + i + 1), targetReps: ranges[1].targetReps }
  ];
}

// --- chooseNewExercises --------------------------------------------

// Returns exerciseSelection for a new mesocycle, rotating ≥50% of exercises
// from the prior meso to drive resensitization.
// plan §4.5: max ~50% overlap with prior meso.
function chooseNewExercises(currentSelection, daysPerWeek) {
  const result = {};
  Object.keys(RP_VOLUME_LANDMARKS).forEach(muscle => {
    const pool = _exercisePoolForMuscle(muscle);
    if (!pool.length) { result[muscle] = []; return; }

    const prev = currentSelection[muscle] || [];
    // Keep at most floor(prev.length/2) items from prior meso — strictly ≤50% overlap (§4.5)
    const keepMax = Math.floor(prev.length / 2);
    const kept    = prev.filter(id => pool.includes(id)).slice(0, keepMax);

    // Fill remaining slots from exercises NOT in prev at all (fresh for resensitization)
    const fresh = pool.filter(id => !prev.includes(id));
    // Shuffle fresh for variety
    for (let i = fresh.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
    }

    // Build picks: kept (≤50%) + fresh. If fresh runs out, pull remaining prev (suboptimal but valid).
    const prevRemainder = prev.filter(id => !kept.includes(id) && pool.includes(id));
    const picks = [...kept, ...fresh, ...prevRemainder].slice(0, 3);
    result[muscle] = picks;
  });
  return result;
}

function _buildDefaultExerciseSelection(prevSelection, daysPerWeek) {
  const result = {};
  Object.keys(RP_VOLUME_LANDMARKS).forEach(muscle => {
    if (prevSelection[muscle] && prevSelection[muscle].length) {
      result[muscle] = prevSelection[muscle];
    } else {
      result[muscle] = _exercisePoolForMuscle(muscle).slice(0, 3);
    }
  });
  return result;
}

// Returns exercises for a given muscle from the locked library.
// Uses setContribution > 0 for primary exercises; biases by SFR via exId.
function _exercisePoolForMuscle(muscle) {
  if (typeof LIB_BY_ID === "undefined") return [];
  return Object.values(LIB_BY_ID)
    .filter(ex => {
      if (!ex.muscles || !ex.setContribution) return false;
      if (ex.noRpe) return false;
      const contrib = ex.setContribution[muscle] || 0;
      return contrib >= 1.0; // primary muscle exercises only
    })
    .map(ex => ex.id);
}

// --- generateRpWeek ------------------------------------------------

// Generates a program Day[] for the given week in this mesocycle.
// Called at meso start (week 1) and at every week advance.
function generateRpWeek(mesocycle, weekNum, u) {
  const dpw        = mesocycle.daysPerWeek || 4;
  const pattern    = RP_SPLIT_PATTERNS[dpw] || RP_SPLIT_PATTERNS[4];
  const rir        = _getRirForWeek(mesocycle, weekNum);
  const targetReps = _getRepRangeForWeek(mesocycle, weekNum);
  const isDeload   = rir === "deload";

  const days = [];
  const dayNames = { push: "Push", pull: "Pull", legs: "Legs", upper: "Upper", lower: "Lower", full: "Full Body" };

  pattern.forEach((dayType, idx) => {
    const dayNum  = idx + 1;
    const muscles = _rpMusclesForDayType(dayType);
    const blocks  = [];
    let letterIdx = 0;

    muscles.forEach(muscle => {
      const vol = mesocycle.perMuscleVolume[muscle];
      if (!vol) return;
      const weekEntry = vol.find(v => v.week === weekNum);
      if (!weekEntry) return;
      const plannedSets = isDeload
        ? Math.max(1, Math.floor((weekEntry.plannedSets || 0) * 0.5)) // deload: half volume
        : (weekEntry.plannedSets || 0);
      if (plannedSets <= 0) return;

      const pool = (mesocycle.exerciseSelection[muscle] || []).slice(0, 2);
      if (!pool.length) return;

      // Distribute sets across pool exercises (round-robin)
      const setsEach = Math.ceil(plannedSets / pool.length);
      const exRows = pool.map(exId => {
        const lib = (typeof LIB_BY_ID !== "undefined") ? LIB_BY_ID[exId] : null;
        if (!lib) return null;
        return {
          exId,
          name:          lib.name,
          muscles:       lib.muscles || [],
          sets:          setsEach,
          reps:          targetReps[1] || 10,   // upper bound of rep range
          targetRIR:     isDeload ? 4 : (typeof rir === "number" ? rir : 2),
          defaultWeight: lib.defaultWeight || 0,
          defaultRest:   lib.defaultRest || 120,
          bodyweight:    !!lib.bodyweight,
          isWarmup:      false
        };
      }).filter(Boolean);

      if (!exRows.length) return;

      const letter = String.fromCharCode(65 + letterIdx++);
      blocks.push({
        id:        "rp-" + muscle.replace(/ /g, "_") + "-d" + dayNum + "-w" + weekNum,
        name:      muscle.charAt(0).toUpperCase() + muscle.slice(1),
        letter,
        blockType: "rp-hypertrophy",
        exercises: exRows
      });
    });

    if (!blocks.length) return; // skip empty days

    days.push({
      id:     dayNum,
      name:   dayNames[dayType] || ("Day " + dayNum),
      letter: String.fromCharCode(65 + idx),
      blocks
    });
  });

  return days;
}

function _getRirForWeek(mesocycle, weekNum) {
  const sched = mesocycle.rirSchedule || [4, 3, 2, 1, "deload"];
  return sched[weekNum - 1] !== undefined ? sched[weekNum - 1] : sched[sched.length - 1];
}

function _getRepRangeForWeek(mesocycle, weekNum) {
  const sched = mesocycle.repRangeSchedule || [];
  for (const entry of sched) {
    if (Array.isArray(entry.weeks) && entry.weeks.includes(weekNum)) {
      return entry.targetReps;
    }
  }
  return [8, 12]; // fallback
}

// --- captureSessionFeedback ----------------------------------------

// Saves 3-question feedback (per muscle) to a session after finishWorkout.
// feedback = { [muscle]: { pump: 0-3, soreness: 0-3, workload: 0-3 } }
function captureSessionFeedback(sessionId, feedback) {
  updateUser(u => {
    const s = (u.sessions || []).find(x => x.id === sessionId);
    if (s) s.feedback = feedback || {};
  });
}

// --- adjustVolumeFromFeedback --------------------------------------

// At week boundary, reads prior-week feedback from sessions and plans next-week sets.
// Mutates mesocycle.perMuscleVolume in place. Returns a summary of deltas.
// plan §4.5 progression rules:
//   avgWorkload <= 1 → +2 sets (undershoot)
//   avgWorkload == 2 → +1 set
//   avgWorkload == 3 && avgSoreness <= 2 → hold (0)
//   avgWorkload == 3 && avgSoreness == 3 → -1 set (approaching MRV)
// Clamp to MRV. Principle §1.4: fatigue recommends, does not force.
function adjustVolumeFromFeedback(mesocycle, weekNum, u) {
  const nextWeek = weekNum + 1;
  if (nextWeek > mesocycle.lengthWeeks) return {}; // no more weeks to plan

  const sessions = (u.sessions || []).filter(
    s => s.mesocycleId === mesocycle.id && s.mesoWeek === weekNum
  );

  const deltas = {};

  Object.keys(mesocycle.perMuscleVolume).forEach(muscle => {
    const vol = mesocycle.perMuscleVolume[muscle];
    const thisWeekEntry = vol.find(v => v.week === weekNum);
    const nextWeekEntry = vol.find(v => v.week === nextWeek);
    if (!thisWeekEntry || !nextWeekEntry) return;

    const currentSets = thisWeekEntry.plannedSets || 0;
    if (currentSets <= 0) {
      nextWeekEntry.plannedSets = 0;
      deltas[muscle] = 0;
      return;
    }

    // Aggregate feedback for this muscle across sessions
    const fb = [];
    sessions.forEach(s => {
      if (s.feedback && s.feedback[muscle]) {
        fb.push(s.feedback[muscle]);
      }
    });

    let delta = 0;
    if (fb.length === 0) {
      // No feedback → hold flat (N-7: first week of new meso runs on MEV, no feedback yet)
      delta = 0;
    } else {
      const avg = key => fb.reduce((sum, x) => sum + (x[key] || 0), 0) / fb.length;
      const avgWorkload  = avg("workload");
      const avgSoreness  = avg("soreness");

      if (avgWorkload <= 1)                           delta = +2;
      else if (avgWorkload <= 2)                      delta = +1;
      else if (avgWorkload >= 3 && avgSoreness <= 2)  delta = 0;
      else                                            delta = -1;
    }

    const lm = rpLandmarks(u, muscle);
    const nextSets = Math.min(Math.max(currentSets + delta, 0), lm.mrv);
    nextWeekEntry.plannedSets = nextSets;
    deltas[muscle] = delta;
  });

  return deltas;
}

// --- recomputeMesocycleState ---------------------------------------

// Sibling to recomputeAllIsPR (Chunk 3 D-pattern). Called whenever a past
// session belonging to an rp-hypertrophy meso is mutated (edit, delete, undo).
// Recomputes completedSets per muscle per week from actual logged sessions.
function recomputeMesocycleState(mesocycleId) {
  if (!mesocycleId) return;
  updateUser(u => {
    const meso = getMesocycle(u, mesocycleId);
    if (!meso) return;

    // Reset all completedSets to 0 before recount
    Object.values(meso.perMuscleVolume).forEach(vol => {
      vol.forEach(entry => { entry.completedSets = 0; });
    });

    // Walk sessions tagged to this mesocycle and tally completed sets by muscle
    (u.sessions || []).forEach(s => {
      if (s.mesocycleId !== mesocycleId) return;
      const week = s.mesoWeek;
      if (!week) return;

      // Tally sets per muscle using setContribution weights
      (s.sets || []).forEach(set => {
        const lib = (typeof LIB_BY_ID !== "undefined") ? LIB_BY_ID[set.exId] : null;
        const contrib = (lib && lib.setContribution) || {};
        Object.entries(contrib).forEach(([muscle, weight]) => {
          if (!meso.perMuscleVolume[muscle]) return;
          const entry = meso.perMuscleVolume[muscle].find(v => v.week === week);
          if (entry) {
            entry.completedSets = (entry.completedSets || 0) + weight;
          }
        });
      });
    });
  });
}

// --- End-of-session feedback UI ------------------------------------

// Builds the 3-question feedback bottom sheet for muscles trained in a session.
// Called from finishWorkout when session has rp-hypertrophy blocks.
// Returns a DOM element (the sheet content).
function buildFeedbackSheet(trainedMuscles, onSave) {
  const wrap = document.createElement("div");
  wrap.className = "rp-feedback-wrap";

  const hdr = document.createElement("div");
  hdr.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;";
  hdr.innerHTML = `<h3 style="margin:0;">Session Check-In</h3><button class="icon-btn" onclick="closeSheet()" title="Skip">✕</button>`;
  wrap.appendChild(hdr);

  const note = document.createElement("p");
  note.style.cssText = "font-size:12px;color:var(--text-dim);margin-bottom:12px;";
  note.textContent = "Rate each muscle group you trained. This drives next week's volume.";
  wrap.appendChild(note);

  const feedback = {};

  trainedMuscles.forEach(muscle => {
    feedback[muscle] = { pump: null, soreness: null, workload: null };

    const card = document.createElement("div");
    card.className = "rp-feedback-muscle";
    card.style.cssText = "margin-bottom:16px;padding:12px;border:2px solid var(--border);border-radius:14px;";

    const title = document.createElement("h4");
    title.style.cssText = "margin:0 0 8px;font-size:14px;text-transform:capitalize;";
    title.textContent = muscle;
    card.appendChild(title);

    const questions = [
      { key: "pump",     label: "Pump",     options: ["none","mild","good","insane"] },
      { key: "soreness", label: "Soreness", options: ["none","mild","notable","painful"] },
      { key: "workload", label: "Workload", options: ["easy","good","pushing it","too much"] }
    ];

    questions.forEach(q => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:6px;margin-bottom:6px;";

      const lbl = document.createElement("span");
      lbl.style.cssText = "font-size:12px;color:var(--text-dim);min-width:60px;";
      lbl.textContent = q.label;
      row.appendChild(lbl);

      const pills = document.createElement("div");
      pills.style.cssText = "display:flex;gap:4px;flex-wrap:wrap;";
      q.options.forEach((opt, val) => {
        const btn = document.createElement("button");
        btn.dataset.val = val;
        btn.style.cssText = "font-size:10px;padding:3px 7px;border-radius:8px;min-width:44px;box-shadow:0 2px 0 var(--border-dark);";
        btn.textContent = opt;
        btn.onclick = () => {
          feedback[muscle][q.key] = val;
          pills.querySelectorAll("button").forEach(b => {
            const active = b.dataset.val == val;
            b.style.background = active ? "var(--accent)" : "";
            b.style.color      = active ? "#fff" : "";
            b.style.borderColor = active ? "var(--accent)" : "";
          });
        };
        pills.appendChild(btn);
      });
      row.appendChild(pills);
      card.appendChild(row);
    });

    wrap.appendChild(card);
  });

  const footer = document.createElement("div");
  footer.style.cssText = "display:flex;gap:8px;margin-top:8px;";

  const saveBtn = document.createElement("button");
  saveBtn.className = "primary";
  saveBtn.textContent = "Save feedback";
  saveBtn.style.cssText = "flex:1;";
  saveBtn.onclick = () => {
    // Fill null fields with 2 (neutral) before saving
    Object.keys(feedback).forEach(muscle => {
      ["pump","soreness","workload"].forEach(k => {
        if (feedback[muscle][k] === null) feedback[muscle][k] = 2;
      });
    });
    onSave(feedback);
    closeSheet();
  };
  footer.appendChild(saveBtn);

  const skipBtn = document.createElement("button");
  skipBtn.textContent = "Skip";
  skipBtn.onclick = () => { onSave({}); closeSheet(); };
  footer.appendChild(skipBtn);

  wrap.appendChild(footer);
  return wrap;
}

// Called at the end of finishWorkout for rp-hypertrophy sessions.
// Collects trained muscles from the day's rp-hypertrophy blocks and opens the feedback sheet.
function maybeShowRpFeedbackSheet(day, sessionId) {
  if (!day || !day.blocks) return;
  const rpBlocks = day.blocks.filter(b => b.blockType === "rp-hypertrophy");
  if (!rpBlocks.length) return;

  const muscleSet = new Set();
  rpBlocks.forEach(b => {
    (b.exercises || []).forEach(ex => {
      const lib = (typeof LIB_BY_ID !== "undefined") ? LIB_BY_ID[ex.exId] : null;
      if (lib && lib.muscles) lib.muscles.forEach(m => muscleSet.add(m));
    });
  });
  const trainedMuscles = [...muscleSet];
  if (!trainedMuscles.length) return;

  const content = buildFeedbackSheet(trainedMuscles, feedback => {
    captureSessionFeedback(sessionId, feedback);
  });

  if (typeof openSheet === "function") openSheet(content);
}

// Expose Chunk 4 internals on window for test harness.
// Must be at the END of this file so all consts are defined first (const = no TDZ hoisting).
try {
  if (typeof window !== "undefined") {
    window.APP_VERSION = (typeof APP_VERSION !== "undefined") ? APP_VERSION : undefined;
    window.RP_VOLUME_LANDMARKS = RP_VOLUME_LANDMARKS;
    window.startMesocycle = startMesocycle;
    window.chooseNewExercises = chooseNewExercises;
    window.generateRpWeek = generateRpWeek;
    window.adjustVolumeFromFeedback = adjustVolumeFromFeedback;
    window.recomputeMesocycleState = recomputeMesocycleState;
    window.captureSessionFeedback = captureSessionFeedback;
    window.getActiveMesocycle = getActiveMesocycle;
    window.getMesocycle = getMesocycle;
    window.rpLandmarks = rpLandmarks;
    window._getRirForWeek = _getRirForWeek;
  }
} catch (_) {}
