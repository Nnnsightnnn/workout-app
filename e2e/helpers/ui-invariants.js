// @ts-check
// Browser-side probes for e2e/ui-invariants.spec.js.
//
// Each probe runs inside the page (page.evaluate) and returns plain data, so
// the spec can assert on it and print a readable failure. We assert the RULES
// that broke on a real iPhone ("the X is under the MENU note", "the selected
// week looks like every other week", "Add is off the bottom") instead of
// pixel-diffing screenshots, which flake across font rasterisers.

const path = require("path");

const APP_URL = "file://" + path.join(__dirname, "..", "..", "workout-app.html");
const STORAGE_KEY = "kn-lifts-v3";

// Everything that counts as "an overlay is open". Mirrors the :has() list in
// src/styles.css that hides the MENU fab.
const OPEN_ROOTS = [
  "#sheetBg.active .sheet",
  "#sidebarBg.active",
  "#infoGuideOverlay.active",
  "#onboardingOverlay.active",
  "#tutorialOverlay.active"
];

/**
 * Build a returning-user store using the app's own constructors, so the seed
 * tracks schema changes. Runs in the page.
 * @param {{ dark: boolean, templateId?: string }} opts
 */
function buildSeedInPage(opts) {
  /* global getDefaultStore, newUserRecord */
  const store = getDefaultStore();
  const u = newUserRecord("Tester", opts.templateId || "conjugate5", 10, 4);
  if (opts.dark) u.preferences = Object.assign({}, u.preferences, { bgColor: "nearblack" });
  const now = Date.now();
  // One finished session so History / session view have something to show.
  u.sessions = [{
    id: "s-seed-1",
    dayId: (u.programs[0].program[0] || {}).id || 1,
    dayName: (u.programs[0].program[0] || {}).name || "Day 1",
    startedAt: now - 2 * 86400000 - 3600000,
    finishedAt: now - 2 * 86400000,
    duration: 3600,
    sets: [
      { exId: "back-squat", exName: "Back Squat", muscles: ["quads"], setIdx: 1, weight: 185, reps: 5, rpe: 7, bodyweight: false, isPR: false },
      { exId: "back-squat", exName: "Back Squat", muscles: ["quads"], setIdx: 2, weight: 185, reps: 5, rpe: 8, bodyweight: false, isPR: true }
    ],
    volume: 1850,
    prCount: 1,
    blockNotes: {},
    programId: u.activeProgramId,
    programWeek: 1,
    feedback: {},
    mesocycleId: null,
    mesoWeek: null
  }];
  u.firstWorkoutCompleted = true;
  store.users = [u];
  store.currentUserId = u.id;
  store.onboarding = Object.assign({}, store.onboarding || {}, { completedAt: now });
  store.onboardingDismissedAt = now;
  store.tutorialState = { completedAt: now, dismissedAt: now, lastStepId: null };
  return JSON.stringify(store);
}

/** Close everything and return to a screen. Runs in the page. */
function resetInPage(screen) {
  /* global closeSheet, closeSidebar, closeInfoGuide, showScreen */
  // A still-focused input (add-user, search) makes WebKit scroll the closed
  // sheet back to it on the next layout; drop focus first.
  if (document.activeElement && document.activeElement !== document.body) {
    try { document.activeElement.blur(); } catch (e) {}
  }
  try { if (typeof closeSheet === "function") closeSheet(); } catch (e) {}
  try { if (typeof closeSidebar === "function") closeSidebar(); } catch (e) {}
  try { if (typeof closeInfoGuide === "function") closeInfoGuide(); } catch (e) {}
  const sheet = document.querySelector(".sheet");
  if (sheet) {
    sheet.classList.remove("sheet--paper-page");
    // Isolation: the app never resets this (see the "stale scroll" test), so
    // without it one test's scrolled sheet would leak into the next.
    sheet.scrollTop = 0;
  }
  if (screen) showScreen(screen);
  window.scrollTo(0, 0);
}

/**
 * Inspect whatever overlay is open and report on every invariant.
 * Runs in the page. Pure read: never clicks anything.
 * @param {{ roots: string[], wantPrimary: boolean }} arg
 */
function inspectInPage(arg) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const describe = (el) => {
    if (!el) return "(nothing)";
    const id = el.id ? "#" + el.id : "";
    const cls = typeof el.className === "string" && el.className.trim()
      ? "." + el.className.trim().split(/\s+/).join(".") : "";
    const txt = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
    return el.tagName.toLowerCase() + id + cls + (txt ? ` "${txt}"` : "");
  };
  const isVisible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  // Is `el` what a finger at its centre would hit?
  const hitTest = (el) => {
    const r = el.getBoundingClientRect();
    const cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
    const onScreen = cx >= 0 && cy >= 0 && cx < vw && cy < vh;
    const hit = onScreen ? document.elementFromPoint(cx, cy) : null;
    return {
      ok: !!hit && (hit === el || el.contains(hit)),
      hit: describe(hit),
      rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
    };
  };

  let root = null;
  for (const sel of arg.roots) {
    const el = document.querySelector(sel);
    if (el && isVisible(el)) { root = el; break; }
  }
  const out = { root: describe(root), fab: null, closes: [], primary: null, groups: [] };

  // MENU fab must step aside while any overlay is open.
  const fab = document.getElementById("paperMenuBtn");
  if (fab) {
    const cs = getComputedStyle(fab);
    out.fab = {
      hidden: cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0,
      pointerEvents: cs.pointerEvents
    };
  }
  if (!root) return out;

  // Close controls: ✕ / × glyph buttons, anything titled or labelled Close,
  // or with "close" in its class.
  const closeish = [...root.querySelectorAll("button, [role=button]")].filter(b => {
    const label = (b.getAttribute("title") || "") + " " + (b.getAttribute("aria-label") || "");
    const cls = typeof b.className === "string" ? b.className : "";
    return /\bclose\b/i.test(label) || /close/i.test(cls) || /^[✕×✖]$/.test((b.textContent || "").trim());
  }).filter(isVisible);
  // Overlays open scrolled to the top; that's where a close X lives.
  out.closes = closeish.map(b => Object.assign({ el: describe(b) }, hitTest(b)));

  // Selected-looks-selected: any element flagged selected/active/aria-pressed
  // must differ (background or text colour) from its same-kind siblings.
  const flagged = [...root.querySelectorAll(".selected, .active, [aria-pressed=true]")].filter(isVisible);
  const isOn = (el) => el.classList.contains("selected") || el.classList.contains("active")
    || el.getAttribute("aria-pressed") === "true";
  const kind = (el) => [...el.classList].filter(c => c !== "selected" && c !== "active")[0] || el.tagName;
  const seenParents = new Set();
  for (const el of flagged) {
    const parent = el.parentElement;
    if (!parent || seenParents.has(parent)) continue;
    const k = kind(el);
    const sibs = [...parent.children].filter(s => s !== el && kind(s) === k && s.tagName === el.tagName && isVisible(s));
    const off = sibs.filter(s => !isOn(s));
    if (!off.length) continue;
    seenParents.add(parent);
    const on = [...parent.children].filter(s => kind(s) === k && isOn(s) && isVisible(s));
    const look = (e) => { const cs = getComputedStyle(e); return { bg: cs.backgroundColor, color: cs.color }; };
    for (const sel of on) {
      const a = look(sel);
      const twins = off.filter(o => { const b = look(o); return b.bg === a.bg && b.color === a.color; });
      out.groups.push({
        kind: k,
        selected: describe(sel),
        look: a,
        offLook: look(off[0]),
        twins: twins.map(describe)
      });
    }
  }

  // Primary action: the last button of the last .sheet-actions row, checked
  // after scrolling the sheet to the very bottom.
  if (arg.wantPrimary) {
    const rows = [...root.querySelectorAll(".sheet-actions")].filter(isVisible);
    const row = rows[rows.length - 1];
    const btns = row ? [...row.querySelectorAll("button")].filter(isVisible) : [];
    const btn = btns[btns.length - 1];
    if (btn) {
      for (let p = btn.parentElement; p; p = p.parentElement) {
        if (p.scrollHeight > p.clientHeight + 1) p.scrollTop = p.scrollHeight;
      }
      root.scrollTop = root.scrollHeight;
      const r = btn.getBoundingClientRect();
      const h = hitTest(btn);
      out.primary = Object.assign({
        el: describe(btn),
        inViewport: r.left >= -0.5 && r.top >= -0.5 && r.right <= vw + 0.5 && r.bottom <= vh + 0.5
      }, h);
    }
  }
  return out;
}

module.exports = { APP_URL, STORAGE_KEY, OPEN_ROOTS, buildSeedInPage, resetInPage, inspectInPage };
