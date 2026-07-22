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

// Returns a normalized rpt scheme for an exercise, or null.
// Bodyweight-only / time / distance prescriptions never qualify —
// there's no load to drop.
function rptScheme(ex) {
  if (!ex || !ex.scheme || ex.scheme.type !== "rpt") return null;
  if (ex.isTime || ex.isDistance) return null;
  const s = ex.scheme;
  const topMax = Number(s.topRepsMax) || Number(ex.reps) || 6;
  return {
    type: "rpt",
    topRepsMin: Math.max(1, Number(s.topRepsMin) || Math.max(1, topMax - 2)),
    topRepsMax: topMax,
    dropPct: Math.min(50, Math.max(1, Number(s.dropPct) || 10)),
    repAdd: s.repAdd == null ? 1 : Math.max(0, Number(s.repAdd) || 0)
  };
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

// Numeric rep target per set: top set aims at topRepsMax; each
// back-off adds repAdd on top of that.
function rptTargetReps(ex, setIdx) {
  const s = rptScheme(ex);
  if (!s) return Number(ex.reps) || 8;
  return setIdx <= 0 ? s.topRepsMax : s.topRepsMax + s.repAdd * setIdx;
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
// when the exercise has no rpt scheme. weight is null for pure-
// bodyweight moves (no load to drop — reps stepping still applies).
function rptPlannedSet(block, ex, ei, setIdx) {
  const s = rptScheme(ex);
  if (!s) return null;
  const reps = rptTargetReps(ex, setIdx);
  if (ex.bodyweight && !(Number(ex.defaultWeight) > 0)) {
    return { weight: null, reps: reps };
  }
  const topW = rptResolveTopWeight(block, ex, ei);
  const weight = setIdx <= 0 ? rptRoundW(topW) : rptBackoffWeight(s, topW, setIdx);
  return { weight: weight, reps: reps };
}

// Target-spec string for exercise heads, e.g. "rpt · top 4-6 · −10%".
// Kept short — long specs collide with wrapped exercise names at 375px.
function rptSpecText(ex) {
  const s = rptScheme(ex);
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
function rptProgressionSuggestion(ex) {
  const s = rptScheme(ex);
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
  const sug = rptProgressionSuggestion(ex);
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
    window.rptRoundW = rptRoundW;
    window.rptBackoffWeight = rptBackoffWeight;
    window.rptTargetReps = rptTargetReps;
    window.rptResolveTopWeight = rptResolveTopWeight;
    window.rptPlannedSet = rptPlannedSet;
    window.rptProgressionSuggestion = rptProgressionSuggestion;
    window.rptSpecText = rptSpecText;
    window.rptRepsLabel = rptRepsLabel;
  }
} catch (_) {}
