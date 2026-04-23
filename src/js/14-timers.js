// ============================================================
// TIMERS
// ============================================================
function startSessionTimer() {
  if (!state.workoutStartedAt) return;
  const el = document.getElementById("sessionPill");
  el.classList.add("active");

  // If draft is paused, show frozen time without starting interval
  const draft = getDraft();
  if (draft && draft.pausedAt) {
    if (state.sessionIntervalId) clearInterval(state.sessionIntervalId);
    state.sessionIntervalId = null;
    const sec = Math.floor((draft.pausedAt - state.workoutStartedAt) / 1000);
    el.textContent = formatDuration(sec);
    el.classList.add("paused");
    return;
  }

  el.classList.remove("paused");
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
  const el = document.getElementById("sessionPill");
  el.classList.remove("active", "paused");
  stopPaceTicker();
}

function pauseSessionTimer() {
  const draft = getDraft();
  if (!draft || draft.pausedAt) return;
  if (state.sessionIntervalId) clearInterval(state.sessionIntervalId);
  state.sessionIntervalId = null;
  stopPaceTicker();
  updateUser(u => { if (u.draft) u.draft.pausedAt = Date.now(); });
  const el = document.getElementById("sessionPill");
  el.classList.add("paused");
}

function resumeSessionTimer() {
  const draft = getDraft();
  if (!draft || !draft.pausedAt) return;
  const pausedFor = Date.now() - draft.pausedAt;
  updateUser(u => {
    if (!u.draft) return;
    u.draft.startedAt += pausedFor;
    u.draft.pausedAt = null;
  });
  state.workoutStartedAt = getDraft().startedAt;
  document.getElementById("sessionPill").classList.remove("paused");
  startSessionTimer();
}

function toggleSessionTimer() {
  const draft = getDraft();
  if (!draft) return;
  draft.pausedAt ? resumeSessionTimer() : pauseSessionTimer();
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

function _buildRingTicks() {
  const R = 90, cx = 120, cy = 120;
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const r1 = R + 8, r2 = i % 5 === 0 ? R + 18 : R + 13;
    const x1 = cx + Math.cos(a) * r1, y1 = cy + Math.sin(a) * r1;
    const x2 = cx + Math.cos(a) * r2, y2 = cy + Math.sin(a) * r2;
    const sw = i % 5 === 0 ? 1.5 : 1;
    ticks += `<line class="ring-tick" data-i="${i}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(255,255,255,0.1)" stroke-width="${sw}"/>`;
  }
  return ticks;
}

const _ringR = 90;
const _ringC = 2 * Math.PI * _ringR; // ~565.49

function openRestSheet() {
  const rem = state.restEndsAt ? Math.max(0, Math.ceil((state.restEndsAt - Date.now()) / 1000)) : 0;
  const activeSec = state.restActiveSec || 90;
  const frac = state.restTotal > 0 ? rem / state.restTotal : 0;
  const offset = _ringC * (1 - frac);

  const html = `
    <div class="sa-timer">
      <div class="ring-timer">
        <svg viewBox="0 0 240 240">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="var(--accent-ember)"/>
              <stop offset="60%" stop-color="var(--accent)"/>
              <stop offset="100%" stop-color="var(--accent-dim)"/>
            </linearGradient>
            <filter id="ringGlow"><feGaussianBlur stdDeviation="4"/></filter>
          </defs>
          <circle cx="120" cy="120" r="${_ringR}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3"/>
          ${_buildRingTicks()}
          <circle class="ring-timer-glow" cx="120" cy="120" r="${_ringR}" fill="none" stroke="url(#ringGrad)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${_ringC.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" transform="rotate(-90 120 120)" filter="url(#ringGlow)"/>
          <circle class="ring-timer-arc" cx="120" cy="120" r="${_ringR}" fill="none" stroke="url(#ringGrad)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${_ringC.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" transform="rotate(-90 120 120)"/>
        </svg>
        <div class="ring-timer-center">
          <div class="ring-timer-label accent">Remaining</div>
          <div class="ring-timer-time">${formatRest(rem)}</div>
          <div class="ring-timer-label">of ${formatRest(state.restTotal || activeSec)}</div>
        </div>
      </div>
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
    </div>
  `;

  openSheet(html);

  const root = document.getElementById("sheetContent");

  // Sync ring display with running header timer
  if (_restSheetSyncId) clearInterval(_restSheetSyncId);
  _restSheetSyncId = setInterval(() => {
    const timeEl = root.querySelector(".ring-timer-time");
    const arcEl = root.querySelector(".ring-timer-arc");
    const glowEl = root.querySelector(".ring-timer-glow");
    const totalLabel = root.querySelectorAll(".ring-timer-label")[1];
    const wrap = root.querySelector(".sa-timer");
    if (!timeEl) { clearInterval(_restSheetSyncId); _restSheetSyncId = null; return; }
    if (!state.restEndsAt) {
      timeEl.textContent = formatRest(0);
      if (arcEl) { arcEl.style.strokeDashoffset = _ringC; }
      if (glowEl) { glowEl.style.strokeDashoffset = _ringC; }
      return;
    }
    const r = Math.max(0, Math.ceil((state.restEndsAt - Date.now()) / 1000));
    timeEl.textContent = formatRest(r);
    if (totalLabel) totalLabel.textContent = "of " + formatRest(state.restTotal || 90);
    const pct = state.restTotal > 0 ? r / state.restTotal : 0;
    const off = (_ringC * (1 - pct)).toFixed(2);
    if (arcEl) arcEl.style.strokeDashoffset = off;
    if (glowEl) glowEl.style.strokeDashoffset = off;
    // Color tick marks based on progress
    const ticks = root.querySelectorAll(".ring-tick");
    ticks.forEach(t => {
      const i = parseInt(t.dataset.i);
      t.setAttribute("stroke", i / 60 < (1 - pct) ? "var(--accent)" : "rgba(255,255,255,0.1)");
    });
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
