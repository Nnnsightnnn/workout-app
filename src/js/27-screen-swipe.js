// ============================================================
// SCREEN SWIPE NAVIGATION
// Horizontal swipe between top-level screens.
// ============================================================

const SCREEN_SWIPE_ORDER = ["workout", "body", "prs", "history", "settings"];

function _swipeCurrentScreen() {
  const active = document.querySelector("main > .screen.active");
  if (!active) return null;
  return active.id.replace(/^screen-/, "");
}

function _swipeOverlayOpen() {
  return !!document.querySelector(
    ".sheet-bg.active, .sidebar-bg.active, .info-guide-overlay.active, .onboarding-overlay.active, .tutorial-overlay.active"
  );
}

function _swipeHasHScroll(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el === document.body || el === document.documentElement) return false;
  const style = window.getComputedStyle(el);
  const ox = style.overflowX;
  if ((ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth + 2) return true;
  return false;
}

function _swipeShouldIgnore(target) {
  if (!target || target.nodeType !== 1) return true;
  // Native inputs, buttons, contenteditable
  if (target.closest("input, textarea, select, button, [contenteditable=\"true\"]")) return true;
  // Workout exercise focus card has its own horizontal swipe
  if (target.closest(".focus-card-wrap, .focus-cards")) return true;
  // Set chips have inline editors / horizontal interactions
  if (target.closest(".set-chip")) return true;
  // Anything inside a sheet/sidebar/overlay (overlay check is a backup)
  if (target.closest(".sheet, .sidebar, .info-guide-overlay, .onboarding-overlay, .tutorial-overlay")) return true;
  // Anything inside a horizontally scrollable container (timeline strip, tag rows, etc.)
  let node = target;
  while (node && node !== document.body) {
    if (_swipeHasHScroll(node)) return true;
    node = node.parentElement;
  }
  return false;
}

function initScreenSwipe() {
  const MIN_DX = 70;       // min horizontal travel to count as a swipe
  const RATIO = 1.4;       // |dx| must exceed |dy| * RATIO
  const MAX_DT = 700;      // max swipe duration (ms)
  const EDGE_DEAD = 20;    // ignore touches starting within Npx of either edge (iOS back-swipe area)

  let sx = 0, sy = 0, st = 0;
  let tracking = false;
  let aborted = false;

  document.addEventListener("touchstart", (e) => {
    tracking = false; aborted = false;
    if (!e.touches || e.touches.length !== 1) return;
    if (_swipeOverlayOpen()) return;
    if (_swipeShouldIgnore(e.target)) return;
    const t = e.touches[0];
    const w = window.innerWidth || document.documentElement.clientWidth;
    if (t.clientX < EDGE_DEAD || t.clientX > w - EDGE_DEAD) return;
    sx = t.clientX; sy = t.clientY; st = Date.now();
    tracking = true;
  }, { passive: true });

  document.addEventListener("touchmove", (e) => {
    if (!tracking || aborted) return;
    if (!e.touches || e.touches.length !== 1) { aborted = true; return; }
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    const wasTracking = tracking;
    tracking = false;
    if (!wasTracking || aborted) { aborted = false; return; }
    if (_swipeOverlayOpen()) return;
    if (!e.changedTouches || !e.changedTouches[0]) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    const dt = Date.now() - st;
    if (dt > MAX_DT) return;
    if (Math.abs(dx) < MIN_DX) return;
    if (Math.abs(dx) < Math.abs(dy) * RATIO) return;

    const cur = _swipeCurrentScreen();
    const idx = SCREEN_SWIPE_ORDER.indexOf(cur);
    if (idx === -1) return;
    if (dx < 0 && idx < SCREEN_SWIPE_ORDER.length - 1) {
      showScreen(SCREEN_SWIPE_ORDER[idx + 1]);
    } else if (dx > 0 && idx > 0) {
      showScreen(SCREEN_SWIPE_ORDER[idx - 1]);
    }
  }, { passive: true });

  document.addEventListener("touchcancel", () => {
    tracking = false; aborted = false;
  }, { passive: true });
}
