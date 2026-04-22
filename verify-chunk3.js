// verify-chunk3.js — Standalone verification for Chunk 3 (Workstream D)
// Tests recomputeAllIsPR, _original capture, revert, and B-core non-staleness.
const fs = require("fs");
const { JSDOM } = require("jsdom");
const path = require("path");

const html = fs.readFileSync(
  path.join(__dirname, "workout-app.html"),
  "utf-8"
);

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "http://localhost/",
  beforeParse(window) {
    window.AudioContext = class {
      createOscillator() { return { type: "", frequency: { value: 0 }, connect() {}, start() {}, stop() {} }; }
      createGain()      { return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} }; }
      get destination() { return {}; }
      get currentTime() { return 0; }
    };
    window.webkitAudioContext = window.AudioContext;
  }
});

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  await wait(120);
  const w = dom.window;
  if (typeof w.init === "function") w.init();
  await wait(50);

  const results = [];
  const t = (name, fn) => {
    try { fn(); results.push([name, "PASS", ""]); }
    catch (e) { results.push([name, "FAIL", e.message]); }
  };
  const assert = (c, m) => { if (!c) throw new Error(m); };
  const eq     = (a, b, m) => { if (a !== b) throw new Error(`got ${JSON.stringify(a)}, expected ${JSON.stringify(b)} — ${m || ""}`); };

  // ---- Set up a mock user with sessions ----
  w.localStorage.clear();
  w.addUser("VerifyUser");
  const NOW = Date.now();

  w.updateUser(u => {
    u.sessions = [
      {
        id: "s1", finishedAt: NOW - 30 * 86400000, prCount: 0, volume: 675, editedAt: null,
        sets: [{ exId: "bench", exName: "Bench Press", weight: 135, reps: 5, rpe: 8, isPR: false, bodyweight: false, muscles: [] }]
      },
      {
        id: "s2", finishedAt: NOW - 20 * 86400000, prCount: 0, volume: 725, editedAt: null,
        sets: [{ exId: "bench", exName: "Bench Press", weight: 145, reps: 5, rpe: 8, isPR: false, bodyweight: false, muscles: [] }]
      },
      {
        id: "s3", finishedAt: NOW - 10 * 86400000, prCount: 0, volume: 775, editedAt: null,
        sets: [{ exId: "bench", exName: "Bench Press", weight: 155, reps: 5, rpe: 8, isPR: false, bodyweight: false, muscles: [] }]
      }
    ];
  });

  // (a) set value changes after saveSessionEdits
  t("(a) set value changes after saveSessionEdits", () => {
    const u = w.userData();
    const edited = w.deepClone(u.sessions.find(s => s.id === "s2"));
    edited.sets[0].weight = 160; // bump up s2
    w.saveSessionEdits(edited);
    const u2 = w.userData();
    const s2 = u2.sessions.find(s => s.id === "s2");
    eq(s2.sets[0].weight, 160, "weight updated to 160");
  });

  // (b) _original captured the old value
  t("(b) _original captures pre-edit value", () => {
    const u = w.userData();
    const s2 = u.sessions.find(s => s.id === "s2");
    assert(s2.sets[0]._original, "_original exists");
    eq(s2.sets[0]._original.weight, 145, "_original.weight holds pre-edit value (145)");
  });

  // (c) recomputeAllIsPR fired and PR flags are consistent
  t("(c) recomputeAllIsPR: PR flags consistent after edit", () => {
    // After editing s2 weight from 145→160:
    // s1: 135 → PR (first)
    // s2: 160 → PR (160 > 135)
    // s3: 155 → NOT PR (155 < 160, s2 now leads)
    const u = w.userData();
    eq(u.sessions.find(s => s.id === "s1").sets[0].isPR, true, "s1 is PR (first bench)");
    eq(u.sessions.find(s => s.id === "s2").sets[0].isPR, true, "s2 is PR (160 > 135)");
    eq(u.sessions.find(s => s.id === "s3").sets[0].isPR, false, "s3 NOT PR (155 < 160)");
    eq(u.sessions.find(s => s.id === "s2").prCount, 1, "s2 prCount=1");
    eq(u.sessions.find(s => s.id === "s3").prCount, 0, "s3 prCount=0");
  });

  // (d) second edit does NOT overwrite _original
  t("(d) second edit does not overwrite _original", () => {
    const u = w.userData();
    const edited = w.deepClone(u.sessions.find(s => s.id === "s2"));
    const origBeforeSecondEdit = edited.sets[0]._original.weight; // should be 145
    edited.sets[0].weight = 170; // second edit
    w.saveSessionEdits(edited);
    const u2 = w.userData();
    const s2 = u2.sessions.find(s => s.id === "s2");
    eq(s2.sets[0].weight, 170, "weight now 170 after second edit");
    eq(s2.sets[0]._original.weight, origBeforeSecondEdit, "_original still holds first pre-edit value");
  });

  // (e) revert within 7 days restores the original
  t("(e) revert restores pre-edit value and clears _original", () => {
    w.revertSession("s2");
    const u = w.userData();
    const s2 = u.sessions.find(s => s.id === "s2");
    eq(s2.sets[0].weight, 145, "weight restored to 145 (first pre-edit value)");
    eq(s2.sets[0]._original, undefined, "_original cleared after revert");
    eq(s2.editedAt, null, "editedAt cleared");
  });

  // (f) revert after 7 days: _original is removed by loadStore cleanup
  t("(f) _original older than 7 days dropped by loadStore", () => {
    const eightDaysAgo = Date.now() - 8 * 86400000;
    w.updateUser(u => {
      const s = u.sessions.find(x => x.id === "s3");
      s.sets[0]._original = {
        weight: 999, reps: 5, rpe: 8, bodyweight: false, isPR: false,
        editedAt: eightDaysAgo
      };
    });
    // loadStore runs the 7-day cleanup
    const store = w.loadStore();
    const user = store.users[0];
    const s3 = user.sessions.find(s => s.id === "s3");
    eq(s3.sets[0]._original, undefined, "_original older than 7 days removed by loadStore");
  });

  // (g) B-core: suggestedWeight re-reads from edited sessions (no stale cache)
  t("(g) B-core recentE1RM reads live sessions, not stale cache", () => {
    // Edit s3 weight from 155 → 185 (big jump)
    const u = w.userData();
    w.updateUser(u2 => {
      u2.rp.enabled = true;
      u2.rp.rpeCalibrationCompletedAt = NOW;
    });
    const edited = w.deepClone(w.userData().sessions.find(s => s.id === "s3"));
    edited.sets[0].weight = 185;
    w.saveSessionEdits(edited);

    // recentE1RM should now see 185 as the top session value
    const e1rm = w.recentE1RM("bench");
    assert(e1rm.value !== null, "recentE1RM returns a value");
    // e1rm for 185×5 ≈ 215.8; weighted with others it should exceed 185
    assert(e1rm.value > 180, `e1rm ${e1rm.value} should reflect edited 185lb session`);
  });

  // Print results
  console.log("\n===== VERIFY CHUNK 3 =====");
  let pass = 0, fail = 0;
  for (const [name, status, err] of results) {
    console.log(`[${status}] ${name}`);
    if (status === "FAIL") { console.log("   " + err); fail++; } else pass++;
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error("Runner error:", e); process.exit(1); });
