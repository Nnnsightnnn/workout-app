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

// ============================================================
// INLINE REST TIMER
// ============================================================

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

function showInlineRest(cardEl, seconds) {
  // Dismiss any existing inline rest timer
  hideInlineRest();
  // Unlock AudioContext while we're in a user-gesture context
  _resumeAudioCtx();

  state.restCardEl = cardEl;
  state.restEndsAt = Date.now() + seconds * 1000;
  state.restTotal = seconds;

  // Build the inline timer element
  const el = document.createElement("div");
  el.className = "rest-inline";
  el.innerHTML = `
    <div class="rest-inline-top">
      <span class="rest-inline-time">${formatRest(seconds)}</span>
      <div class="rest-inline-pills">
        <button class="rest-pill" data-sec="45">45s</button>
        <button class="rest-pill" data-sec="60">1:00</button>
        <button class="rest-pill" data-sec="90">1:30</button>
        <button class="rest-pill" data-sec="120">2:00</button>
        <button class="rest-pill" data-sec="180">3:00</button>
      </div>
      <button class="rest-inline-btn" data-action="add30">+30</button>
      <button class="rest-inline-btn" data-action="skip">Skip</button>
    </div>
    <div class="rest-inline-bar"><div class="rest-inline-fill"></div></div>`;

  // Mark initial active pill
  const activePill = el.querySelector(`.rest-pill[data-sec="${seconds}"]`);
  if (activePill) activePill.classList.add("active");

  // Event delegation
  el.addEventListener("click", (e) => {
    const pill = e.target.closest(".rest-pill");
    if (pill) {
      const sec = parseInt(pill.dataset.sec);
      setRestDuration(sec);
      el.querySelectorAll(".rest-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      return;
    }
    const btn = e.target.closest(".rest-inline-btn");
    if (btn) {
      if (btn.dataset.action === "add30") addInlineRest(30);
      else if (btn.dataset.action === "skip") hideInlineRest();
    }
  });

  cardEl.appendChild(el);

  // Force layout then expand
  el.style.maxHeight = "0";
  requestAnimationFrame(() => {
    el.style.maxHeight = el.scrollHeight + "px";
  });

  // Start tick
  const tick = () => {
    const rem = Math.max(0, Math.ceil((state.restEndsAt - Date.now()) / 1000));
    const timeEl = el.querySelector(".rest-inline-time");
    const fillEl = el.querySelector(".rest-inline-fill");
    if (!timeEl) return;
    timeEl.textContent = formatRest(rem);
    const frac = state.restTotal > 0 ? rem / state.restTotal : 0;
    fillEl.style.width = (frac * 100) + "%";

    if (rem === 0) {
      clearInterval(state.restIntervalId);
      state.restIntervalId = null;
      el.classList.add("done");
      playBeep();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      setTimeout(hideInlineRest, 2000);
    }
  };
  tick();
  state.restIntervalId = setInterval(tick, 250);
}

function hideInlineRest() {
  if (state.restIntervalId) clearInterval(state.restIntervalId);
  state.restIntervalId = null;
  state.restEndsAt = null;
  const existing = state.restCardEl && state.restCardEl.querySelector(".rest-inline");
  if (existing) {
    existing.style.maxHeight = "0";
    existing.addEventListener("transitionend", () => existing.remove(), { once: true });
    // Fallback removal if transition doesn't fire
    setTimeout(() => { if (existing.parentNode) existing.remove(); }, 400);
  }
  state.restCardEl = null;
}

function setRestDuration(seconds) {
  if (!state.restCardEl) return;
  state.restEndsAt = Date.now() + seconds * 1000;
  state.restTotal = seconds;
  const el = state.restCardEl.querySelector(".rest-inline");
  if (el) el.classList.remove("done");
  // Restart tick if it was cleared (timer had finished)
  if (!state.restIntervalId) {
    const tick = () => {
      const rem = Math.max(0, Math.ceil((state.restEndsAt - Date.now()) / 1000));
      const timeEl = el && el.querySelector(".rest-inline-time");
      const fillEl = el && el.querySelector(".rest-inline-fill");
      if (!timeEl) return;
      timeEl.textContent = formatRest(rem);
      const frac = state.restTotal > 0 ? rem / state.restTotal : 0;
      fillEl.style.width = (frac * 100) + "%";
      if (rem === 0) {
        clearInterval(state.restIntervalId);
        state.restIntervalId = null;
        if (el) el.classList.add("done");
        playBeep();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        setTimeout(hideInlineRest, 2000);
      }
    };
    tick();
    state.restIntervalId = setInterval(tick, 250);
  }
}

function addInlineRest(sec) {
  if (state.restEndsAt) {
    state.restEndsAt += sec * 1000;
    state.restTotal += sec;
  }
}

// ============================================================
// FORMAT UTILITIES
// ============================================================
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
