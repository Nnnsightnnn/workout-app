/**
 * Chunk 2 acceptance-gate verification script (§3.12)
 * Run: node verify-chunk2.js
 * Exits 0 on pass, 1 on any failure.
 */
const fs   = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "workout-app.html"), "utf-8");
const dom  = new JSDOM(html, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "http://localhost/",
  beforeParse(window) {
    window.AudioContext = class {
      createOscillator() { return { type:"", frequency:{value:0}, connect(){}, start(){}, stop(){} }; }
      createGain()       { return { gain:{value:0, setValueAtTime(){}, linearRampToValueAtTime(){}}, connect(){} }; }
      get destination()  { return {}; }
      get currentTime()  { return 0; }
    };
    window.webkitAudioContext = window.AudioContext;
  }
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  await sleep(120);
  const w = dom.window;
  if (typeof w.init === "function") w.init();
  await sleep(50);

  let pass = 0, fail = 0;
  function check(name, fn) {
    try   { fn(); console.log("[PASS]", name); pass++; }
    catch(e) { console.error("[FAIL]", name, "\n      ", e.message); fail++; }
  }
  function assert(c, msg) { if (!c) throw new Error(msg || "assertion failed"); }
  function eq(a, b, msg) {
    if (a !== b) throw new Error(`expected ${JSON.stringify(b)}, got ${JSON.stringify(a)} :: ${msg||""}`);
  }

  const now = Date.now();

  // 1. APP_VERSION = 9 (const isn't a window property; getDefaultStore reflects it)
  check("APP_VERSION = 9", () => {
    const defaultSchemaVer = w.getDefaultStore()._schemaVersion;
    eq(defaultSchemaVer, 9, "getDefaultStore()._schemaVersion must be 9 (reflects APP_VERSION)");
  });

  // 2. Migration v9 adds u.rp to a v8 profile
  check("migration v9: u.rp shape on v8 profile", () => {
    w.localStorage.clear();
    const v8Profile = {
      _schemaVersion: 8, unit: "lbs",
      users: [{ id:"u_v8", name:"V8User", program:[], sessions:[],
                measurements:[], templateId:"conjugate5",
                draft:null, lastDoneDayId:null,
                programStartDate: now, weeklySchedule:null,
                currentWeek:1, totalWeeks:10, daysPerWeek:5 }],
      currentUserId: "u_v8",
      onboarding: null, onboardingDismissedAt: null
    };
    w.localStorage.setItem("kn-lifts-v3", JSON.stringify(v8Profile));
    w.runMigrations();
    const s = w.loadStore();
    eq(s._schemaVersion, 9, "schema = 9 after migration");
    const u = s.users[0];
    assert(u.rp, "u.rp exists");
    eq(u.rp.enabled, false, "enabled = false");
    assert(u.rp.coldStartAnchors && typeof u.rp.coldStartAnchors === "object", "coldStartAnchors object");
    eq(u.rp.rpeCalibrationCompletedAt, null, "calibrationAt null");
    eq(u.rp.lastDeloadRecommendedAt, null, "deloadAt null");
    eq(u.rp.dismissedDeloadForWeek, null, "dismissedDeload null");
    console.log("       u.rp =", JSON.stringify(u.rp));
  });

  // 3. Migration v9 does NOT mutate existing session data
  check("migration v9: does not touch sessions", () => {
    w.localStorage.clear();
    const fakeSession = { id:"s1", finishedAt: now - 86400000, sets:
      [{ exId:"bench", weight:185, reps:5, rpe:8, muscles:["chest","triceps","front delts"] }] };
    const v8Profile = {
      _schemaVersion: 8, unit:"lbs",
      users:[{ id:"u_v8", name:"V8User", program:[], sessions:[fakeSession],
               measurements:[], templateId:"conjugate5", draft:null,
               lastDoneDayId:null, programStartDate:now, weeklySchedule:null,
               currentWeek:1, totalWeeks:10, daysPerWeek:5 }],
      currentUserId:"u_v8", onboarding:null, onboardingDismissedAt:null
    };
    w.localStorage.setItem("kn-lifts-v3", JSON.stringify(v8Profile));
    w.runMigrations();
    const s  = w.loadStore();
    const sess = s.users[0].sessions[0];
    assert(sess, "session still present");
    eq(sess.sets[0].weight, 185, "set weight unchanged");
    eq(sess.sets[0].reps,     5, "set reps unchanged");
  });

  // 4. userBodyweightAt: null on empty
  check("userBodyweightAt: null on empty measurements", () => {
    w.localStorage.clear();
    w.addUser("BwTest");
    eq(w.userBodyweightAt(now), null, "null when no measurements");
  });

  // 5. userBodyweightAt: correct interpolation
  // Use numeric timestamps (not date strings) to avoid date-string rounding offsets.
  check("userBodyweightAt: linear interpolation", () => {
    const t1 = now - 10 * 86400000;
    const t2 = now;
    w.updateUser(u => {
      u.measurements = [
        { date: t1, weight: 180, unit: "lbs" },
        { date: t2, weight: 190, unit: "lbs" }
      ];
    });
    const mid = (t1 + t2) / 2; // exact midpoint
    const r   = w.userBodyweightAt(mid);
    assert(r !== null, "not null");
    assert(r.value >= 184.5 && r.value <= 185.5, `interpolated ~185, got ${r.value}`);
    eq(r.stale, false, "not stale (recent entry)");
    console.log(`       interpolated BW = ${r.value.toFixed(2)} lbs (expected 185)`);
  });

  // 6. userBodyweightAt: stale flag
  check("userBodyweightAt: stale when latest >30d old", () => {
    w.updateUser(u => {
      u.measurements = [{ date: new Date(now - 35 * 86400000).toISOString().slice(0, 10), weight: 180, unit:"lbs" }];
    });
    const r = w.userBodyweightAt(now);
    assert(r !== null, "not null");
    eq(r.stale, true, "stale = true");
  });

  // 7. suggestedWeight: disabled when rp.enabled = false
  check("suggestedWeight: disabled reason when not RP-enabled", () => {
    w.localStorage.clear();
    w.addUser("SWTest");
    const r = w.suggestedWeight("bench", 5, 2, { now });
    eq(r.reason, "disabled", "disabled");
    eq(r.weight, null, "null weight");
  });

  // 8. suggestedWeight: cold-start (no history, no anchor)
  check("suggestedWeight: cold-start reason with no history", () => {
    w.updateUser(u => {
      u.rp.enabled = true;
      u.rp.rpeCalibrationCompletedAt = now;
      u.sessions = [];
    });
    const r = w.suggestedWeight("bench", 5, 2, { now });
    eq(r.reason, "cold-start", "cold-start reason");
    eq(r.weight, null, "null weight — no silent default");
    console.log("       cold-start result:", JSON.stringify(r));
  });

  // 9. suggestedWeight: needs-bodyweight for pullup with no measurements
  check("suggestedWeight: needs-bodyweight for BW exercise with no measurements", () => {
    w.updateUser(u => {
      u.measurements = [];
      u.rp.enabled = true;
      u.rp.rpeCalibrationCompletedAt = now;
    });
    const r = w.suggestedWeight("pullup", 6, 2, { now });
    eq(r.reason, "needs-bodyweight", "needs-bodyweight");
    eq(r.weight, null, "null weight");
    console.log("       needs-bodyweight result:", JSON.stringify(r));
  });

  // 10. suggestedWeight: history result from real sessions
  check("suggestedWeight: history result with sessions, rounded to 5 lbs", () => {
    w.updateUser(u => {
      u.rp.enabled = true;
      u.rp.rpeCalibrationCompletedAt = now;
      u.sessions = [
        { id:"s1", finishedAt: now - 7*86400000, sets:[{ exId:"bench", weight:185, reps:5, rpe:8, muscles:["chest","triceps","front delts"] }] },
        { id:"s2", finishedAt: now - 3*86400000, sets:[{ exId:"bench", weight:190, reps:5, rpe:8, muscles:["chest","triceps","front delts"] }] },
      ];
    });
    const r = w.suggestedWeight("bench", 5, 2, { now });
    eq(r.reason, "history", "history reason");
    assert(r.weight !== null, "weight not null");
    assert(r.weight > 0, "positive weight");
    eq(r.weight % 5, 0, `rounded to 5 lbs (got ${r.weight})`);
    console.log(`       suggested weight = ${r.weight} lbs (confidence: ${r.confidence})`);
  });

  // 11. suggestedWeight: cold-start anchor → history result
  check("suggestedWeight: anchor converts cold-start to history result", () => {
    w.updateUser(u => {
      u.sessions = [];
      u.rp.coldStartAnchors = { "bench": { weight: 155, reps: 5, dateMs: now - 1000 } };
    });
    const r = w.suggestedWeight("bench", 5, 2, { now });
    eq(r.reason, "history", "anchor produces history result");
    assert(r.weight !== null, "weight not null");
    eq(r.confidence, "low", "low confidence from anchor");
    console.log(`       anchor-based suggestion = ${r.weight} lbs`);
  });

  // Summary
  console.log(`\n========================================`);
  console.log(`Chunk 2 verification: ${pass} passed, ${fail} failed`);
  console.log(`========================================`);
  process.exit(fail > 0 ? 1 : 0);

})().catch(e => { console.error("Verifier error:", e); process.exit(1); });
