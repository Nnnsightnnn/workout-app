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
    body: "60-second walkthrough so you know where everything lives. Re-open it anytime via the ? in the header."
  },
  {
    id: "day-bar",
    target: ".day-bar",
    placement: "bottom",
    title: "Today's workout",
    body: "This is your day at a glance — the program name, current week, and what's on the menu."
  },
  {
    id: "home-btn",
    target: "#homeDayBtn",
    placement: "bottom",
    title: "Home",
    body: "Jump back to today's workout from any other view."
  },
  {
    id: "pick-day",
    target: "#pickDayBtn",
    placement: "bottom",
    title: "Switch days",
    body: "Browse the week, peek at upcoming sessions, or jump to a different day if you're training out of order."
  },
  {
    id: "customize-day",
    target: "#customizeDayBtn",
    placement: "bottom",
    title: "Customize & swap exercises",
    body: "Edit this day — swap exercises, reorder blocks, tweak rep schemes. Long-press any exercise card for the same options."
  },
  {
    id: "adhoc",
    target: "#adhocBtn",
    placement: "bottom",
    title: "Quick workout",
    body: "Log an ad-hoc session that's not part of your program — perfect for travel days or a one-off lift."
  },
  {
    id: "edit-schedule",
    target: ".tl-sched-btn",
    fallback: "#timelineStrip",
    placement: "top",
    title: "Reshape your week",
    body: "Tap Edit schedule to assign program days to weekdays — swap two days, drop in a rest day, or shift everything to fit your calendar. Picking a day that's already scheduled auto-swaps with the day it lands on."
  },
  {
    id: "start-btn",
    target: "#headerStartBtn",
    placement: "bottom",
    title: "Start your session",
    body: "Tap Start when you're ready to lift. The session timer fires automatically."
  },
  {
    id: "exercise-card",
    target: '.exercise-card[data-bi="0"][data-ei="0"]',
    fallback: ".exercise-card",
    placement: "bottom",
    title: "Tap an exercise to log sets",
    body: "Each card opens a quick editor for weight, reps, and effort. Last session auto-fills so you usually just tap to confirm."
  },
  {
    id: "set-inputs",
    target: ".set-chip",
    fallback: ".exercise-card",
    placement: "top",
    title: "Log a set",
    body: "Each chip is one set — tap to confirm weight, reps, and effort. Saving fires the rest timer with audio + vibration cues. Swipe right to mark done, left to skip."
  },
  {
    id: "session-pill",
    target: "#sessionPill",
    placement: "bottom",
    title: "Workout & rest timer",
    body: "Your session time lives here. A rest-timer ring appears alongside it whenever a set is in progress."
  },
  {
    id: "progress",
    target: "#workoutProgressWrap",
    fallback: ".day-bar",
    placement: "top",
    title: "Progress & pace",
    body: "Once you're rolling, a progress bar tracks completed sets so you can stay on pace through the whole session."
  },
  {
    id: "finish-btn",
    target: "#headerFinishBtn",
    placement: "bottom",
    title: "Finish & track PRs",
    body: "Tap ✓ Sets to wrap. Personal records and e1RM updates land in your history automatically."
  },
  {
    id: "bottom-nav",
    target: "nav.bottom",
    placement: "top",
    title: "Body, PRs & history",
    body: "The bottom bar gets you to body-weight tracking, your PRs, and full training history."
  },
  {
    id: "timer-fab",
    target: "#timerFab",
    placement: "top",
    title: "Standalone rest timer",
    body: "Need a timer outside a session — between warm-up sets, mobility work, anywhere? Tap TIMER for a free-standing countdown."
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

  // Treat a hidden/zero-rect target as missing so we fall back to centered text.
  if (target) {
    const r = target.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) target = null;
  }

  if (!target) {
    bubble.dataset.placement = "center";
    spotlight.setAttribute("x", "-100");
    spotlight.setAttribute("y", "-100");
    spotlight.setAttribute("width", "0");
    spotlight.setAttribute("height", "0");
    bubble.style.left = "50%";
    bubble.style.top = "50%";
    bubble.style.transform = "translate(-50%, -50%)";
    void bubble.offsetWidth;
    return;
  }

  // Scroll into view if off-screen (header is sticky, so account for that).
  let rect = target.getBoundingClientRect();
  const vh0 = window.innerHeight;
  if (rect.top < 60 || rect.bottom > vh0 - 100) {
    target.scrollIntoView({ block: "center", behavior: "auto" });
    rect = target.getBoundingClientRect();
  }
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
