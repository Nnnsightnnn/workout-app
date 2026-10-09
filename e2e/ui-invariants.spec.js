// @ts-check
// WebKit UI invariants — "does it look broken on an iPhone?" guardrails.
//
// Code tests (test-v3.js) can't see a selected button that looks unselected,
// a Close X buried under the MENU sticky note, or an Add button below the
// fold. Pixel diffs would see them but flake across font rasterisers, so this
// spec asserts the rules that actually broke, on WebKit, at three iPhone-ish
// viewports, in the cream (default) and dark (nearblack) themes:
//
//   reach     every visible close control is topmost at its centre; the MENU
//             fab is hidden while an overlay is open; the sheet's last action
//             button is fully on screen (sheet scrolled to bottom) and
//             topmost; pointerdown on a data-busy button lights #knBusyBar
//   selected  a .selected/.active/aria-pressed item differs in background or
//             text colour from its same-kind siblings (after ≥600 ms), and
//             still does after tapping a different option
//   screens   main screens never scroll sideways; MENU is tappable
//
// A screenshot per surface/viewport/theme lands in test-results/ui/ for a
// human to eyeball (CI artifact). Nothing is pixel-compared.
//
// Setup:  node mockups/download-fonts.js   (once; fonts are gitignored)
//         node build.js
// Run:    npx playwright test --project='webkit-ui-*'
//
// The six (theme × viewport) configs are projects in playwright.config.js
// (worker option `uiConfig`). One page per project is loaded once per worker
// and reused: each test closes everything, opens its surface, inspects and
// screenshots. A failing test restarts the worker, so a broken surface can't
// leak into the next one.

const base = require("@playwright/test");
const { expect } = base;
const path = require("path");
const fs = require("fs");
const {
  APP_URL, STORAGE_KEY, OPEN_ROOTS, buildSeedInPage, resetInPage, inspectInPage
} = require("./helpers/ui-invariants");

const SHOT_DIR = path.join(__dirname, "..", "test-results", "ui");
const DAY_WK = ".schedule-day-btn[data-day], .schedule-day-btn[data-wk]";

// Surfaces we can open programmatically.
//   toggles: has a selected/active group → gets a "selected" test
//   tap:     selector of toggle options to tap a different one of and re-check
//   busy:    has a data-busy button → busy-line check
const SURFACES = [
  { name: "nav-menu", open: "paperOpenNavMenu()", toggles: true },
  { name: "program-picker", open: "openProgramPicker()", toggles: true },
  { name: "duration-prvn4", open: "openDurationPicker('prvn4')", toggles: true, tap: DAY_WK, busy: true },
  // glutes2: 2d native, four week options (6/8/10/12) — the widest row.
  { name: "duration-glutes2", open: "openDurationPicker('glutes2')", toggles: true, tap: DAY_WK, busy: true },
  { name: "duration-rp-hypertrophy", open: "openDurationPicker('rp-hypertrophy')", toggles: true, tap: DAY_WK, busy: true },
  { name: "program-builder", open: "openProgramBuilder()", toggles: true, tap: ".schedule-day-btn" },
  { name: "week-control", open: "openWeekControl()" },
  { name: "library", open: "openLibrary(getCurrentDay().blocks[0].id)", toggles: true, tap: ".lib-cat-btn" },
  { name: "adhoc", open: "openAdhocWorkout()", toggles: true, tap: ".lib-cat-btn" },
  { name: "info-guide", open: "openInfoGuide()", toggles: true, tap: ".ig-dot" },
  { name: "sidebar", open: "openSidebar()", toggles: true, tap: ".lib-cat-btn" },
  { name: "look-ahead", open: "openLookAhead()", toggles: true, tap: ".la-mode-btn" },
  { name: "rest-timer", open: "openStandaloneTimer()", toggles: true /* no tap: a pill restarts the timer */ },
  { name: "program-switcher", open: "openProgramSwitcher()" /* one program seeded: no group */ },
  { name: "add-user", open: "openAddUserDialog(false)", toggles: true },
  { name: "day-picker", open: "openDayPicker()" },
  { name: "weekly-schedule", open: "openWeeklyScheduleEditor()" },
  { name: "glossary", open: "openFullGlossary()" },
  { name: "saved-workouts", open: "openSavedWorkoutsPicker()" },
  { name: "import-workout", open: "openImportWorkoutSheet()" },
  { name: "csv-import", open: "openCsvImportSheet()" },
  { name: "customize-day", open: "openCustomizeDay()" },
  { name: "train-anyway", open: "openTrainAnywayPicker()" },
  { name: "session-view", open: "openSessionEditor(userData().sessions[0])" },
  { name: "import-confirm", open: null /* file chooser; see openSurface */ }
];

const MAIN_SCREENS = ["workout", "body", "prs", "history", "settings"];

const STALE_SCROLL =
  "openSheet() (src/js/12-bottom-sheet.js:4) never resets .sheet scrollTop and .sheet-bg only fades (opacity, src/styles.css:1036), so the day picker opened after scrolling the program picker starts scrolled down with its title and close X out of view (fits at 390x844)";

// Real bugs on the current code, found by this spec. Key:
// `${invariant}|${theme}|${w}x${h}|${surface}` ("*" matches anything).
// Each matching case is marked test.fixme. Remove the entry once fixed.
//
// Root cause for the "selected" ones: the generic paper sheet-button rule
//   body[data-skin="paper"] .sheet button:not(.primary)   src/styles.css:9174
// (specificity 0,3,2) resets background/color/border on every sheet button,
// out-specifying each toggle's own selected rule — the same bug that hid
// .schedule-day-btn.selected (fixed at src/styles.css:10717).
const KNOWN_BUGS = {
  "selected|*|*|library":
    ".lib-cat-btn.active (src/styles.css:1159) loses to src/styles.css:9174 inside a sheet; the active category looks like the rest",
  "selected|*|*|adhoc":
    ".lib-cat-btn.active (src/styles.css:1159) loses to src/styles.css:9174 inside a sheet; the active category looks like the rest",
  "selected|*|*|look-ahead":
    ".la-mode-btn.active (src/styles.css:5274) loses to src/styles.css:9174; the active view-mode toggle looks like the other",
  "selected|*|*|rest-timer":
    "body[data-skin=paper] .rest-pill.active (src/styles.css:9254) loses to src/styles.css:9174; the chosen rest pill looks like the rest",
  "selected|*|*|nav-menu":
    "body[data-skin=paper] .paper-menu-item.active colour (src/styles.css:8124) loses to src/styles.css:9174, which also shrinks the 34px handwritten items to 11px typewriter; only the squiggle marks the current screen",
  // Not the sheet rule:
  "screens|*|320x568|settings":
    "Settings > Notebook style ink row (.paper-pref-ink-row, src/styles.css:6981; four fixed-label buttons) is 1px wider than a 320px screen, so the page scrolls sideways",
  "stale-scroll|*|320x568|day-picker": STALE_SCROLL,
  "stale-scroll|*|375x667|day-picker": STALE_SCROLL
};

// UI_RUN_KNOWN_BUGS=1 runs the fixme'd cases anyway (to confirm a fix).
function knownBug(invariant, cfg, surface) {
  if (process.env.UI_RUN_KNOWN_BUGS) return null;
  for (const [k, why] of Object.entries(KNOWN_BUGS)) {
    const [i, t, v, s] = k.split("|");
    if ((i === "*" || i === invariant) && (t === "*" || t === cfg.theme)
      && (v === "*" || v === `${cfg.width}x${cfg.height}`) && (s === "*" || s === surface)) return why;
  }
  return null;
}

// Worker-scoped: one loaded app page per (theme, viewport) project.
const test = base.test.extend({
  uiConfig: [{ theme: "cream", dark: false, width: 375, height: 667 }, { scope: "worker", option: true }],
  app: [async ({ browser, uiConfig }, use) => {
    fs.mkdirSync(SHOT_DIR, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: uiConfig.width, height: uiConfig.height },
      hasTouch: true,
      isMobile: true,
      // 1x keeps WebKit's software-rendered paper-roughen SVG filter fast
      // enough on GPU-less CI runners (2x drops an open sheet to ~3 fps).
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("dialog", d => d.accept());
    // Seed a returning user with the app's own constructors, then reload.
    await page.goto(APP_URL);
    const seed = await page.evaluate(buildSeedInPage, { dark: uiConfig.dark });
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [STORAGE_KEY, seed]);
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("#screen-workout")).toHaveClass(/active/);
    await expect(page.locator("#onboardingOverlay")).not.toHaveClass(/active/);
    await expect(page.locator("#tutorialOverlay")).not.toHaveClass(/active/);
    if (uiConfig.dark) await expect(page.locator("body")).toHaveAttribute("data-paper-mode", "dark");
    const shot = name => path.join(SHOT_DIR, `${uiConfig.theme}-${uiConfig.width}x${uiConfig.height}-${name}.png`);
    await use({ page, errors, seed, shot, cfg: `${uiConfig.theme} ${uiConfig.width}x${uiConfig.height}` });
    await context.close();
  }, { scope: "worker" }]
});

// Wait out transitions, then jump any still-running finite ones to their end
// state: on GPU-less CI the filter can still make WebKit drop frames, and we
// assert the settled look, not the frame rate. Infinite animations are left.
async function settle(page, ms) {
  await page.waitForTimeout(ms);
  await page.evaluate(() => {
    for (const a of document.getAnimations()) {
      const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
      if (t && Number.isFinite(t.endTime)) { try { a.finish(); } catch (e) {} }
    }
  });
}

async function openSurface(page, s, seed) {
  await page.evaluate(resetInPage, "workout");
  if (s.open) {
    await page.evaluate(expr => {
      const sheet = document.querySelector(".sheet");
      if (sheet) sheet.scrollTop = 0; // isolation; see the stale-scroll test
      (0, eval)(expr);
    }, s.open);
  } else {
    const chooser = page.waitForEvent("filechooser");
    await page.evaluate(() => { /* global importData */ importData(); });
    await (await chooser).setFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(seed) });
    await expect(page.locator("#importConfirm")).toBeVisible();
  }
}

const ROOT_SEL = "#sheetBg.active .sheet, #sidebarBg.active, #infoGuideOverlay.active";
const isOn = e => e.classList.contains("selected") || e.classList.contains("active") || e.getAttribute("aria-pressed") === "true";

function assertReach(report, label) {
  expect(report.root, `${label}: no overlay opened`).not.toBe("(nothing)");
  expect(report.fab && report.fab.hidden,
    `${label}: MENU fab (#paperMenuBtn) still visible over an open overlay`).toBe(true);
  for (const c of report.closes) {
    const why = c.hit === "(nothing)" ? "off screen" : `covered by ${c.hit} at its centre`;
    expect(c.ok, `${label}: close control ${c.el} is ${why} ${JSON.stringify(c.rect)}`).toBe(true);
  }
  if (report.primary) {
    expect(report.primary.inViewport,
      `${label}: primary action ${report.primary.el} is not fully on screen ${JSON.stringify(report.primary.rect)}`).toBe(true);
    expect(report.primary.ok,
      `${label}: primary action ${report.primary.el} is covered by ${report.primary.hit}`).toBe(true);
  }
}

function assertSelected(report, label) {
  expect(report.root, `${label}: no overlay opened`).not.toBe("(nothing)");
  for (const g of report.groups) {
    expect(g.twins,
      `${label}: selected ${g.selected} looks identical to ${g.twins.join(", ")} (bg ${g.look.bg}, color ${g.look.color})`).toEqual([]);
  }
}

for (const screen of MAIN_SCREENS) {
  test(`screen ${screen}: no horizontal overflow, MENU tappable`, async ({ app, uiConfig }) => {
    const bug = knownBug("screens", uiConfig, screen);
    test.fixme(!!bug, bug || "");
    const { page, errors, shot, cfg } = app;
    const errBefore = errors.length;
    await page.evaluate(resetInPage, screen);
    await settle(page, 200);
    const r = await page.evaluate(() => {
      const fab = document.getElementById("paperMenuBtn");
      const b = fab.getBoundingClientRect();
      const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      return {
        scrollWidth: document.scrollingElement.scrollWidth,
        innerWidth: window.innerWidth,
        fabOk: !!hit && (hit === fab || fab.contains(hit))
      };
    });
    await page.screenshot({ path: shot(`screen-${screen}`) });
    expect(r.scrollWidth, `${cfg} ${screen}: page scrolls sideways`).toBeLessThanOrEqual(r.innerWidth);
    expect(r.fabOk, `${cfg} ${screen}: MENU fab not tappable with no overlay open`).toBe(true);
    expect(errors.slice(errBefore), `${cfg}: page errors`).toEqual([]);
  });
}

// Real-use flow the per-surface tests deliberately isolate away: scroll a
// long sheet, close it, open another long one. It must open at the top with
// its close X reachable.
test("day-picker · stale scroll from a previous sheet", async ({ app, uiConfig }) => {
  const bug = knownBug("stale-scroll", uiConfig, "day-picker");
  test.fixme(!!bug, bug || "");
  const { page, shot, cfg } = app;
  await page.evaluate(resetInPage, "workout");
  await page.evaluate(() => { /* global openProgramPicker */ openProgramPicker(); });
  await settle(page, 300);
  await page.evaluate(() => { const s = document.querySelector(".sheet"); s.scrollTop = s.scrollHeight; });
  await page.evaluate(() => { /* global closeSheet */ closeSheet(); });
  await settle(page, 400);
  await page.evaluate(() => { /* global openDayPicker */ openDayPicker(); });
  await settle(page, 350);
  const report = await page.evaluate(inspectInPage, { roots: OPEN_ROOTS, wantPrimary: false });
  await page.screenshot({ path: shot("day-picker-after-scrolled-sheet") });
  expect(report.closes.length, `${cfg}: day picker has no close control`).toBeGreaterThan(0);
  assertReach(report, `${cfg} day-picker after a scrolled sheet`);
});

for (const s of SURFACES) {
  test(`${s.name} · reach`, async ({ app, uiConfig }) => {
    const bug = knownBug("reach", uiConfig, s.name);
    test.fixme(!!bug, bug || "");
    const { page, errors, seed, shot, cfg } = app;
    const label = `${cfg} ${s.name}`;
    const errBefore = errors.length;
    await openSurface(page, s, seed);
    await settle(page, 250);
    const report = await page.evaluate(inspectInPage, { roots: OPEN_ROOTS, wantPrimary: true });
    await page.screenshot({ path: shot(s.name) });
    assertReach(report, label);
    if (!s.toggles) assertSelected(report, label); // catch any surprise toggle group

    if (s.busy) {
      const lit = await page.evaluate(() => {
        const btn = document.querySelector("#sheetContent button[data-busy]");
        if (!btn) return "no #sheetContent button[data-busy]";
        btn.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "touch", isPrimary: true }));
        const bar = document.getElementById("knBusyBar");
        const on = !!bar && bar.classList.contains("active");
        btn.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerType: "touch" }));
        return on;
      });
      expect(lit, `${label}: pointerdown on a data-busy button did not light #knBusyBar`).toBe(true);
    }
    expect(errors.slice(errBefore), `${label}: page errors`).toEqual([]);
  });

  if (!s.toggles) continue;

  test(`${s.name} · selected`, async ({ app, uiConfig }) => {
    const bug = knownBug("selected", uiConfig, s.name);
    test.fixme(!!bug, bug || "");
    const { page, errors, seed, shot, cfg } = app;
    const label = `${cfg} ${s.name}`;
    const errBefore = errors.length;
    await openSurface(page, s, seed);
    await settle(page, 650);
    const report = await page.evaluate(inspectInPage, { roots: OPEN_ROOTS, wantPrimary: false });
    expect(report.groups.length, `${label}: expected a selected toggle group`).toBeGreaterThan(0);
    assertSelected(report, label);

    if (s.tap) {
      // Tap an unselected option in each toggle group, then re-check.
      const targets = await page.evaluate(([rootSel, sel, isOnSrc]) => {
        const on = (0, eval)(isOnSrc);
        const root = document.querySelector(rootSel);
        const all = [...root.querySelectorAll(sel)];
        return [...new Set(all.map(e => e.parentElement))]
          .map(p => all.findIndex(e => e.parentElement === p && !on(e)))
          .filter(i => i >= 0);
      }, [ROOT_SEL, s.tap, isOn.toString()]);
      expect(targets.length, `${label}: no unselected option to tap`).toBeGreaterThan(0);
      for (const i of targets) {
        const opt = () => page.locator(ROOT_SEL).first().locator(s.tap).nth(i);
        await opt().scrollIntoViewIfNeeded();
        await opt().tap();
        await settle(page, 650);
        const nowOn = await opt().evaluate(isOn);
        expect(nowOn, `${label}: tapped option #${i} did not become selected`).toBe(true);
        const after = await page.evaluate(inspectInPage, { roots: OPEN_ROOTS, wantPrimary: false });
        assertSelected(after, `${label} (after tapping option #${i})`);
      }
    }
    await page.screenshot({ path: shot(`${s.name}-selected`) });
    expect(errors.slice(errBefore), `${label}: page errors`).toEqual([]);
  });
}
