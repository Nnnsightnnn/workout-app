// ============================================================
// START / FINISH WORKOUT
// ============================================================
function startWorkout() {
  // Show the full-day preview first; the CTA on that screen calls _beginWorkoutFocus().
  state.previewBlockIdx = null;
  state.workoutView = "preview";
  renderWorkoutScreen();
}

function _beginWorkoutFocus() {
  state.trimmedBlocks = null;
  state.previewBlockIdx = null;
  ensureDraft();

  // Jump straight to focus view on first incomplete block
  const day = getCurrentDay();
  let targetIdx = 0;
  let allDone = true;
  if (day) {
    for (let i = 0; i < day.blocks.length; i++) {
      const bp = calcBlockProgress(day.blocks[i]);
      if (bp.done < bp.total) { targetIdx = i; allDone = false; break; }
    }
  }

  state.workoutView = "focus";
  state.focusBlockIdx = allDone ? -1 : targetIdx;
  state.focusExIdx = 0;

  updateFinishButton();
  showToast(getRandomQuote(), "quote", 3500);
  renderWorkoutScreen();
}

function completeCurrentBlock() {
  const day = getCurrentDay();
  if (!day || state.focusBlockIdx == null || state.focusBlockIdx < 0) return false;
  const block = day.blocks[state.focusBlockIdx];
  if (!block) return false;

  // Mark all incomplete sets in this block as done with defaults
  block.exercises.forEach((ex, ei) => {
    if (ex.isWarmup) return;
    const numSets = ex.sets || 3;
    const last = getLastSetsFor(ex.exId || ex.name);
    for (let i = 0; i < numSets; i++) {
      const sKey = inputKey(block.id, ei, i, "status");
      if (getInput(sKey, null) === "done" || getInput(sKey, null) === "skipped") continue;
      saveInput(sKey, "done");
      const lastSet = last[i] || last[last.length - 1];
      const rkey = inputKey(block.id, ei, i, "r");
      if (getInput(rkey, null) == null) saveInput(rkey, lastSet?.reps ?? ex.reps);
      const wkey = inputKey(block.id, ei, i, "w");
      if (getInput(wkey, null) == null) saveInput(wkey, lastSet?.weight ?? ex.defaultWeight ?? 0);
      const pkey = inputKey(block.id, ei, i, "p");
      if (getInput(pkey, null) == null) saveInput(pkey, 7);
    }
  });

  renderWorkoutScreen();
  showToast("✓ Block " + block.letter + " complete", "success");
  return true;
}

function handleFinishButton() {
  // In focus view: complete current block and advance to next
  if (state.workoutStartedAt && state.workoutView === "focus" && state.focusBlockIdx != null && state.focusBlockIdx >= 0) {
    const day = getCurrentDay();
    if (day) {
      // Auto-complete remaining sets in current block
      completeCurrentBlock();

      // Find next incomplete block
      let nextBlockIdx = null;
      for (let i = state.focusBlockIdx + 1; i < day.blocks.length; i++) {
        const bp = calcBlockProgress(day.blocks[i]);
        if (bp.done < bp.total) { nextBlockIdx = i; break; }
      }

      if (nextBlockIdx !== null) {
        state.focusBlockIdx = nextBlockIdx;
        state.focusExIdx = 0;
        renderWorkoutScreen();
        return;
      }
      // All blocks done — fall through to finishWorkout
    }
  }
  finishWorkout();
}

function finishWorkout() {
  const draft = getDraft();
  if (!draft) {
    showToast("Nothing to save");
    return;
  }
  // If paused, account for paused time before computing duration
  if (draft.pausedAt) {
    draft.startedAt += Date.now() - draft.pausedAt;
    draft.pausedAt = null;
  }
  const day = getCurrentDay();
  const inputs = draft.inputs;

  // Auto-complete: fill in defaults for any sets the user didn't touch
  day.blocks.forEach(block => {
    block.exercises.forEach((ex, ei) => {
      if (ex.isWarmup) return;
      const last = getLastSetsFor(ex.exId || ex.name);
      for (let i = 0; i < ex.sets; i++) {
        const sKey = inputKey(block.id, ei, i, "status");
        if (inputs[sKey] === "skipped") continue;
        if (!inputs[sKey]) inputs[sKey] = "done";
        const lastSet = last[i] || last[last.length - 1];
        const rkey = inputKey(block.id, ei, i, "r");
        if (inputs[rkey] == null) inputs[rkey] = lastSet?.reps ?? ex.reps;
        const wkey = inputKey(block.id, ei, i, "w");
        if (inputs[wkey] == null) inputs[wkey] = lastSet?.weight ?? ex.defaultWeight ?? 0;
        const pkey = inputKey(block.id, ei, i, "p");
        if (inputs[pkey] == null) inputs[pkey] = 7;
      }
    });
  });

  // Build the sets array from all exercises' inputs
  const sets = [];
  day.blocks.forEach(block => {
    block.exercises.forEach((ex, ei) => {
      if (ex.isWarmup) return;
      for (let i = 0; i < ex.sets; i++) {
        const w = inputs[inputKey(block.id, ei, i, "w")] ?? 0;
        const r = inputs[inputKey(block.id, ei, i, "r")];
        const p = inputs[inputKey(block.id, ei, i, "p")] ?? 7;
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

  // Collect block-level notes (per-session)
  const blockNotes = {};
  day.blocks.forEach(block => {
    const note = inputs[`${block.id}|__note`];
    if (note && String(note).trim()) {
      blockNotes[block.id] = { name: block.name, note: String(note).trim() };
    }
  });
  const cooldownNote = inputs["__cooldown|__note"];
  if (cooldownNote && String(cooldownNote).trim()) {
    blockNotes["__cooldown"] = { name: "Cool Down", note: String(cooldownNote).trim() };
  }

  const duration = Math.floor((Date.now() - draft.startedAt) / 1000);
  const volume = sets.reduce((a, s) => a + s.weight * s.reps, 0);
  const prCount = sets.filter(s => s.isPR).length;
  const uForWeek = userData();
  const session = {
    id: "s-" + Date.now(),
    dayId: day.id,
    dayName: day.name,
    startedAt: draft.startedAt,
    finishedAt: Date.now(),
    duration, sets, volume, prCount,
    blockNotes,
    programWeek: uForWeek ? uForWeek.currentWeek || null : null
  };

  updateUser(u => {
    u.sessions.push(session);
    if (u.sessions.length > 365) {
      u.sessions = u.sessions.slice(-365);
      setTimeout(() => showToast("Oldest sessions trimmed — export a backup to keep full history"), 3500);
    }
    u.draft = null;
    u.lastDoneDayId = day.id;
  });

  const hasSuperset = day.blocks.some(b => b.exercises.filter(e => !e.isWarmup).length > 1);
  const completeLabel = hasSuperset ? "Superset Complete" : "Sets Complete";

  state.trimmedBlocks = null;
  state.workoutView = "chapters";
  state.focusBlockIdx = null;
  state.focusExIdx = 0;
  stopSessionTimer();
  hideHeaderRest();
  state.workoutStartedAt = null;

  // Check if this completes the week (all days done)
  const uAfter = userData();
  if (uAfter && uAfter.totalWeeks && uAfter.currentWeek) {
    const weekSessions = uAfter.sessions.filter(s => s.programWeek === uAfter.currentWeek);
    const uniqueDays = new Set(weekSessions.map(s => s.dayId));
    if (uniqueDays.size >= uAfter.program.length && uAfter.currentWeek <= uAfter.totalWeeks) {
      if (uAfter.currentWeek < uAfter.totalWeeks) {
        advanceWeek();
        showToast("Week " + (uAfter.currentWeek + 1) + " unlocked! New exercises loaded.", "success");
      } else {
        // Program complete
        showToast("Program complete! Check settings to restart or switch.", "pr");
      }
      renderWorkoutScreen();
      const msg2 = prCount > 0
        ? `🏆 ${completeLabel}! ${sets.length} sets, ${prCount} PR${prCount>1?'s':''}!`
        : `✓ ${completeLabel}! ${sets.length} sets in ${formatDuration(duration)}`;
      setTimeout(() => showToast(msg2, prCount > 0 ? "pr" : "success"), 1500);
      return;
    }
  }

  // Move to next day in rotation (within same week)
  const nextDay = (day.id % userData().program.length) + 1;
  state.currentDayId = nextDay;
  renderWorkoutScreen();

  const msg = prCount > 0
    ? `🏆 ${completeLabel}! ${sets.length} sets, ${prCount} PR${prCount>1?'s':''}!`
    : `✓ ${completeLabel}! ${sets.length} sets in ${formatDuration(duration)}`;
  showToast(msg, prCount > 0 ? "pr" : "success");
}