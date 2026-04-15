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
    // Find back squat in Day 1
    const day1 = u.program.find(d => d.id === 1);
    const squat = day1.blocks.flatMap(b => b.exercises).find(e => e.exId === "backsquat");
    assert(squat, "back squat exists");
    eq(squat.defaultWeight, 135, "back squat default 135");
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
    // Find a weight input. Back Squat should show 135
    const inputs = w.document.querySelectorAll(".weight-in");
    assert(inputs.length > 0, "weight inputs present");
    // Any of them should show 135 (back squat)
    const vals = Array.from(inputs).map(i => i.value);
    assert(vals.includes("135"), "a weight input shows 135 (back squat default). got: " + vals.join(","));
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
    w.renderWorkoutScreen();
    // Save a realistic input on the back squat, set 0
    const day = w.getCurrentDay();
    const block = day.blocks.find(b => b.exercises.some(e => e.exId === "backsquat"));
    const exIdx = block.exercises.findIndex(e => e.exId === "backsquat");
    w.saveInput(w.inputKey(block.id, exIdx, 0, "w"), 135);
    w.saveInput(w.inputKey(block.id, exIdx, 0, "r"), 3);
    w.saveInput(w.inputKey(block.id, exIdx, 0, "p"), 8);
    const beforeLen = w.userData().sessions.length;
    w.finishWorkout();
    assert(w.userData().sessions.length === beforeLen + 1, "session saved");
    eq(w.userData().lastDoneDayId, 1, "lastDone = 1");
    eq(w.state.currentDayId, 2, "next day");
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
    eq(s._schemaVersion, 1, "schema bumped to v1");
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
    eq(s._schemaVersion, 1, "defaults carry current schema version");

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
