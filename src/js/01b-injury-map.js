// ============================================================
// INJURY → EXERCISE MAP
// ============================================================
// Lives ahead of 04e-periodization.js on purpose. The stock programs in
// 07a-generated-programs.js are built at script load, and generateWeek()
// filters by the user's stored injuries. A const declared later in the
// bundle is in its temporal dead zone at that moment, and `typeof` does
// not guard a TDZ binding: any user with a flagged injury got a
// ReferenceError on every launch (Nick, 2026-10-08).
// Exercise IDs flagged per injury category (warning chip shown, nothing removed)
const INJURY_EXERCISE_MAP = {
  lowerback: ["deadlift","sumo","trapbar","rdl","slrdl","goodmorning","kbswing",
               "backsquat","frontsquat","ssbsquat","pausesquat"],
  knees:     ["backsquat","frontsquat","pausesquat","ssbsquat","ohsquat","goblet",
               "bulgarian","stepup"],
  shoulders: ["strictpress","pushpress","logpress","bench","incbench","tempobench",
               "cgbench","floorpress","dbbench","inclinedb","dbshoulder","hkpress",
               "arnold","pushup","dip","pullup","weightedpullup","chinup",
               "pulldown","facepull"]
};
