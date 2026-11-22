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

  // Regression (2026-11-17): with a block done in focus view, the bar kept a
  // live weight stepper and Swap aimed at that block's first set, already
  // logged. A "+" meant for the next lift rewrote it (walked: Back Squat
  // lifted at 135 saved as 140 and flagged a PR). Real taps: log a block led
  // by a weighted lift; then nothing on the bar can change those sets, and
  // the stamp still holds the bar's right edge.
  test("focus view: a finished block's logged sets can't be changed from the bar", async ({ page }) => {
    test.setTimeout(60_000);
    const errors = await P.instrument(page);
    await P.seedUser(page, { name: "Stepper", templateId: "upperlower4" });
    await P.startToday(page);
    const plan = await page.evaluate(() => {
      const day = getCurrentDay();
      const bwLed = b => { const e = b.exercises[0]; return !!((LIB_BY_ID[e.exId] || e).bodyweight); };
      const bi = day.blocks.findIndex(b => calcBlockProgress(b).total > 0 && !bwLed(b));
      state.workoutView = "focus";
      state.focusBlockIdx = bi;
      state.focusExIdx = 0;
      renderWorkoutScreen();
      const b = day.blocks[bi];
      return { bi, id: b && b.id, sets: b ? calcBlockProgress(b).total : 0 };
    });
    expect(plan.bi, "day has a block led by a weighted lift").toBeGreaterThan(-1);

    const bar = page.locator(".paper-focus-view .paper-action-bar");
    await expect(bar.locator(".pa-weight-plus"), "stepper while the block has a set to log").toBeVisible();
    const stamp = bar.locator(".paper-action-log");
    for (let i = 1; i <= plan.sets; i++) {
      await expect(stamp).toBeEnabled();
      await stamp.tap();
      await page.waitForFunction(a => calcBlockProgress(getCurrentDay().blocks[a.bi]).done >= a.want,
        { bi: plan.bi, want: i });
    }
    await expect(stamp, "the stamp leads on to the next block").toHaveClass(/paper-action-next/);

    // What a lifter would press for the next lift's weight, if it were there.
    const plus = bar.locator(".pa-weight-plus");
    if (await plus.count()) await plus.tap();
    const w = await page.evaluate(id => getInput(inputKey(id, 0, 0, "w"), null), plan.id);
    expect(w, "a + on the finished block rewrote its logged set 1").toBeNull();
    await expect(bar.locator(".paper-action-weight"), "weight cell on a finished block").toHaveCount(0);
    await expect(bar.locator(".paper-action-swap"), "Swap on a finished block").toHaveCount(0);

    const s = await stamp.boundingBox();
    const b = await bar.boundingBox();
    expect(s && b && (b.x + b.width) - (s.x + s.width) < 30, "stamp holds the bar's right edge").toBe(true);
    expect(s.y + s.height <= 844, "stamp wholly in view").toBe(true);
    expect(errors, "page errors / console.error").toEqual([]);
  });

  // Regression (2026-11-22): in list view the bar said only "set 1 of 4" and
  // the list never moved, so after Start and after every log the set being
  // logged sat under the bar or below the fold (walked: 0 of 10 on screen;
  // Back Squat logged with the finished Row warm-up showing). Real taps: after
  // each log the active set is wholly in view above the bar and the bar names
  // its lift; a "+" on the weight leaves the page where it was.
  test("list view: the set being logged is on screen and the bar names its lift", async ({ page }) => {
    test.setTimeout(90_000);
    const errors = await P.instrument(page);
    await P.seedUser(page, { name: "Follow", templateId: "upperlower4" });
    await P.startToday(page);
    const bar = page.locator(".paper-chapters-view .paper-action-bar");
    const stamp = bar.locator(".paper-action-log");
    const inView = () => page.evaluate(() => {
      const row = document.querySelector(".paper-chapters-view .paper-focus-active-set");
      const b = document.querySelector(".paper-chapters-view .paper-action-bar");
      if (!row || !b) return { ok: false, why: "no active row or bar" };
      const r = row.getBoundingClientRect();
      const ex = row.closest(".paper-exercise").querySelector(".paper-ex-name").textContent.trim();
      const lift = (b.querySelector(".pa-label-lift") || {}).textContent || "";
      return { ok: r.top >= 0 && r.bottom <= b.getBoundingClientRect().top, named: lift === ex, ex, lift };
    });
    const settledScrollY = async () => {
      let prev = null, y = await page.evaluate(() => scrollY);
      for (let i = 0; i < 20 && y !== prev; i++) {
        prev = y;
        await page.waitForTimeout(150);
        y = await page.evaluate(() => scrollY);
      }
      return y;
    };

    let weighted = false;
    const misnamed = [];
    for (let i = 0; i < 10; i++) {
      await expect.poll(async () => (await inView()).ok, { message: `set ${i + 1} on screen above the bar` }).toBe(true);
      const v = await inView();
      if (!v.named) misnamed.push(`set ${i + 1}: row ${v.ex}, bar "${v.lift}"`);
      if (!weighted && await bar.locator(".pa-weight-plus").count()) {
        weighted = true;
        // The follow scrolls smoothly, and the row reads as in view before
        // the scroll ends; on a loaded runner it was still moving when y was
        // read (1145, then 1195). Measure only a page at rest.
        const y = await settledScrollY();
        await bar.locator(".pa-weight-plus").tap();
        await page.waitForTimeout(400);
        expect(await settledScrollY(), "a + on the weight moved the page").toBe(y);
      }
      const done = await page.evaluate(() => Object.values(getDraft().inputs).filter(x => x === "done").length);
      await expect(stamp).toBeEnabled();
      await stamp.tap();
      await page.waitForFunction(n => Object.values(getDraft().inputs).filter(x => x === "done").length > n, done);
    }
    expect(weighted, "walk reached a weighted lift").toBe(true);
    expect(misnamed, "the bar didn't name the lift being logged").toEqual([]);
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

  // Regression (2026-11-19): from 2026-05-12 "adjust time" opened to zero
  // height in paper, and behind it "Start adjusted" wrote the cut day over
  // the stored program, so the cut stayed every week after. Real taps:
  // adjust time, 30, the card's Start; the cut day runs, and a logged set
  // and Finish leave the stored program as written.
  test("adjust time: three real taps start a 30-minute day for this session only", async ({ page }) => {
    test.setTimeout(60_000);
    const errors = await P.instrument(page);
    await P.seedUser(page, { name: "Adjust", templateId: "upperlower4" });
    await P.ensureTrainingToday(page);
    const hero = page.locator(".paper-day-card-hero");
    const before = await page.evaluate(() => {
      const id = Number(document.querySelector(".paper-day-card-hero").dataset.dayId);
      const d = activeProgram().program.find(x => x.id === id);
      return { program: JSON.stringify(activeProgram().program), sets: d.blocks.reduce((n, b) => n + b.exercises.reduce((s, e) => s + (e.sets || 0), 0), 0) };
    });

    await hero.locator(".dpc-expand-hint").tap({ timeout: 15000 });
    const pick = hero.locator('.paper-tb-pick[data-min="30"]');
    await expect(pick, "30 is on screen once adjust time is tapped").toBeInViewport({ ratio: 1 });
    await pick.tap({ timeout: 15000 });
    await expect(hero.locator(".tb-adj-item").first(), "the cuts are listed").toBeInViewport();
    const start = P.leadStart(page);
    await expect(start).toHaveText(/start ~\d+ min/i);
    await expect(start, "the card's Start stays on screen beside the cuts").toBeInViewport({ ratio: 1 });
    await start.tap({ timeout: 15000 });
    await page.waitForFunction(() => !!getDraft());

    const cut = await page.evaluate(() => getCurrentDay().blocks.reduce((n, b) => n + b.exercises.reduce((s, e) => s + (e.sets || 0), 0), 0));
    expect(cut, "the session runs the cut day").toBeLessThan(before.sets);
    await page.locator(".paper-action-log").first().tap({ timeout: 15000 });
    await page.waitForFunction(() => Object.values(getDraft().inputs).indexOf("done") >= 0);
    await P.finishToday(page);
    const after = await page.evaluate(() => ({ program: JSON.stringify(activeProgram().program), draft: activeProgram().draft }));
    expect(after.program, "the stored program after a cut session").toBe(before.program);
    expect(after.draft, "the cut day went with the draft").toBeNull();
    expect(errors, "page errors / console.error").toEqual([]);
  });

  // Regression (2026-11-21): "Trim session" removed the last untouched block
  // through mutateDay into the stored program, so a block trimmed on one
  // late day was gone from that day every week after. A lifter with Auto
  // timer on runs long; a real tap on Trim cuts this session only, and a
  // logged set and Finish leave the stored program as written.
  test("pace trim: a real tap on Trim cuts today's session only", async ({ page }) => {
    test.setTimeout(60_000);
    const errors = await P.instrument(page);
    await P.seedUser(page, { name: "Trim", templateId: "upperlower4" });
    await P.ensureTrainingToday(page);
    const before = await page.evaluate(() => {
      const s = loadStore(); s.autoTimer = true; saveStore(s); state.autoTimer = true;
      return JSON.stringify(activeProgram().program);
    });
    await P.startToday(page);
    const blocks = await page.evaluate(() => getCurrentDay().blocks.length);
    // Setup: the session began 25 minutes ago, so the pace check reads long.
    await page.evaluate(() => {
      updateActiveProgram(e => { if (e.draft) e.draft.startedAt -= 25 * 60000; });
      state.workoutStartedAt = getDraft().startedAt;
      updatePaceChip();
    });
    const trim = page.locator("#trimBtn");
    await expect(trim, "Trim is offered once the session runs long").toBeVisible();
    await trim.tap({ timeout: 15000 });
    await page.waitForFunction(n => getCurrentDay().blocks.length === n - 1, blocks);
    expect(await page.evaluate(() => JSON.stringify(activeProgram().program)), "the stored program after a trim").toBe(before);
    await page.locator(".paper-action-log").first().tap({ timeout: 15000 });
    await page.waitForFunction(() => Object.values(getDraft().inputs).indexOf("done") >= 0);
    await P.finishToday(page);
    const after = await page.evaluate(() => ({ program: JSON.stringify(activeProgram().program), draft: activeProgram().draft }));
    expect(after.program, "the stored program after a trimmed session").toBe(before);
    expect(after.draft, "the trimmed day went with the draft").toBeNull();
    expect(errors, "page errors / console.error").toEqual([]);
  });

  // Regression (2026-11-15): the rest countdown lived only in a header pill
  // the paper skin hides, so the bar's rest cell sat still through every
  // rest, and the 0s warm-up's pending hide cancelled the first working
  // rest outright. Real taps through the warm-up, then the first working
  // set: its rest must count down in the bar and still be running after
  // the old 2s cancel window.
  test("rest: the first working set's rest counts down in the bar", async ({ page }) => {
    test.setTimeout(60_000);
    const errors = await P.instrument(page);
    await P.seedUser(page, { name: "Rest", templateId: "upperlower4" });
    await P.ensureTrainingToday(page);
    await P.startToday(page);
    const stamp = page.locator(".paper-action-bar .paper-action-log");
    const restVal = page.locator(".paper-action-bar .paper-action-rest .pa-rest-val");
    const doneCount = () => page.evaluate(() => Object.values(getDraft().inputs).filter(v => v === "done").length);
    // Follow the lead through the no-rest warm-up sets.
    let taps = 0;
    while (/^(none|0s)$/.test((await restVal.textContent() || "").trim()) && taps < 15) {
      const n = await doneCount();
      await expect(stamp).toBeEnabled();
      await stamp.tap();
      await page.waitForFunction(want => Object.values(getDraft().inputs).filter(v => v === "done").length >= want, n + 1);
      await expect(stamp).toBeEnabled();
      taps++;
    }
    const planned = (await restVal.textContent() || "").trim();
    const toSec = s => { const m = /^(\d+):(\d\d)$/.exec(s); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
    expect(toSec(planned), `working set shows its rest length, got "${planned}"`).toBeGreaterThan(0);
    await stamp.tap();
    await page.waitForTimeout(2600);
    const t1 = toSec((await restVal.textContent() || "").trim());
    await expect(page.locator(".paper-action-bar .paper-action-rest"), "running rest is marked").toHaveClass(/is-resting/);
    expect(t1, "rest still running 2.6s in, and counting down").toBeLessThan(toSec(planned));
    await page.waitForTimeout(1100);
    const t2 = toSec((await restVal.textContent() || "").trim());
    expect(t2, "the countdown keeps moving").toBeLessThan(t1);
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
