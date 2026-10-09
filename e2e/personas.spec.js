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

  // Known bug, kept visible: the first-run "who's training?" sheet
  // (openAddUserDialog, src/js/22-init.js) lists every template, but
  // addUser() → newUserRecord() builds an empty program for "custom" and
  // "rp-hypertrophy" (no startMesocycle), so that user lands on a rest-day
  // card every day with no Start button. test.fail() flips red once fixed —
  // then delete the annotation.
  test("add-user sheet: every offered template yields a startable program", async ({ page }) => {
    test.fail(true, "custom / rp-hypertrophy create an empty program via addUser()");
    await P.openFresh(page);
    const empty = await page.evaluate(() => PROGRAM_TEMPLATES
      .filter(t => !newUserRecord("x", t.id).programs[0].program.length)
      .map(t => t.id));
    expect(empty).toEqual([]);
  });
});
