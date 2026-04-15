// ============================================================
// PERIODIZATION ENGINE
// ============================================================

// --- Phase allocation ---

function allocatePhases(totalWeeks, config) {
  const phases = [];
  let used = 0;
  config.forEach(function(p, i) {
    var isLast = i === config.length - 1;
    var n = isLast ? totalWeeks - used : Math.max(1, Math.round(totalWeeks * p.ratio));
    var weeks = [];
    for (var w = used + 1; w <= Math.min(used + n, totalWeeks); w++) weeks.push(w);
    phases.push({ name: p.name, weeks: weeks, color: p.color, description: p.description });
    used += weeks.length;
  });
  return phases;
}

function phaseForWeek(phases, wk) {
  return phases.find(function(p) { return p.weeks.includes(wk); }) || phases[phases.length - 1];
}

function weekInPhase(phases, wk) {
  var p = phaseForWeek(phases, wk);
  return p ? p.weeks.indexOf(wk) : 0;
}

// --- Rotation helpers ---

function pick(arr, wk) { return arr[(wk - 1) % arr.length]; }
function pickEvery(arr, wk, n) { return arr[Math.floor((wk - 1) / n) % arr.length]; }

// --- Exercise pools by movement pattern + equipment ---

var POOLS = {
  squat_primary:   { full:["backsquat","frontsquat","ssbsquat","pausesquat"], barbell:["backsquat","frontsquat","pausesquat"], bodyweight:["goblet","jumpsquat"] },
  squat_secondary: { full:["legpress","bulgarian","goblet","reverselunge","stepup","legext"], barbell:["bulgarian","goblet","reverselunge","stepup"], bodyweight:["cossacksquat","bulgarian","reverselunge","stepup","jumpsquat"] },
  hinge_primary:   { full:["deadlift","sumo","trapbar"], barbell:["deadlift","sumo"], bodyweight:["kbswing","slrdl"] },
  hinge_secondary: { full:["rdl","slrdl","goodmorning","hipthrust","legcurl","nordiccurl","kbswing","gluebridge"], barbell:["rdl","slrdl","goodmorning","hipthrust","nordiccurl","kbswing"], bodyweight:["slrdl","nordiccurl","gluebridge","kbswing"] },
  push_primary:    { full:["bench","incbench","cgbench","floorpress"], barbell:["bench","incbench","cgbench","floorpress"], bodyweight:["dip","pushup"] },
  push_secondary:  { full:["dbbench","inclinedb","tempobench","cablefly","pecfly","dip"], barbell:["dbbench","inclinedb","tempobench","dip"], bodyweight:["dip","pushup"] },
  press_primary:   { full:["strictpress","pushpress","logpress"], barbell:["strictpress","pushpress"], bodyweight:["hkpress","dbshoulder"] },
  press_secondary: { full:["dbshoulder","hkpress","arnold"], barbell:["dbshoulder","hkpress","arnold"], bodyweight:["hkpress"] },
  pull_horizontal: { full:["bbrow","pendlayrow","csrow","sarow","cablerow","gorillarow","meadowsrow"], barbell:["bbrow","pendlayrow","sarow","gorillarow"], bodyweight:["ringrow","bandrow","gorillarow"] },
  pull_vertical:   { full:["weightedpullup","pullup","chinup","pulldown"], barbell:["pullup","chinup","weightedpullup"], bodyweight:["pullup","chinup","ringrow"] },
  delt:            { full:["latraise","revfly","facepull","frontraise","arnold","uprightrow"], barbell:["latraise","revfly","facepull","frontraise","arnold"], bodyweight:["bandpullapart","revfly","latraise"] },
  bicep:           { full:["bbcurl","dbcurl","hammer","inclinecurl","cablecurl"], barbell:["bbcurl","dbcurl","hammer","inclinecurl"], bodyweight:["chinup","bandrow"] },
  tricep:          { full:["pushdown","skullcrusher","ohtri","dip"], barbell:["skullcrusher","ohtri","dip"], bodyweight:["dip","pushup"] },
  core:            { full:["pallof","hangingkr","hanglegr","abwheel","plank","sideplank","deadbug","tgu"], barbell:["hangingkr","hanglegr","abwheel","plank","sideplank","deadbug","tgu"], bodyweight:["plank","sideplank","deadbug","hangingkr","abwheel"] },
  carry:           { full:["farmers","safwalk","yoke","sledpush"], barbell:["farmers","safwalk"], bodyweight:["farmers","safwalk"] },
  glute:           { full:["hipthrust","gluebridge","dbhipabduction","bulgarian","reverselunge","kbswing"], barbell:["hipthrust","gluebridge","dbhipabduction","kbswing"], bodyweight:["gluebridge","dbhipabduction","reverselunge","kbswing"] },
  conditioning:    { full:["assaultbike","echobike","rower","wallball","burpee","boxjump","medballslam","kbswing","sledpush"], barbell:["rower","burpee","boxjump","kbswing"], bodyweight:["burpee","boxjump","jumpsquat"] },
  power:           { full:["hangpowerclean","pushpress","boxjump","jumpsquat","medballslam","kbswing"], barbell:["pushpress","boxjump","jumpsquat","kbswing"], bodyweight:["boxjump","jumpsquat","burpee"] },
  kot:             { full:["tibraise","atgsplit","slantboardsquat","poliquat","reversesled","nordiccurl","calfraise"], barbell:["tibraise","atgsplit","slantboardsquat","poliquat","nordiccurl","calfraise"], bodyweight:["tibraise","atgsplit","slantboardsquat","poliquat","nordiccurl"] },
  warmup_cardio:   { full:["rower","bikerg","skierg","stairmaster"], barbell:["rower","bikerg","treadmill"], bodyweight:["treadmill","jumpsquat","burpee"] }
};

// --- Pool access with equipment + injury filtering ---

function getInjuredExercises(injuries) {
  var injured = new Set();
  if (!injuries) return injured;
  for (var i = 0; i < injuries.length; i++) {
    if (injuries[i] === "none") continue;
    var ids = (typeof INJURY_EXERCISE_MAP !== "undefined") && INJURY_EXERCISE_MAP[injuries[i]];
    if (ids) ids.forEach(function(id) { injured.add(id); });
  }
  return injured;
}

function getPool(poolName, equipment, injuredIds) {
  var p = POOLS[poolName];
  if (!p) return [];
  var base = p[equipment] || p.full || [];
  if (!injuredIds || !injuredIds.size) return base;
  var filtered = base.filter(function(id) { return !injuredIds.has(id); });
  return filtered.length > 0 ? filtered : base;
}

// --- User profile helper ---

function getUserProfile() {
  var s = loadStore();
  var ob = s.onboarding || {};
  return {
    equipment: ob.equipment || "full",
    injuries: ob.injuries || ["none"],
    experience: ob.experience || "intermediate",
    goal: ob.goal || "general",
    daysPerWeek: ob.days || 5,
    age: ob.age || "30to40",
    duration: ob.duration || 60,
    bodyGoal: ob.bodyGoal || "muscle",
    gender: ob.gender || "skip"
  };
}

// --- Loading schemes: style × phase × weekInPhase ---

var LOADING = {
  me: {
    Accumulation:    [{ s:4, r:5, rest:180, t:"3-1-1-0", n:"Build to heavy 5s. Leave 1-2 in reserve." }, { s:4, r:5, rest:180, t:"3-1-1-0", n:"Match or beat last week." }, { s:4, r:3, rest:210, t:"3-1-1-0", n:"Heavy triples." }, { s:3, r:5, rest:150, t:"2-0-1-0", n:"Back-off week. Same load as week 1." }],
    Intensification: [{ s:5, r:3, rest:210, t:"2-1-1-0", n:"Work to heavy triples." }, { s:5, r:2, rest:210, t:"2-1-1-0", n:"Heavy doubles." }, { s:5, r:2, rest:240, t:"2-1-1-0", n:"Heavier doubles. Grind." }, { s:4, r:2, rest:240, t:"2-1-1-0", n:"Top set + back-offs." }],
    Peak:            [{ s:3, r:2, rest:240, t:"2-1-1-0", n:"Near-max doubles." }, { s:3, r:1, rest:300, t:"", n:"Heavy single. Test day." }],
    Deload:          [{ s:3, r:5, rest:120, t:"2-0-1-0", n:"DELOAD: ~60% working weight." }]
  },
  de: {
    Accumulation:    [{ s:8, r:3, rest:60, t:"X-0-X-0", n:"65% 1RM. Max bar speed." }, { s:8, r:3, rest:60, t:"X-0-X-0", n:"68% 1RM. Fast and crisp." }, { s:8, r:2, rest:60, t:"X-0-X-0", n:"70% 1RM. Speed priority." }, { s:6, r:3, rest:45, t:"X-0-X-0", n:"65% 1RM. Light speed work." }],
    Intensification: [{ s:8, r:2, rest:60, t:"X-0-X-0", n:"72% 1RM. Explosive." }, { s:8, r:2, rest:60, t:"X-0-X-0", n:"75% 1RM. Max speed." }, { s:6, r:2, rest:75, t:"X-0-X-0", n:"78% 1RM. Heavy speed." }, { s:6, r:2, rest:60, t:"X-0-X-0", n:"72% 1RM. Back-off wave." }],
    Peak:            [{ s:6, r:1, rest:90, t:"X-0-X-0", n:"80% 1RM. Speed singles." }, { s:5, r:1, rest:90, t:"X-0-X-0", n:"82% 1RM. Max intent." }],
    Deload:          [{ s:5, r:3, rest:60, t:"X-0-X-0", n:"DELOAD: 60% 1RM. Easy speed." }]
  },
  compound: {
    Accumulation:    [{ s:4, r:8, rest:120, t:"2-0-1-0", n:"Moderate load." }, { s:4, r:8, rest:120, t:"2-0-1-0", n:"Slight increase." }, { s:4, r:6, rest:150, t:"2-0-1-0", n:"Heavier. Fewer reps." }, { s:3, r:8, rest:120, t:"2-0-1-0", n:"Back-off." }],
    Intensification: [{ s:5, r:5, rest:150, t:"2-1-1-0", n:"Strength range." }, { s:5, r:4, rest:180, t:"2-1-1-0", n:"Heavier." }, { s:5, r:3, rest:180, t:"2-1-1-0", n:"Heavy triples." }, { s:4, r:3, rest:180, t:"2-1-1-0", n:"Top set + back-offs." }],
    Peak:            [{ s:4, r:3, rest:210, t:"2-1-1-0", n:"Heavy." }, { s:3, r:2, rest:240, t:"", n:"Near-max." }],
    Deload:          [{ s:3, r:8, rest:90, t:"2-0-1-0", n:"DELOAD: light." }]
  },
  accessory: {
    Accumulation:    [{ s:3, r:12, rest:60, t:"2-0-1-0" }, { s:3, r:12, rest:60, t:"2-0-1-0" }, { s:4, r:10, rest:60, t:"2-0-1-0" }, { s:3, r:10, rest:60, t:"2-0-1-0" }],
    Intensification: [{ s:4, r:8,  rest:90, t:"2-0-1-0" }, { s:4, r:8,  rest:90, t:"2-0-1-0" }, { s:4, r:6,  rest:90, t:"2-0-1-0" }, { s:3, r:6,  rest:90, t:"2-0-1-0" }],
    Peak:            [{ s:3, r:8, rest:60, t:"2-0-1-0" }, { s:3, r:8, rest:60, t:"2-0-1-0" }],
    Deload:          [{ s:2, r:12, rest:45, t:"2-0-1-0" }]
  },
  isolation: {
    Accumulation:    [{ s:3, r:15, rest:45, t:"2-1-1-0" }, { s:3, r:15, rest:45, t:"2-1-1-0" }, { s:3, r:12, rest:45, t:"2-1-1-0" }, { s:3, r:12, rest:45, t:"2-1-1-0" }],
    Intensification: [{ s:3, r:12, rest:60, t:"2-1-1-0" }, { s:4, r:10, rest:60, t:"2-1-1-0" }, { s:4, r:10, rest:60, t:"2-1-1-0" }, { s:3, r:10, rest:60, t:"2-1-1-0" }],
    Peak:            [{ s:3, r:10, rest:45, t:"2-1-1-0" }, { s:3, r:10, rest:45, t:"2-1-1-0" }],
    Deload:          [{ s:2, r:15, rest:30, t:"2-0-1-0" }]
  },
  tempo: {
    Accumulation:    [{ s:3, r:10, rest:60, t:"4-1-1-0", n:"Slow eccentric. Feel the stretch." }, { s:3, r:10, rest:60, t:"4-1-1-0", n:"Same tempo, slightly heavier." }, { s:4, r:8, rest:60, t:"3-1-1-0", n:"Moderate tempo." }, { s:3, r:8, rest:60, t:"3-0-1-0", n:"Light tempo work." }],
    Intensification: [{ s:4, r:8, rest:75, t:"3-1-1-0", n:"Heavier tempo." }, { s:4, r:6, rest:90, t:"3-1-1-0", n:"Heavy tempo." }, { s:4, r:6, rest:90, t:"2-1-1-0", n:"Moderate tempo, heavy load." }, { s:3, r:6, rest:90, t:"2-0-1-0", n:"Reduced tempo, maintain load." }],
    Peak:            [{ s:4, r:5, rest:90, t:"2-1-1-0", n:"Heavy." }, { s:3, r:5, rest:90, t:"2-0-1-0", n:"Near-max." }],
    Deload:          [{ s:3, r:10, rest:45, t:"3-0-1-0", n:"DELOAD: light tempo work." }]
  },
  rpt: {
    Accumulation:    [{ s:3, r:6, rest:180, t:"2-0-1-0", n:"RPT: Top set heavy, drop 10% per set." }, { s:3, r:6, rest:180, t:"2-0-1-0", n:"RPT: Beat last week's top set." }, { s:3, r:5, rest:180, t:"2-0-1-0", n:"RPT: Heavier top set, drop 10%." }, { s:2, r:6, rest:150, t:"2-0-1-0", n:"RPT: Light top set. Back-off." }],
    Intensification: [{ s:3, r:5, rest:210, t:"2-0-1-0", n:"RPT: Heavy top set of 5, drop 10%." }, { s:3, r:4, rest:210, t:"2-0-1-0", n:"RPT: Top set of 4, drop 10%." }, { s:3, r:3, rest:240, t:"2-0-1-0", n:"RPT: Top set of 3, drop 10%." }, { s:2, r:4, rest:210, t:"2-0-1-0", n:"RPT: Moderate top set. Back-off." }],
    Peak:            [{ s:2, r:3, rest:240, t:"", n:"RPT: Near-max set of 3, one drop set." }, { s:2, r:2, rest:300, t:"", n:"RPT: Heavy double, one back-off." }],
    Deload:          [{ s:2, r:8, rest:120, t:"2-0-1-0", n:"RPT DELOAD: Light top set." }]
  },
  power: {
    Accumulation:    [{ s:4, r:5, rest:90, t:"X-0-X-0", n:"Explosive. Full extension." }, { s:4, r:5, rest:90, t:"X-0-X-0", n:"Maintain speed." }, { s:3, r:5, rest:90, t:"X-0-X-0", n:"Quality reps." }, { s:3, r:5, rest:60, t:"X-0-X-0", n:"Back-off." }],
    Intensification: [{ s:5, r:3, rest:120, t:"X-0-X-0", n:"Max power output." }, { s:5, r:3, rest:120, t:"X-0-X-0", n:"Heavier power." }, { s:4, r:3, rest:120, t:"X-0-X-0", n:"Peak power." }, { s:4, r:3, rest:90, t:"X-0-X-0", n:"Maintain." }],
    Peak:            [{ s:4, r:2, rest:150, t:"X-0-X-0", n:"Max intent." }, { s:3, r:2, rest:150, t:"X-0-X-0", n:"Peak." }],
    Deload:          [{ s:3, r:5, rest:60, t:"X-0-X-0", n:"DELOAD: easy power." }]
  },
  wendler531: {
    Accumulation:    [{ s:3, r:5, rest:180, t:"", n:"5s Week: 65% × 5, 75% × 5, 85% × 5+ AMRAP." }, { s:3, r:3, rest:210, t:"", n:"3s Week: 70% × 3, 80% × 3, 90% × 3+ AMRAP." }, { s:3, r:1, rest:240, t:"", n:"1s Week: 75% × 5, 85% × 3, 95% × 1+ AMRAP." }, { s:3, r:5, rest:120, t:"", n:"5s Week: new cycle. Add 5 lbs upper / 10 lbs lower." }],
    Intensification: [{ s:3, r:5, rest:180, t:"", n:"5s Week: 65% × 5, 75% × 5, 85% × 5+ AMRAP." }, { s:3, r:3, rest:210, t:"", n:"3s Week: 70% × 3, 80% × 3, 90% × 3+ AMRAP." }, { s:3, r:1, rest:240, t:"", n:"1s Week: 75% × 5, 85% × 3, 95% × 1+ AMRAP." }, { s:3, r:5, rest:180, t:"", n:"5s Week: heavier cycle." }],
    Peak:            [{ s:3, r:3, rest:210, t:"", n:"3s Week: push for PR on AMRAP set." }, { s:3, r:1, rest:240, t:"", n:"1s Week: go for a big AMRAP." }],
    Deload:          [{ s:3, r:5, rest:120, t:"", n:"DELOAD: 40% × 5, 50% × 5, 60% × 5. Easy." }]
  },
  gzcl_t1: {
    Accumulation:    [{ s:5, r:3, rest:180, t:"2-0-1-0", n:"T1: Heavy compound. Build to a tough triple." }, { s:5, r:3, rest:180, t:"2-0-1-0", n:"T1: Match or beat last week." }, { s:6, r:2, rest:210, t:"2-0-1-0", n:"T1: Heavy doubles." }, { s:4, r:3, rest:150, t:"2-0-1-0", n:"T1: Back-off." }],
    Intensification: [{ s:6, r:2, rest:210, t:"2-0-1-0", n:"T1: Heavy doubles." }, { s:8, r:1, rest:210, t:"", n:"T1: Heavy singles." }, { s:10, r:1, rest:240, t:"", n:"T1: Max singles. Push it." }, { s:5, r:2, rest:180, t:"2-0-1-0", n:"T1: Back-off doubles." }],
    Peak:            [{ s:5, r:1, rest:240, t:"", n:"T1: Test. Work to heavy single." }, { s:3, r:1, rest:300, t:"", n:"T1: True max attempt." }],
    Deload:          [{ s:4, r:3, rest:120, t:"2-0-1-0", n:"T1 DELOAD: ~60% load." }]
  },
  gzcl_t2: {
    Accumulation:    [{ s:3, r:10, rest:90, t:"2-0-1-0", n:"T2: Moderate compound. Controlled reps." }, { s:3, r:10, rest:90, t:"2-0-1-0", n:"T2: Same or slightly heavier." }, { s:3, r:8, rest:90, t:"2-0-1-0", n:"T2: Heavier, fewer reps." }, { s:3, r:10, rest:60, t:"2-0-1-0", n:"T2: Back-off." }],
    Intensification: [{ s:3, r:8, rest:90, t:"2-0-1-0", n:"T2: Moderate-heavy." }, { s:3, r:8, rest:90, t:"2-0-1-0", n:"T2: Push load." }, { s:3, r:6, rest:120, t:"2-0-1-0", n:"T2: Heavy 6s." }, { s:3, r:8, rest:90, t:"2-0-1-0", n:"T2: Maintain." }],
    Peak:            [{ s:3, r:6, rest:120, t:"2-0-1-0", n:"T2: Heavy." }, { s:3, r:6, rest:120, t:"2-0-1-0", n:"T2: Support main lift." }],
    Deload:          [{ s:2, r:10, rest:60, t:"2-0-1-0", n:"T2 DELOAD: light." }]
  },
  gvt: {
    Accumulation:    [{ s:10, r:10, rest:60, t:"4-0-2-0", n:"GVT: 10×10 @55%. Tempo is king. Don't rush." }, { s:10, r:10, rest:60, t:"4-0-2-0", n:"GVT: 10×10 @55-58%. Maintain all 100 reps." }, { s:10, r:10, rest:60, t:"4-0-2-0", n:"GVT: 10×10 @58-60%. This will burn." }, { s:8, r:10, rest:60, t:"4-0-2-0", n:"GVT: 8×10 back-off. Same weight." }],
    Intensification: [{ s:10, r:10, rest:60, t:"4-0-2-0", n:"GVT: 10×10 @60%. New base." }, { s:10, r:10, rest:60, t:"4-0-2-0", n:"GVT: 10×10 @60-63%." }, { s:10, r:8, rest:75, t:"4-0-2-0", n:"GVT: 10×8 @65%. Heavier, fewer reps." }, { s:8, r:8, rest:75, t:"4-0-2-0", n:"GVT: 8×8 back-off." }],
    Peak:            [{ s:10, r:6, rest:90, t:"3-0-2-0", n:"GVT: 10×6 @70%. Heavy volume." }, { s:8, r:6, rest:90, t:"3-0-2-0", n:"GVT: 8×6 @72%. Peak volume." }],
    Deload:          [{ s:6, r:10, rest:60, t:"4-0-2-0", n:"GVT DELOAD: 6×10 @50%. Easy movement." }]
  }
};

function getLoading(style, phaseName, wip) {
  var scheme = LOADING[style];
  if (!scheme) return { s:3, r:10, rest:60, t:"", n:"" };
  var phase = scheme[phaseName] || scheme.Deload;
  var entry = phase[Math.min(wip, phase.length - 1)];
  return { sets: entry.s, reps: entry.r, rest: entry.rest, tempo: entry.t || "", notes: entry.n || "" };
}

function adjustForExperience(loading, experience) {
  if (experience === "beginner") {
    return Object.assign({}, loading, {
      sets: Math.max(2, loading.sets - 1),
      reps: loading.reps + 2,
      rest: loading.rest + 30,
      notes: loading.notes + (loading.notes ? " " : "") + "Focus on form."
    });
  }
  if (experience === "advanced") {
    return Object.assign({}, loading, { sets: loading.sets + 1 });
  }
  return loading;
}

// --- Warmup builder ---

var WU_MOBILITY = [
  ["cossacksquat","bandpullapart","wgs"],
  ["hipswitch","scappushup","inchworm"],
  ["goblet","thoracicrot","deadbug"],
  ["spiderman","bandpullapart","hipswitch"],
  ["wgs","scappushup","cossacksquat"],
  ["inchworm","deadbug","thoracicrot"],
  ["hipswitch","wgs","spiderman"],
  ["cossacksquat","scappushup","deadbug"],
  ["goblet","bandpullapart","inchworm"],
  ["spiderman","thoracicrot","wgs"],
  ["deadbug","hipswitch","bandpullapart"],
  ["inchworm","cossacksquat","scappushup"]
];

function buildWarmup(blockId, weekNum, equipment, injuredIds) {
  var cardioPool = getPool("warmup_cardio", equipment, injuredIds);
  var cardioId = pick(cardioPool, weekNum);
  var cardio = LIB_BY_ID[cardioId];
  var mobSet = WU_MOBILITY[(weekNum - 1) % WU_MOBILITY.length];
  var exercises = [
    mkSets(cardio, { sets:1, reps: cardio.isDistance ? 250 : 60, rest:0, notes:"5 min easy" })
  ];
  mobSet.forEach(function(id) {
    var ex = LIB_BY_ID[id];
    if (ex) exercises.push(mkSets(ex, { sets:2, reps: ex.isTime ? 30 : (ex.perSide ? 5 : 10), rest:0 }));
  });
  return { id: blockId, letter: "WU", name: "Warm-Up", type: "warmup", exercises: exercises };
}

// --- Finisher/conditioning loading ---

function getFinisherLoading(exId) {
  var ex = LIB_BY_ID[exId];
  if (!ex) return { sets:3, reps:1, rest:90, tempo:"", notes:"" };
  if (ex.isDistance) return { sets:4, reps:40, rest:90, tempo:"", notes:"Full effort." };
  if (ex.isTime)    return { sets:6, reps:20, rest:40, tempo:"", notes:"Max effort intervals." };
  if (ex.bodyweight) return { sets:3, reps:10, rest:60, tempo:"", notes:"Push the pace." };
  return { sets:3, reps:8, rest:60, tempo:"", notes:"" };
}

// --- Day builder from config ---

function buildDayFromConfig(dayCfg, dayId, weekNum, phaseName, wip, equipment, injuredIds, experience) {
  var pfx = "d" + dayId;
  var blocks = [];
  var primaryName = "";

  dayCfg.blocks.forEach(function(bCfg, bi) {
    if (bCfg.type === "warmup") {
      blocks.push(buildWarmup(pfx + "-wu", weekNum, equipment, injuredIds));
      return;
    }

    var blockLetter = bCfg.letter.toLowerCase().replace(/[^a-z0-9]/g, "");
    var blockId = pfx + "-" + blockLetter;
    var exercises = [];

    (bCfg.slots || []).forEach(function(slot, si) {
      var pool = getPool(slot.pool, equipment, injuredIds);
      if (!pool.length) return;

      var offset = dayId * 7 + bi * 3 + si;
      var rotateN = slot.rotateEvery || 1;
      var exId = rotateN > 1 ? pickEvery(pool, weekNum + offset, rotateN) : pick(pool, weekNum + offset);
      var exRef = LIB_BY_ID[exId];
      if (!exRef) return;

      var loading;
      if (slot.loading === "finisher") {
        loading = getFinisherLoading(exId);
      } else {
        loading = getLoading(slot.loading, phaseName, wip);
        loading = adjustForExperience(loading, experience);
      }

      exercises.push(mkSets(exRef, loading));

      if (bi === 1 && si === 0) primaryName = exRef.name;
    });

    if (exercises.length) {
      blocks.push({ id: blockId, letter: bCfg.letter, name: bCfg.name, exercises: exercises });
    }
  });

  return {
    id: dayId,
    name: dayCfg.name,
    sub: (primaryName ? primaryName + " · " : "") + phaseName,
    blocks: blocks
  };
}

// --- Master generator ---

function generateWeek(templateId, weekNum, totalWeeks) {
  var cfg = typeof PROGRAM_CONFIGS !== "undefined" && PROGRAM_CONFIGS[templateId];
  if (!cfg) return null;

  var profile = getUserProfile();
  var injuredIds = getInjuredExercises(profile.injuries);
  var phases = allocatePhases(totalWeeks, cfg.phaseConfig);
  var phase = phaseForWeek(phases, weekNum);
  var phaseName = phase ? phase.name : "Deload";
  var wip = weekInPhase(phases, weekNum);

  return cfg.days.map(function(dayCfg, di) {
    return buildDayFromConfig(dayCfg, di + 1, weekNum, phaseName, wip, profile.equipment, injuredIds, profile.experience);
  });
}

// --- Resolution wrapper ---

function resolveWeekProgram(templateId, weekNum, totalWeeks) {
  var generated = generateWeek(templateId, weekNum, totalWeeks);
  if (generated) return generated;
  // Fallback: legacy template without config
  var tpl = PROGRAM_TEMPLATES.find(function(t) { return t.id === templateId; });
  if (!tpl) return null;
  return deepClone(tpl.baseDays || tpl.days);
}
