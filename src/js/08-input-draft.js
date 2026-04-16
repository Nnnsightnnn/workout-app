// ============================================================
// INPUT DRAFT MANAGEMENT
// ============================================================
function getDraft() {
  const u = userData();
  if (!u || !u.draft || u.draft.dayId !== state.currentDayId) return null;
  return u.draft;
}

function ensureDraft() {
  updateUser(u => {
    if (!u.draft || u.draft.dayId !== state.currentDayId) {
      u.draft = { dayId: state.currentDayId, startedAt: Date.now(), inputs: {}, pausedAt: null };
    }
  });
  state.workoutStartedAt = getDraft().startedAt;
  startSessionTimer();
}

function saveInput(key, value) {
  const s = loadStore();
  const user = s.users.find(u => u.id === state.userId);
  if (!user) return;
  if (!user.draft || user.draft.dayId !== state.currentDayId) {
    user.draft = { dayId: state.currentDayId, startedAt: Date.now(), inputs: {}, pausedAt: null };
    state.workoutStartedAt = user.draft.startedAt;
    startSessionTimer();
  }
  user.draft.inputs[key] = value;
  saveStore(s);
  updateFinishButton();
  updateProgress();
}

function getInput(key, fallback) {
  const draft = getDraft();
  if (!draft) return fallback;
  return draft.inputs[key] != null ? draft.inputs[key] : fallback;
}

function inputKey(blockId, exIdx, setIdx, field) {
  return `${blockId}|${exIdx}|${setIdx}|${field}`;
}

function hasAnyInput() {
  const draft = getDraft();
  if (!draft) return false;
  return Object.keys(draft.inputs).length > 0;
}

function updateFinishButton() {
  const started = state.workoutStartedAt != null || hasAnyInput();
  document.getElementById("startBtn").style.display = started ? "none" : "";
  document.getElementById("finishBtn").style.display = started ? "" : "none";
  document.getElementById("headerStartBtn").classList.toggle("active", !started);
  document.getElementById("headerFinishBtn").classList.toggle("active", started);

  // Dynamic label based on context
  if (started) {
    const day = getCurrentDay();
    const inFocus = state.workoutView === "focus" && state.focusBlockIdx != null && state.focusBlockIdx >= 0;

    if (inFocus && day) {
      // Check if there are more incomplete blocks after current
      let hasMoreBlocks = false;
      for (let i = state.focusBlockIdx + 1; i < day.blocks.length; i++) {
        const bp = calcBlockProgress(day.blocks[i]);
        if (bp.done < bp.total) { hasMoreBlocks = true; break; }
      }

      if (hasMoreBlocks) {
        const block = day.blocks[state.focusBlockIdx];
        const lbl = block ? "✓ Block " + block.letter + " →" : "Next →";
        document.getElementById("finishBtn").textContent = lbl;
        document.getElementById("headerFinishBtn").textContent = "Next →";
      } else {
        document.getElementById("finishBtn").textContent = "✓ Finish Workout";
        document.getElementById("headerFinishBtn").textContent = "✓ Finish";
      }
    } else {
      document.getElementById("finishBtn").textContent = "✓ Finish Workout";
      document.getElementById("headerFinishBtn").textContent = "✓ Finish";
    }
  }

  updateSessionEst();
}

function calcBlockProgress(block) {
  let total = 0, done = 0;
  block.exercises.forEach((ex, ei) => {
    if (ex.isWarmup) return;
    const numSets = ex.sets || 3;
    for (let i = 0; i < numSets; i++) {
      total++;
      if (getInput(inputKey(block.id, ei, i, "status"), null) === "done") done++;
    }
  });
  return { done, total };
}

function calcProgress() {
  const day = getCurrentDay();
  if (!day) return { done: 0, total: 0 };
  let total = 0, done = 0;
  day.blocks.forEach(block => {
    const bp = calcBlockProgress(block);
    total += bp.total;
    done += bp.done;
  });
  return { done, total };
}

function calcLiveStats(day) {
  const draft = getDraft();
  if (!draft || !day) return { volume: 0, setsDone: 0, setsTotal: 0, prs: 0 };
  const inputs = draft.inputs;
  let volume = 0, setsDone = 0, setsTotal = 0;
  const currentSets = [];
  day.blocks.forEach(block => {
    block.exercises.forEach((ex, ei) => {
      if (ex.isWarmup) return;
      const numSets = ex.sets || 3;
      for (let i = 0; i < numSets; i++) {
        setsTotal++;
        if (inputs[inputKey(block.id, ei, i, "status")] === "done") {
          setsDone++;
          const w = inputs[inputKey(block.id, ei, i, "w")] ?? 0;
          const r = inputs[inputKey(block.id, ei, i, "r")] ?? 0;
          if (r > 0) {
            volume += w * r;
            currentSets.push({ exId: ex.exId || ex.name, weight: w, reps: r });
          }
        }
      }
    });
  });
  // PR detection against history
  const u = userData();
  const priorBest = {};
  if (u) {
    u.sessions.forEach(s => {
      s.sets.forEach(set => {
        const key = set.exId;
        const score = set.weight * (1 + set.reps / 30);
        if (!priorBest[key] || score > priorBest[key]) priorBest[key] = score;
      });
    });
  }
  let prs = 0;
  currentSets.forEach(s => {
    if (s.weight > 0) {
      const score = s.weight * (1 + s.reps / 30);
      if (!priorBest[s.exId] || score > priorBest[s.exId]) prs++;
    }
  });
  return { volume, setsDone, setsTotal, prs };
}

function updateProgress() {
  const wrap = document.getElementById("workoutProgressWrap");
  const fill = document.getElementById("workoutProgressFill");
  if (!wrap || !fill) return;
  const started = state.workoutStartedAt != null || hasAnyInput();
  wrap.style.display = started ? "" : "none";
  const { done, total } = calcProgress();
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  fill.style.width = pct + "%";
  fill.classList.toggle("complete", pct === 100 && total > 0);
  if (pct === 100 && total > 0 && done > 0) triggerCelebration();
  updatePaceChip();
}

function triggerCelebration() {
  if (document.querySelector(".celebration")) return;
  const el = document.createElement("div");
  el.className = "celebration";
  const colors = Object.values(GROUP_COLORS);
  for (let i = 0; i < 30; i++) {
    const dot = document.createElement("span");
    dot.style.left = (20 + Math.random() * 60) + "%";
    dot.style.top = (40 + Math.random() * 20) + "%";
    dot.style.background = colors[i % colors.length];
    dot.style.animationDelay = (i * 30) + "ms";
    dot.style.width = (4 + Math.random() * 4) + "px";
    dot.style.height = dot.style.width;
    el.appendChild(dot);
  }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}