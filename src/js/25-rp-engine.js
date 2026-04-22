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
