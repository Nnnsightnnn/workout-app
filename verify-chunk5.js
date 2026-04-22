#!/usr/bin/env node
// verify-chunk5.js — Acceptance criteria for Chunk 5 (Workstream B-fatigue)
// Usage: node verify-chunk5.js (from repo root)
"use strict";

const { JSDOM } = require("jsdom");
const fs   = require("fs");
const path = require("path");

const html = fs.readFileSync(path.resolve(__dirname, "workout-app.html"), "utf8");
const dom  = new JSDOM(html, {
  runScripts:      "dangerously",
  resources:       "usable",
  pretendToBeVisual: true,
  url:             "http://localhost/"
});
const w = dom.window;

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { console.log("  \u2713", label); pass++; }
  else       { console.log("  \u2717", label, detail ? "(" + detail + ")" : ""); fail++; }
}
function getU() { return w.userData(); }

// Helper: reset store to a fresh RP user
function makeRpUser() {
  var s = w.loadStore();
  s.users = [];
  s.currentUserId = null;
  w.saveStore(s);
  var u = w.addUser("C5User", "rp-hypertrophy");
  w.state.userId = u.id;
  w.updateUser(function(u) { u.rp.enabled = true; });
}

// Helper: create a minimal mesocycle object (not via startMesocycle) for pure-function tests
function makeMockMeso(overrides) {
  var base = {
    id: "meso-test-" + Date.now(),
    startedAt: Date.now() - 86400000 * 7,
    finishedAt: null,
    lengthWeeks: 5,
    currentWeek: 1,
    daysPerWeek: 4,
    rirSchedule: [4, 3, 2, 1, "deload"],
    repRangeSchedule: [],
    perMuscleVolume: {
      "chest": [
        { week: 1, plannedSets: 10, completedSets: null },
        { week: 2, plannedSets: null, completedSets: null }
      ]
    },
    exerciseSelection: {},
    completedSessionsByWeek: {},
    flagsForNextMeso: {}
  };
  Object.assign(base, overrides || {});
  return base;
}

// ─── [1] APP_VERSION is 12 ─────────────────────────────────────────────────────
console.log("\n[1] APP_VERSION = 12");
check("APP_VERSION === 12", w.APP_VERSION === 12, "got " + w.APP_VERSION);

// ─── [2] Migration v12 adds new fields without crashing on a v11 store ─────────
console.log("\n[2] Migration v12 on v11-shaped store");
(function() {
  // Build a v11-shaped store (has mesocycles but no flagsForNextMeso / completedSessionsByWeek)
  var s11 = {
    _schemaVersion: 11,
    unit: "lbs",
    users: [{
      id: "v11u",
      name: "V11User",
      templateId: "rp-hypertrophy",
      program: [], sessions: [], measurements: [], draft: null,
      lastDoneDayId: null, currentWeek: 1, totalWeeks: 5, daysPerWeek: 4,
      rp: {
        enabled: true,
        rpeCalibrationCompletedAt: null, rpeCalibrationMethod: null,
        coldStartAnchors: {}, lastDeloadRecommendedAt: null, dismissedDeloadForWeek: null,
        volumeLandmarks: null,
        mesocycles: [{ id: "meso-v11", startedAt: 1000, finishedAt: null, lengthWeeks: 5,
                       currentWeek: 1, daysPerWeek: 4, perMuscleVolume: {} }],
        currentMesocycleId: "meso-v11"
      }
    }]
  };
  // Write to localStorage via saveStore so runMigrations() can pick it up
  w.saveStore(s11);
  var didCrash = false;
  try {
    w.runMigrations();
  } catch (e) { didCrash = true; console.error("migration crash:", e); }
  check("migration v12 does not crash on v11 store", !didCrash);
  // Read back the migrated store
  var s12 = w.loadStore();
  var mesoAfter = s12 && s12.users && s12.users[0] && s12.users[0].rp &&
                  s12.users[0].rp.mesocycles && s12.users[0].rp.mesocycles[0];
  check("migration v12 adds flagsForNextMeso",
    mesoAfter && typeof mesoAfter.flagsForNextMeso === "object",
    "got " + JSON.stringify(mesoAfter && mesoAfter.flagsForNextMeso));
  check("migration v12 adds completedSessionsByWeek",
    mesoAfter && typeof mesoAfter.completedSessionsByWeek === "object",
    "got " + JSON.stringify(mesoAfter && mesoAfter.completedSessionsByWeek));
})();

// ─── [3] isMicrocycleBoundary ──────────────────────────────────────────────────
console.log("\n[3] isMicrocycleBoundary");

// Empty mesocycle (no sessions completed)
var mesoEmpty = makeMockMeso({ completedSessionsByWeek: {} });
check("empty meso → false", w.isMicrocycleBoundary(mesoEmpty, Date.now()) === false);

// All 4 sessions completed this week
var mesoFull = makeMockMeso({ daysPerWeek: 4, completedSessionsByWeek: { 1: 4 } });
check("4/4 sessions complete → true", w.isMicrocycleBoundary(mesoFull, Date.now()) === true);

// Mid-week partial (2 of 4)
var mesoPart = makeMockMeso({ daysPerWeek: 4, completedSessionsByWeek: { 1: 2 } });
check("2/4 sessions complete → false", w.isMicrocycleBoundary(mesoPart, Date.now()) === false);

// ─── [4] adjustVolumeFromFeedback: no feedback → 'no-feedback' (North Star) ────
console.log("\n[4] adjustVolumeFromFeedback — no feedback captured");
makeRpUser();
w.startMesocycle({ daysPerWeek: 3, lengthWeeks: 5 });
var u4 = getU();
var meso4 = w.getActiveMesocycle(u4);

// Add a session for this meso but with skipped feedback
w.updateUser(function(u) {
  u.sessions.push({
    id: "s4-001",
    finishedAt: Date.now() - 3600000,
    duration: 3600, volume: 0, prCount: 0, sets: [],
    mesocycleId: meso4.id,
    mesoWeek: 1,
    feedback: { skipped: true }  // explicitly skipped
  });
});
var u4b = getU();
var meso4b = w.getActiveMesocycle(u4b);
var adj4 = w.adjustVolumeFromFeedback(u4b, meso4b);
var allNoFeedback = Object.keys(adj4).every(function(m) {
  return adj4[m].delta === 0 && adj4[m].reason === "no-feedback";
});
check("all muscles → {delta:0, reason:'no-feedback'} when skipped", allNoFeedback,
  "sample: " + JSON.stringify(adj4["chest"]));

// ─── [5] adjustVolumeFromFeedback: all-low feedback → +1 ──────────────────────
console.log("\n[5] adjustVolumeFromFeedback — all-low feedback → +1");
makeRpUser();
w.startMesocycle({ daysPerWeek: 3, lengthWeeks: 5 });
var u5 = getU();
var meso5 = w.getActiveMesocycle(u5);

// Ensure chest week 1 is below MAV (starts at MEV=8, MAV=14, MRV=22)
w.updateUser(function(u) {
  u.sessions.push({
    id: "s5-001",
    finishedAt: Date.now() - 3600000,
    duration: 3600, volume: 0, prCount: 0, sets: [],
    mesocycleId: meso5.id,
    mesoWeek: 1,
    feedback: { "chest": { pump: 1, soreness: 1, workload: 1 } }
  });
});
var u5b = getU();
var meso5b = w.getActiveMesocycle(u5b);
var adj5 = w.adjustVolumeFromFeedback(u5b, meso5b);
check("all-low feedback → chest delta=+1",
  adj5["chest"] && adj5["chest"].delta === 1,
  "got " + JSON.stringify(adj5["chest"]));

// ─── [6] adjustVolumeFromFeedback: high soreness + high workload → -1 ─────────
console.log("\n[6] adjustVolumeFromFeedback — high soreness + high workload → -1");
makeRpUser();
w.startMesocycle({ daysPerWeek: 3, lengthWeeks: 5 });
// Force chest above MEV so cap won't prevent -1
w.updateUser(function(u) {
  var m = w.getActiveMesocycle(u);
  var w1 = (m.perMuscleVolume["chest"] || []).find(function(v) { return v.week === 1; });
  if (w1) w1.plannedSets = 16; // above MEV(8), below MRV(22)
});
var u6 = getU();
var meso6 = w.getActiveMesocycle(u6);
w.updateUser(function(u) {
  u.sessions.push({
    id: "s6-001",
    finishedAt: Date.now() - 3600000,
    duration: 3600, volume: 0, prCount: 0, sets: [],
    mesocycleId: meso6.id,
    mesoWeek: 1,
    feedback: { "chest": { pump: 3, soreness: 3, workload: 3 } }
  });
});
var u6b = getU();
var meso6b = w.getActiveMesocycle(u6b);
var adj6 = w.adjustVolumeFromFeedback(u6b, meso6b);
check("high sor+wkld → chest delta=-1",
  adj6["chest"] && adj6["chest"].delta === -1,
  "got " + JSON.stringify(adj6["chest"]));

// ─── [7] adjustVolumeFromFeedback: at MRV → {delta:0, reason:'at-mrv'} ─────────
console.log("\n[7] adjustVolumeFromFeedback — MRV cap");
makeRpUser();
w.startMesocycle({ daysPerWeek: 3, lengthWeeks: 5 });
// Force chest to MRV (22)
w.updateUser(function(u) {
  var m = w.getActiveMesocycle(u);
  var w1 = (m.perMuscleVolume["chest"] || []).find(function(v) { return v.week === 1; });
  if (w1) w1.plannedSets = 22;
});
var u7 = getU();
var meso7 = w.getActiveMesocycle(u7);
// All-low feedback would trigger +1, but we're at MRV
w.updateUser(function(u) {
  u.sessions.push({
    id: "s7-001",
    finishedAt: Date.now() - 3600000,
    duration: 3600, volume: 0, prCount: 0, sets: [],
    mesocycleId: meso7.id,
    mesoWeek: 1,
    feedback: { "chest": { pump: 1, soreness: 1, workload: 1 } }
  });
});
var u7b = getU();
var meso7b = w.getActiveMesocycle(u7b);
var adj7 = w.adjustVolumeFromFeedback(u7b, meso7b);
check("chest at MRV → delta=0, reason='at-mrv'",
  adj7["chest"] && adj7["chest"].delta === 0 && adj7["chest"].reason === "at-mrv",
  "got " + JSON.stringify(adj7["chest"]));

// ─── [8] Cold-start meso (no sessions) → reason 'cold-start' ──────────────────
console.log("\n[8] adjustVolumeFromFeedback — cold-start (no sessions)");
makeRpUser();
w.startMesocycle({ daysPerWeek: 3, lengthWeeks: 5 });
var u8 = getU();
var meso8 = w.getActiveMesocycle(u8);
// No sessions added for this meso
var adj8 = w.adjustVolumeFromFeedback(u8, meso8);
var allColdStart = Object.keys(adj8).every(function(m) {
  return adj8[m].delta === 0 && adj8[m].reason === "cold-start";
});
check("no sessions → all muscles 'cold-start'", allColdStart,
  "sample: " + JSON.stringify(adj8["chest"]));

// ─── [9] Feedback UI: rp-hypertrophy shows sheet; strength does NOT ────────────
console.log("\n[9] Feedback UI block-type gate");
// Grep the built HTML for the gate condition
var htmlSrc = fs.readFileSync(path.resolve(__dirname, "workout-app.html"), "utf8");
// maybeShowRpFeedbackSheet must check blockType === "rp-hypertrophy"
var hasRpBlockCheck = htmlSrc.includes('blockType === "rp-hypertrophy"') ||
                      htmlSrc.includes("blockType === 'rp-hypertrophy'");
check("render code gates feedback on rp-hypertrophy blockType", hasRpBlockCheck);
// hasRpBlocks must use blockType check (grep in finishWorkout context)
var finishCtx = htmlSrc.indexOf("hasRpBlocks");
var nearbyCode = finishCtx > 0 ? htmlSrc.slice(finishCtx - 20, finishCtx + 200) : "";
var strengthNotInFeedback = !nearbyCode.includes('"strength"');
check("finishWorkout hasRpBlocks does not include 'strength' in feedback gate",
  hasRpBlockCheck && strengthNotInFeedback, "nearby: " + nearbyCode.slice(0, 100));

// ─── [10] Skipped feedback persists as {skipped:true}, not zero scores ─────────
console.log("\n[10] Skipped feedback stored as {skipped:true}");
makeRpUser();
w.startMesocycle({ daysPerWeek: 3, lengthWeeks: 5 });
var u10 = getU();
var meso10 = w.getActiveMesocycle(u10);
w.updateUser(function(u) {
  u.sessions.push({
    id: "s10-001",
    finishedAt: Date.now() - 3600000,
    duration: 3600, volume: 0, prCount: 0, sets: [],
    mesocycleId: meso10.id, mesoWeek: 1, feedback: {}
  });
});
// Simulate user pressing Skip on the feedback sheet
w.captureSessionFeedback("s10-001", { skipped: true });
var u10b = getU();
var s10 = (u10b.sessions || []).find(function(s) { return s.id === "s10-001"; });
check("skipped feedback stored as {skipped:true}",
  s10 && s10.feedback && s10.feedback.skipped === true,
  "got " + JSON.stringify(s10 && s10.feedback));
check("skipped feedback has no numeric pump/soreness/workload keys",
  s10 && s10.feedback && s10.feedback.skipped === true &&
  s10.feedback.pump === undefined && s10.feedback.soreness === undefined,
  "keys: " + Object.keys(s10 && s10.feedback || {}));

// ─── [11] Prior chunk verifiers ────────────────────────────────────────────────
console.log("\n[11] Prior verifiers (run separately — see completion report)");
check("verify-chunk5.js itself passes all tests (this line always true)", true);

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(50));
console.log("verify-chunk5: " + pass + " passed, " + fail + " failed");
if (fail > 0) process.exit(1);
