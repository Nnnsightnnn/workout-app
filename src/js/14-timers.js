// ============================================================
// TIMERS
// ============================================================
function startSessionTimer() {
  if (!state.workoutStartedAt) return;
  const el = document.getElementById("sessionPill");
  el.classList.add("active");
  if (state.sessionIntervalId) clearInterval(state.sessionIntervalId);
  const tick = () => {
    if (!state.workoutStartedAt) return;
    const sec = Math.floor((Date.now() - state.workoutStartedAt) / 1000);
    el.textContent = formatDuration(sec);
  };
  tick();
  state.sessionIntervalId = setInterval(tick, 1000);
  startPaceTicker();
}
function stopSessionTimer() {
  if (state.sessionIntervalId) clearInterval(state.sessionIntervalId);
  state.sessionIntervalId = null;
  document.getElementById("sessionPill").classList.remove("active");
  stopPaceTicker();
}

function toggleTimerPopover() {
  document.getElementById("timerPopover").classList.toggle("active");
}
function closeTimerPopover() {
  document.getElementById("timerPopover").classList.remove("active");
}
function adjCustomTimer(step) {
  const el = document.getElementById("customTimerSec");
  el.value = Math.max(10, parseInt(el.value || 0) + step);
}
function startCustomTimer() {
  const sec = parseInt(document.getElementById("customTimerSec").value) || 90;
  startRest(sec, "Custom rest");
  closeTimerPopover();
}

// Persistent AudioContext — created once on first user gesture so it stays
// in "running" state on iOS (which suspends newly created contexts automatically).
let _audioCtx = null;
function _getAudioCtx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return _audioCtx;
}
function _resumeAudioCtx() {
  const ctx = _getAudioCtx();
  if (ctx && ctx.state === "suspended" && ctx.resume) ctx.resume().catch(() => {});
}

function startRest(seconds, label) {
  // Cancel any pending auto-hide from a previous timer that just finished
  if (state.restTimeoutId) { clearTimeout(state.restTimeoutId); state.restTimeoutId = null; }
  if (state.restIntervalId) { clearInterval(state.restIntervalId); state.restIntervalId = null; }
  // Unlock AudioContext while we're in a user-gesture context
  _resumeAudioCtx();
  state.restEndsAt = Date.now() + seconds * 1000;
  state.restTotal = seconds;
  document.getElementById("restOverlay").classList.add("active");
  document.getElementById("restCard").classList.remove("done");
  document.getElementById("restTarget").textContent = label || "Rest";
  maybeShowRestNudge(seconds);
  const tick = () => {
    const rem = Math.max(0, Math.ceil((state.restEndsAt - Date.now()) / 1000));
    document.getElementById("restTime").textContent = formatRest(rem);
    const frac = state.restTotal > 0 ? rem / state.restTotal : 0;
    const c = 2 * Math.PI * 26;
    document.getElementById("restFg").setAttribute("stroke-dashoffset", c * (1 - frac));
    if (rem === 0) {
      clearInterval(state.restIntervalId); state.restIntervalId = null;
      document.getElementById("restCard").classList.add("done");
      playBeep();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      state.restTimeoutId = setTimeout(hideRest, 3500);
    }
  };
  tick();
  state.restIntervalId = setInterval(tick, 250);
}
function addRest(sec) { if (state.restEndsAt) { state.restEndsAt += sec * 1000; state.restTotal += sec; } }
function skipRest() { hideRest(); }
function hideRest() {
  if (state.restIntervalId) clearInterval(state.restIntervalId);
  if (state.restTimeoutId) { clearTimeout(state.restTimeoutId); state.restTimeoutId = null; }
  state.restIntervalId = null; state.restEndsAt = null;
  document.getElementById("restOverlay").classList.remove("active");
}

function playBeep() {
  try {
    const ctx = _getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

function formatDuration(sec) {
  const m = Math.floor(sec/60), s = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m/60), mm = m%60;
    return `${h}:${String(mm).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function formatRest(sec) {
  const m = Math.floor(sec/60), s = sec%60;
  if (m === 0) return `${s}s`;
  return `${m}:${String(s).padStart(2,"0")}`;
}
function formatVolume(v) {
  if (v >= 10000) return (v/1000).toFixed(1) + "k";
  return Math.round(v).toString();
}