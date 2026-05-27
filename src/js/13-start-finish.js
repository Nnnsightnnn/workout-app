// ============================================================
// START / FINISH WORKOUT
// ============================================================
function openWorkout() {
  if (state.adhocActive) return;
  state.trimmedBlocks = null;
  state.previewBlockIdx = null;
  ensureDraft();
  if (state.autoTimer) {
    state.workoutStartedAt = getDraft().startedAt;
    startSessionTimer();
  }
  state.workoutView = "chapters";
  updateFinishButton();
  showToast(getRandomQuote(), "quote", 3500);
  renderWorkoutScreen();
}

function startWorkout() {
  if (state.adhocActive) return;
  state.trimmedBlocks = null;
  state.previewBlockIdx = null;
  state.previewDateMs = null;
  state.restOverride = false;
  ensureDraft();
  state.workoutStartedAt = getDraft().startedAt;
  startSessionTimer();
  state.workoutView = "chapters";

  updateFinishButton();
  showToast(getRandomQuote(), "quote", 3500);
  renderWorkoutScreen();
}

function startFirstWorkout() {
  const day = getCurrentDay();
  if (!day) { renderWorkoutScreen(); return; }

  // Deliberately undersized first workout (~20 min) per UX research.
  // The full program regenerates next week via advanceWeek().
  const estMin = estimateSessionMinutes(day);
  if (estMin > 20) {
    const budget = computeTimeBudget(day, 20);
    if (budget.adjustments.length > 0 && budget.adjustedDay) {
      updateActiveProgram(entry => {
        const dayIdx = entry.program.findIndex(d => d.id === day.id);
        if (dayIdx >= 0) entry.program[dayIdx] = budget.adjustedDay;
      });
    }
  }

  state.dayChosen = true;
  startWorkout();
}

function _beginWorkoutFocus() {
  state.trimmedBlocks = null;
  state.previewBlockIdx = null;
  ensureDraft();
  state.workoutStartedAt = getDraft().startedAt;
  startSessionTimer();

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

function toggleBlockComplete(block) {
  if (!block) return;
  let total = 0, done = 0;
  block.exercises.forEach((ex, ei) => {
    if (ex.isWarmup) return;
    const numSets = ex.sets || 3;
    for (let i = 0; i < numSets; i++) {
      total++;
      if (getInput(inputKey(block.id, ei, i, "status"), null) === "done") done++;
    }
  });
  const isFullyDone = total > 0 && done === total;

  block.exercises.forEach((ex, ei) => {
    if (ex.isWarmup) return;
    const numSets = ex.sets || 3;
    const last = getLastSetsFor(ex.exId || ex.name);
    for (let i = 0; i < numSets; i++) {
      const sKey = inputKey(block.id, ei, i, "status");
      if (isFullyDone) {
        saveInput(sKey, null);
      } else {
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
    }
  });

  if (!isFullyDone && state.workoutStartedAt) showHeaderRest(90);
  renderWorkoutScreen();
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

// Exit an in-progress workout, saving whatever the user logged so far. Routes
// through the canonical finishWorkout() with autoCompleteUntouched=false so
// untouched sets aren't fabricated into history — only sets the user actually
// marked done (or partially logged) land in the session record. PR detection,
// RP mesocycle bookkeeping, and draft-clearing all run via the same path.
function exitWorkout() {
  // Ad-hoc sessions have their own cancel path (and a different draft shape).
  if (state.adhocActive) {
    if (typeof cancelAdhocWorkout === "function") cancelAdhocWorkout();
    return;
  }
  const hasDraft = typeof getDraft === "function" && getDraft();
  if (hasDraft) {
    finishWorkout({ autoCompleteUntouched: false });
  } else {
    if (typeof stopSessionTimer === "function") stopSessionTimer();
    if (typeof hideHeaderRest === "function") hideHeaderRest();
    state.workoutStartedAt = null;
    state.workoutView = "chapters";
    state.focusBlockIdx = null;
    state.focusExIdx = 0;
    state.trimmedBlocks = null;
  }
  // Land on the day-picker / chapters on re-entry — finishWorkout() doesn't
  // touch dayChosen, so reset it here regardless of which branch ran.
  state.dayChosen = false;
  if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
}

// Bottom-sheet confirm before ending a workout in progress. "Save and end"
// is the primary action — exiting saves whatever the user logged through the
// canonical finishWorkout() path. "Keep going" stays in the session.
function openExitWorkoutSheet() {
  const html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">End workout?</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>
    </div>
    <p style="color:var(--text-dim); font-size:13px; line-height:1.5; margin-bottom:10px;">
      We'll save what you logged so far.
    </p>
    <div class="sheet-actions">
      <button class="primary" id="exitWorkoutConfirm">Save and end</button>
      <button class="secondary" id="exitWorkoutCancel">Keep going</button>
    </div>
  `;
  openSheet(html);
  document.getElementById("exitWorkoutCancel").onclick = () => closeSheet();
  document.getElementById("exitWorkoutConfirm").onclick = () => {
    closeSheet();
    exitWorkout();
  };
}

// opts.autoCompleteUntouched (default true): fill in defaults for sets the
// user never touched. The normal end-of-workout finish wants this — most
// people tap a few checkboxes and rely on the "completed-as-prescribed"
// fill-in. The exit-mid-workout path passes false so untouched sets are
// dropped instead of fabricated.
function finishWorkout(opts) {
  const autoCompleteUntouched = !opts || opts.autoCompleteUntouched !== false;
  // Ad-hoc sessions have their own finish flow
  if (state.adhocActive) { finishAdhocWorkout(); return; }
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

  // Fill defaults for any set the user marked done but didn't enter values
  // for. In normal-finish mode, also promote untouched sets to "done" so the
  // session reflects "completed as prescribed." In exit mode we skip that
  // promotion — untouched sets fall through to the build-sets loop and are
  // dropped by the `r == null` guard.
  day.blocks.forEach(block => {
    block.exercises.forEach((ex, ei) => {
      if (ex.isWarmup) return;
      const last = getLastSetsFor(ex.exId || ex.name);
      for (let i = 0; i < ex.sets; i++) {
        const sKey = inputKey(block.id, ei, i, "status");
        if (inputs[sKey] === "skipped") continue;
        if (!inputs[sKey]) {
          if (!autoCompleteUntouched) continue;
          inputs[sKey] = "done";
        }
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
  // Include manual PRs as baseline so session sets aren't incorrectly flagged
  (u.manualPRs || []).forEach(mpr => {
    const score = calcE1RM(mpr.weight || 0, mpr.reps || 0);
    if (score > 0 && (!priorBest[mpr.exId] || score > priorBest[mpr.exId].score)) {
      priorBest[mpr.exId] = { score, w: mpr.weight, r: mpr.reps };
    }
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
  const entryForWeek = activeProgramOf(uForWeek);

  // Stamp mesocycle context if user is on an rp-hypertrophy program with an active meso
  const activeMeso = (typeof getActiveMesocycle === "function" && entryForWeek)
    ? getActiveMesocycle(entryForWeek) : null;
  const hasRpBlocks = day.blocks.some(b => b.blockType === "rp-hypertrophy");

  const session = {
    id: "s-" + Date.now(),
    dayId: day.id,
    dayName: day.name,
    startedAt: draft.startedAt,
    finishedAt: Date.now(),
    duration, sets, volume, prCount,
    blockNotes,
    programId: uForWeek ? uForWeek.activeProgramId || null : null,
    programWeek: entryForWeek ? entryForWeek.currentWeek || null : null,
    feedback: {},
    // Mesocycle context — null for non-RP sessions
    mesocycleId: (activeMeso && hasRpBlocks) ? activeMeso.id : null,
    mesoWeek:    (activeMeso && hasRpBlocks) ? activeMeso.currentWeek : null
  };

  updateUser(u => {
    u.sessions.push(session);
    if (!u.firstWorkoutCompleted) u.firstWorkoutCompleted = true;
    const entry = activeProgramOf(u);
    if (entry) {
      entry.draft = null;
      entry.lastDoneDayId = day.id;
      // Increment RP completedSessionsByWeek for isMicrocycleBoundary detection
      if (hasRpBlocks && activeMeso && session.mesoWeek) {
        const meso = getMesocycle(entry, activeMeso.id);
        if (meso) {
          if (!meso.completedSessionsByWeek) meso.completedSessionsByWeek = {};
          meso.completedSessionsByWeek[session.mesoWeek] =
            (meso.completedSessionsByWeek[session.mesoWeek] || 0) + 1;
        }
      }
    }
  });

  // Offer RP feedback sheet for rp-hypertrophy sessions (§4.7). Non-blocking.
  if (hasRpBlocks && typeof maybeShowRpFeedbackSheet === "function") {
    setTimeout(() => maybeShowRpFeedbackSheet(day, session.id), 600);
  }

  const hasSuperset = day.blocks.some(b => b.exercises.filter(e => !e.isWarmup).length > 1);
  const completeLabel = hasSuperset ? "Superset Complete" : "Sets Complete";
  const exitMode = !autoCompleteUntouched;

  state.trimmedBlocks = null;
  state.workoutView = "chapters";
  state.focusBlockIdx = null;
  state.focusExIdx = 0;
  stopSessionTimer();
  hideHeaderRest();
  state.workoutStartedAt = null;

  // Check if this completes the week (all days done).
  // RP programs advance after feedback capture via captureSessionFeedback →
  // isMicrocycleBoundary → _rpAdvanceMesocycleWeek; skip regular advance here.
  const uAfter = userData();
  const entryAfter = activeProgramOf(uAfter);
  if (entryAfter && entryAfter.totalWeeks && entryAfter.currentWeek && entryAfter.templateId !== "rp-hypertrophy") {
    const weekSessions = uAfter.sessions.filter(s => s.programWeek === entryAfter.currentWeek && (!s.programId || s.programId === entryAfter.id));
    const uniqueDays = new Set(weekSessions.map(s => s.dayId));
    if (uniqueDays.size >= entryAfter.program.length && entryAfter.currentWeek <= entryAfter.totalWeeks) {
      if (entryAfter.currentWeek < entryAfter.totalWeeks) {
        advanceWeek();
        showToast("Week " + (entryAfter.currentWeek + 1) + " unlocked! New exercises loaded.", "success");
      } else {
        // Program complete
        showToast("Program complete! Check settings to restart or switch.", "pr");
      }
      renderWorkoutScreen();
      const msg2 = exitMode
        ? _exitToast(sets.length)
        : (prCount > 0
            ? `🏆 ${completeLabel}! ${sets.length} sets, ${prCount} PR${prCount>1?'s':''}!`
            : `✓ ${completeLabel}! ${sets.length} sets in ${formatDuration(duration)}`);
      setTimeout(() => showToast(msg2, (!exitMode && prCount > 0) ? "pr" : "success"), 1500);
      return;
    }
  }

  // Move to next day in rotation (within same week). On exit we stay on the
  // current day so the user can pick up where they left off — the saved
  // session is in history, but the rotation pointer hasn't moved.
  if (!exitMode) {
    const _ap = activeProgram();
    const nextDay = _ap ? (day.id % _ap.program.length) + 1 : day.id;
    state.currentDayId = nextDay;
  }
  renderWorkoutScreen();

  const msg = exitMode
    ? _exitToast(sets.length)
    : (prCount > 0
        ? `🏆 ${completeLabel}! ${sets.length} sets, ${prCount} PR${prCount>1?'s':''}!`
        : `✓ ${completeLabel}! ${sets.length} sets in ${formatDuration(duration)}`);
  showToast(msg, (!exitMode && prCount > 0) ? "pr" : "success");
}

function _exitToast(n) {
  if (n === 0) return "Workout exited — nothing to save";
  return `✓ Saved ${n} set${n > 1 ? "s" : ""} from your workout`;
}
