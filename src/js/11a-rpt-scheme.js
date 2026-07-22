// ============================================================
// RPT SCHEME — Reverse Pyramid Training as a first-class scheme
// ------------------------------------------------------------
// An exercise prescription may carry an optional scheme object:
//   scheme: { type:"rpt", topRepsMin:4, topRepsMax:6, dropPct:10, repAdd:1 }
// ex.sets stays the total set count (top set + back-offs) and
// ex.reps stays equal to topRepsMax so every generic code path
// (estimates, share, look-ahead) keeps working. No scheme field
// means straight sets — nothing changes for existing data.
//
// Live behavior: back-off weight suggestions derive from the
// ACTUAL top-set weight logged this session (draft input for
// set 0), compounding ×(1 − dropPct/100) per set, plate-rounded.
// User-entered values always win over suggestions.
// ============================================================

// Normalizes a raw scheme object against an exercise, or returns null.
// Time / distance prescriptions never qualify — there's no load to drop.
function rptNormalizeScheme(ex, raw) {
  if (!ex || !raw || raw.type !== "rpt") return null;
  if (ex.isTime || ex.isDistance) return null;
  const topMax = Number(raw.topRepsMax) || Number(ex.reps) || 6;
  return {
    type: "rpt",
    topRepsMin: Math.max(1, Number(raw.topRepsMin) || Math.max(1, topMax - 2)),
    topRepsMax: topMax,
    dropPct: Math.min(50, Math.max(1, Number(raw.dropPct) || 10)),
    repAdd: raw.repAdd == null ? 1 : Math.max(0, Number(raw.repAdd) || 0)
  };
}

// Program-level scheme for an exercise, or null.
function rptScheme(ex) {
  return ex ? rptNormalizeScheme(ex, ex.scheme) : null;
}

// ------------------------------------------------------------
// SESSION OVERRIDE — mid-workout "convert to reverse pyramid".
// Lives on the draft (entry.draft.schemeOverrides, keyed
// "<blockId>|<ei>") so it dies with the session and never touches
// the program template. Undo = delete the key; the program's own
// scheme (if any) resumes.
// ------------------------------------------------------------

function _rptOverrideKey(block, ei) {
  return block.id + "|" + ei;
}

// Raw session override for an exercise slot, or null.
function rptSessionOverride(block, ei) {
  const draft = (typeof getDraft === "function") ? getDraft() : null;
  if (!draft || !draft.schemeOverrides) return null;
  return draft.schemeOverrides[_rptOverrideKey(block, ei)] || null;
}

// The scheme actually in effect for this exercise right now:
// session override first, then the program prescription.
function rptEffectiveScheme(block, ex, ei) {
  const ov = rptSessionOverride(block, ei);
  if (ov) return rptNormalizeScheme(ex, ov);
  return rptScheme(ex);
}

// Write / clear a session override. Mirrors saveInput's store walk —
// draft mutations must go through the store, not a stale reference.
function rptSetSessionOverride(block, ei, schemeOrNull) {
  if (typeof ensureDraft === "function") ensureDraft();
  const s = loadStore();
  const user = s.users.find(u => u.id === state.userId);
  if (!user) return;
  const entry = activeProgramOf(user);
  if (!entry || !entry.draft) return;
  if (!entry.draft.schemeOverrides) entry.draft.schemeOverrides = {};
  const key = _rptOverrideKey(block, ei);
  if (schemeOrNull) entry.draft.schemeOverrides[key] = schemeOrNull;
  else delete entry.draft.schemeOverrides[key];
  saveStore(s);
}

// Can this exercise be converted right now? Conversion is clean while
// the top set is still the working set — set 0 may already be logged
// (it just becomes the top-set anchor), but back-off sets logged under
// a different scheme would make the pyramid lie about what happened.
// Returns { ok, reason }.
function rptCanConvertNow(block, ex, ei) {
  if (ex.isTime || ex.isDistance) return { ok: false, reason: "not a load-based exercise" };
  if (rptScheme(ex)) return { ok: false, reason: "already reverse pyramid" };
  const nSets = ex.sets || 3;
  for (let i = 1; i < nSets; i++) {
    const st = getInput(inputKey(block.id, ei, i, "status"), null);
    if (st === "done" || st === "skipped") {
      return { ok: false, reason: "back-off sets already logged" };
    }
  }
  return { ok: true, reason: null };
}

// Plate rounding — same increments the rest of the app uses.
function rptRoundW(w) {
  if (!w || w <= 0) return 0;
  const incr = (typeof state !== "undefined" && state.unit === "kg") ? 2.5 : 5;
  return Math.max(0, Math.round(w / incr) * incr);
}

// Pure back-off math: set 0 = top weight; set i = top × (1−drop)^i.
function rptBackoffWeight(scheme, topWeight, setIdx) {
  const w = Number(topWeight) || 0;
  if (setIdx <= 0 || w <= 0) return rptRoundW(w);
  const factor = Math.pow(1 - scheme.dropPct / 100, setIdx);
  return rptRoundW(w * factor);
}

// Numeric rep target per set for a normalized scheme: top set aims at
// topRepsMax; each back-off adds repAdd on top of that.
function rptTargetRepsFor(scheme, setIdx) {
  return setIdx <= 0 ? scheme.topRepsMax : scheme.topRepsMax + scheme.repAdd * setIdx;
}

// Rep target from the exercise's program scheme (session overrides are
// resolved by rptPlannedSet / finishWorkout, which pass the scheme in).
function rptTargetReps(ex, setIdx) {
  const s = rptScheme(ex);
  if (!s) return Number(ex.reps) || 8;
  return rptTargetRepsFor(s, setIdx);
}

// Top-set weight for this exercise right now: the draft's set-0
// entry first (drop % applies to the actual load, not the plan),
// then last session's first logged set, then the prescription default.
function rptResolveTopWeight(block, ex, ei) {
  let topW = null;
  if (typeof getInput === "function" && typeof inputKey === "function") {
    const v = getInput(inputKey(block.id, ei, 0, "w"), null);
    if (v != null && Number(v) > 0) topW = Number(v);
  }
  if (topW == null && typeof getLastSetsFor === "function") {
    const last = getLastSetsFor(ex.exId || ex.name);
    if (last.length && Number(last[0].weight) > 0) topW = Number(last[0].weight);
  }
  if (topW == null) topW = Number(ex.defaultWeight) || 0;
  return topW;
}

// Planned { weight, reps } for one set of an rpt exercise, or null
// when no rpt scheme is in effect (program or session override).
// weight is null for pure-bodyweight moves (no load to drop — reps
// stepping still applies).
function rptPlannedSet(block, ex, ei, setIdx) {
  const s = rptEffectiveScheme(block, ex, ei);
  if (!s) return null;
  const reps = rptTargetRepsFor(s, setIdx);
  if (ex.bodyweight && !(Number(ex.defaultWeight) > 0)) {
    return { weight: null, reps: reps };
  }
  const topW = rptResolveTopWeight(block, ex, ei);
  const weight = setIdx <= 0 ? rptRoundW(topW) : rptBackoffWeight(s, topW, setIdx);
  return { weight: weight, reps: reps };
}

// Target-spec string for exercise heads, e.g. "rpt · top 4-6 · −10%".
// Kept short — long specs collide with wrapped exercise names at 375px.
// Pass block/ei to resolve a session override; ex-only uses the program.
function rptSpecText(ex, block, ei) {
  const s = (block != null && ei != null)
    ? rptEffectiveScheme(block, ex, ei) : rptScheme(ex);
  if (!s) return null;
  const range = s.topRepsMin === s.topRepsMax
    ? String(s.topRepsMax) : s.topRepsMin + "-" + s.topRepsMax;
  return "rpt &middot; top " + range + " &middot; &minus;" + s.dropPct + "%";
}

// Display label for a set's rep target: the top set shows the
// range ("4-6"), back-offs show their stepped number.
function rptRepsLabel(ex, setIdx) {
  const s = rptScheme(ex);
  if (!s) return null;
  if (setIdx <= 0 && s.topRepsMin !== s.topRepsMax) {
    return s.topRepsMin + "-" + s.topRepsMax;
  }
  return String(rptTargetReps(ex, setIdx));
}

// ------------------------------------------------------------
// Linear progression for rpt: when last session's TOP set hit
// the top of the rep range, suggest a load bump this session.
// Same rule family as injectLinearProgressionHint, scoped to the
// top set — back-offs re-derive from it automatically.
// ------------------------------------------------------------

// Returns { newTopWeight, lastTopWeight, lastTopReps } or null.
// Pass block/ei so a session override's rep range is respected.
function rptProgressionSuggestion(ex, block, ei) {
  const s = (block != null && ei != null)
    ? rptEffectiveScheme(block, ex, ei) : rptScheme(ex);
  if (!s) return null;
  if (typeof getLastSetsFor !== "function" || typeof state === "undefined") return null;
  const last = getLastSetsFor(ex.exId || ex.name);
  if (!last.length) return null;
  const top = last[0];
  const lastW = Number(top.weight) || 0;
  const lastR = Number(top.reps) || 0;
  if (lastW <= 0 || lastR < s.topRepsMax) return null;
  const bump = state.unit === "kg" ? 2.5 : 5;
  return { newTopWeight: lastW + bump, lastTopWeight: lastW, lastTopReps: lastR };
}

// Injects the rpt progression chip above the set list. Apply sets
// only the top-set weight — the back-off suggestions cascade from
// it on the re-render. Skips when the user already logged set 0
// at or above the suggestion (they're ahead of us).
function injectRptHint(wrap, ex, block, ei) {
  const sug = rptProgressionSuggestion(ex, block, ei);
  if (!sug) return;
  const set0Key = inputKey(block.id, ei, 0, "w");
  const set0Cur = Number(getInput(set0Key, sug.lastTopWeight));
  if (set0Cur > sug.lastTopWeight) return;

  const chip = document.createElement("div");
  chip.className = "lp-hint-chip rpt-hint-chip";
  chip.innerHTML =
    '<span class="lp-hint-icon">&uarr;</span>' +
    '<span class="lp-hint-text"><span class="lp-hint-label">Top set hit ' + sug.lastTopReps + '</span>' +
    ' <strong>' + sug.newTopWeight + ' ' + state.unit + '</strong></span>' +
    '<button class="lp-hint-apply" type="button">Apply</button>';
  chip.querySelector(".lp-hint-apply").addEventListener("click", (e) => {
    e.stopPropagation();
    saveInput(set0Key, sug.newTopWeight);
    if (navigator.vibrate) navigator.vibrate(10);
    if (typeof showToast === "function") showToast("Top set bumped to " + sug.newTopWeight + " " + state.unit);
    if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
  });
  wrap.insertBefore(chip, wrap.firstChild);
}

// Expose for test harness (matches 25-rp-engine.js pattern).
try {
  if (typeof window !== "undefined") {
    window.rptScheme = rptScheme;
    window.rptNormalizeScheme = rptNormalizeScheme;
    window.rptRoundW = rptRoundW;
    window.rptBackoffWeight = rptBackoffWeight;
    window.rptTargetReps = rptTargetReps;
    window.rptTargetRepsFor = rptTargetRepsFor;
    window.rptResolveTopWeight = rptResolveTopWeight;
    window.rptPlannedSet = rptPlannedSet;
    window.rptProgressionSuggestion = rptProgressionSuggestion;
    window.rptSpecText = rptSpecText;
    window.rptRepsLabel = rptRepsLabel;
    window.rptSessionOverride = rptSessionOverride;
    window.rptEffectiveScheme = rptEffectiveScheme;
    window.rptSetSessionOverride = rptSetSessionOverride;
    window.rptCanConvertNow = rptCanConvertNow;
  }
} catch (_) {}
