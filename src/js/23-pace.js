// ============================================================
// PACE & SESSION TIMING
// ============================================================

// Estimate total session duration in minutes for a given day object.
// Formula: each working set costs ~45s execution + its configured rest (default 90s).
function estimateSessionMinutes(day) {
  if (!day) return 0;
  let totalSec = 0;
  day.blocks.forEach(block => {
    block.exercises.forEach(ex => {
      if (ex.isWarmup) return;
      const numSets = ex.sets || 3;
      const rest = (ex.rest != null && ex.rest >= 0) ? ex.rest : 90;
      totalSec += numSets * (45 + rest);
    });
  });
  return Math.round(totalSec / 60);
}

// Update the pre-start session estimate chip on the workout screen.
function updateSessionEst() {
  const row = document.getElementById("sessionEstRow");
  if (!row) return;
  const started = state.workoutStartedAt != null || hasAnyInput();
  const day = getCurrentDay();
  if (!started && day && state.dayChosen) {
    const estMin = estimateSessionMinutes(day);
    const { total } = calcProgress();
    row.innerHTML = `<span class="est-icon">⏱</span><span class="est-badge">~${estMin} min</span><span class="est-detail">· ${total} sets</span>`;
    row.style.display = "";
  } else {
    row.style.display = "none";
  }
}

// Calculate pace status during an active workout.
// Returns null when workout not started or no progress data.
// Returns { status:"green"|"amber"|"red", overByMin, estTotalMin }
function calcPaceStatus() {
  if (!state.workoutStartedAt) return null;
  const day = getCurrentDay();
  if (!day) return null;
  const estTotalMin = estimateSessionMinutes(day);
  if (estTotalMin === 0) return null;
  const { done, total } = calcProgress();
  if (total === 0) return null;

  const elapsedMin = (Date.now() - state.workoutStartedAt) / 60000;
  const fracDone = done / total;
  const expectedElapsedMin = fracDone * estTotalMin;
  const overByMin = elapsedMin - expectedElapsedMin;

  let status = "green";
  if (overByMin >= 10) status = "red";
  else if (overByMin >= 5) status = "amber";

  return { status, overByMin: Math.round(overByMin * 10) / 10, estTotalMin };
}

// Render the live pace chip and manage trim/undo button visibility.
function updatePaceChip() {
  const chip = document.getElementById("paceChip");
  const trimRow = document.getElementById("trimRow");
  if (!chip) return;

  if (!state.workoutStartedAt) {
    chip.style.display = "none";
    if (trimRow) trimRow.style.display = "none";
    return;
  }

  const pace = calcPaceStatus();
  if (!pace) {
    chip.style.display = "none";
    if (trimRow) trimRow.style.display = "none";
    return;
  }

  chip.style.display = "";
  chip.className = "pace-chip pace-" + pace.status;

  const over = pace.overByMin;
  const overStr = over > 0.5 ? `+${Math.round(over)} min` : over < -0.5 ? `${Math.round(over)} min` : "on track";
  const label = pace.status === "green" ? "On pace" : "Running long";
  chip.textContent = `${label} · ${overStr} · ~${pace.estTotalMin} min est.`;

  if (trimRow) {
    const hasTrimmed = state.trimmedBlocks && state.trimmedBlocks.length > 0;
    const showAny = pace.status === "red" || hasTrimmed;
    trimRow.style.display = showAny ? "" : "none";
    const trimBtn = document.getElementById("trimBtn");
    const undoBtn = document.getElementById("undoTrimBtn");
    if (trimBtn) trimBtn.style.display = pace.status === "red" ? "" : "none";
    if (undoBtn) undoBtn.style.display = hasTrimmed ? "" : "none";
  }
}

// Start the pace update interval (called alongside session timer).
function startPaceTicker() {
  if (state.paceIntervalId) clearInterval(state.paceIntervalId);
  updatePaceChip();
  state.paceIntervalId = setInterval(updatePaceChip, 20000);
}

// Stop the pace interval and clear the chip.
function stopPaceTicker() {
  if (state.paceIntervalId) clearInterval(state.paceIntervalId);
  state.paceIntervalId = null;
  updatePaceChip();
}

// Remove the last block that has no done sets from the current day.
function trimSession() {
  const day = getCurrentDay();
  if (!day) return;

  // Walk blocks in order; track the last one with zero done sets.
  let lastPendingIdx = -1;
  day.blocks.forEach((block, bi) => {
    if (block.exercises.every(ex => ex.isWarmup)) return;
    let anyDone = false;
    block.exercises.forEach((ex, ei) => {
      if (ex.isWarmup) return;
      const n = ex.sets || 3;
      for (let i = 0; i < n; i++) {
        if (getInput(inputKey(block.id, ei, i, "status"), null) === "done") anyDone = true;
      }
    });
    if (!anyDone) lastPendingIdx = bi;
  });

  if (lastPendingIdx < 0) {
    showToast("No untouched blocks to trim");
    return;
  }

  const trimmedBlock = deepClone(day.blocks[lastPendingIdx]);
  if (!state.trimmedBlocks) state.trimmedBlocks = [];
  state.trimmedBlocks.push({ dayId: day.id, blockIdx: lastPendingIdx, block: trimmedBlock });

  mutateDay(d => { d.blocks.splice(lastPendingIdx, 1); });
  renderWorkoutScreen();
  showToast(`Trimmed "${trimmedBlock.name}" — tap Undo to restore`, "success");
  updatePaceChip();
}

// Restore the most recently trimmed block.
function undoTrim() {
  if (!state.trimmedBlocks || !state.trimmedBlocks.length) return;
  const last = state.trimmedBlocks.pop();
  mutateDay(d => {
    if (d.id === last.dayId) d.blocks.splice(last.blockIdx, 0, last.block);
  });
  renderWorkoutScreen();
  showToast("Block restored", "success");
  updatePaceChip();
}

// Show the rest-nudge suggestion if session is running long and rest > 60s.
function maybeShowRestNudge(requestedSec) {
  const nudge = document.getElementById("restNudge");
  if (!nudge) return;
  const pace = calcPaceStatus();
  const isLong = pace && (pace.status === "amber" || pace.status === "red");
  if (isLong && requestedSec > 60) {
    nudge.style.display = "";
    const btn = nudge.querySelector(".rest-nudge-btn");
    if (btn) {
      btn.onclick = () => {
        const lbl = (document.getElementById("restTarget") || {}).textContent || "Rest";
        startRest(60, lbl);
        nudge.style.display = "none";
      };
    }
  } else {
    nudge.style.display = "none";
  }
}
