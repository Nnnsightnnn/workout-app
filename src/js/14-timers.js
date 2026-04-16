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

const _restCircumference = 2 * Math.PI * 12; // r=12 from SVG

function showHeaderRest(seconds) {
  hideHeaderRest();
  _resumeAudioCtx();

  state.restEndsAt = Date.now() + seconds * 1000;
  state.restTotal = seconds;
  state.restActiveSec = seconds;

  const pill = document.getElementById("restPill");
  const timeEl = document.getElementById("restPillTime");
  const arc = pill.querySelector(".rest-pill-arc");

  pill.classList.add("active");
  pill.classList.remove("done");

  const tick = () => {
    const rem = Math.max(0, Math.ceil((state.restEndsAt - Date.now()) / 1000));
    timeEl.textContent = formatRest(rem);
    const frac = state.restTotal > 0 ? rem / state.restTotal : 0;
    arc.style.strokeDashoffset = _restCircumference * (1 - frac);

    if (rem === 0) {
      clearInterval(state.restIntervalId);
      state.restIntervalId = null;
      pill.classList.add("done");
      playBeep();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      setTimeout(hideHeaderRest, 2000);
    }
  };
  tick();
  state.restIntervalId = setInterval(tick, 250);
}

function hideHeaderRest() {
  if (state.restIntervalId) clearInterval(state.restIntervalId);
  state.restIntervalId = null;
  state.restEndsAt = null;
  const pill = document.getElementById("restPill");
  pill.classList.remove("active", "done");
}

function setRestDuration(seconds) {
  state.restEndsAt = Date.now() + seconds * 1000;
  state.restTotal = seconds;
  state.restActiveSec = seconds;

  const pill = document.getElementById("restPill");
  pill.classList.remove("done");
  pill.classList.add("active");

  if (!state.restIntervalId) {
    const timeEl = document.getElementById("restPillTime");
    const arc = pill.querySelector(".rest-pill-arc");

    const tick = () => {
      const rem = Math.max(0, Math.ceil((state.restEndsAt - Date.now()) / 1000));
      timeEl.textContent = formatRest(rem);
      const frac = state.restTotal > 0 ? rem / state.restTotal : 0;
      arc.style.strokeDashoffset = _restCircumference * (1 - frac);
      if (rem === 0) {
        clearInterval(state.restIntervalId);
        state.restIntervalId = null;
        pill.classList.add("done");
        playBeep();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        setTimeout(hideHeaderRest, 2000);
      }
    };
    tick();
    state.restIntervalId = setInterval(tick, 250);
  }
}

function addRestTime(sec) {
  if (state.restEndsAt) {
    state.restEndsAt += sec * 1000;
    state.restTotal += sec;
  }
}

// ============================================================
// REST TIMER SHEET (full controls via bottom sheet)
// ============================================================
let _restSheetSyncId = null;

function openRestSheet() {
  const rem = state.restEndsAt ? Math.max(0, Math.ceil((state.restEndsAt - Date.now()) / 1000)) : 0;
  const activeSec = state.restActiveSec || 90;

  const html = `
    <div class="sa-timer">
      <div class="sa-timer-time">${formatRest(rem)}</div>
      <div class="sa-timer-pills">
        <button class="rest-pill${activeSec === 45 ? " active" : ""}" data-sec="45">45s</button>
        <button class="rest-pill${activeSec === 60 ? " active" : ""}" data-sec="60">1:00</button>
        <button class="rest-pill${activeSec === 90 ? " active" : ""}" data-sec="90">1:30</button>
        <button class="rest-pill${activeSec === 120 ? " active" : ""}" data-sec="120">2:00</button>
        <button class="rest-pill${activeSec === 180 ? " active" : ""}" data-sec="180">3:00</button>
      </div>
      <div class="sa-timer-actions">
        <button class="rest-inline-btn" data-action="add30">+30</button>
        <button class="rest-inline-btn" data-action="skip">Skip</button>
      </div>
      <div class="rest-inline-bar"><div class="rest-inline-fill" id="restSheetFill"></div></div>
    </div>
  `;

  openSheet(html);

  const root = document.getElementById("sheetContent");

  // Sync sheet display with running header timer
  if (_restSheetSyncId) clearInterval(_restSheetSyncId);
  _restSheetSyncId = setInterval(() => {
    const timeEl = root.querySelector(".sa-timer-time");
    const fillEl = root.querySelector("#restSheetFill");
    const wrap = root.querySelector(".sa-timer");
    if (!timeEl) { clearInterval(_restSheetSyncId); _restSheetSyncId = null; return; }
    if (!state.restEndsAt) {
      timeEl.textContent = formatRest(0);
      fillEl.style.width = "0%";
      return;
    }
    const r = Math.max(0, Math.ceil((state.restEndsAt - Date.now()) / 1000));
    timeEl.textContent = formatRest(r);
    const frac = state.restTotal > 0 ? r / state.restTotal : 0;
    fillEl.style.width = (frac * 100) + "%";
    if (r === 0 && wrap) wrap.classList.add("done");
  }, 250);

  // Event delegation for sheet controls
  root.addEventListener("click", (e) => {
    const pill = e.target.closest(".rest-pill");
    if (pill) {
      const sec = parseInt(pill.dataset.sec);
      setRestDuration(sec);
      root.querySelectorAll(".rest-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const wrap = root.querySelector(".sa-timer");
      if (wrap) wrap.classList.remove("done");
      return;
    }
    const btn = e.target.closest(".rest-inline-btn");
    if (btn) {
      if (btn.dataset.action === "add30") {
        addRestTime(30);
        const wrap = root.querySelector(".sa-timer");
        if (wrap) wrap.classList.remove("done");
      } else if (btn.dataset.action === "skip") {
        hideHeaderRest();
        closeSheet();
      }
    }
  });
}

function openStandaloneTimer() {
  _resumeAudioCtx();
  if (!state.restEndsAt || state.restEndsAt <= Date.now()) {
    showHeaderRest(90);
  }
  openRestSheet();
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
