// ============================================================
// BUSY FEEDBACK — "something is running"
// ============================================================
// One quiet signal for every action that does real work (start, finish,
// add program, import, week skip): a thin ink line drawn along the top of
// the page while it runs, the tapped button dims, and a second tap while
// it's working is ignored.
//
// Heavy handlers here are synchronous, so the line has to be on screen
// BEFORE the click runs. We show it on pointerdown (the finger lands one or
// more frames before click fires), let the click run untouched — no
// re-dispatch, so audio unlock / user-activation stays intact — and hide it
// once the handler has returned, holding it at least MIN_MS so a fast
// action still reads as "done" rather than a flicker.
//
// Opt in a button with data-busy, or list it in KN_BUSY_SELECTOR.

const KN_BUSY_SELECTOR = [
  "[data-busy]",
  ".tb-start-btn",
  "#headerFinishBtn",
  ".paper-action-finish",
  "#importConfirm"
].join(",");

const knBusy = (function () {
  const MIN_MS = 320;       // shortest time the line stays up
  const GUARD_MS = 700;     // repeat taps on the same button are swallowed
  const ORPHAN_MS = 1200;   // pointerdown with no click (a scroll) — clean up
  let bar = null, shownAt = 0, hideTimer = null, orphanTimer = null, depth = 0;

  function ensureBar() {
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "knBusyBar";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-label", "Working");
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    return bar;
  }

  function show() {
    clearTimeout(hideTimer);
    depth++;
    const b = ensureBar();
    if (!b.classList.contains("active")) shownAt = performance.now();
    b.classList.add("active");
    b.setAttribute("aria-hidden", "false");
    document.body.setAttribute("aria-busy", "true");
  }

  function hide() {
    depth = Math.max(0, depth - 1);
    if (depth > 0 || !bar) return;
    const wait = Math.max(0, MIN_MS - (performance.now() - shownAt));
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (depth > 0) return;
      bar.classList.remove("active");
      bar.setAttribute("aria-hidden", "true");
      document.body.removeAttribute("aria-busy");
      document.querySelectorAll(".kn-busy").forEach(el => el.classList.remove("kn-busy"));
    }, wait);
  }

  // Wrap any piece of work (sync or promise-returning) in the signal.
  function run(fn) {
    show();
    let out;
    try { out = fn(); }
    catch (e) { hide(); throw e; }
    if (out && typeof out.then === "function") {
      return out.then(v => { hide(); return v; }, e => { hide(); throw e; });
    }
    setTimeout(hide, 0);
    return out;
  }

  function wire() {
    let pending = null; // button that got a pointerdown and may get a click

    document.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest && e.target.closest(KN_BUSY_SELECTOR);
      if (!btn || btn.disabled || btn.classList.contains("kn-busy")) return;
      pending = btn;
      show();
      clearTimeout(orphanTimer);
      orphanTimer = setTimeout(() => {
        if (pending === btn) { pending = null; hide(); }
      }, ORPHAN_MS);
    }, true);

    document.addEventListener("pointercancel", () => {
      if (pending) { pending = null; clearTimeout(orphanTimer); hide(); }
    }, true);

    document.addEventListener("click", (e) => {
      const btn = e.target.closest && e.target.closest(KN_BUSY_SELECTOR);
      if (!btn) return;
      const last = Number(btn.dataset.busyAt || 0);
      if (Date.now() - last < GUARD_MS || btn.classList.contains("kn-busy")) {
        // Double tap while the first one is still being handled.
        if (pending === btn) { pending = null; clearTimeout(orphanTimer); hide(); }
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      btn.dataset.busyAt = String(Date.now());
      btn.classList.add("kn-busy");
      if (pending === btn) {
        pending = null;
        clearTimeout(orphanTimer);
      } else {
        show(); // keyboard / programmatic click: no pointerdown came first
      }
      // Runs after every click handler on this event has returned.
      setTimeout(hide, 0);
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

  return { show, hide, run };
})();
