// ============================================================
// TUTORIAL (coach-mark overlay)
// ============================================================
//
// Contextual tour shown after the onboarding handoff (and re-runnable
// via the `?` button in the header). Each step spotlights a UI element
// with a chunky bubble card; steps without a target render centered.
//
// State persists in s.tutorialState = { completedAt, dismissedAt, lastStepId }.

const TUTORIAL_STEPS = [
  {
    id: "welcome",
    target: null,
    placement: "center",
    title: "Quick tour",
    body: "60-second walkthrough so you know where everything lives. You can re-open it anytime from the ? in the header."
  },
  {
    id: "start-btn",
    target: "#headerStartBtn",
    placement: "bottom",
    title: "Start your workout",
    body: "Tap Start to begin a session. The session timer kicks off automatically."
  },
  {
    id: "exercise-card",
    target: '.exercise-card[data-bi="0"][data-ei="0"]',
    fallback: ".exercise-card",
    placement: "bottom",
    title: "Tap an exercise to log sets",
    body: "Each card opens an editor where you enter weight, reps, and effort. Last session auto-fills so you can just tap to confirm."
  },
  {
    id: "set-inputs",
    target: "#f-sets",
    placement: "top",
    title: "Sets · reps · rest",
    body: "Inside the editor you'll find quick steppers for sets, reps, and rest. Tap once and the rest timer fires between sets."
  },
  {
    id: "session-pill",
    target: "#sessionPill",
    placement: "bottom",
    title: "Workout & rest timers",
    body: "Your session time lives here. A rest-timer ring appears next to it during sets — with audio + vibration cues."
  },
  {
    id: "finish-btn",
    target: "#headerFinishBtn",
    placement: "bottom",
    title: "Finish & track PRs",
    body: "When you're done, tap ✓ Sets to wrap the session. Personal records and e1RM updates are tracked automatically."
  },
  {
    id: "bottom-nav",
    target: "nav.bottom",
    placement: "top",
    title: "History, body & PRs",
    body: "The bottom bar gets you to your training history, body-weight log, PRs, and the standalone rest timer."
  },
  {
    id: "customize",
    target: "#customizeDayBtn",
    placement: "bottom",
    title: "Customize anything",
    body: "Tap the menu icon on any exercise to swap, reorder, or rename. The day-bar tools above let you reshape entire days."
  },
  {
    id: "done",
    target: null,
    placement: "center",
    title: "You're ready",
    body: "Need a refresher? Tap the ? in the header anytime. Have a great session."
  }
];

let _tIdx = 0;
let _tActive = false;
let _tForcing = false;
let _tRepositionRaf = 0;

function _tState() {
  const s = loadStore();
  if (!s.tutorialState) {
    s.tutorialState = { completedAt: null, dismissedAt: null, lastStepId: null };
  }
  return s;
}

function _tSaveState(patch) {
  const s = _tState();
  s.tutorialState = { ...s.tutorialState, ...patch };
  saveStore(s);
}

function startTutorial(opts) {
  opts = opts || {};
  const overlay = document.getElementById("tutorialOverlay");
  if (!overlay) return;
  const s = _tState();
  if (!opts.force && s.tutorialState.completedAt) return;
  _tIdx = 0;
  _tActive = true;
  _tForcing = !!opts.force;
  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");
  _tBindGlobalListeners();
  _tRender();
}

function closeTutorial(reason) {
  const overlay = document.getElementById("tutorialOverlay");
  if (overlay) {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
  }
  _tActive = false;
  _tUnbindGlobalListeners();
  const step = TUTORIAL_STEPS[_tIdx];
  const lastStepId = step ? step.id : null;
  if (reason === "completed") {
    _tSaveState({ completedAt: Date.now(), lastStepId: "done" });
  } else if (reason === "skipped" || reason === "dismissed") {
    _tSaveState({ dismissedAt: Date.now(), lastStepId });
  }
}

function _tNext() {
  if (_tIdx >= TUTORIAL_STEPS.length - 1) {
    closeTutorial("completed");
    return;
  }
  _tIdx++;
  _tRender();
}

function _tBack() {
  if (_tIdx <= 0) return;
  _tIdx--;
  _tRender();
}

function _tRender() {
  const step = TUTORIAL_STEPS[_tIdx];
  if (!step) { closeTutorial("completed"); return; }

  const labelEl = document.getElementById("tutorialStepLabel");
  const titleEl = document.getElementById("tutorialTitle");
  const bodyEl = document.getElementById("tutorialBody");
  const backBtn = document.getElementById("tutorialBackBtn");
  const nextBtn = document.getElementById("tutorialNextBtn");
  const skipBtn = document.getElementById("tutorialSkipBtn");
  if (!labelEl || !titleEl || !bodyEl || !backBtn || !nextBtn || !skipBtn) return;

  labelEl.textContent = (_tIdx + 1) + " of " + TUTORIAL_STEPS.length;
  titleEl.textContent = step.title;
  bodyEl.textContent = step.body;
  backBtn.hidden = _tIdx === 0;
  nextBtn.textContent = (_tIdx === TUTORIAL_STEPS.length - 1) ? "Got it ✓" : "Next →";
  skipBtn.hidden = _tIdx === TUTORIAL_STEPS.length - 1;

  _tPosition(step);
}

function _tPosition(step) {
  const bubble = document.getElementById("tutorialBubble");
  const spotlight = document.getElementById("tutorialSpotlight");
  if (!bubble || !spotlight) return;

  let target = null;
  if (step.target) {
    target = document.querySelector(step.target);
    if (!target && step.fallback) target = document.querySelector(step.fallback);
  }

  if (!target) {
    bubble.dataset.placement = "center";
    spotlight.setAttribute("x", "-100");
    spotlight.setAttribute("y", "-100");
    spotlight.setAttribute("width", "0");
    spotlight.setAttribute("height", "0");
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    bubble.style.left = "50%";
    bubble.style.top = "50%";
    bubble.style.transform = "translate(-50%, -50%)";
    void bubble.offsetWidth;
    return;
  }

  const rect = target.getBoundingClientRect();
  const pad = 8;
  const sx = rect.left - pad;
  const sy = rect.top - pad;
  const sw = rect.width + pad * 2;
  const sh = rect.height + pad * 2;
  spotlight.setAttribute("x", String(sx));
  spotlight.setAttribute("y", String(sy));
  spotlight.setAttribute("width", String(sw));
  spotlight.setAttribute("height", String(sh));

  const placement = step.placement || "bottom";
  bubble.dataset.placement = placement;
  bubble.style.transform = "";

  const bw = bubble.offsetWidth || 300;
  const bh = bubble.offsetHeight || 160;
  const margin = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left, top;

  if (placement === "bottom") {
    top = sy + sh + margin;
    left = rect.left + rect.width / 2 - bw / 2;
  } else if (placement === "top") {
    top = sy - bh - margin;
    left = rect.left + rect.width / 2 - bw / 2;
  } else if (placement === "right") {
    top = rect.top + rect.height / 2 - bh / 2;
    left = sx + sw + margin;
  } else if (placement === "left") {
    top = rect.top + rect.height / 2 - bh / 2;
    left = sx - bw - margin;
  } else {
    top = (vh - bh) / 2;
    left = (vw - bw) / 2;
  }

  // Clamp to viewport
  left = Math.max(8, Math.min(left, vw - bw - 8));
  top = Math.max(8, Math.min(top, vh - bh - 8));

  bubble.style.left = left + "px";
  bubble.style.top = top + "px";
}

function _tReposition() {
  if (!_tActive) return;
  if (_tRepositionRaf) cancelAnimationFrame(_tRepositionRaf);
  _tRepositionRaf = requestAnimationFrame(() => {
    _tRepositionRaf = 0;
    const step = TUTORIAL_STEPS[_tIdx];
    if (step) _tPosition(step);
  });
}

function _tHandleKey(e) {
  if (!_tActive) return;
  if (e.key === "Escape") {
    e.preventDefault();
    closeTutorial("dismissed");
  } else if (e.key === "ArrowRight" || e.key === "Enter") {
    e.preventDefault();
    _tNext();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    _tBack();
  }
}

let _tTouchStartX = 0;
function _tTouchStart(e) { _tTouchStartX = e.touches[0].clientX; }
function _tTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - _tTouchStartX;
  if (Math.abs(dx) > 60) {
    if (dx < 0) _tNext();
    else _tBack();
  }
}

function _tBindGlobalListeners() {
  window.addEventListener("resize", _tReposition);
  window.addEventListener("scroll", _tReposition, true);
  window.addEventListener("keydown", _tHandleKey);
  const bubble = document.getElementById("tutorialBubble");
  if (bubble) {
    bubble.addEventListener("touchstart", _tTouchStart, { passive: true });
    bubble.addEventListener("touchend", _tTouchEnd, { passive: true });
  }
}

function _tUnbindGlobalListeners() {
  window.removeEventListener("resize", _tReposition);
  window.removeEventListener("scroll", _tReposition, true);
  window.removeEventListener("keydown", _tHandleKey);
  const bubble = document.getElementById("tutorialBubble");
  if (bubble) {
    bubble.removeEventListener("touchstart", _tTouchStart);
    bubble.removeEventListener("touchend", _tTouchEnd);
  }
}

function initTutorial() {
  const overlay = document.getElementById("tutorialOverlay");
  const skipBtn = document.getElementById("tutorialSkipBtn");
  const backBtn = document.getElementById("tutorialBackBtn");
  const nextBtn = document.getElementById("tutorialNextBtn");
  const helpBtn = document.getElementById("headerHelpBtn");

  if (skipBtn) skipBtn.addEventListener("click", () => closeTutorial("skipped"));
  if (backBtn) backBtn.addEventListener("click", _tBack);
  if (nextBtn) nextBtn.addEventListener("click", _tNext);

  // Click on dim area (outside bubble) advances; tapping bubble does not
  if (overlay) {
    overlay.addEventListener("click", e => {
      if (e.target === overlay || e.target.id === "tutorialMask" ||
          (e.target.tagName === "rect" && e.target.parentNode &&
           e.target.parentNode.tagName === "svg")) {
        _tNext();
      }
    });
  }

  if (helpBtn) helpBtn.addEventListener("click", () => startTutorial({ force: true }));
}

// Expose for tests
try {
  window.TUTORIAL_STEPS = TUTORIAL_STEPS;
  window.startTutorial = startTutorial;
  window.closeTutorial = closeTutorial;
  window.initTutorial = initTutorial;
} catch (e) {}
