// ============================================================
// START / FINISH WORKOUT
// ============================================================
function startWorkout() {
  state.trimmedBlocks = null;
  ensureDraft();
  updateFinishButton();
  showToast("Workout started 💪", "success");
}

function finishWorkout() {
  const draft = getDraft();
  if (!draft) {
    showToast("Nothing to save");
    return;
  }
  const day = getCurrentDay();
  const inputs = draft.inputs;

  // Build the sets array from all exercises' inputs
  const sets = [];
  day.blocks.forEach(block => {
    block.exercises.forEach((ex, ei) => {
      if (ex.isWarmup) return;
      for (let i = 0; i < ex.sets; i++) {
        const w = inputs[inputKey(block.id, ei, i, "w")] ?? 0;
        const r = inputs[inputKey(block.id, ei, i, "r")];
        const p = inputs[inputKey(block.id, ei, i, "p")] ?? 7;
        // Only include sets that have a reps entry or that were skipped
        if (r == null || r === 0) continue;
        if (inputs[inputKey(block.id, ei, i, "status")] === "skipped") continue;
        sets.push({
          exId: ex.exId || ex.name,
          exName: ex.name,
          muscles: ex.muscles || [],
          setIdx: i + 1,
          weight: ex.bodyweight ? 0 : w,
          reps: r,
          rpe: p,
          bodyweight: !!ex.bodyweight,
          isPR: false
        });
      }
    });
  });

  if (sets.length === 0) {
    if (!confirm("No sets logged with reps. Finish anyway?")) return;
  }

  // PR detection (computed against history before this save)
  const u = userData();
  const priorBest = {};
  u.sessions.forEach(s => {
    s.sets.forEach(set => {
      const key = set.exId;
      if (!priorBest[key] || set.weight * (1 + set.reps / 30) > priorBest[key].score) {
        priorBest[key] = { score: set.weight * (1 + set.reps / 30), w: set.weight, r: set.reps };
      }
    });
  });
  sets.forEach(s => {
    const best = priorBest[s.exId];
    const score = s.weight * (1 + s.reps / 30);
    if (s.weight > 0 && (!best || score > best.score)) s.isPR = true;
  });

  const duration = Math.floor((Date.now() - draft.startedAt) / 1000);
  const volume = sets.reduce((a, s) => a + s.weight * s.reps, 0);
  const prCount = sets.filter(s => s.isPR).length;
  const session = {
    id: "s-" + Date.now(),
    dayId: day.id,
    dayName: day.name,
    startedAt: draft.startedAt,
    finishedAt: Date.now(),
    duration, sets, volume, prCount
  };

  updateUser(u => {
    u.sessions.push(session);
    if (u.sessions.length > 365) u.sessions = u.sessions.slice(-365);
    u.draft = null;
    u.lastDoneDayId = day.id;
  });

  state.trimmedBlocks = null;
  stopSessionTimer();
  hideRest();
  state.workoutStartedAt = null;

  // Move to next day in rotation
  const nextDay = (day.id % userData().program.length) + 1;
  state.currentDayId = nextDay;
  renderWorkoutScreen();

  const msg = prCount > 0
    ? `🏆 Saved! ${sets.length} sets, ${prCount} PR${prCount>1?'s':''}!`
    : `✓ Saved! ${sets.length} sets in ${formatDuration(duration)}`;
  showToast(msg, prCount > 0 ? "pr" : "success");
}