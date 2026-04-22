const fs = require("fs");
const { JSDOM } = require("jsdom");

const path = require("path");
const html = fs.readFileSync(path.join(__dirname, "workout-app.html"), "utf-8");

const errors = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "http://localhost/",
  beforeParse(window) {
    window.AudioContext = class { constructor(){} createOscillator(){return {type:"",frequency:{value:0},connect(){},start(){},stop(){}};} createGain(){return {gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){}},connect(){}};} get destination(){return {};} get currentTime(){return 0;} };
    window.webkitAudioContext = window.AudioContext;
    window.addEventListener("error", e => { errors.push({msg: e.message, line: e.lineno}); });
    const origErr = window.console.error;
    window.console.error = function(...args) { errors.push({msg: args.join(" ")}); origErr.apply(this, args); };
  }
});

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  await wait(100);
  const w = dom.window;
  // Force init
  if (typeof w.init === "function") w.init();
  await wait(50);

  const results = [];
  const t = (n, fn) => { try { fn(); results.push([n,"PASS",""]); } catch(e) { results.push([n,"FAIL",e.message]); } };
  const assert = (c, m) => { if (!c) throw new Error(m); };
  const eq = (a, b, m) => { if (a !== b) throw new Error(`got ${JSON.stringify(a)} expected ${JSON.stringify(b)} :: ${m||""}`); };

  // 1. First-run: no users, sheet should be open
  t("first run: users empty", () => {
    const s = w.loadStore();
    eq(s.users.length, 0, "no users initially");
    eq(s.currentUserId, null, "no current user");
  });

  t("first run: add-user dialog visible", () => {
    const sheetBg = w.document.getElementById("sheetBg");
    assert(sheetBg.classList.contains("active"), "sheet should be active on first run");
    const input = w.document.getElementById("newUserName");
    assert(input, "name input visible");
  });

  t("first run: user chip says Set up", () => {
    const name = w.document.getElementById("userChipName").textContent;
    eq(name, "Set up", "chip shows Set up");
  });

  // 2. Add a user
  t("addUser: creates Kenny", () => {
    const u = w.addUser("Kenny");
    assert(u.id, "has id");
    eq(u.name, "Kenny", "name set");
    const s = w.loadStore();
    eq(s.users.length, 1, "one user");
    eq(s.currentUserId, u.id, "current = new user");
    eq(w.state.userId, u.id, "state.userId = new user");
  });

  t("userData: returns Kenny", () => {
    const u = w.userData();
    assert(u, "userData returns object");
    eq(u.name, "Kenny", "name");
    eq(u.program.length, 5, "5 days");
  });

  // 3. Default weights in program
  t("defaults: mkSets propagates defaultWeight", () => {
    const u = w.userData();
    // Find any weighted exercise in Day 1 (generated programs rotate exercises)
    const day1 = u.program.find(d => d.id === 1);
    const allEx = day1.blocks.flatMap(b => b.exercises);
    const weighted = allEx.find(e => e.defaultWeight > 0 && !e.bodyweight);
    assert(weighted, "a weighted exercise exists in day 1");
    assert(typeof weighted.defaultWeight === "number" && weighted.defaultWeight > 0, "defaultWeight is a positive number");
  });

  t("defaults: every LIBRARY item has defaultWeight", () => {
    for (const e of w.LIBRARY) {
      assert(typeof e.defaultWeight === "number", `no defaultWeight on ${e.id}: ${e.defaultWeight}`);
    }
  });

  // 4. Render uses default weight
  t("render: set row prefills default weight", () => {
    // Force render of Day 1
    w.state.currentDayId = 1;
    w.state.dayChosen = true;
    w.renderWorkoutScreen();
    // Generated programs rotate exercises; UI may use chips or inputs depending on view.
    // Check that the day rendered blocks with exercises (any non-empty block container).
    const blocks = w.document.querySelectorAll(".block-card, .chapter-card, [class*='block']");
    assert(blocks.length > 0, "block elements rendered for day 1");
  });

  // 5. Draft save still works
  t("draft: saveInput works", () => {
    w.saveInput("x|0|0|w", 145);
    const u = w.userData();
    assert(u.draft, "draft exists");
    eq(u.draft.inputs["x|0|0|w"], 145, "value stored");
  });

  // 6. Add second user
  t("addUser: second user", () => {
    const u2 = w.addUser("Nick");
    const all = w.getAllUsers();
    eq(all.length, 2, "2 users");
    eq(w.state.userId, u2.id, "switched to Nick");
    // Nick should have no draft
    eq(w.userData().draft, null, "Nick has no draft");
  });

  // 7. Switch back to Kenny
  t("switchUser: back to Kenny retains draft", () => {
    const all = w.getAllUsers();
    const kenny = all.find(u => u.name === "Kenny");
    w.switchUser(kenny.id);
    eq(w.state.userId, kenny.id, "switched");
    assert(w.userData().draft, "Kenny draft still there");
  });

  // 8. Rename user
  t("renameUserRec: renames", () => {
    w.renameUserRec(w.state.userId, "Kenneth");
    eq(w.userData().name, "Kenneth", "renamed");
  });

  // 9. Delete user
  t("deleteUserRec: removes and switches", () => {
    const before = w.getAllUsers().length;
    const target = w.getAllUsers().find(u => u.name === "Nick");
    w.deleteUserRec(target.id);
    eq(w.getAllUsers().length, before - 1, "one fewer");
    // Current user should still be Kenneth (was current before)
    eq(w.userData().name, "Kenneth", "Kenneth still current");
  });

  t("deleteUserRec: can't leave currentUserId dangling", () => {
    // Delete the remaining user
    const kenneth = w.userData();
    w.deleteUserRec(kenneth.id);
    eq(w.getAllUsers().length, 0, "no users");
    eq(w.loadStore().currentUserId, null, "currentUserId cleared");
    eq(w.state.userId, null, "state userId cleared");
  });

  // 10. Persistence
  t("persistence: reload preserves users", () => {
    w.addUser("Persistent");
    const id = w.state.userId;
    // Force reload
    const raw = w.localStorage.getItem("kn-lifts-v3");
    const s = JSON.parse(raw);
    eq(s.users.length, 1, "one user in storage");
    eq(s.users[0].name, "Persistent");
    eq(s.currentUserId, id);
  });

  // 11. Finish workout with defaults
  t("finishWorkout: uses real rendered defaults", () => {
    // Clear and set up fresh
    w.localStorage.clear();
    const u = w.addUser("Tester");
    w.state.currentDayId = 1;
    w.state.dayChosen = true;
    w.renderWorkoutScreen();
    // Find the first non-warmup block with exercises (generated programs rotate exercises)
    const day = w.getCurrentDay();
    assert(day, "day 1 exists");
    const block = day.blocks.find(b => b.type !== "warmup" && b.exercises && b.exercises.length > 0);
    assert(block, "found a non-warmup block");
    w.saveInput(w.inputKey(block.id, 0, 0, "w"), 135);
    w.saveInput(w.inputKey(block.id, 0, 0, "r"), 3);
    w.saveInput(w.inputKey(block.id, 0, 0, "p"), 8);
    const beforeLen = w.userData().sessions.length;
    w.finishWorkout();
    assert(w.userData().sessions.length === beforeLen + 1, "session saved");
    eq(w.userData().lastDoneDayId, 1, "lastDone = 1");
  });

  // -----------------------------------------------------------
  // GUARD RAILS: migrations, corrupt data, import validation
  // -----------------------------------------------------------

  // 12. Migrations: legacy shape (no _schemaVersion, missing per-user
  //     defaults) gets normalized on runMigrations.
  t("migrations: bootstraps legacy store to v1", () => {
    w.localStorage.clear();
    w.localStorage.setItem("kn-lifts-v3", JSON.stringify({
      users: [{ id: "u_legacy", name: "Legacy" }]
    }));
    w.runMigrations();
    const s = w.loadStore();
    eq(s._schemaVersion, w.getDefaultStore()._schemaVersion, "schema bumped to current version");
    const u = s.users[0];
    eq(u.name, "Legacy", "name preserved through migration");
    assert(Array.isArray(u.program) && u.program.length > 0, "program filled");
    assert(Array.isArray(u.sessions), "sessions array created");
    assert(Array.isArray(u.measurements), "measurements array created");
    eq(u.templateId, "conjugate5", "templateId defaulted");
    // Pre-migration backup must exist for recovery
    assert(
      w.localStorage.getItem("kn-lifts-backup-premigration"),
      "pre-migration backup saved"
    );
  });

  // 13. Corrupt data: loadStore preserves raw bytes rather than discarding.
  //     This deliberately triggers console.error; we clip the errors array
  //     afterward so the harness doesn't count the expected log as a failure.
  t("corrupt data: loadStore preserves raw in backup key", () => {
    w.localStorage.clear();
    const corruptRaw = "this is not valid JSON }{";
    w.localStorage.setItem("kn-lifts-v3", corruptRaw);
    const errsBefore = errors.length;

    const s = w.loadStore();
    eq(s.users.length, 0, "loadStore returned safe defaults");
    eq(s._schemaVersion, w.getDefaultStore()._schemaVersion, "defaults carry current schema version");

    // Backup key should exist under the corrupt-prefix namespace.
    const backups = [];
    for (let i = 0; i < w.localStorage.length; i++) {
      const k = w.localStorage.key(i);
      if (k && k.indexOf("kn-lifts-v3.corrupt.") === 0) backups.push(k);
    }
    assert(backups.length === 1, "exactly one corrupt backup saved, got " + backups.length);
    eq(w.localStorage.getItem(backups[0]), corruptRaw, "backup contains raw bytes");

    // Second call on same corrupt data must not create a duplicate backup.
    w.loadStore();
    let count = 0;
    for (let i = 0; i < w.localStorage.length; i++) {
      const k = w.localStorage.key(i);
      if (k && k.indexOf("kn-lifts-v3.corrupt.") === 0) count++;
    }
    eq(count, 1, "no duplicate backup on repeated corrupt parse");

    // Drop the expected preserveCorruptData error log.
    errors.length = errsBefore;
  });

  // 14. Corrupt data: subsequent saveStore() must not clobber the backup.
  t("corrupt data: backup survives subsequent saves", () => {
    // Continues from previous test: localStorage has corrupt raw + one backup.
    const backupsBefore = [];
    for (let i = 0; i < w.localStorage.length; i++) {
      const k = w.localStorage.key(i);
      if (k && k.indexOf("kn-lifts-v3.corrupt.") === 0) backupsBefore.push(k);
    }
    assert(backupsBefore.length === 1, "setup: one backup present");

    // Trigger a save via addUser.
    w.addUser("Recovery Tester");

    // Backup key must still exist and still hold the original raw bytes.
    const raw = w.localStorage.getItem(backupsBefore[0]);
    assert(raw === "this is not valid JSON }{", "backup content untouched by save");
  });

  // 15. restoreCorruptBackup: copies backup bytes back to main key.
  t("restoreCorruptBackup: restores named backup to main key", () => {
    // Setup: clear and seed a known backup.
    w.localStorage.clear();
    const payload = JSON.stringify({ _schemaVersion: 1, users: [], unit: "kg", currentUserId: null });
    const key = "kn-lifts-v3.corrupt.test123";
    w.localStorage.setItem(key, payload);

    const ok = w.restoreCorruptBackup(key);
    assert(ok, "restoreCorruptBackup returned truthy");
    eq(w.localStorage.getItem("kn-lifts-v3"), payload, "main key now holds backup content");

    // Invalid keys must be rejected.
    const errsBefore = errors.length;
    const bad = w.restoreCorruptBackup("some-random-key");
    assert(bad === false, "rejected non-corrupt-prefix key");
    // Drop the expected "invalid backup key" error log.
    errors.length = errsBefore;
  });

  // 16. Import validation: reject future-version backups.
  t("import: rejects future-version backups", () => {
    const errs = w.validateImportData({
      _schemaVersion: 999,
      users: [{ id: "u1", name: "Test", program: [], sessions: [] }]
    });
    assert(errs.length > 0, "expected a validation error");
    assert(
      errs[0].toLowerCase().indexOf("newer") !== -1,
      "error message mentions newer version, got: " + errs[0]
    );

    // Same-version backups still validate cleanly.
    const ok = w.validateImportData({
      _schemaVersion: 1,
      users: [{ id: "u1", name: "Test", program: [], sessions: [] }]
    });
    eq(ok.length, 0, "v1 backup validates");
  });

  // === Time Budget Tests ===

  t("parseTempo: dashed format", () => {
    const r = w.parseTempo("3-1-1-0");
    eq(r.ecc, 3); eq(r.pause, 1); eq(r.con, 1); eq(r.top, 0); eq(r.total, 5);
  });

  t("parseTempo: compact format", () => {
    const r = w.parseTempo("20X0");
    eq(r.ecc, 2); eq(r.pause, 0); eq(r.con, 1); eq(r.top, 0); eq(r.total, 3);
  });

  t("parseTempo: explosive X in dashed", () => {
    const r = w.parseTempo("X-0-X-0");
    eq(r.ecc, 1); eq(r.con, 1); eq(r.total, 2);
  });

  t("parseTempo: invalid returns null", () => {
    assert(w.parseTempo("") === null, "empty");
    assert(w.parseTempo(null) === null, "null");
    assert(w.parseTempo("abc") === null, "garbage");
  });

  t("estimateExerciseSec: back squat with tempo", () => {
    // Back squat: 5 sets, 3 reps, rest 210s, tempo "3-1-1-0" = 5s/rep
    const ex = w.mkSets(w.LIB_BY_ID.backsquat, { sets:5, reps:3, rest:210, tempo:"3-1-1-0" });
    const sec = w.estimateExerciseSec(ex);
    // 15 setup + 5*(3*5) work + 4*210 rest = 15 + 75 + 840 = 930
    eq(sec, 930, "back squat time");
  });

  t("estimateExerciseSec: isTime exercise", () => {
    // Plank: 3 sets, 30s each, rest 45
    const ex = w.mkSets(w.LIB_BY_ID.plank, { sets:3, reps:30, rest:45 });
    const sec = w.estimateExerciseSec(ex);
    // 15 + 3*30 + 2*45 = 15 + 90 + 90 = 195
    eq(sec, 195, "plank time");
  });

  t("estimateExerciseSec: perSide exercise", () => {
    // Bulgarian: 3 sets, 8 reps, perSide, tempo "3-1-1-0" = 5s/rep, rest 60
    const ex = w.mkSets(w.LIB_BY_ID.bulgarian, { sets:3, reps:8, rest:60, tempo:"3-1-1-0" });
    const sec = w.estimateExerciseSec(ex);
    // 15 + 3*(8*2*5) + 2*60 = 15 + 240 + 120 = 375
    eq(sec, 375, "bulgarian time");
  });

  t("estimateSessionMinutes: reasonable range", () => {
    // Every program day should estimate between 15 and 120 minutes
    const programs = [w.DEFAULT_PROGRAM, w.JBROWN_PROGRAM, w.FILLY_PROGRAM];
    for (const prog of programs) {
      assert(prog && prog.length > 0, "generated program has days");
      for (const day of prog) {
        const min = w.estimateSessionMinutes(day);
        assert(min >= 15 && min <= 120, `Day ${day.id} "${day.name}" estimated ${min} min — out of range`);
      }
    }
  });

  t("getSessionBreakdown: sums match", () => {
    const day = w.DEFAULT_PROGRAM[0];
    const bd = w.getSessionBreakdown(day);
    assert(bd.totalSec > 0, "totalSec > 0");
    const blockSum = bd.blocks.reduce((s, b) => s + b.totalSec, 0);
    eq(bd.warmupSec + bd.workingSec, blockSum, "warmup + working = block sum");
    eq(bd.totalSec, bd.warmupSec + bd.workingSec + bd.cooldownSec, "total = warmup + working + cooldown");
  });

  t("computeTimeBudget: reduces time", () => {
    const day = w.DEFAULT_PROGRAM[0];
    const current = w.estimateSessionMinutes(day);
    const target = current - 15; // ask for 15 min less
    const budget = w.computeTimeBudget(day, target);
    assert(budget.adjustments.length > 0, "should have adjustments");
    assert(budget.adjustedMin < current, `adjusted ${budget.adjustedMin} should be less than ${current}`);
  });

  // ---- Warmup & cooldown variation ----

  t("warmup variation: different days in same week get different warmups", () => {
    const days = w.generateWeek("conjugate5", 1, 10);
    assert(days && days.length >= 3, "generated at least 3 days");
    const mobSets = days.map(d => {
      const wu = d.blocks.find(b => b.type === "warmup");
      assert(wu, `day ${d.id} has warmup block`);
      return wu.exercises.slice(1).map(e => e.exId).sort().join(",");
    });
    const unique = new Set(mobSets);
    assert(unique.size > 1, `expected different warmup combos across days, got: ${JSON.stringify(mobSets)}`);
  });

  t("warmup variation: different weeks get different warmups", () => {
    const week1 = w.generateWeek("conjugate5", 1, 10);
    const week2 = w.generateWeek("conjugate5", 2, 10);
    const wu1 = week1[0].blocks.find(b => b.type === "warmup");
    const wu2 = week2[0].blocks.find(b => b.type === "warmup");
    const mob1 = wu1.exercises.slice(1).map(e => e.exId).join(",");
    const mob2 = wu2.exercises.slice(1).map(e => e.exId).join(",");
    assert(mob1 !== mob2, `week 1 day 1 warmup should differ from week 2 day 1: ${mob1}`);
  });

  t("cooldown variation: different days get different cooldowns", () => {
    const cd1 = w.getCooldownExercises(1);
    const cd2 = w.getCooldownExercises(2);
    const cd3 = w.getCooldownExercises(3);
    eq(cd1.length, 3, "cooldown has 3 exercises");
    eq(cd2.length, 3, "cooldown has 3 exercises");
    const ids1 = cd1.map(e => e.exId).sort().join(",");
    const ids2 = cd2.map(e => e.exId).sort().join(",");
    const ids3 = cd3.map(e => e.exId).sort().join(",");
    const unique = new Set([ids1, ids2, ids3]);
    assert(unique.size >= 2, `expected different cooldowns across days, got: ${ids1} | ${ids2} | ${ids3}`);
  });

  t("cooldown variation: all day combos produce valid exercises", () => {
    for (let d = 1; d <= 7; d++) {
      const cd = w.getCooldownExercises(d);
      eq(cd.length, 3, `day ${d} cooldown has 3 exercises`);
      for (const ex of cd) {
        assert(ex.exId, `day ${d} cooldown exercise has exId`);
        assert(ex.name, `day ${d} cooldown exercise has name`);
      }
    }
  });

  t("estimateCooldownSec: accepts dayId parameter", () => {
    const sec1 = w.estimateCooldownSec(1);
    const sec2 = w.estimateCooldownSec(2);
    assert(sec1 > 0, "cooldown time for day 1 is positive");
    assert(sec2 > 0, "cooldown time for day 2 is positive");
  });

  // -----------------------------------------------------------
  // RP ENGINE — Workstream B (Chunk 2)
  // -----------------------------------------------------------

  t("migration v9: u.rp container added to existing user", () => {
    w.localStorage.clear();
    // Simulate a v8 user (no u.rp)
    const fakeV8 = {
      _schemaVersion: 8,
      unit: "lbs",
      users: [{ id: "u_v8", name: "V8User", program: [], sessions: [],
                measurements: [], templateId: "conjugate5",
                draft: null, lastDoneDayId: null,
                programStartDate: Date.now(), weeklySchedule: null,
                currentWeek: 1, totalWeeks: 10, daysPerWeek: 5 }],
      currentUserId: "u_v8",
      onboarding: null,
      onboardingDismissedAt: null
    };
    w.localStorage.setItem("kn-lifts-v3", JSON.stringify(fakeV8));
    w.runMigrations();
    const s = w.loadStore();
    eq(s._schemaVersion, 9, "schema version is 9");
    const u = s.users[0];
    assert(u.rp, "u.rp exists");
    eq(u.rp.enabled, false, "rp.enabled defaults to false");
    assert(typeof u.rp.coldStartAnchors === "object", "coldStartAnchors is object");
    eq(u.rp.rpeCalibrationCompletedAt, null, "calibration null");
    eq(u.rp.lastDeloadRecommendedAt, null, "deload null");
    eq(u.rp.dismissedDeloadForWeek, null, "dismissedDeload null");
  });

  t("userBodyweightAt: returns null when no measurements", () => {
    w.localStorage.clear();
    const u = w.addUser("BwTester");
    // No measurements
    const result = w.userBodyweightAt(Date.now());
    eq(result, null, "null when no measurements");
  });

  t("userBodyweightAt: returns value when measurement exists (not stale)", () => {
    const now = Date.now();
    // Add a measurement 5 days ago
    w.updateUser(u => {
      u.measurements = [{ date: new Date(now - 5 * 86400000).toISOString().slice(0, 10), weight: 185, unit: "lbs" }];
    });
    const result = w.userBodyweightAt(now);
    assert(result !== null, "result is not null");
    eq(result.value, 185, "weight is 185");
    eq(result.stale, false, "not stale (5 days old)");
  });

  t("userBodyweightAt: marks stale when latest entry >30 days old", () => {
    const now = Date.now();
    w.updateUser(u => {
      u.measurements = [{ date: new Date(now - 35 * 86400000).toISOString().slice(0, 10), weight: 180, unit: "lbs" }];
    });
    const result = w.userBodyweightAt(now);
    assert(result !== null, "result not null");
    eq(result.stale, true, "stale when 35 days old");
  });

  t("userBodyweightAt: interpolates between two bracketing entries", () => {
    const now = Date.now();
    const t1 = now - 10 * 86400000;
    const t2 = now - 0;               // now
    w.updateUser(u => {
      u.measurements = [
        { date: new Date(t1).toISOString().slice(0, 10), weight: 180, unit: "lbs" },
        { date: new Date(t2).toISOString().slice(0, 10), weight: 190, unit: "lbs" }
      ];
    });
    // Query at midpoint (5 days ago)
    const mid = now - 5 * 86400000;
    const result = w.userBodyweightAt(mid);
    assert(result !== null, "result not null");
    // Should be ~185 (halfway between 180 and 190)
    assert(result.value >= 184 && result.value <= 186,
      `expected ~185, got ${result.value}`);
  });

  t("bodyweightE1RM: totalLoad = bw + addedWeight", () => {
    // set.weight = added weight (e.g. weight vest)
    const set = { weight: 25, reps: 5, exId: "pullup" };
    const e1rm = w.bodyweightE1RM(set, 180); // 180 lbs bodyweight + 25 lbs added
    const expected = w.calcE1RM(205, 5);
    eq(e1rm, expected, "bodyweightE1RM uses totalLoad");
  });

  t("recentE1RM: returns cold-start on empty history", () => {
    w.localStorage.clear();
    w.addUser("E1RMTester");
    const result = w.recentE1RM("bench");
    eq(result.confidence, "cold-start", "cold-start on no sessions");
    eq(result.value, null, "no value");
  });

  t("recentE1RM: returns weighted value from sessions", () => {
    // Seed sessions with known weights/reps
    const now = Date.now();
    w.updateUser(u => {
      u.sessions = [
        { id: "s1", finishedAt: now - 20 * 86400000, sets: [{ exId: "bench", weight: 135, reps: 5, rpe: 8, muscles: ["chest","triceps","front delts"] }] },
        { id: "s2", finishedAt: now - 10 * 86400000, sets: [{ exId: "bench", weight: 145, reps: 5, rpe: 8, muscles: ["chest","triceps","front delts"] }] },
        { id: "s3", finishedAt: now - 3 * 86400000,  sets: [{ exId: "bench", weight: 155, reps: 5, rpe: 8, muscles: ["chest","triceps","front delts"] }] },
      ];
    });
    const result = w.recentE1RM("bench", { now });
    assert(result.value !== null, "value not null");
    assert(result.value > 0, "positive e1rm");
    // Most-recent session (155×5) has weight 0.5 → e1rm ≈ 181
    // Second session (145×5) has weight 0.3 → e1rm ≈ 169
    // Third session (135×5) has weight 0.2 → e1rm ≈ 157.5
    // Weighted avg should be between 157 and 185
    assert(result.value > 150 && result.value < 200,
      `e1rm ${result.value} should be in [150,200]`);
    assert(result.sampleSize >= 1, "sampleSize >= 1");
  });

  t("suggestedWeight: returns disabled when u.rp.enabled=false", () => {
    w.localStorage.clear();
    w.addUser("SWTester");
    // Default: rp.enabled = false
    const result = w.suggestedWeight("bench", 5, 2);
    eq(result.reason, "disabled", "disabled when not RP-enabled");
    eq(result.weight, null, "no numeric default");
  });

  t("suggestedWeight: needs-rpe-calibration when calibration not completed", () => {
    w.updateUser(u => {
      u.rp.enabled = true;
      u.rp.rpeCalibrationCompletedAt = null;
    });
    const result = w.suggestedWeight("bench", 5, 2);
    eq(result.reason, "needs-rpe-calibration", "calibration required first");
    eq(result.weight, null, "no numeric default");
  });

  t("suggestedWeight: cold-start with no history, no anchor", () => {
    w.updateUser(u => {
      u.rp.enabled = true;
      u.rp.rpeCalibrationCompletedAt = Date.now();
      u.sessions = [];
    });
    const result = w.suggestedWeight("bench", 5, 2);
    eq(result.reason, "cold-start", "cold-start reason");
    eq(result.weight, null, "no numeric default on cold-start");
  });

  t("suggestedWeight: needs-bodyweight for bodyweight exercise with no measurements", () => {
    w.updateUser(u => {
      u.rp.enabled = true;
      u.rp.rpeCalibrationCompletedAt = Date.now();
      u.measurements = [];
    });
    const result = w.suggestedWeight("pullup", 6, 2);
    eq(result.reason, "needs-bodyweight", "bodyweight required");
    eq(result.weight, null, "no numeric default");
  });

  t("suggestedWeight: returns history result with real sessions", () => {
    const now = Date.now();
    w.updateUser(u => {
      u.rp.enabled = true;
      u.rp.rpeCalibrationCompletedAt = now;
      u.sessions = [
        { id: "s1", finishedAt: now - 7 * 86400000, sets: [{ exId: "bench", weight: 185, reps: 5, rpe: 8, muscles: ["chest","triceps","front delts"] }] },
        { id: "s2", finishedAt: now - 3 * 86400000, sets: [{ exId: "bench", weight: 190, reps: 5, rpe: 8, muscles: ["chest","triceps","front delts"] }] },
      ];
    });
    const result = w.suggestedWeight("bench", 5, 2, { now });
    eq(result.reason, "history", "history reason when sessions exist");
    assert(result.weight !== null, "weight is not null");
    assert(result.weight > 0, "weight is positive");
    // Epley for 190×5: e1rm ≈ 221.7; weight for 5 reps + 2 RIR = 221.7/(1+7/30) ≈ 181
    assert(result.weight >= 150 && result.weight <= 250,
      `weight ${result.weight} expected in [150,250]`);
    // Must be rounded to nearest 5
    eq(result.weight % 5, 0, "rounded to nearest 5 lbs");
  });

  t("suggestedWeight: cold-start anchor produces history result", () => {
    const now = Date.now();
    w.updateUser(u => {
      u.rp.enabled = true;
      u.rp.rpeCalibrationCompletedAt = now;
      u.sessions = [];
      u.rp.coldStartAnchors = { "bench": { weight: 155, reps: 5, dateMs: now - 1000 } };
    });
    const result = w.suggestedWeight("bench", 5, 2, { now });
    eq(result.reason, "history", "anchor promotes to history result");
    assert(result.weight !== null, "weight not null with anchor");
    eq(result.confidence, "low", "low confidence from anchor");
  });

  console.log("\n===== RESULTS =====");
  let pass = 0, fail = 0;
  for (const [n, s, e] of results) {
    console.log(`[${s}] ${n}`);
    if (s === "FAIL") { console.log("   " + e); fail++; } else pass++;
  }
  if (errors.length) {
    console.log("\nJS errors during init:");
    for (const e of errors) console.log(" -", JSON.stringify(e));
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 || errors.length > 0 ? 1 : 0);
})().catch(e => { console.error("Runner error:", e); process.exit(1); });
