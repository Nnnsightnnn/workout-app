// ============================================================
// HELPERS
// ============================================================
function getLastSetsFor(exId) {
  const u = userData();
  for (let i = u.sessions.length - 1; i >= 0; i--) {
    const sets = u.sessions[i].sets.filter(s => s.exId === exId);
    if (sets.length) return sets;
  }
  return [];
}

// Returns the sets for a given exercise from the most recent session of a specific day.
// Used to show "last time you did this workout day" per-exercise.
function getPrevDaySetsFor(dayId, exId) {
  const u = userData();
  for (let i = u.sessions.length - 1; i >= 0; i--) {
    if (u.sessions[i].dayId !== dayId) continue;
    const sets = u.sessions[i].sets.filter(s => s.exId === exId);
    if (sets.length) return sets;
  }
  return [];
}

// ============================================================
// SET REPS DEFAULT
// ------------------------------------------------------------
// The reps a set shows before the lifter changes them, which is also what
// Log set and Finish record. Today's plan comes first: a periodized week
// can move a lift from 4 x 8 to 4 x 6 ("Heavier. Fewer reps."), and last
// session's 8 used to be logged against a plan of 6. Last session's reps
// are the fallback when the plan names none.
// A draft begun before this rule has no repsFrom (see newDraft); it keeps
// the old rule, last session first, until it ends, so a set logged under
// it still reads what the lifter saw when they logged it.
// Pass `draft` when holding a private copy (finishWorkout); otherwise the
// stored draft for today is read.
// ============================================================
function setRepsDefault(ex, lastSet, draft) {
  const d = (draft !== undefined) ? draft
    : (typeof getDraft === "function" ? getDraft() : null);
  const fromPlan = !d || d.repsFrom === "plan";
  if (fromPlan && Number(ex && ex.reps) > 0) return ex.reps;
  return lastSet?.reps ?? ex.reps;
}

// ============================================================
// LINEAR-PROGRESSION HINT
// ------------------------------------------------------------
// Simple, deterministic progression suggestion for users who
// have NOT opted into the full RP engine (u.rp.enabled === false).
// Rule: if last session for this exercise was a "clean sweep" —
// every prescribed set logged at the same weight with reps >=
// today's prescription — surface a chip suggesting a +5 lbs (or
// +2.5 kg) bump. One Apply button pre-fills all set weights for
// the current exercise.
// ============================================================
function injectLinearProgressionHint(wrap, ex, block, ei) {
  if (typeof userData !== "function") return;
  const u = userData();
  if (!u) return;
  // Defer to the RP engine when the user has opted into it (avoids
  // duplicate suggestions stacked on top of each other).
  const _ap = activeProgramOf(u);
  if (_ap && _ap.rp && _ap.rp.enabled) return;

  const exId = (ex && (ex.exId || ex.name)) || null;
  if (!exId) return;
  const lib = (typeof LIB_BY_ID !== "undefined" && LIB_BY_ID[exId]) || ex;

  // Skip prescriptions where "+5 lbs" doesn't apply.
  if (ex.isWarmup || ex.isTime || ex.isDistance) return;
  // Pure bodyweight (no added load) — no plate to add.
  if (lib.bodyweight && !(lib.defaultWeight || 0)) return;

  const lastSets = getLastSetsFor(exId);
  if (!lastSets.length) return;

  const numSets = ex.sets || 3;
  const prescribedReps = Number(ex.reps) || 8;
  const lastWeight = Number(lastSets[0].weight) || 0;
  if (lastWeight <= 0) return;

  // Clean sweep: at least the prescribed number of sets logged,
  // all at the same weight, all reps >= today's prescribed reps.
  const cleanSweep = lastSets.length >= numSets &&
    lastSets.every(s => Number(s.weight) === lastWeight && (Number(s.reps) || 0) >= prescribedReps);
  if (!cleanSweep) return;

  // Don't bump if the user has already entered a higher weight
  // for set 1 in this session (they're clearly ahead of us).
  const set1Key = (typeof inputKey === "function") ? inputKey(block.id, ei, 0, "w") : null;
  const set1Cur = set1Key ? Number(getInput(set1Key, lastWeight)) : lastWeight;
  if (set1Cur > lastWeight) return;

  // The guess is for the lift's first set. Once any set of it is logged or
  // skipped the lifter has chosen a weight, and Apply would only reach the
  // sets after it, so the line goes away.
  const statusOf = s => (typeof inputKey === "function")
    ? getInput(inputKey(block.id, ei, s, "status"), null) : null;
  for (let s = 0; s < numSets; s++) {
    const st = statusOf(s);
    if (st === "done" || st === "skipped") return;
  }

  const bump = state.unit === "lbs" ? 5 : 2.5;
  const newWeight = lastWeight + bump;
  const unitLbl = state.unit === "kg" ? "kg" : "lb";

  // Names the weight that went clean and marks the new one as a try. It
  // read "Last week clean 140 lbs", which a lifter took as "last time I did
  // 140" right above "last: 135x8" (blind read, 2026-11-24); and the last
  // session may be weeks back, not a week.
  const chip = document.createElement("div");
  chip.className = "lp-hint-chip";
  chip.innerHTML =
    '<span class="lp-hint-icon">↑</span>' +
    '<span class="lp-hint-text"><span class="lp-hint-label">All clean at ' + lastWeight + ' &middot; try</span>' +
    ' <strong>' + newWeight + ' ' + unitLbl + '</strong></span>' +
    '<button class="lp-hint-apply" type="button">Apply</button>';

  const applyBtn = chip.querySelector(".lp-hint-apply");
  applyBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (typeof inputKey !== "function" || typeof saveInput !== "function") return;
    // Never rewrite a set already logged or skipped (the same rule as the
    // bar's stepper since F19).
    for (let s = 0; s < numSets; s++) {
      const st = statusOf(s);
      if (st === "done" || st === "skipped") continue;
      saveInput(inputKey(block.id, ei, s, "w"), newWeight);
    }
    if (navigator.vibrate) navigator.vibrate(10);
    // No toast: the rows and the bar change to the new weight where the
    // lifter is looking; a toast at the top of the screen was out of sight.
    if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
  });

  wrap.insertBefore(chip, wrap.firstChild);
}