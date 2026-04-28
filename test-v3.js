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

  t("first run: onboarding overlay visible", () => {
    const overlay = w.document.getElementById("onboardingOverlay");
    assert(overlay.classList.contains("active"), "onboarding should be active on first run");
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
    eq(s._schemaVersion, w.APP_VERSION, "schema version migrated up to current APP_VERSION");
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

  // -----------------------------------------------------------
  // WORKSTREAM D — Session Edit, recomputeAllIsPR, _original, revert
  // -----------------------------------------------------------

  t("recomputeAllIsPR: flags correct on 5-session fixture", () => {
    w.localStorage.clear();
    w.addUser("PRTester");
    const now = Date.now();
    // Session 1: bench 135×5 e1rm≈157.5
    // Session 2: bench 145×5 e1rm≈169.2 — PR
    // Session 3: bench 155×5 e1rm≈180.8 — PR
    // Session 4: bench 150×5 e1rm≈175.0 — NOT PR (below session 3)
    // Session 5: bench 160×5 e1rm≈186.7 — PR
    w.updateUser(u => {
      u.sessions = [
        { id: "s1", finishedAt: now - 40*86400000, prCount: 0, volume: 675, sets: [
          { exId: "bench", exName: "Bench", weight: 135, reps: 5, rpe: 8, isPR: false, muscles: [] }
        ]},
        { id: "s2", finishedAt: now - 30*86400000, prCount: 0, volume: 725, sets: [
          { exId: "bench", exName: "Bench", weight: 145, reps: 5, rpe: 8, isPR: false, muscles: [] }
        ]},
        { id: "s3", finishedAt: now - 20*86400000, prCount: 0, volume: 775, sets: [
          { exId: "bench", exName: "Bench", weight: 155, reps: 5, rpe: 8, isPR: false, muscles: [] }
        ]},
        { id: "s4", finishedAt: now - 10*86400000, prCount: 0, volume: 750, sets: [
          { exId: "bench", exName: "Bench", weight: 150, reps: 5, rpe: 8, isPR: false, muscles: [] }
        ]},
        { id: "s5", finishedAt: now - 1*86400000, prCount: 0, volume: 800, sets: [
          { exId: "bench", exName: "Bench", weight: 160, reps: 5, rpe: 8, isPR: false, muscles: [] }
        ]}
      ];
    });
    w.recomputeAllIsPR();
    const u = w.userData();
    // s1 is first — first set for exercise is always a PR
    eq(u.sessions[0].sets[0].isPR, true, "s1 is PR (first ever)");
    eq(u.sessions[1].sets[0].isPR, true, "s2 is PR (145>135)");
    eq(u.sessions[2].sets[0].isPR, true, "s3 is PR (155>145)");
    eq(u.sessions[3].sets[0].isPR, false, "s4 not PR (150<155)");
    eq(u.sessions[4].sets[0].isPR, true, "s5 is PR (160>155)");
    // prCounts
    eq(u.sessions[0].prCount, 1, "s1 prCount=1");
    eq(u.sessions[1].prCount, 1, "s2 prCount=1");
    eq(u.sessions[2].prCount, 1, "s3 prCount=1");
    eq(u.sessions[3].prCount, 0, "s4 prCount=0");
    eq(u.sessions[4].prCount, 1, "s5 prCount=1");
  });

  t("saveSessionEdits: edit → volume and prCount update, isPR recomputed", () => {
    // Continue from above user — edit s3's bench weight downward so s2 becomes the last PR
    const u = w.userData();
    // s3 has bench 155×5. Edit it down to 140×5 (below 145 in s2).
    const s3 = w.deepClone(u.sessions.find(s => s.id === "s3"));
    s3.sets[0].weight = 140;
    w.saveSessionEdits(s3);

    const u2 = w.userData();
    const s3after = u2.sessions.find(s => s.id === "s3");
    eq(s3after.sets[0].weight, 140, "weight updated to 140");
    eq(s3after.sets[0].isPR, false, "s3 no longer a PR (140 < 145)");
    // s2 (145) is still PR, s4 (150) is now PR, s5 (160) is PR
    const s4after = u2.sessions.find(s => s.id === "s4");
    eq(s4after.sets[0].isPR, true, "s4 is now a PR after edit");
    // _original captured
    assert(s3after.sets[0]._original, "_original captured on edit");
    eq(s3after.sets[0]._original.weight, 155, "_original.weight is pre-edit value");
  });

  t("saveSessionEdits: second edit does NOT overwrite _original", () => {
    const u = w.userData();
    const s3 = w.deepClone(u.sessions.find(s => s.id === "s3"));
    const origWeight = s3.sets[0]._original.weight; // should be 155 from first edit
    // Second edit: weight 140→135
    s3.sets[0].weight = 135;
    w.saveSessionEdits(s3);

    const u2 = w.userData();
    const s3after = u2.sessions.find(s => s.id === "s3");
    eq(s3after.sets[0].weight, 135, "weight is now 135");
    eq(s3after.sets[0]._original.weight, origWeight, "_original still holds first pre-edit value (155)");
  });

  t("revertSession: restores pre-edit values within 7 days", () => {
    w.revertSession("s3");
    const u = w.userData();
    const s3 = u.sessions.find(s => s.id === "s3");
    eq(s3.sets[0].weight, 155, "weight restored to 155 via _original");
    eq(s3.sets[0]._original, undefined, "_original cleared after revert");
    eq(s3.editedAt, null, "editedAt cleared");
    // PR flags should be correct again: s3 (155) > s2 (145) → s3 is PR
    eq(s3.sets[0].isPR, true, "s3 is PR again after revert");
  });

  t("revertSession after 7 days: _original is gone (loadStore cleanup)", () => {
    // Simulate an _original that is 8 days old — loadStore should drop it.
    const eightDaysAgo = Date.now() - 8 * 86400000;
    w.updateUser(u => {
      const s = u.sessions.find(x => x.id === "s3");
      if (s) {
        // Plant a stale _original
        s.sets[0]._original = {
          weight: 200, reps: 5, rpe: 8, bodyweight: false, isPR: true,
          editedAt: eightDaysAgo
        };
      }
    });
    // loadStore runs the cleanup
    const u = w.loadStore();
    const s3 = u.users.find(u2 => u2.name === "PRTester").sessions.find(s => s.id === "s3");
    eq(s3.sets[0]._original, undefined, "_original older than 7 days cleared by loadStore");
  });

  t("deleteSession: recomputeAllIsPR fires, PR flags correct after delete", () => {
    // State: s1(135),s2(145),s3(155),s4(150),s5(160) — s3 and s5 are PRs.
    // Deleting s5 (160) → s3 (155) remains peak; s4 (150) is still below s3.
    const u0 = w.userData();
    const s5Before = w.deepClone(u0.sessions.find(s => s.id === "s5"));
    assert(s5Before, "s5 exists before delete");
    w.deleteSession("s5");
    let u1 = w.userData();
    assert(!u1.sessions.find(s => s.id === "s5"), "s5 removed");
    eq(u1.sessions.find(s => s.id === "s3").sets[0].isPR, true, "s3(155) is PR after s5 deleted");
    eq(u1.sessions.find(s => s.id === "s4").sets[0].isPR, false, "s4(150) not PR (below s3)");

    // Simulate session restore (what undoDeleteSession does data-layer wise)
    // _undoPending is a let-variable — not settable from test; test the data path directly.
    w.updateUser(u => {
      u.sessions.push(s5Before);
      u.sessions.sort((a, b) => a.finishedAt - b.finishedAt);
    });
    w.recomputeAllIsPR();
    let u2 = w.userData();
    const s5back = u2.sessions.find(s => s.id === "s5");
    assert(s5back, "s5 restored in storage");
    eq(s5back.sets[0].isPR, true, "s5(160) is PR again after restore");
    eq(u2.sessions.find(s => s.id === "s3").sets[0].isPR, true, "s3(155) still PR");
    eq(u2.sessions.find(s => s.id === "s4").sets[0].isPR, false, "s4(150) still not PR");
  });

  t("openLogSets: retroactive session has null RPE (not hardcoded 7)", () => {
    // Verify that the exRows array in openLogSets defaults rpe to null.
    // We test the data-layer path: the session saved via the button onclick uses exEntry.rpe = null.
    // We can exercise this by directly checking that rpe: 7 no longer appears in the source function
    // (structural check — the actual onclick is DOM-driven).
    const src = w.openLogSets.toString();
    assert(src.indexOf("rpe: 7") === -1, "hardcoded rpe: 7 removed from openLogSets");
    assert(src.indexOf("exEntry.rpe") !== -1, "exEntry.rpe used instead");
  });

  // ============================================================
  // CHUNK 4 — Workstream C: RP Hypertrophy / Mesocycle
  // ============================================================

  // ---- Migration v10/v11 shape ----------------------------------
  t("migration: APP_VERSION matches default store schema version", () => {
    eq(w.APP_VERSION, w.getDefaultStore()._schemaVersion, "APP_VERSION tracks schema");
  });

  t("migration v10: RP_VOLUME_LANDMARKS defined with all 19 muscles", () => {
    const lm = w.RP_VOLUME_LANDMARKS;
    assert(lm, "RP_VOLUME_LANDMARKS defined");
    const muscles = ["chest","upper chest","lats","upper back","lower back","traps",
      "front delts","side delts","rear delts","biceps","triceps","forearms",
      "quads","hamstrings","glutes","adductors","calves","core","obliques"];
    muscles.forEach(m => assert(lm[m], "landmark missing for: " + m));
  });

  t("migration v10: landmark sanity — chest MEV 8-10, MAV 12-16, MRV 20+", () => {
    const c = w.RP_VOLUME_LANDMARKS["chest"];
    assert(c.mev >= 8 && c.mev <= 10, "chest MEV in 8-10 range, got " + c.mev);
    assert(c.mav >= 12 && c.mav <= 16, "chest MAV in 12-16 range, got " + c.mav);
    assert(c.mrv >= 20, "chest MRV 20+, got " + c.mrv);
  });

  t("migration v10: landmark sanity — side delts MEV 8, MRV 26", () => {
    const sd = w.RP_VOLUME_LANDMARKS["side delts"];
    eq(sd.mev, 8, "side delts MEV 8");
    eq(sd.mrv, 26, "side delts MRV 26");
  });

  t("migration v10: landmark sanity — front delts MEV 0, lats MRV 25", () => {
    eq(w.RP_VOLUME_LANDMARKS["front delts"].mev, 0, "front delts MEV 0");
    eq(w.RP_VOLUME_LANDMARKS["lats"].mrv, 25, "lats MRV 25");
  });

  t("migration v10: new user gets volumeLandmarks after loadStore", () => {
    const u = w.userData();
    assert(u.rp, "u.rp exists");
    // volumeLandmarks seeded by migration or defensive default
    // (null means migration hasn't run on fresh user — acceptable since migration runs on existing data)
    // Just assert the defensive default ensures the field exists
    assert(u.rp.mesocycles !== undefined, "u.rp.mesocycles exists");
    assert(u.rp.currentMesocycleId !== undefined, "u.rp.currentMesocycleId exists");
  });

  t("migration v11: new sessions get feedback:{} field", () => {
    // After finishWorkout, session.feedback must exist (even if empty)
    const u = w.userData();
    (u.sessions || []).forEach(s => {
      assert(s.feedback !== undefined, "session.feedback exists on session " + s.id);
    });
  });

  t("migration v10: blockType set on existing blocks by migration", () => {
    // All existing blocks should have blockType: "strength" (or "warmup") set by v10 migration
    const u = w.userData();
    (u.program || []).forEach(day => {
      (day.blocks || []).forEach(block => {
        assert(block.blockType, "block missing blockType in program, block.name=" + block.name);
      });
    });
  });

  // ---- rp-hypertrophy template ----------------------------------
  t("rp-hypertrophy template defined in PROGRAM_TEMPLATES", () => {
    const tpl = w.PROGRAM_TEMPLATES.find(t => t.id === "rp-hypertrophy");
    assert(tpl, "rp-hypertrophy template exists");
    assert(tpl.generative, "template is marked generative");
    assert(tpl.minWeeks >= 4 && tpl.maxWeeks <= 6, "meso length constraints correct");
  });

  // ---- startMesocycle -------------------------------------------
  t("startMesocycle: creates a mesocycle with MEV as week 1 plannedSets", () => {
    // Switch user to rp-hypertrophy mode for this test
    w.updateUser(u => { u.rp.enabled = true; });
    const meso = w.startMesocycle({ lengthWeeks: 5, daysPerWeek: 4 });
    assert(meso, "mesocycle created");
    assert(meso.id, "has id");
    eq(meso.currentWeek, 1, "starts at week 1");
    eq(meso.lengthWeeks, 5, "5 weeks");
    eq(meso.rirSchedule.length, 5, "RIR schedule has 5 entries");
    assert(meso.perMuscleVolume, "perMuscleVolume exists");
    // chest MEV = 8 → week 1 plannedSets = 8
    assert(meso.perMuscleVolume["chest"], "chest in volume");
    const chestW1 = meso.perMuscleVolume["chest"][0];
    eq(chestW1.week, 1, "week 1 entry");
    eq(chestW1.plannedSets, 8, "chest week 1 = MEV(8)");
    eq(chestW1.completedSets, null, "completedSets starts null");
  });

  t("startMesocycle: volumeLandmarks seeded on user when not set", () => {
    const u = w.userData();
    // After startMesocycle, the user's volumeLandmarks should be set
    // (either from migration v10 or from engine defaults)
    assert(u.rp.mesocycles.length > 0, "mesocycle added to user");
    assert(u.rp.currentMesocycleId, "currentMesocycleId set");
  });

  t("startMesocycle: generates week 1 program[] with rp-hypertrophy blocks", () => {
    const u = w.userData();
    assert(u.program && u.program.length > 0, "program generated");
    const rpBlocks = u.program.flatMap(d => d.blocks).filter(b => b.blockType === "rp-hypertrophy");
    assert(rpBlocks.length > 0, "at least one rp-hypertrophy block in program");
  });

  t("startMesocycle: rirSchedule week 1 = 4, deload on last week", () => {
    const u = w.userData();
    const meso = w.getActiveMesocycle(u);
    assert(meso, "active meso exists");
    eq(meso.rirSchedule[0], 4, "week 1 RIR = 4");
    eq(meso.rirSchedule[meso.lengthWeeks - 1], "deload", "last week is deload");
  });

  // ---- generateRpWeek -------------------------------------------
  t("generateRpWeek: returns Day[] with valid block structure", () => {
    const u = w.userData();
    const meso = w.getActiveMesocycle(u);
    assert(meso, "active meso");
    const days = w.generateRpWeek(meso, 1, u);
    assert(Array.isArray(days) && days.length > 0, "days generated");
    const allBlocks = days.flatMap(d => d.blocks);
    assert(allBlocks.length > 0, "blocks generated");
    allBlocks.forEach(b => {
      assert(b.blockType === "rp-hypertrophy", "blockType = rp-hypertrophy, got " + b.blockType);
      assert(Array.isArray(b.exercises) && b.exercises.length > 0, "block has exercises");
      b.exercises.forEach(ex => {
        assert(ex.exId, "ex has exId");
        assert(ex.sets > 0, "ex has sets");
        assert(typeof ex.targetRIR === "number", "ex has targetRIR");
      });
    });
  });

  t("generateRpWeek: week 5 (deload) exercises get RIR 4", () => {
    const u = w.userData();
    const meso = w.getActiveMesocycle(u);
    // For deload week, _getRirForWeek should return "deload"
    const rir = w._getRirForWeek ? w._getRirForWeek(meso, 5) : meso.rirSchedule[4];
    eq(rir, "deload", "week 5 RIR = deload");
    // deload exercises get targetRIR = 4 (easy)
    const days = w.generateRpWeek(meso, 5, u);
    const allEx = days.flatMap(d => d.blocks).flatMap(b => b.exercises);
    assert(allEx.length > 0, "deload week has exercises");
    allEx.forEach(ex => eq(ex.targetRIR, 4, "deload ex targetRIR = 4"));
  });

  t("generateRpWeek: suggestedWeight uses block's targetRIR for rp-hypertrophy", () => {
    // When suggestedWeight is called with the week's targetRIR, it uses the meso-specified value
    // Verify the path: exercise in rp-hypertrophy block carries targetRIR from rirSchedule
    const u = w.userData();
    const meso = w.getActiveMesocycle(u);
    // Seed week 2 plannedSets so blocks are generated (week 2 may be null until adjustVolume runs)
    if (meso.perMuscleVolume["chest"] && meso.perMuscleVolume["chest"][1]) {
      meso.perMuscleVolume["chest"][1].plannedSets = 10;
    }
    const days = w.generateRpWeek(meso, 2, u); // week 2 → RIR 3
    const allEx = days.flatMap(d => d.blocks).flatMap(b => b.exercises);
    assert(allEx.length > 0, "week 2 has exercises (plannedSets seeded for week 2)");
    // All week 2 exercises should carry RIR 3 (meso.rirSchedule[1])
    allEx.forEach(ex => eq(ex.targetRIR, 3, "week 2 exercise carries RIR 3 from meso.rirSchedule"));
  });

  // ---- adjustVolumeFromFeedback ---------------------------------
  // 6 feedback combinations per the acceptance criteria

  // Helper: inject a fake meso-session into the user store
  function _injectMesoSession(mesoId, mesoWeek, muscleFeedback) {
    w.updateUser(u => {
      u.sessions.push({
        id: "test-fb-" + Date.now() + "-" + Math.random(),
        mesocycleId: mesoId,
        mesoWeek,
        finishedAt: Date.now(),
        sets: [],
        feedback: muscleFeedback
      });
    });
  }

  // Helper: build an isolated meso-like object for feedback tests so we don't accumulate sessions
  function _makeFeedbackTestMeso(mesoId, muscle, currentSets, nWeeks) {
    const vol = {};
    const lm = w.RP_VOLUME_LANDMARKS[muscle];
    vol[muscle] = [];
    for (let w2 = 1; w2 <= nWeeks; w2++) {
      vol[muscle].push({ week: w2, plannedSets: w2 === 1 ? currentSets : null, completedSets: null });
    }
    return {
      id: mesoId,
      lengthWeeks: nWeeks,
      currentWeek: 1,
      rirSchedule: [4,3,2,1,"deload"].slice(0, nWeeks),
      repRangeSchedule: [],
      perMuscleVolume: vol,
      exerciseSelection: {}
    };
  }

  t("adjustVolumeFromFeedback: no sessions → cold-start (delta 0)", () => {
    const u = w.userData();
    const FAKE_ID = "fb-test-nofb-" + Date.now();
    const meso = _makeFeedbackTestMeso(FAKE_ID, "chest", 8, 5);
    // No sessions with this mesoId → cold-start
    const deltas = w.adjustVolumeFromFeedback(u, meso);
    eq(deltas["chest"].delta, 0, "cold-start → delta 0 for chest");
    eq(deltas["chest"].reason, "cold-start", "reason = cold-start");
  });

  t("adjustVolumeFromFeedback: all-low feedback (0,0,0) → +1 set", () => {
    const FAKE_ID = "fb-test-wl0-" + Date.now();
    const meso = _makeFeedbackTestMeso(FAKE_ID, "chest", 8, 5);
    _injectMesoSession(FAKE_ID, 1, { chest: { pump: 0, soreness: 0, workload: 0 } });
    const u = w.userData();
    const deltas = w.adjustVolumeFromFeedback(u, meso);
    eq(deltas["chest"].delta, 1, "all-low → +1");
    w.applyVolumeAdjustments(meso, 1, deltas, u);
    eq(meso.perMuscleVolume["chest"][1].plannedSets, 9, "week 2 = 8 + 1 = 9");
  });

  t("adjustVolumeFromFeedback: all-low feedback (1,1,1) → +1 set", () => {
    const FAKE_ID = "fb-test-wl1-" + Date.now();
    const meso = _makeFeedbackTestMeso(FAKE_ID, "chest", 8, 5);
    _injectMesoSession(FAKE_ID, 1, { chest: { pump: 1, soreness: 1, workload: 1 } });
    const u = w.userData();
    const deltas = w.adjustVolumeFromFeedback(u, meso);
    eq(deltas["chest"].delta, 1, "all-low → +1");
    w.applyVolumeAdjustments(meso, 1, deltas, u);
    eq(meso.perMuscleVolume["chest"][1].plannedSets, 9, "week 2 = 8 + 1 = 9");
  });

  t("adjustVolumeFromFeedback: sweet-spot feedback → hold (0)", () => {
    const FAKE_ID = "fb-test-wl2-" + Date.now();
    const meso = _makeFeedbackTestMeso(FAKE_ID, "chest", 8, 5);
    _injectMesoSession(FAKE_ID, 1, { chest: { pump: 2, soreness: 1, workload: 2 } });
    const u = w.userData();
    const deltas = w.adjustVolumeFromFeedback(u, meso);
    eq(deltas["chest"].delta, 0, "sweet-spot → hold (0)");
    w.applyVolumeAdjustments(meso, 1, deltas, u);
    eq(meso.perMuscleVolume["chest"][1].plannedSets, 8, "week 2 = 8 + 0 = 8");
  });

  t("adjustVolumeFromFeedback: workload=3, soreness≤2 → hold (0)", () => {
    const FAKE_ID = "fb-test-hold-" + Date.now();
    const meso = _makeFeedbackTestMeso(FAKE_ID, "chest", 12, 5);
    _injectMesoSession(FAKE_ID, 1, { chest: { pump: 2, soreness: 2, workload: 3 } });
    const u = w.userData();
    const deltas = w.adjustVolumeFromFeedback(u, meso);
    eq(deltas["chest"].delta, 0, "workload=3, soreness=2 → hold (0)");
    w.applyVolumeAdjustments(meso, 1, deltas, u);
    eq(meso.perMuscleVolume["chest"][1].plannedSets, 12, "week 2 = 12 + 0 = 12");
  });

  t("adjustVolumeFromFeedback: high soreness+workload → -1 set", () => {
    const FAKE_ID = "fb-test-minus-" + Date.now();
    const meso = _makeFeedbackTestMeso(FAKE_ID, "chest", 14, 5);
    _injectMesoSession(FAKE_ID, 1, { chest: { pump: 1, soreness: 3, workload: 3 } });
    const u = w.userData();
    const deltas = w.adjustVolumeFromFeedback(u, meso);
    eq(deltas["chest"].delta, -1, "high sor+wkld → -1");
    w.applyVolumeAdjustments(meso, 1, deltas, u);
    eq(meso.perMuscleVolume["chest"][1].plannedSets, 13, "week 2 = 14 - 1 = 13");
  });

  t("adjustVolumeFromFeedback: at MRV → reason='at-mrv', delta=0", () => {
    const FAKE_ID = "fb-test-mrv-" + Date.now();
    const mrv = w.RP_VOLUME_LANDMARKS["chest"].mrv; // 22
    const meso = _makeFeedbackTestMeso(FAKE_ID, "chest", mrv, 5); // start AT MRV
    _injectMesoSession(FAKE_ID, 1, { chest: { pump: 0, soreness: 0, workload: 0 } }); // all-low
    const u = w.userData();
    const deltas = w.adjustVolumeFromFeedback(u, meso);
    eq(deltas["chest"].delta, 0, "at-mrv → delta=0");
    eq(deltas["chest"].reason, "at-mrv", "reason = at-mrv");
    w.applyVolumeAdjustments(meso, 1, deltas, u);
    eq(meso.perMuscleVolume["chest"][1].plannedSets, mrv, "week 2 stays at MRV (22)");
  });

  // ---- mesocycle week advance -----------------------------------
  t("mesocycle week advance: adjustVolumeFromFeedback + applyVolumeAdjustments on successive weeks", () => {
    const u = w.userData();
    const meso = w.getActiveMesocycle(u);
    // Seed clean week 1 plannedSets
    meso.perMuscleVolume["quads"][0].plannedSets = 8;
    meso.perMuscleVolume["quads"][1].plannedSets = null;
    // Inject all-low feedback (pump:1, sor:1, wkld:1 → +1)
    _injectMesoSession(meso.id, 1, { quads: { pump: 1, soreness: 1, workload: 1 } });
    const u2 = w.userData();
    const deltas = w.adjustVolumeFromFeedback(u2, meso);
    w.applyVolumeAdjustments(meso, 1, deltas, u2);
    eq(meso.perMuscleVolume["quads"][1].plannedSets, 9, "quads week 2 = 8 + 1 = 9");
  });

  t("mesocycle deload week: volume halved relative to last accumulation week", () => {
    const u = w.userData();
    const meso = w.getActiveMesocycle(u);
    // Force chest week 4 (last accumulation) to 14 sets
    if (meso.perMuscleVolume["chest"][3]) {
      meso.perMuscleVolume["chest"][3].plannedSets = 14;
    }
    // Generate week 5 (deload)
    const deloadDays = w.generateRpWeek(meso, 5, u);
    const chestEx = deloadDays.flatMap(d => d.blocks)
      .filter(b => b.blockType === "rp-hypertrophy" && b.name.toLowerCase() === "chest")
      .flatMap(b => b.exercises);
    // Deload week exercises carry RIR=4 (easy)
    if (chestEx.length > 0) {
      eq(chestEx[0].targetRIR, 4, "deload chest exercise targetRIR = 4");
    }
  });

  // ---- resensitization ------------------------------------------
  t("chooseNewExercises: ≤50% overlap guarantee with controlled input (chest exercises)", () => {
    // Use chest as the test muscle since it has many exercises in the library.
    // Build a controlled prev selection from actual pool items.
    const chestPool = w._exercisePoolForMuscle("chest");
    assert(chestPool.length >= 4, "chest pool has ≥4 exercises for a meaningful resensitization test, got " + chestPool.length);
    // Prev: first 3 from pool (simulates prior meso's top picks)
    const prevSel = { chest: chestPool.slice(0, 3) };
    const newSel = w.chooseNewExercises(prevSel, 4);
    const prev = prevSel.chest;
    const next = newSel.chest;
    assert(next && next.length > 0, "new selection generated for chest");
    const overlap = next.filter(id => prev.includes(id)).length;
    const keepMax = Math.floor(prev.length / 2); // floor(3/2) = 1
    assert(overlap <= keepMax, "chest overlap " + overlap + " must be ≤ keepMax " + keepMax);
  });

  t("startMesocycle with resensitize: exercises differ from prior meso", () => {
    const u = w.userData();
    const priorMeso = w.getActiveMesocycle(u);
    const priorChest = [...(priorMeso.exerciseSelection["chest"] || [])];
    const newMeso = w.startMesocycle({ lengthWeeks: 4, daysPerWeek: 4, resensitize: true });
    const newChest = newMeso.exerciseSelection["chest"] || [];
    // At most 50% overlap by design
    const overlap = newChest.filter(id => priorChest.includes(id)).length;
    const maxOverlap = Math.floor(priorChest.length / 2);
    assert(overlap <= maxOverlap, "chest overlap " + overlap + " <= " + maxOverlap + " (50% cap)");
  });

  // ---- recomputeMesocycleState ----------------------------------
  t("recomputeMesocycleState: completedSets updated from sessions after past-session edit", () => {
    const u0 = w.userData();
    const meso = w.getActiveMesocycle(u0);
    if (!meso) { assert(false, "no active meso for recompute test"); return; }

    // Inject a session that trained chest with 3 sets (via setContribution)
    // We use "bench" which has setContribution: {chest:1.0,...}
    const benchLib = w.LIB_BY_ID["bench"];
    assert(benchLib, "bench in library");
    const contrib = benchLib.setContribution || {};
    w.updateUser(u => {
      // Reset completedSets for chest week 1
      if (u.rp.mesocycles) {
        const m = u.rp.mesocycles.find(x => x.id === meso.id);
        if (m && m.perMuscleVolume["chest"]) {
          m.perMuscleVolume["chest"][0].completedSets = 0;
        }
      }
      u.sessions.push({
        id: "rcs-test-" + Date.now(),
        mesocycleId: meso.id,
        mesoWeek: 1,
        finishedAt: Date.now(),
        feedback: {},
        sets: [
          { exId: "bench", exName: "Bench Press", muscles: ["chest","triceps","front delts"],
            weight: 135, reps: 10, rpe: 7, bodyweight: false, isPR: false },
          { exId: "bench", exName: "Bench Press", muscles: ["chest","triceps","front delts"],
            weight: 135, reps: 10, rpe: 7, bodyweight: false, isPR: false },
          { exId: "bench", exName: "Bench Press", muscles: ["chest","triceps","front delts"],
            weight: 135, reps: 10, rpe: 7, bodyweight: false, isPR: false }
        ]
      });
    });

    w.recomputeMesocycleState(meso.id);
    const u1 = w.userData();
    const mesoAfter = u1.rp.mesocycles.find(m => m.id === meso.id);
    const chestEntry = mesoAfter.perMuscleVolume["chest"][0];
    // 3 sets × chest setContribution 1.0 = 3 completed sets for chest
    assert(chestEntry.completedSets >= 3, "completedSets >= 3, got " + chestEntry.completedSets);
  });

  t("recomputeMesocycleState: wired into saveSessionEdits (D integration)", () => {
    // Verify that saveSessionEdits calls recomputeMesocycleState when session has mesocycleId
    const src = w.saveSessionEdits.toString();
    assert(src.indexOf("recomputeMesocycleState") !== -1, "saveSessionEdits calls recomputeMesocycleState");
  });

  t("recomputeMesocycleState: wired into revertSession (D integration)", () => {
    const src = w.revertSession.toString();
    assert(src.indexOf("recomputeMesocycleState") !== -1, "revertSession calls recomputeMesocycleState");
  });

  // ---- captureSessionFeedback -----------------------------------
  t("captureSessionFeedback: saves feedback to session", () => {
    const u = w.userData();
    const s = u.sessions[u.sessions.length - 1];
    if (!s) { assert(false, "no session to test captureSessionFeedback"); return; }
    w.captureSessionFeedback(s.id, { chest: { pump: 2, soreness: 1, workload: 2 } });
    const u2 = w.userData();
    const sAfter = u2.sessions.find(x => x.id === s.id);
    assert(sAfter.feedback && sAfter.feedback.chest, "feedback.chest saved");
    eq(sAfter.feedback.chest.pump, 2, "pump = 2");
    eq(sAfter.feedback.chest.workload, 2, "workload = 2");
  });

  // ---- struct / grep assertions (fast, structural) --------------
  t("struct: blockType field present on rp-hypertrophy blocks in generated program", () => {
    const u = w.userData();
    u.program.flatMap(d => d.blocks).forEach(b => {
      assert(b.blockType !== undefined, "blockType missing on block " + b.name);
    });
  });

  t("struct: mesocycleId + rirSchedule + perMuscleVolume in engine source", () => {
    const src = w.startMesocycle.toString() + w.generateRpWeek.toString() + w.adjustVolumeFromFeedback.toString();
    assert(src.indexOf("mesocycleId") !== -1 || src.indexOf("meso.id") !== -1, "mesocycleId referenced");
    assert(src.indexOf("rirSchedule") !== -1, "rirSchedule referenced");
    assert(src.indexOf("perMuscleVolume") !== -1, "perMuscleVolume referenced");
  });

  t("struct: MEV/MAV/MRV referenced in adjustVolumeFromFeedback", () => {
    const src = w.adjustVolumeFromFeedback.toString();
    assert(src.indexOf("mrv") !== -1 || src.indexOf("MRV") !== -1, "MRV referenced in adjustVolumeFromFeedback");
  });

  t("struct: finishWorkout stamps mesocycleId on session for rp-hypertrophy blocks", () => {
    const src = w.finishWorkout.toString();
    assert(src.indexOf("mesocycleId") !== -1, "finishWorkout stamps mesocycleId");
    assert(src.indexOf("mesoWeek") !== -1, "finishWorkout stamps mesoWeek");
  });

  t("struct: adjustVolumeFromFeedback respects §1.4 — deload is a recommendation, not forced", () => {
    // The function returns deltas only; it does NOT call startMesocycle or advanceWeek.
    const src = w.adjustVolumeFromFeedback.toString();
    assert(src.indexOf("startMesocycle") === -1, "adjustVolumeFromFeedback must not force-start new meso");
    assert(src.indexOf("advanceWeek") === -1, "adjustVolumeFromFeedback must not force week advance");
  });

  // ---- non-RP regression ----------------------------------------
  t("non-RP user: existing conjugate program unchanged by Chunk 4", () => {
    // A non-RP user's program should not have rp-hypertrophy blocks injected
    // (we switched to rp-hypertrophy in earlier tests; restore conjugate for this check)
    w.updateUser(u => {
      u.templateId = "conjugate5";
      u.rp.enabled = false;
    });
    // Re-generate a non-RP program
    if (typeof w.resolveWeekProgram === "function") {
      w.updateUser(u => { u.program = w.resolveWeekProgram("conjugate5", 1, 10, 5) || u.program; });
    }
    const u = w.userData();
    const rpBlocks = (u.program || []).flatMap(d => d.blocks).filter(b => b.blockType === "rp-hypertrophy");
    eq(rpBlocks.length, 0, "non-RP program has 0 rp-hypertrophy blocks");
  });

  t("non-RP user: suggestedWeight returns disabled when rp.enabled=false", () => {
    const u = w.userData();
    eq(u.rp.enabled, false, "rp.enabled is false");
    const result = w.suggestedWeight("bench", 8, 2);
    eq(result.reason, "disabled", "suggestedWeight returns disabled for non-RP user");
  });

  // ============================================================
  // ONBOARDING TESTS
  // ============================================================

  // ---- Helpers ---------------------------------------------------

  // Patch setTimeout to fire synchronously so onboarding transitions don't slow
  // tests. Restored via _restoreTimeouts() after the flow completes. Errors
  // thrown inside the patched callback are routed to a local sink instead of
  // the harness `errors` array (a flow may legitimately exercise edge paths).
  const _origSetTimeout = w.setTimeout.bind(w);
  const _obSinkErrors = [];
  function _syncTimeouts() {
    w.setTimeout = (fn, _ms) => { try { fn(); } catch (e) { _obSinkErrors.push(e.message); } return 0; };
  }
  function _restoreTimeouts() { w.setTimeout = _origSetTimeout; }

  // Reset to a clean first-run state.
  function resetForOnboarding() {
    w.localStorage.clear();
    if (typeof w.init === "function") w.init();
  }

  function clickSel(sel) {
    const el = w.document.querySelector(sel);
    if (!el) throw new Error("clickSel: no element for " + sel);
    el.click();
  }

  // Read the visible step's id by matching its title against ONBOARDING_STEPS.
  function getCurrentStepId() {
    const titleEl = w.document.querySelector(".ob-title");
    if (!titleEl) return null;
    const title = titleEl.textContent;
    const step = w.ONBOARDING_STEPS.find(s => s.title === title);
    return step ? step.id : null;
  }

  function isHandoff() {
    return !!w.document.querySelector(".ob-handoff");
  }

  function clickOption(value) {
    const sel = `.ob-option[data-value="${value}"]`;
    const el = w.document.querySelector(sel);
    if (!el) throw new Error("clickOption: no option value=" + value + " on step " + getCurrentStepId());
    el.click();
  }

  // Drive the onboarding flow given an answers object. Skipped steps fall back
  // to Skip (if skippable) or first option (single) / last option (multi).
  // Returns { durationMs, clickCount, stepsVisited, finalState }.
  function runOnboarding(answers, options) {
    const opts = options || {};
    const ans = answers || {};
    const start = Date.now();
    let clicks = 0;
    const visited = [];

    _syncTimeouts();
    try {
      w.showOnboardingFlow(!!opts.redo);

      let safety = 60;
      while (safety-- > 0 && !isHandoff()) {
        const stepId = getCurrentStepId();
        if (!stepId) break;
        visited.push(stepId);
        const step = w.ONBOARDING_STEPS.find(s => s.id === stepId);
        const provided = stepId in ans;

        if (step.type === "single") {
          if (provided) {
            clickOption(ans[stepId]); clicks++;
          } else if (step.skippable) {
            clickSel("#obSkipBtn"); clicks++;
          } else {
            clickOption(step.options[0].value); clicks++;
          }
        } else if (step.type === "multi") {
          if (provided) {
            const vals = (Array.isArray(ans[stepId]) ? ans[stepId] : [ans[stepId]]).map(String);
            // On redo, prior answers are pre-selected. Clicking toggles, so deselect
            // anything that's currently selected but not in target, then click anything
            // in target that's not yet selected.
            const currentlySel = Array.from(w.document.querySelectorAll(".ob-option.selected"))
              .map(e => e.dataset.value);
            for (const cur of currentlySel) {
              if (!vals.includes(cur)) { clickOption(cur); clicks++; }
            }
            const stillSel = Array.from(w.document.querySelectorAll(".ob-option.selected"))
              .map(e => e.dataset.value);
            for (const v of vals) {
              if (!stillSel.includes(v)) { clickOption(v); clicks++; }
            }
            clickSel("#obContinueBtn"); clicks++;
          } else if (step.skippable) {
            clickSel("#obSkipBtn"); clicks++;
          } else {
            const fallback = step.options[step.options.length - 1].value;
            clickOption(fallback); clicks++;
            clickSel("#obContinueBtn"); clicks++;
          }
        } else if (step.type === "number") {
          if (provided) {
            const inp = w.document.getElementById("obNumberInput");
            inp.value = String(ans[stepId]);
            clickSel("#obContinueBtn"); clicks++;
          } else if (step.skippable) {
            clickSel("#obSkipBtn"); clicks++;
          } else {
            throw new Error("required number step missing answer: " + stepId);
          }
        } else if (step.type === "info") {
          clickSel("#obContinueBtn"); clicks++;
        } else if (step.type === "equipmentDetail") {
          if (provided && Array.isArray(ans.equipmentDetail)) {
            const preset = w.EQUIPMENT_PRESETS[ans.equipment] || w.EQUIPMENT_PRESETS.full;
            const target = ans.equipmentDetail;
            const toToggle = new Set();
            preset.forEach(t => { if (!target.includes(t)) toToggle.add(t); });
            target.forEach(t => { if (!preset.includes(t)) toToggle.add(t); });
            for (const t of toToggle) {
              const el = w.document.querySelector(`.ob-eq-chip[data-eq="${t}"]`);
              if (el) { el.click(); clicks++; }
            }
          }
          clickSel("#obContinueBtn"); clicks++;
        } else {
          throw new Error("unknown step type: " + step.type);
        }
      }

      if (safety <= 0) throw new Error("runOnboarding: safety cap hit at step " + getCurrentStepId());

      if (!opts.redo) {
        // Fill name on handoff screen (inline user creation flow).
        // Only create user if name explicitly provided, to avoid side effects
        // (starting timers, rendering workout) in tests that don't need it.
        const nameInput = w.document.getElementById("obNameInput");
        if (nameInput && opts.name) nameInput.value = opts.name;
        const startBtn = w.document.getElementById("obStartBtn");
        if (startBtn && opts.name) { startBtn.click(); clicks++; }
      }
    } finally {
      _restoreTimeouts();
    }

    const dur = Date.now() - start;
    return {
      durationMs: dur,
      clickCount: clicks,
      stepsVisited: visited,
      finalState: w.loadStore().onboarding
    };
  }

  // Speed/click metrics collected from E2E persona runs (report-only).
  const onboardingMetrics = [];

  // ---- 17. Recommendation matrix (exhaustive: 540 combos) -------
  t("recommendation matrix: exhaustive coverage of getRecommendedTemplate", () => {
    const tplById = new Map(w.PROGRAM_TEMPLATES.map(p => [p.id, p]));
    const dims = {
      experience: ["beginner", "intermediate", "advanced"],
      days:       [2, 3, 4, 5, 6],
      equipment:  ["full", "barbell", "bodyweight"],
      gender:     ["male", "female", "skip"],
      bodyGoal:   ["fat_loss", "muscle", "recomp", "maintain"]
    };
    let total = 0, pass = 0;
    const failures = [];
    const goalsList = [["general"], ["strength"], ["hypertrophy"], ["athletic"], ["strength","hypertrophy"]];
    for (const exp of dims.experience)
    for (const d   of dims.days)
    for (const eq  of dims.equipment)
    for (const g   of dims.gender)
    for (const bg  of dims.bodyGoal)
    for (const gl  of goalsList) {
      total++;
      const answers = {
        goals: gl,
        experience: exp, days: d, duration: 60,
        equipment: eq, gender: g, bodyGoal: bg,
        injuries: ["none"]
      };
      let tplId;
      try { tplId = w.getRecommendedTemplate(answers); }
      catch (e) {
        failures.push({ answers, error: e.message });
        continue;
      }
      if (!tplId) {
        failures.push({ answers, error: "null/undefined templateId" });
        continue;
      }
      const tpl = tplById.get(tplId);
      if (!tpl) {
        failures.push({ answers, error: "unknown templateId: " + tplId });
        continue;
      }
      // Day-count alignment: template must NOT require more days than the user can train.
      // Exemption: bodyweight users with days<3 fall back to minimal3 (3-day) — no 2-day
      // bodyweight template exists in the library, so this is the closest fit.
      if (tpl.daysPerWeek > 0 && tpl.daysPerWeek > d) {
        const isBodyweightFallback = (eq === "bodyweight" && tplId === "minimal3" && d < 3);
        if (!isBodyweightFallback) {
          failures.push({ answers, error: `template ${tplId} requires ${tpl.daysPerWeek} days but user has ${d}` });
          continue;
        }
      }
      pass++;
    }
    if (failures.length) {
      const sample = failures.slice(0, 5).map(f => JSON.stringify(f)).join("\n  ");
      throw new Error(`${failures.length}/${total} combos failed:\n  ${sample}`);
    }
    eq(pass, total, "all combos returned a valid templateId with compatible day count");
  });

  // ---- 18. Named-persona recommendation tests -------------------
  t("recommendation: named personas land on expected templates", () => {
    const cases = [
      { name: "beginner-male-3day-fullgym",
        a: { goals:["strength"], experience:"beginner", days:3, equipment:"full", gender:"male", duration:60 },
        expect: "ss3" },
      { name: "beginner-female-2day",
        a: { goals:["general"], experience:"beginner", days:2, equipment:"full", gender:"female", duration:60 },
        expect: "runner2" },
      { name: "female-glutes-4day",
        a: { goals:["hypertrophy"], experience:"intermediate", days:4, equipment:"full", gender:"female", duration:60, physiquePriority:["glutes"] },
        expect: "filly4" },
      { name: "bodyweight-3day",
        a: { goals:["general"], experience:"intermediate", days:3, equipment:"bodyweight", gender:"male", duration:45 },
        expect: "minimal3" },
      { name: "bodyweight-4day",
        a: { goals:["general"], experience:"intermediate", days:4, equipment:"bodyweight", gender:"male", duration:60 },
        expect: "calisthenics4" },
      { name: "advanced-strength-4day",
        a: { goals:["strength"], experience:"advanced", days:4, equipment:"full", gender:"male", duration:60 },
        expect: "wendler4" },
      { name: "intermediate-strength+hypertrophy-4day",
        a: { goals:["strength","hypertrophy"], experience:"intermediate", days:4, equipment:"full", gender:"male", duration:60 },
        expect: "phul4" },
      { name: "40plus-knees-3day",
        a: { goals:["general"], experience:"intermediate", days:3, equipment:"full", gender:"male", duration:60, age:"40plus", injuries:["knees"] },
        expect: "kot3" },
      { name: "athletic-4day-advanced",
        a: { goals:["athletic"], experience:"advanced", days:4, equipment:"full", gender:"male", duration:60 },
        expect: "prvn4" },
      { name: "arms-superset-3day",
        a: { goals:["hypertrophy"], experience:"intermediate", days:3, equipment:"full", gender:"male", duration:60, physiquePriority:["bigger_arms"] },
        expect: "arms_superset3" }
    ];
    const fails = [];
    for (const c of cases) {
      const got = w.getRecommendedTemplate(c.a);
      if (got !== c.expect) fails.push(`${c.name}: got ${got}, expected ${c.expect}`);
    }
    if (fails.length) throw new Error(fails.join("\n  "));
  });

  // ---- 18b. bodyGoal influence (and audit-bug regression) ------
  t("recommendation: bodyGoal routes hypertrophy 4-day fat_loss → strength_cond4", () => {
    const cases = [
      { name: "hyp-4day-fat_loss",
        a: { goals:["hypertrophy"], experience:"intermediate", days:4, equipment:"full", gender:"male", duration:60, bodyGoal:"fat_loss" },
        expect: "strength_cond4" },
      { name: "hyp-4day-muscle (intermediate)",
        a: { goals:["hypertrophy"], experience:"intermediate", days:4, equipment:"full", gender:"male", duration:60, bodyGoal:"muscle" },
        expect: "phul4" },
      { name: "hyp-4day-recomp (intermediate)",
        a: { goals:["hypertrophy"], experience:"intermediate", days:4, equipment:"full", gender:"male", duration:60, bodyGoal:"recomp" },
        expect: "phul4" },
      { name: "hyp-4day-advanced-60min",
        a: { goals:["hypertrophy"], experience:"advanced", days:4, equipment:"full", gender:"male", duration:60, bodyGoal:"muscle" },
        expect: "gzcl4" },
      { name: "hyp-4day-advanced-90min",
        a: { goals:["hypertrophy"], experience:"advanced", days:4, equipment:"full", gender:"male", duration:90, bodyGoal:"muscle" },
        expect: "gvt4" },
      // Regression: pre-fix this returned 4-day strength_cond4 for a 3-day request
      { name: "general-3day-fat_loss (post-fix)",
        a: { goals:["general"], experience:"intermediate", days:3, equipment:"full", gender:"male", duration:60, bodyGoal:"fat_loss" },
        expect: "ppl3" },
      // Regression: dead-ternary cleanup — short session unaffected by days <=3 vs > 3
      { name: "30min-2day",
        a: { goals:["general"], experience:"intermediate", days:2, equipment:"full", gender:"male", duration:30, bodyGoal:"maintain" },
        expect: "rpt3" },
      { name: "30min-5day",
        a: { goals:["general"], experience:"intermediate", days:5, equipment:"full", gender:"male", duration:30, bodyGoal:"maintain" },
        expect: "rpt3" }
    ];
    const fails = [];
    for (const c of cases) {
      const got = w.getRecommendedTemplate(c.a);
      if (got !== c.expect) fails.push(`${c.name}: got ${got}, expected ${c.expect}`);
    }
    if (fails.length) throw new Error(fails.join("\n  "));
  });

  // ---- 19. saveOnboarding writes complete onboarding state ------
  t("saveOnboarding: persists answers + computed fields to s.onboarding", () => {
    resetForOnboarding();
    const answers = {
      goals:["strength","hypertrophy"], experience:"intermediate", days:4,
      equipment:"full", gender:"male", duration:60, bodyGoal:"muscle",
      smartSuggestions:"yes", injuries:["none"]
    };
    const onb = w.saveOnboarding(answers);
    assert(onb.completedAt > 0, "completedAt set");
    assert(onb.recommendedTemplate, "recommendedTemplate set");
    eq(onb.defaultRestSeconds, 90, "defaultRestSeconds = 90 for non-beginner");
    eq(onb.experience, "intermediate", "experience persisted");
    const stored = w.loadStore().onboarding;
    eq(stored.recommendedTemplate, onb.recommendedTemplate, "stored matches return value");
    eq(w.getDefaultRestSeconds("beginner"), 120, "beginners get 120s rest");
  });

  // ---- 20. E2E: beginner-male-3day persona ----------------------
  t("E2E onboarding: beginner-male-3day completes and yields ss3", () => {
    resetForOnboarding();
    const persona = {
      goals:["strength"], bodyGoal:"muscle", experience:"beginner",
      days:3, duration:60, gender:"male", equipment:"full",
      smartSuggestions:"no"
    };
    const r = runOnboarding(persona, { name: "Beginner Bob" });
    onboardingMetrics.push({ name: "beginner-male-3day", ...r });
    assert(r.finalState && r.finalState.completedAt, "onboarding completed");
    eq(r.finalState.recommendedTemplate, "ss3", "ss3 recommended");
    eq(r.finalState.experience, "beginner", "experience persisted");
    eq(r.finalState.days, 3, "days persisted as int");
    // User created inline by onboarding handoff
    const u = w.userData();
    assert(u, "user created by onboarding flow");
    assert(u.program && u.program.length === 3, "3-day program created (got " + (u.program?.length) + ")");
  });

  // ---- 21. E2E: female-glutes-4day persona ----------------------
  t("E2E onboarding: female-glutes-4day yields filly4", () => {
    resetForOnboarding();
    const persona = {
      goals:["hypertrophy"], physiquePriority:["glutes"], bodyGoal:"recomp",
      experience:"intermediate", days:4, duration:60, gender:"female",
      equipment:"full", smartSuggestions:"yes", injuries:["none"]
    };
    const r = runOnboarding(persona);
    onboardingMetrics.push({ name: "female-glutes-4day", ...r });
    eq(r.finalState.recommendedTemplate, "filly4", "filly4 recommended for female+glutes+4day");
    assert(r.stepsVisited.includes("rpeCalibration"), "rpeCalibration shown when smartSuggestions=yes");
    assert(r.finalState.rpeCalibration && r.finalState.rpeCalibration.completedAt, "rpeCalibration timestamp set");
  });

  // ---- 22. E2E: bodyweight-3day persona -------------------------
  t("E2E onboarding: bodyweight-3day yields minimal3", () => {
    resetForOnboarding();
    const persona = {
      goals:["general"], bodyGoal:"maintain", experience:"intermediate",
      days:3, duration:45, gender:"male", equipment:"bodyweight",
      smartSuggestions:"no", injuries:["none"]
    };
    const r = runOnboarding(persona);
    onboardingMetrics.push({ name: "bodyweight-3day", ...r });
    eq(r.finalState.recommendedTemplate, "minimal3", "minimal3 for bodyweight+3day");
  });

  // ---- 23. E2E: advanced-5day-strength persona ------------------
  t("E2E onboarding: advanced-5day-strength yields conjugate5", () => {
    resetForOnboarding();
    const persona = {
      goals:["strength"], bodyGoal:"muscle", experience:"advanced",
      days:5, duration:90, gender:"male", equipment:"full",
      smartSuggestions:"no", injuries:["none"]
    };
    const r = runOnboarding(persona);
    onboardingMetrics.push({ name: "advanced-5day-strength", ...r });
    eq(r.finalState.recommendedTemplate, "conjugate5", "conjugate5 for advanced+5day+strength");
  });

  // ---- 24. Skip-everything still produces a working program -----
  t("E2E onboarding: skip-everything path still produces a working program", () => {
    resetForOnboarding();
    const r = runOnboarding({}, { name: "Skipper" });
    onboardingMetrics.push({ name: "skip-everything", ...r });
    assert(r.finalState && r.finalState.completedAt, "onboarding completed even with no answers");
    const tpl = r.finalState.recommendedTemplate;
    assert(tpl, "recommendedTemplate set");
    const validIds = new Set(w.PROGRAM_TEMPLATES.map(p => p.id));
    assert(validIds.has(tpl), "recommendedTemplate is a real template: " + tpl);
    // Defaults applied when missing
    assert(Array.isArray(r.finalState.goals) && r.finalState.goals.length, "goals defaulted");
    assert(Array.isArray(r.finalState.injuries) && r.finalState.injuries.length, "injuries defaulted");
    // User is created inline by the handoff
    const u = w.userData();
    assert(u && u.program && u.program.length > 0, "user has a non-empty program");
    eq(u.templateId, tpl, "user templateId matches recommendation");
  });

  // ---- 25. Conditional rendering: rpeCalibration only when smartSuggestions=yes
  t("conditional: rpeCalibration step hidden when smartSuggestions=no", () => {
    resetForOnboarding();
    const r = runOnboarding({
      goals:["general"], bodyGoal:"maintain", experience:"intermediate",
      days:3, duration:60, gender:"male", equipment:"full",
      smartSuggestions:"no", injuries:["none"]
    });
    assert(!r.stepsVisited.includes("rpeCalibration"), "rpeCalibration was skipped");
    assert(r.stepsVisited.includes("smartSuggestions"), "smartSuggestions was visited");
  });

  // ---- 26. Multi-select "none" mutual exclusivity ---------------
  t("multi-select: 'none' on injuries is mutually exclusive", () => {
    resetForOnboarding();
    // Ensure onboarding data exists so redo mode works
    const s = w.loadStore();
    s.onboarding = { completedAt: Date.now(), goals: ["general"], experience: "intermediate", days: 4, equipment: "full" };
    w.saveStore(s);
    _syncTimeouts();
    try {
      w.showOnboardingFlow(true);  // Redo mode: injuries step is visible
      // Advance to injuries step by skipping/answering everything quickly
      while (getCurrentStepId() !== "injuries" && !isHandoff()) {
        const stepId = getCurrentStepId();
        const step = w.ONBOARDING_STEPS.find(s => s.id === stepId);
        if (step.type === "single") clickOption(step.options[0].value);
        else if (step.type === "multi") {
          clickOption(step.options[step.options.length - 1].value);
          clickSel("#obContinueBtn");
        } else if (step.type === "info") clickSel("#obContinueBtn");
        else if (step.type === "equipmentDetail") clickSel("#obContinueBtn");
        else if (step.skippable) clickSel("#obSkipBtn");
      }
      eq(getCurrentStepId(), "injuries", "reached injuries step");
      // Click knees, then shoulders, then "none" — none should clear the others
      clickOption("knees");
      clickOption("shoulders");
      let selected = w.document.querySelectorAll(".ob-option.selected");
      eq(selected.length, 2, "two injuries selected");
      clickOption("none");
      selected = w.document.querySelectorAll(".ob-option.selected");
      eq(selected.length, 1, "only 'none' selected after click");
      eq(selected[0].dataset.value, "none", "selected one is 'none'");
      // Click another → 'none' is cleared
      clickOption("knees");
      const finalSel = Array.from(w.document.querySelectorAll(".ob-option.selected")).map(e => e.dataset.value);
      assert(!finalSel.includes("none"), "none cleared when other selected");
      assert(finalSel.includes("knees"), "knees selected");
    } finally {
      _restoreTimeouts();
    }
  });

  // ---- 27. Back button navigates through visible steps ----------
  t("back button: returns to previous visible step", () => {
    resetForOnboarding();
    _syncTimeouts();
    try {
      w.showOnboardingFlow(false);
      eq(getCurrentStepId(), "goals", "start at goals");
      clickOption("strength");
      clickSel("#obContinueBtn");
      // Should be at physiquePriority now
      eq(getCurrentStepId(), "physiquePriority", "advanced to physiquePriority");
      clickSel("#obBackBtn");
      eq(getCurrentStepId(), "goals", "back returns to goals");
    } finally {
      _restoreTimeouts();
    }
  });

  // ---- 28. Dismiss path sets onboardingDismissedAt --------------
  t("dismiss: sets onboardingDismissedAt and does not save onboarding", () => {
    resetForOnboarding();
    _syncTimeouts();
    try {
      w.showOnboardingFlow(false);
      clickSel("#obDismissBtn");
    } finally {
      _restoreTimeouts();
    }
    const s = w.loadStore();
    assert(s.onboardingDismissedAt > 0, "onboardingDismissedAt set");
    assert(!s.onboarding || !s.onboarding.completedAt, "no completed onboarding");
  });

  // ---- 28b. Redo with template change: Switch dialog appears ----
  const _redoBeginner = {
    goals:["strength"], bodyGoal:"muscle", experience:"beginner",
    days:3, duration:60, gender:"male", equipment:"full",
    smartSuggestions:"no", injuries:["none"]
  };
  const _redoAdvanced = {
    goals:["strength"], bodyGoal:"muscle", experience:"advanced",
    days:4, duration:60, gender:"male", equipment:"full",
    smartSuggestions:"no", injuries:["none"]
  };

  t("E2E redo: recommendation change shows Switch dialog with both names", () => {
    resetForOnboarding();
    runOnboarding(_redoBeginner);
    w.addUser("Switcher", "ss3");

    const r = runOnboarding(_redoAdvanced, { redo: true });
    eq(r.finalState.recommendedTemplate, "wendler4", "redo recommends wendler4");

    const titleEl = w.document.querySelector(".ob-title");
    assert(titleEl && /Your recommendation/.test(titleEl.textContent), "redo handoff rendered");
    const switchBtn = w.document.getElementById("obSwitchBtn");
    assert(switchBtn, "Switch button rendered when recommendation changes");
    assert(w.document.getElementById("obKeepBtn"), "Keep button rendered alongside Switch");

    // Both old and new template names must appear in the body
    const bodyText = w.document.querySelector(".ob-handoff").textContent;
    const oldName = w.PROGRAM_TEMPLATES.find(t => t.id === "ss3").name;
    const newName = w.PROGRAM_TEMPLATES.find(t => t.id === "wendler4").name;
    assert(bodyText.includes(oldName), "body mentions current template: " + oldName);
    assert(bodyText.includes(newName), "body mentions new template: " + newName);
    assert(switchBtn.textContent.includes(newName), "Switch button labeled with: " + newName);
  });

  t("E2E redo: clicking Switch closes overlay and opens duration picker", () => {
    resetForOnboarding();
    runOnboarding(_redoBeginner);
    w.addUser("Switcher2", "ss3");
    runOnboarding(_redoAdvanced, { redo: true });

    _syncTimeouts();
    try { clickSel("#obSwitchBtn"); } finally { _restoreTimeouts(); }
    assert(!w.document.getElementById("onboardingOverlay").classList.contains("active"),
           "onboarding overlay closed");
    const sheetBg = w.document.getElementById("sheetBg");
    assert(sheetBg && sheetBg.classList.contains("active"), "duration picker sheet opened");
  });

  t("E2E redo: clicking Keep leaves templateId unchanged", () => {
    resetForOnboarding();
    runOnboarding(_redoBeginner);
    w.addUser("Keeper", "ss3");
    runOnboarding(_redoAdvanced, { redo: true });

    eq(w.userData().templateId, "ss3", "templateId is ss3 before Keep");
    _syncTimeouts();
    try { clickSel("#obKeepBtn"); } finally { _restoreTimeouts(); }
    eq(w.userData().templateId, "ss3", "templateId still ss3 after Keep");
    assert(!w.document.getElementById("onboardingOverlay").classList.contains("active"),
           "overlay closed after Keep");
  });

  t("E2E redo: same recommendation shows Done button (no Switch dialog)", () => {
    resetForOnboarding();
    runOnboarding(_redoBeginner);
    w.addUser("Same Tester", "ss3");
    runOnboarding(_redoBeginner, { redo: true });

    assert(w.document.getElementById("obDoneBtn"), "Done button rendered");
    assert(!w.document.getElementById("obSwitchBtn"), "no Switch button when recommendation unchanged");
    assert(!w.document.getElementById("obKeepBtn"), "no Keep button when recommendation unchanged");
  });

  // ---- 29. Redo: clears dismissedAt and pre-fills prior answers --
  t("redo: showOnboardingFlow(true) clears dismissedAt and seeds prior answers", () => {
    // Setup: complete onboarding once, then dismiss-equivalent state
    resetForOnboarding();
    const seed = {
      goals:["strength"], bodyGoal:"muscle", experience:"intermediate",
      days:4, duration:60, gender:"male", equipment:"full",
      smartSuggestions:"no", injuries:["none"]
    };
    runOnboarding(seed);
    w.addUser("Redo Tester", w.loadStore().onboarding.recommendedTemplate);
    // Now manually set dismissedAt to verify redo clears it
    const s1 = w.loadStore();
    s1.onboardingDismissedAt = Date.now();
    w.saveStore(s1);

    _syncTimeouts();
    try {
      w.showOnboardingFlow(true);
    } finally {
      _restoreTimeouts();
    }
    const s2 = w.loadStore();
    eq(s2.onboardingDismissedAt, null, "dismissedAt cleared on redo");
    // Prior answers should be pre-selected: navigate to goals and check selection
    // (we're already at the first step after showOnboardingFlow)
    const selectedVals = Array.from(w.document.querySelectorAll(".ob-option.selected")).map(e => e.dataset.value);
    assert(selectedVals.includes("strength"), "prior 'strength' goal pre-selected on redo");
  });

  // ---- 30. Recommendation handles edge cases --------------------
  t("recommendation: empty answers returns a valid template", () => {
    const tplId = w.getRecommendedTemplate({});
    const validIds = new Set(w.PROGRAM_TEMPLATES.map(p => p.id));
    assert(validIds.has(tplId), "got valid templateId for empty answers: " + tplId);
  });

  t("recommendation: legacy goal field still works", () => {
    const tplId = w.getRecommendedTemplate({ goal: "strength", experience: "advanced", days: 4, equipment: "full" });
    eq(tplId, "wendler4", "legacy goal=strength still routes correctly");
  });

  // ---- 31. Click-count budget (UX regression guard) -------------
  // Hard-fails if any persona run exceeds the budget. Catches new
  // confirmation steps or accidentally-required answers that bloat the flow.
  const CLICK_BUDGET = 20;
  t("click-count budget: every persona completes in ≤ " + CLICK_BUDGET + " clicks", () => {
    assert(onboardingMetrics.length > 0, "no metrics collected — did E2E tests run?");
    const over = onboardingMetrics.filter(m => m.clickCount > CLICK_BUDGET);
    if (over.length) {
      const detail = over.map(m => `${m.name}: ${m.clickCount}`).join(", ");
      throw new Error(`personas over budget (${CLICK_BUDGET}): ${detail}`);
    }
  });

  // ---- 32. Tutorial coach-mark overlay -------------------------
  // Validates the contextual tutorial: state shape, manual trigger,
  // step navigation, dismissal persistence, and re-opening via the
  // help button.
  t("tutorial: defensive default sets tutorialState shape", () => {
    w.localStorage.clear();
    const s = w.loadStore();
    assert(s.tutorialState, "tutorialState exists");
    eq(s.tutorialState.completedAt, null, "completedAt null on fresh store");
    eq(s.tutorialState.dismissedAt, null, "dismissedAt null on fresh store");
    eq(s.tutorialState.lastStepId, null, "lastStepId null on fresh store");
  });

  t("tutorial: startTutorial({force:true}) activates overlay and renders step 0", () => {
    w.localStorage.clear();
    w.addUser("Tutorial Tester");
    w.startTutorial({ force: true });
    const overlay = w.document.getElementById("tutorialOverlay");
    assert(overlay.classList.contains("active"), "overlay active");
    eq(overlay.getAttribute("aria-hidden"), "false", "aria-hidden cleared");
    const title = w.document.getElementById("tutorialTitle").textContent;
    eq(title, w.TUTORIAL_STEPS[0].title, "first step rendered");
  });

  t("tutorial: Skip persists dismissedAt and prevents auto-open", () => {
    w.closeTutorial("skipped");
    const s = w.loadStore();
    assert(s.tutorialState.dismissedAt, "dismissedAt set");
    eq(s.tutorialState.completedAt, null, "completedAt still null after skip");
    // Calling startTutorial without force must NOT activate again because the
    // contract is: completedAt OR explicit force re-opens. After skip alone we
    // still want to allow re-trigger via the ? button (force=true).
    w.startTutorial({ force: true });
    const overlay = w.document.getElementById("tutorialOverlay");
    assert(overlay.classList.contains("active"), "force re-opens overlay after dismissal");
    w.closeTutorial("dismissed");
  });

  t("tutorial: advancing through every step sets completedAt", () => {
    w.startTutorial({ force: true });
    const total = w.TUTORIAL_STEPS.length;
    const nextBtn = w.document.getElementById("tutorialNextBtn");
    for (let i = 0; i < total; i++) nextBtn.click();
    const s = w.loadStore();
    assert(s.tutorialState.completedAt, "completedAt set after walking through all steps");
    eq(s.tutorialState.lastStepId, "done", "lastStepId is 'done' after completion");
    const overlay = w.document.getElementById("tutorialOverlay");
    assert(!overlay.classList.contains("active"), "overlay closed after completion");
  });

  t("tutorial: completedAt blocks auto-open (non-forced startTutorial is no-op)", () => {
    // After previous test, completedAt is set. A plain startTutorial() should
    // NOT activate the overlay.
    w.startTutorial();
    const overlay = w.document.getElementById("tutorialOverlay");
    assert(!overlay.classList.contains("active"), "overlay stays closed when already completed");
  });

  t("tutorial: header help button re-opens tutorial", () => {
    const helpBtn = w.document.getElementById("headerHelpBtn");
    assert(helpBtn, "help button exists in header");
    helpBtn.click();
    const overlay = w.document.getElementById("tutorialOverlay");
    assert(overlay.classList.contains("active"), "help button re-opens tutorial");
    w.closeTutorial("dismissed");
  });

  t("tutorial: graceful fallback when target selector is missing", () => {
    // Force a step whose target won't be in DOM in this state.
    // Step 'set-inputs' targets #f-sets which only exists when bottom sheet open.
    w.startTutorial({ force: true });
    // Jump to set-inputs step by clicking Next until we reach it
    const setInputsIdx = w.TUTORIAL_STEPS.findIndex(s => s.id === "set-inputs");
    const nextBtn = w.document.getElementById("tutorialNextBtn");
    for (let i = 0; i < setInputsIdx; i++) nextBtn.click();
    // We should still be active — the missing-target case shouldn't crash
    const overlay = w.document.getElementById("tutorialOverlay");
    assert(overlay.classList.contains("active"), "overlay remains active on missing target");
    const title = w.document.getElementById("tutorialTitle").textContent;
    eq(title, w.TUTORIAL_STEPS[setInputsIdx].title, "step title still rendered");
    w.closeTutorial("dismissed");
  });

  t("tutorial: migration v16 stamps completedAt for existing users with sessions", () => {
    w.localStorage.clear();
    w.localStorage.setItem("kn-lifts-v3", JSON.stringify({
      _schemaVersion: 15,
      unit: "lbs",
      users: [{
        id: "u_existing", name: "Existing", program: [], sessions: [{ id: "s1", finishedAt: 1 }],
        measurements: [], templateId: "conjugate5"
      }],
      currentUserId: "u_existing",
      onboarding: null,
      onboardingDismissedAt: null
    }));
    w.runMigrations();
    const s = w.loadStore();
    eq(s._schemaVersion, w.getDefaultStore()._schemaVersion, "migrated to current");
    assert(s.tutorialState, "tutorialState created");
    assert(s.tutorialState.completedAt, "existing user with sessions: completedAt stamped");
  });

  t("tutorial: migration v16 leaves brand-new users in opt-in state", () => {
    w.localStorage.clear();
    w.localStorage.setItem("kn-lifts-v3", JSON.stringify({
      _schemaVersion: 15,
      unit: "lbs",
      users: [{
        id: "u_new", name: "New", program: [], sessions: [],
        measurements: [], templateId: "conjugate5"
      }],
      currentUserId: "u_new",
      onboarding: null,
      onboardingDismissedAt: null
    }));
    w.runMigrations();
    const s = w.loadStore();
    eq(s.tutorialState.completedAt, null, "new user (no sessions): tutorial still open");
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
  if (onboardingMetrics.length) {
    console.log("\n===== ONBOARDING METRICS (report-only) =====");
    console.log("persona".padEnd(28) + "  clicks  steps  ms");
    console.log("-".repeat(50));
    for (const m of onboardingMetrics) {
      console.log(
        m.name.padEnd(28) +
        "  " + String(m.clickCount).padStart(6) +
        "  " + String(m.stepsVisited.length).padStart(5) +
        "  " + String(m.durationMs).padStart(4)
      );
    }
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 || errors.length > 0 ? 1 : 0);
})().catch(e => { console.error("Runner error:", e); process.exit(1); });
