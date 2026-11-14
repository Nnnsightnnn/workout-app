// @ts-check
// ============================================================
// PERSONA SUITE — WebKit, iPhone-sized, lived-in stores
// ============================================================
// Boots the built workout-app.html from realistic stored data (see
// e2e/fixtures/personas.js) and drives the core loop for each persona:
// start today's workout → tick sets → finish → history → switch program →
// reload and confirm everything persisted. Fails on any page error or
// console.error, on the boot rescue screen, or (long-history persona) on
// a blown time budget.
//
// Build first:  node mockups/download-fonts.js   (once; fonts are gitignored)
//               node build.js
// Run:          npx playwright test --project=webkit

const { test, expect } = require("@playwright/test");
const P = require("./fixtures/personas");

// Templates are enumerated from the built app so new ones are covered
// automatically. Read once in Node from the bundle so each template gets
// its own test (parallel workers, isolated failures).
const fs = require("fs");
const TEMPLATE_IDS = (() => {
  const html = fs.readFileSync(P.APP_URL.replace("file://", ""), "utf8");
  const start = html.indexOf("const PROGRAM_TEMPLATES = [");
  const end = html.indexOf("\n];", start);
  if (start < 0 || end < 0) throw new Error("PROGRAM_TEMPLATES not found in workout-app.html — run node build.js");
  return [...html.slice(start, end).matchAll(/\bid:\s*"([^"]+)"/g)].map(m => m[1]);
})();

// Core loop shared by every persona. opts:
//   switchTo     template id to switch to at the end
//   budgets      { bootMs, startMs, finishMs } — enforced when present
//   expectDraft  persona boots mid-workout (no Start button expected)
async function coreLoop(page, errors, opts) {
  // ── Boot health ──
  const health = await P.bootHealth(page);
  expect(health.booted, "app booted").toBe(true);
  expect(health.rescue, "rescue screen shown").toBe(false);
  expect(health.workoutActive, "workout screen active").toBe(true);
  expect(health.blocksRendered, "workout screen rendered content").toBe(true);
  if (opts.budgets) {
    expect(health.bootMs, `boot ${Math.round(health.bootMs)}ms > ${opts.budgets.bootMs}ms`).toBeLessThan(opts.budgets.bootMs);
  }

  await P.ensureTrainingToday(page);
  const before = await page.evaluate(() => ({
    sessions: userData().sessions.length,
    programs: userData().programs.length,
    hadDraft: !!getDraft()
  }));
  expect(before.hadDraft, "draft present at boot").toBe(!!opts.expectDraft);

  // ── Start today's workout ──
  const startMs = await P.startToday(page);
  if (!opts.expectDraft) expect(startMs, "Start button handled").not.toBeNull();
  expect(await page.evaluate(() => !!getDraft()), "draft exists after start").toBe(true);
  if (opts.budgets && startMs != null) {
    expect(startMs, `start ${Math.round(startMs)}ms > ${opts.budgets.startMs}ms`).toBeLessThan(opts.budgets.startMs);
  }

  // ── Tick a few sets ──
  const done = await P.markSetsDone(page, 3);
  expect(done, "sets marked done in draft").toBeGreaterThanOrEqual(3);

  // ── Finish ──
  const fin = await P.finishToday(page);
  expect(fin.sessions, "session saved").toBe(before.sessions + 1);
  expect(await page.evaluate(() => !!getDraft()), "draft cleared after finish").toBe(false);
  const last = await page.evaluate(() => { const s = userData().sessions; const x = s[s.length - 1]; return { sets: x.sets.length, finishedAt: x.finishedAt }; });
  expect(last.sets, "saved session has sets").toBeGreaterThan(0);
  if (opts.budgets) {
    expect(fin.ms, `finish ${Math.round(fin.ms)}ms > ${opts.budgets.finishMs}ms`).toBeLessThan(opts.budgets.finishMs);
  }

  // ── History ──
  await page.evaluate(() => showScreen("history"));
  await expect(page.locator("#screen-history")).toHaveClass(/active/);
  expect(await page.evaluate(() => (document.getElementById("screen-history").textContent || "").trim().length),
    "history rendered").toBeGreaterThan(0);

  // ── Switch program ──
  const switched = await page.evaluate(id => {
    const tpl = PROGRAM_TEMPLATES.find(t => t.id === id);
    applyProgramSwitch(tpl, tpl.minWeeks || 8, tpl.daysPerWeek || 3);
    return { templateId: activeProgram().templateId, programs: userData().programs.length };
  }, opts.switchTo);
  expect(switched.templateId).toBe(opts.switchTo);
  expect(switched.programs).toBe(before.programs + 1);

  // ── Reload: everything persisted ──
  await page.reload();
  await P.waitForBoot(page);
  const after = await page.evaluate(() => ({
    sessions: userData().sessions.length,
    programs: userData().programs.length,
    templateId: activeProgram().templateId,
    rescue: !!document.getElementById("knRescue")
  }));
  expect(after).toEqual({
    sessions: before.sessions + 1,
    programs: before.programs + 1,
    templateId: opts.switchTo,
    rescue: false
  });

  expect(errors, "page errors / console.error").toEqual([]);
  return { startMs, finishMs: fin.ms, bootMs: health.bootMs, finishVia: fin.via };
}

// Independent tests: let both workers share the file.
test.describe.configure({ mode: "parallel" });

test.describe("personas", () => {
  test("fresh first-run: onboarding shows, then the core loop works", async ({ page }) => {
    const errors = await P.instrument(page);
    await P.openFresh(page);
    const h = await page.evaluate(() => ({ booted: window.__knBooted === true, rescue: !!document.getElementById("knRescue") }));
    expect(h).toEqual({ booted: true, rescue: false });
    await expect(page.locator("#onboardingOverlay")).toHaveClass(/active/);
    expect(errors).toEqual([]);

    // Skip onboarding → first-run "who's training?" sheet → create a user.
    await page.evaluate(() => document.getElementById("obDismissBtn").click());
    await expect(page.locator("#onboardingOverlay")).not.toHaveClass(/active/);
    await page.locator("#newUserName").fill("Fresh");
    await page.evaluate(() => {
      document.querySelector('.tpl-option[data-tpl="ss3"]').click();
      document.getElementById("saveAddBtn").click();
    });
    await expect(page.locator("#userChipName")).toHaveText("Fresh");
    await page.evaluate(() => { const s = loadStore(); s.tutorialState.completedAt = Date.now(); saveStore(s); });

    await coreLoop(page, errors, { switchTo: "ppl3" });
  });

  for (const persona of P.PERSONAS) {
    test(persona.title, async ({ page }) => {
      test.setTimeout(90_000);
      const errors = await P.instrument(page);
      await persona.build(page);
      if (persona.darkMode) {
        await expect(page.locator("body")).toHaveAttribute("data-paper-mode", "dark");
      }
      if (persona.sessionsAtBoot) {
        expect(await page.evaluate(() => userData().sessions.length)).toBe(persona.sessionsAtBoot);
      }
      if (persona.id === "injured") {
        expect(await page.evaluate(() => loadStore().onboarding.injuries)).toEqual(["knees", "lowerback", "shoulders"]);
      }
      const r = await coreLoop(page, errors, {
        switchTo: "beginner3",
        budgets: persona.budgets,
        expectDraft: !!persona.draftAtBoot
      });
      if (persona.budgets) {
        const line = `boot ${Math.round(r.bootMs)}ms · start ${Math.round(r.startMs)}ms · finish ${Math.round(r.finishMs)}ms (via ${r.finishVia})`;
        test.info().annotations.push({ type: "timing", description: line });
        console.log(`[${persona.id}] ${line}`);
      }
    });
  }

  // Regression (2026-11-12): in focus view, logging the last set of one
  // block turned the stamp into Finish ("workout complete · 4/28"), and that
  // Finish saved every untouched set of the day as lifted. Real taps only:
  // the stamp must lead on to the next block with sets left, and nothing is
  // saved until the whole day is done or the lifter chooses Save & exit.
  test("focus view: finishing one block leads on to the next and saves nothing", async ({ page }) => {
    test.setTimeout(60_000);
    const errors = await P.instrument(page);
    await P.seedUser(page, { name: "Focus", templateId: "upperlower4" });
    await P.startToday(page);
    const plan = await page.evaluate(() => {
      const day = getCurrentDay();
      const open = day.blocks.map((b, i) => i).filter(i => calcBlockProgress(day.blocks[i]).total > 0);
      state.workoutView = "focus";
      state.focusBlockIdx = open[0];
      state.focusExIdx = 0;
      renderWorkoutScreen();
      return { open, sets: calcBlockProgress(day.blocks[open[0]]).total, sessions: userData().sessions.length };
    });
    expect(plan.open.length, "day has at least two blocks with sets").toBeGreaterThan(1);

    const stamp = page.locator(".paper-focus-view .paper-action-log");
    for (let i = 1; i <= plan.sets; i++) {
      await expect(stamp).toBeEnabled();
      await stamp.tap();
      await page.waitForFunction(a => calcBlockProgress(getCurrentDay().blocks[a.bi]).done >= a.want,
        { bi: plan.open[0], want: i });
    }

    await expect(stamp).toBeEnabled();
    await expect(stamp, "Finish offered with one block done").not.toHaveClass(/paper-action-finish/);
    await expect(page.locator(".paper-focus-view .paper-action-edit-label")).not.toContainText(/workout complete/i);
    await stamp.tap();
    await page.waitForFunction(bi => state.focusBlockIdx === bi, plan.open[1]);
    const after = await page.evaluate(() => ({ sessions: userData().sessions.length, draft: !!getDraft(), view: state.workoutView }));
    expect(after, "no session saved; still in the workout, on the next block").toEqual({ sessions: plan.sessions, draft: true, view: "focus" });
    expect(errors, "page errors / console.error").toEqual([]);
  });

  // Regression (2026-11-14): from 2026-05-12 the returning lifter's only
  // Start sat inside the collapsed "adjust time" panel, which never opens in
  // paper. The gate missed it because startToday() used a JS click. A lifter
  // with history opens the app: Start is wholly on the first screen at
  // 390x844, a real tap starts today's workout, and the plan is untouched.
  test("returning open: Start is on the first screen and starts the plan as written", async ({ page }) => {
    test.setTimeout(60_000);
    const errors = await P.instrument(page);
    await P.seedUser(page, { name: "Returning", templateId: "upperlower4" });
    await P.ensureTrainingToday(page);
    await P.startToday(page);
    await P.markSetsDone(page, 4);
    await P.finishToday(page);
    // Move that session two days back, so today opens like a normal returning day.
    await page.evaluate(key => {
      const s = JSON.parse(localStorage.getItem(key));
      const u = s.users.find(x => x.id === s.currentUserId);
      u.sessions.forEach(x => {
        x.startedAt -= 2 * 86400000; x.finishedAt -= 2 * 86400000;
        x.date = new Date(x.startedAt).toISOString();
      });
      localStorage.setItem(key, JSON.stringify(s));
    }, P.STORE_KEY);
    await page.reload();
    await P.waitForBoot(page);
    await P.ensureTrainingToday(page);

    const start = P.leadStart(page);
    await expect(start, "Start is wholly on the first screen").toBeInViewport({ ratio: 1 });
    const programBefore = await page.evaluate(() => JSON.stringify(activeProgram().program));
    await start.tap();
    await page.waitForFunction(() => !!getDraft());
    expect(await page.evaluate(() => JSON.stringify(activeProgram().program)), "Start rewrote the stored program").toBe(programBefore);
    expect(errors, "page errors / console.error").toEqual([]);
  });

  test.describe("program templates", () => {
    // "custom" has no stock program — the picker routes it to the program
    // builder, so it isn't a switchable/seedable template. "rp-hypertrophy"
    // is generative: its program only exists once startMesocycle() runs,
    // which the real app does inside applyProgramSwitch().
    const LOOP_IDS = TEMPLATE_IDS.filter(id => id !== "custom");
    const GENERATIVE = new Set(["rp-hypertrophy"]);
    const SEED_BASE = "ppl3"; // seed template for generative ones

    let stores = {};
    test.beforeAll(async ({ browser }) => {
      const ids = new Set(LOOP_IDS.map(id => (GENERATIVE.has(id) ? SEED_BASE : id)));
      stores = await P.buildStores(browser, [...ids].map(id => ({ name: "Tpl " + id, templateId: id })));
    });

    LOOP_IDS.forEach((id, i) => {
      // Switch to the next template so every template is also exercised as
      // a switch target.
      const switchTo = LOOP_IDS[(i + 1) % LOOP_IDS.length];
      test(`template ${id} → switch to ${switchTo}`, async ({ page }) => {
        const errors = await P.instrument(page);
        await P.openWithStore(page, stores[GENERATIVE.has(id) ? SEED_BASE : id]);
        if (GENERATIVE.has(id)) {
          await page.evaluate(tid => {
            const tpl = PROGRAM_TEMPLATES.find(t => t.id === tid);
            applyProgramSwitch(tpl, tpl.totalWeeks || tpl.minWeeks, tpl.daysPerWeek);
          }, id);
          await page.reload();
          await P.waitForBoot(page);
        }
        expect(await page.evaluate(() => activeProgram().templateId)).toBe(id);
        expect(await page.evaluate(() => activeProgram().program.length), "program has days").toBeGreaterThan(0);
        await coreLoop(page, errors, { switchTo });
      });
    });
  });

  // Regression (2026-10-09): the first-run "who's training?" sheet
  // (openAddUserDialog, src/js/22-init.js) lists every template. "custom"
  // and "rp-hypertrophy" have no stock program, so Create must start the
  // mesocycle (rp) or open the builder (custom) — otherwise the new user
  // lands on a rest-day card every day with no Start button.
  test("add-user sheet: every offered template yields a startable program", async ({ page }) => {
    await P.openFresh(page);
    const results = await page.evaluate(() => {
      // Skip onboarding; drive the real "Add a new user" sheet + Create.
      try { closeOnboarding(); } catch (e) {}
      const out = {};
      for (const t of PROGRAM_TEMPLATES) {
        openAddUserDialog(false);
        document.getElementById("newUserName").value = "T-" + t.id;
        const opt = document.querySelector('.tpl-option[data-tpl="' + t.id + '"]');
        selectNewUserTpl(opt, t.id);
        document.getElementById("saveAddBtn").click();
        const ap = activeProgram();
        const days = ap && Array.isArray(ap.program) ? ap.program.length : 0;
        const builderOpen = document.getElementById("sheetBg").classList.contains("active")
          && typeof _builderStep !== "undefined" && _builderStep === 1;
        out[t.id] = days > 0 ? "program" : (builderOpen ? "builder" : "EMPTY");
        try { closeSheet(); } catch (e) {}
      }
      return out;
    });
    const empty = Object.entries(results).filter(([, v]) => v === "EMPTY").map(([k]) => k);
    expect(empty, JSON.stringify(results)).toEqual([]);
    expect(results.custom).toBe("builder");
  });
});
