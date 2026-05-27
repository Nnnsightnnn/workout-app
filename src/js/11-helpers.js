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

  const bump = state.unit === "lbs" ? 5 : 2.5;
  const newWeight = lastWeight + bump;

  const chip = document.createElement("div");
  chip.className = "lp-hint-chip";
  chip.innerHTML =
    '<span class="lp-hint-icon">↑</span>' +
    '<span class="lp-hint-text"><span class="lp-hint-label">Last week clean</span>' +
    ' <strong>' + newWeight + ' ' + state.unit + '</strong></span>' +
    '<button class="lp-hint-apply" type="button">Apply</button>';

  const applyBtn = chip.querySelector(".lp-hint-apply");
  applyBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (typeof inputKey !== "function" || typeof saveInput !== "function") return;
    for (let s = 0; s < numSets; s++) {
      saveInput(inputKey(block.id, ei, s, "w"), newWeight);
    }
    if (navigator.vibrate) navigator.vibrate(10);
    if (typeof showToast === "function") showToast("Weight bumped to " + newWeight + " " + state.unit);
    if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
  });

  wrap.insertBefore(chip, wrap.firstChild);
}