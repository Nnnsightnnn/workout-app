// @ts-check
// ============================================================
// PERSONA FIXTURES — real-user stores for the WebKit persona suite
// ============================================================
// Every persona is built with the app's OWN code (newUserRecord, the real
// start → finish path) after a first page load, written to localStorage,
// and then the page is reloaded so the app boots from that stored data —
// exactly how a returning user on iPhone Safari meets a new deploy.
//
// Why: the two bugs Nick hit (TDZ crash with stored injuries; 15 s freeze
// on Start with ~300 sessions) only appear with a lived-in store. Tests
// that start from an empty store can't see them.

const path = require("path");

// KN_APP_HTML points the suite at another build (e.g. a scratch build with
// a fix reverted, to prove a guardrail still bites).
const APP_URL = "file://" + path.resolve(process.env.KN_APP_HTML || path.join(__dirname, "..", "..", "workout-app.html"));
const STORE_KEY = "kn-lifts-v3";

// Long-history persona size and its time budgets (ms).
const LONG_HISTORY_SESSIONS = 300;
const BUDGETS = { bootMs: 2000, startMs: 1000, finishMs: 1000 };

// Registered before any page script runs. Records the moment the app's
// init() flips window.__knBooted to true (performance.now() is measured
// from navigation start), so boot time is captured across a reload.
function installBootProbe() {
  let booted = false;
  // @ts-ignore
  window.__knBootMs = null;
  Object.defineProperty(window, "__knBooted", {
    configurable: true,
    get() { return booted; },
    set(v) {
      booted = v;
      // @ts-ignore
      if (v === true && window.__knBootMs == null) window.__knBootMs = performance.now();
    }
  });
}

// Wire error capture + the boot probe onto a page. Returns the live list.
async function instrument(page) {
  const errors = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", msg => { if (msg.type() === "error") errors.push("console.error: " + msg.text()); });
  await page.addInitScript(installBootProbe);
  return errors;
}

// Load the app with an empty store.
async function openFresh(page) {
  await page.goto(APP_URL);
  await page.evaluate(k => localStorage.removeItem(k), STORE_KEY);
  await page.reload();
  await waitForBoot(page);
}

async function waitForBoot(page) {
  await page.waitForFunction(() => window.__knBooted === true, null, { timeout: 15_000 });
}

// Runs IN THE PAGE (serialized by page.evaluate). Builds a one-user store
// with the app's own newUserRecord(), marks first-run overlays as done and
// applies persona tweaks. opts: { name, templateId, weeks, days, injuries, bgColor }
function buildStoreInPage(o) {
  const s = getDefaultStore();
  const u = newUserRecord(o.name || "Persona", o.templateId, o.weeks || 10, o.days);
  const now = Date.now();
  s.users.push(u);
  s.currentUserId = u.id;
  s.onboarding = { completedAt: now, injuries: o.injuries || [] };
  s.onboardingDismissedAt = now;
  s.tutorialState = { completedAt: now, dismissedAt: null, lastStepId: null };
  if (o.bgColor) u.preferences.bgColor = o.bgColor;
  // Date-proof the suite: on a scheduled rest day the picker shows the
  // rest card instead of Start. Map today onto program day 1.
  const entry = u.programs.find(p => p.id === u.activeProgramId);
  const dow = new Date().getDay();
  if (entry && Array.isArray(entry.weeklySchedule) && entry.weeklySchedule.length === 7
      && entry.weeklySchedule[dow] == null && entry.program.length) {
    entry.weeklySchedule[dow] = entry.program[0].id;
  }
  return s;
}

// First load → build the persona store in-page → write → reload.
async function seedUser(page, opts) {
  await page.goto(APP_URL);
  await waitForBoot(page);
  await page.evaluate(({ key, store }) => localStorage.setItem(key, JSON.stringify(store)),
    { key: STORE_KEY, store: await page.evaluate(buildStoreInPage, opts) });
  await page.reload();
  await waitForBoot(page);
}

// Build many persona stores in one throwaway page (one app load total).
// Returns { [opts.templateId]: store }.
async function buildStores(browser, optsList) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(APP_URL);
  await waitForBoot(page);
  const out = {};
  for (const o of optsList) out[o.templateId] = await page.evaluate(buildStoreInPage, o);
  await ctx.close();
  return out;
}

// Fast path: put a prebuilt store in localStorage before the app's first
// script runs, then load once. The sessionStorage guard keeps the seed from
// clobbering what the app saved when the test later reloads the page.
async function openWithStore(page, store) {
  await page.addInitScript(({ key, raw }) => {
    if (sessionStorage.getItem("__personaSeeded")) return;
    sessionStorage.setItem("__personaSeeded", "1");
    localStorage.setItem(key, raw);
  }, { key: STORE_KEY, raw: JSON.stringify(store) });
  await page.goto(APP_URL);
  await waitForBoot(page);
}

// Same rest-day guard, for a user created through the UI (fresh persona).
async function ensureTrainingToday(page) {
  await page.evaluate(() => {
    const ap = activeProgram();
    const dow = new Date().getDay();
    if (ap && Array.isArray(ap.weeklySchedule) && ap.weeklySchedule.length === 7
        && ap.weeklySchedule[dow] == null && ap.program.length) {
      updateActiveProgram(e => { e.weeklySchedule[dow] = e.program[0].id; });
      state.currentDayId = determineDefaultDay();
      renderWorkoutScreen();
    }
  });
}

// Click today's visible Start button (element.click(): the page scrolls an
// inner container, so Playwright's tap is unreliable here). Returns the
// synchronous handler time in ms, or null if a workout was already open.
async function startToday(page) {
  return page.evaluate(() => {
    if (getDraft()) return null; // mid-workout persona resumes straight in
    const btn = [...document.querySelectorAll(".tb-start-btn.primary")]
      .find(b => b.getBoundingClientRect().width > 0);
    if (!btn) throw new Error("no visible .tb-start-btn.primary on the day picker");
    const t0 = performance.now();
    btn.click();
    return performance.now() - t0;
  });
}

// Tick the first n not-yet-done set checkboxes. Returns done-status count.
async function markSetsDone(page, n) {
  return page.evaluate(count => {
    for (let i = 0; i < count; i++) {
      const box = [...document.querySelectorAll(".paper-set-box[aria-checked='false']")]
        .find(b => b.getBoundingClientRect().width > 0);
      if (!box) break;
      box.click(); // each tap re-renders, so re-query every time
    }
    const d = getDraft();
    return d ? Object.values(d.inputs).filter(v => v === "done").length : 0;
  }, n);
}

// Finish via the visible finish control if one is on screen, else the
// function. Returns { ms, via, sessions } (handler time, path, count after).
async function finishToday(page) {
  return page.evaluate(() => {
    const btn = [...document.querySelectorAll("#headerFinishBtn.active, .paper-action-finish")]
      .find(b => b.getBoundingClientRect().width > 0);
    const before = userData().sessions.length;
    const t0 = performance.now();
    if (btn) btn.click(); else finishWorkout();
    const ms = performance.now() - t0;
    // In focus view the header button may advance blocks ("Next →") rather
    // than finish; fall through to the function so the session lands.
    let via = btn ? "button" : "function";
    if (userData().sessions.length === before && getDraft()) {
      const t1 = performance.now();
      finishWorkout();
      return { ms: ms + (performance.now() - t1), via: via + "+function", sessions: userData().sessions.length };
    }
    return { ms, via, sessions: userData().sessions.length };
  });
}

// Grow history to `total` sessions by cloning the newest real session with
// shifted dates/ids. Clones belong to an earlier program so they don't
// count toward the current program week (as a long-time user's would).
async function cloneHistory(page, total) {
  await page.evaluate(({ key, total }) => {
    const s = JSON.parse(localStorage.getItem(key));
    const u = s.users.find(x => x.id === s.currentUserId);
    const base = u.sessions[u.sessions.length - 1];
    const days = (u.programs.find(p => p.id === u.activeProgramId) || {}).program || [];
    const DAY = 86400000;
    const clones = [];
    for (let i = 1; i < total; i++) {
      const c = JSON.parse(JSON.stringify(base));
      const shift = i * DAY + (i % 7) * 3600000;
      c.id = "s-" + (base.finishedAt - shift);
      c.startedAt = base.startedAt - shift;
      c.finishedAt = base.finishedAt - shift;
      c.programId = "p_legacy_history";
      c.programWeek = 1 + Math.floor(i / 5) % 12;
      if (days.length) { const d = days[i % days.length]; c.dayId = d.id; c.dayName = d.name; }
      c.sets.forEach((st, j) => { st.isPR = false; st.weight = Math.max(0, (Number(st.weight) || 0) - (i % 10) * 5); st.reps = st.reps || 5 + (j % 3); });
      c.prCount = 0;
      clones.push(c);
    }
    u.sessions = clones.reverse().concat(u.sessions); // oldest first
    localStorage.setItem(key, JSON.stringify(s));
  }, { key: STORE_KEY, total });
}

// Boot health: booted, no rescue screen, workout screen rendered.
async function bootHealth(page) {
  return page.evaluate(() => ({
    booted: window.__knBooted === true,
    rescue: !!document.getElementById("knRescue"),
    workoutActive: !!document.querySelector("#screen-workout.active"),
    blocksRendered: (document.getElementById("blocksContainer") || { children: [] }).children.length > 0,
    bootMs: window.__knBootMs
  }));
}

// ── Persona catalogue ─────────────────────────────────────────
// Each `build(page)` leaves the page booted from that persona's store.
// `expect` lists extra persona-specific checks the spec runs.
const PERSONAS = [
  {
    id: "injured",
    title: "injured: knees + lower back + shoulders flagged",
    build: page => seedUser(page, { name: "Injured", templateId: "conjugate5", injuries: ["knees", "lowerback", "shoulders"] })
  },
  {
    id: "dark",
    title: "dark theme: near-black background",
    build: page => seedUser(page, { name: "Dark", templateId: "upperlower4", bgColor: "nearblack" }),
    darkMode: true
  },
  {
    id: "long-history",
    title: `long history: ${LONG_HISTORY_SESSIONS} finished sessions`,
    build: async page => {
      await seedUser(page, { name: "Veteran", templateId: "conjugate5" });
      await startToday(page);
      await markSetsDone(page, 4);
      await finishToday(page);
      await cloneHistory(page, LONG_HISTORY_SESSIONS);
      await page.reload();
      await waitForBoot(page);
    },
    sessionsAtBoot: LONG_HISTORY_SESSIONS,
    budgets: BUDGETS
  },
  {
    id: "mid-workout",
    title: "mid-workout: active draft with sets done",
    build: async page => {
      await seedUser(page, { name: "MidWorkout", templateId: "ppl3" });
      await startToday(page);
      await markSetsDone(page, 3);
      await page.reload();
      await waitForBoot(page);
    },
    draftAtBoot: true
  }
];

module.exports = {
  APP_URL, STORE_KEY, LONG_HISTORY_SESSIONS, BUDGETS, PERSONAS,
  instrument, openFresh, waitForBoot, seedUser, buildStores, openWithStore, ensureTrainingToday,
  startToday, markSetsDone, finishToday, cloneHistory, bootHealth
};
