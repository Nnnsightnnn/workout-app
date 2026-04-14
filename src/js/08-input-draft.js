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
      u.draft = { dayId: state.currentDayId, startedAt: Date.now(), inputs: {} };
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
    user.draft = { dayId: state.currentDayId, startedAt: Date.now(), inputs: {} };
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
}

function calcProgress() {
  const day = getCurrentDay();
  if (!day) return { done: 0, total: 0 };
  let total = 0, done = 0;
  day.blocks.forEach(block => {
    block.exercises.forEach((ex, ei) => {
      if (ex.isWarmup) return;
      const numSets = ex.sets || 3;
      for (let i = 0; i < numSets; i++) {
        total++;
        if (getInput(inputKey(block.id, ei, i, "status"), null) === "done") done++;
      }
    });
  });
  return { done, total };
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