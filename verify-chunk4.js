#!/usr/bin/env node
// verify-chunk4.js — Integration walkthrough for Chunk 4 (Workstream C)
// Usage: node verify-chunk4.js (from worktree root)
"use strict";

const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.resolve(__dirname, "workout-app.html"), "utf8");
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  pretendToBeVisual: true,
  url: "http://localhost/"
});
const w = dom.window;

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { console.log("  \u2713", label); pass++; }
  else       { console.log("  \u2717", label, detail ? "(" + detail + ")" : ""); fail++; }
}
function getU() { return w.userData(); }

function makeRpUser() {
  var s = w.loadStore();
  s.users = [];
  s.currentUserId = null;
  w.saveStore(s);
  var u = w.addUser("VerifyUser", "rp-hypertrophy");
  w.state.userId = u.id;
  w.updateUser(function(u) { u.rp.enabled = true; });
}

// ─── §1: startMesocycle ───────────────────────────────────────────────────────
console.log("\n§1 — startMesocycle");
makeRpUser();
w.startMesocycle({ daysPerWeek: 4, lengthWeeks: 5 });  // correct opt name
var u1 = getU();
var meso = u1.rp.mesocycles[0];

check("mesocycle created", meso != null);
check("currentMesocycleId set", u1.rp.currentMesocycleId === meso.id);
check("lengthWeeks=5", meso.lengthWeeks === 5, "got " + meso.lengthWeeks);
check("currentWeek=1", meso.currentWeek === 1);
// rirSchedule is 0-indexed: [4,3,2,1,"deload"] → week 1 = index 0 = 4
check("rirSchedule week 1 = 4", meso.rirSchedule && meso.rirSchedule[0] === 4, "got " + (meso.rirSchedule && meso.rirSchedule[0]));
check("rirSchedule week 5 = deload", meso.rirSchedule && meso.rirSchedule[4] === "deload", "got " + (meso.rirSchedule && meso.rirSchedule[4]));
check("perMuscleVolume seeded", meso.perMuscleVolume && Object.keys(meso.perMuscleVolume).length > 0);

// perMuscleVolume["chest"] is an array of {week, plannedSets, completedSets}
var chestVol = meso.perMuscleVolume["chest"] || [];
var chestW1Entry = chestVol.find(function(v) { return v.week === 1; });
var chestW1 = chestW1Entry && chestW1Entry.plannedSets;
check("chest week 1 starts at MEV (8)", chestW1 === 8, "got " + chestW1);

// ─── §2: generateRpWeek — program structure ───────────────────────────────────
console.log("\n§2 — generateRpWeek week 1");
var prog = u1.program;
check("program[] non-empty", prog.length > 0);
var allBlocks = [];
prog.forEach(function(d) { (d.blocks || []).forEach(function(b) { allBlocks.push(b); }); });
var rpBlock = allBlocks.find(function(b) { return b.blockType === "rp-hypertrophy"; });
check("rp-hypertrophy block exists in program", rpBlock != null);
// rp blocks use 'exercises' array (not 'sets')
check("rpBlock has exercises", rpBlock && rpBlock.exercises && rpBlock.exercises.length > 0);
var rpEx = rpBlock && rpBlock.exercises && rpBlock.exercises[0];
check("exercise has targetRIR", rpEx && rpEx.targetRIR != null, "got " + (rpEx && rpEx.targetRIR));
check("exercise targetRIR=4 (week 1 with default [4,3,2,1,deload])", rpEx && rpEx.targetRIR === 4);

// ─── §3: captureSessionFeedback + adjustVolumeFromFeedback ───────────────────
console.log("\n§3 — captureSessionFeedback + adjustVolumeFromFeedback");
var mesoId = meso.id;

// Inject a session tagged to this meso, week 1
// Feedback must be per-muscle: { "chest": { workload, soreness } }
w.updateUser(function(u) {
  u.sessions.push({
    id: "s-verify-001",
    finishedAt: Date.now() - 86400000,
    duration: 3600, volume: 5000, prCount: 0,
    sets: [{ exId: "bench-press", exName: "Bench Press",
             muscles: ["chest"], weight: 100, reps: 10, rpe: 7,
             bodyweight: false, isPR: false, setIdx: 1 }],
    mesocycleId: mesoId,
    mesoWeek: 1,
    feedback: {}
  });
});

// Capture feedback with per-muscle structure; workload=2 → delta +1
w.captureSessionFeedback("s-verify-001", { "chest": { workload: 2, soreness: 1 } });
var uAfterFb = getU();
var fbSaved = (uAfterFb.sessions || []).find(function(s) { return s.id === "s-verify-001"; });
check("feedback saved to session",
  fbSaved && fbSaved.feedback && fbSaved.feedback["chest"] && fbSaved.feedback["chest"].workload === 2);

var meso2 = w.getActiveMesocycle(uAfterFb);
var deltas = w.adjustVolumeFromFeedback(meso2, 1, uAfterFb);
var chestDelta = deltas["chest"];
check("chest delta=+1 for workload=2", chestDelta === 1, "got " + chestDelta);

// adjustVolumeFromFeedback mutates meso2 in place (no persist) — read directly from meso2
var chestW2Entry = (meso2.perMuscleVolume["chest"] || []).find(function(v) { return v.week === 2; });
var chestW2 = chestW2Entry && chestW2Entry.plannedSets;
check("chest week 2 plannedSets > week 1 (volume ramps)", chestW2 > chestW1, "w1=" + chestW1 + " w2=" + chestW2);

// ─── §4: Deload week generation ───────────────────────────────────────────────
console.log("\n§4 — Deload week (week 5)");
// Seed week 4 plannedSets for deload reference
w.updateUser(function(u) {
  var m = u.rp.mesocycles.find(function(m) { return m.id === mesoId; });
  var w4 = (m.perMuscleVolume["chest"] || []).find(function(v) { return v.week === 4; });
  if (w4) w4.plannedSets = 18;
});
var uDeload = getU();
var mesoDeload = uDeload.rp.mesocycles.find(function(m) { return m.id === mesoId; });
var deloadDays = w.generateRpWeek(mesoDeload, 5, uDeload);
check("deload week returns Day[]", Array.isArray(deloadDays) && deloadDays.length > 0);
var deloadExercises = [];
(deloadDays || []).forEach(function(d) {
  (d.blocks || []).forEach(function(b) {
    if (b.blockType === "rp-hypertrophy") {
      (b.exercises || []).forEach(function(ex) { deloadExercises.push(ex); });
    }
  });
});
check("deload exercises exist", deloadExercises.length > 0);
check("deload exercises all have targetRIR=4",
  deloadExercises.length > 0 && deloadExercises.every(function(ex) { return ex.targetRIR === 4; }));

// ─── §5: recomputeMesocycleState (D integration) ─────────────────────────────
console.log("\n§5 — recomputeMesocycleState");
w.recomputeMesocycleState(mesoId);
var uAfterRecompute = getU();
var mesoAfterRecompute = uAfterRecompute.rp.mesocycles.find(function(m) { return m.id === mesoId; });
check("recomputeMesocycleState runs without error", mesoAfterRecompute != null);
// completedSets lives on volume entries per muscle/week
var chestW1EntryAfter = (mesoAfterRecompute.perMuscleVolume["chest"] || []).find(function(v) { return v.week === 1; });
check("chest week 1 completedSets is numeric after recompute",
  chestW1EntryAfter && typeof chestW1EntryAfter.completedSets === "number",
  "got " + (chestW1EntryAfter && chestW1EntryAfter.completedSets));

// ─── §6: MRV clamp ────────────────────────────────────────────────────────────
console.log("\n§6 — MRV clamp");
// Force chest at MRV (22) for week 1
w.updateUser(function(u) {
  var m = u.rp.mesocycles.find(function(m) { return m.id === mesoId; });
  var w1 = (m.perMuscleVolume["chest"] || []).find(function(v) { return v.week === 1; });
  if (w1) w1.plannedSets = 22;
});
// Reset week 2 so adjustVolumeFromFeedback can recompute
w.updateUser(function(u) {
  var m = u.rp.mesocycles.find(function(m) { return m.id === mesoId; });
  var w2 = (m.perMuscleVolume["chest"] || []).find(function(v) { return v.week === 2; });
  if (w2) w2.plannedSets = null;
});
// Update session feedback to workload=1 → +2, but chest is at MRV → clamped to 0 delta
w.captureSessionFeedback("s-verify-001", { "chest": { workload: 1, soreness: 1 } });
var uMrv = getU();
var mesoMrv = uMrv.rp.mesocycles.find(function(m) { return m.id === mesoId; });
var mrvDeltas = w.adjustVolumeFromFeedback(mesoMrv, 1, uMrv);
// adjustVolumeFromFeedback mutates mesoMrv in place — read clamped week 2 value directly
var chestW2MrvEntry = (mesoMrv.perMuscleVolume["chest"] || []).find(function(v) { return v.week === 2; });
var chestW2Mrv = chestW2MrvEntry && chestW2MrvEntry.plannedSets;
// Returned delta is raw (+2 for workload=1); clamping is applied to plannedSets, not the delta
check("chest week 2 = MRV (22) when +2 would exceed it", chestW2Mrv === 22, "got " + chestW2Mrv);
check("raw delta=+2 (clamping applied to plannedSets)", mrvDeltas["chest"] === 2, "got " + mrvDeltas["chest"]);

// ─── §7: Non-RP regression ────────────────────────────────────────────────────
console.log("\n§7 — Non-RP regression");
var s7 = w.loadStore();
s7.users.push({
  id: "nonrp-v", name: "NonRP", templateId: "conjugate5",
  program: [{ id: 1, label: "Day 1", blocks: [{ id: "b1", type: "main", blockType: "strength",
    sets: [{ exId: "squat", exName: "Squat", setIdx: 1, targetReps: 5,
             weight: 135, reps: 0, rpe: null, bodyweight: false }] }] }],
  sessions: [], measurements: [], draft: null, lastDoneDayId: null,
  rp: { enabled: false, volumeLandmarks: null, mesocycles: [], currentMesocycleId: null }
});
w.saveStore(s7);
w.state.userId = "nonrp-v";
var sw = w.suggestedWeight({ exId: "squat", muscles: ["quads"], weight: 135, targetRIR: 3 });
// suggestedWeight returns { weight, confidence, reason } — reason="disabled" when rp.enabled=false
check("non-RP suggestedWeight reason=disabled", sw && sw.reason === "disabled", JSON.stringify(sw));

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(50));
console.log("verify-chunk4: " + pass + " passed, " + fail + " failed");
if (fail > 0) process.exit(1);
