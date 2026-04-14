// ============================================================
// MARCUS FILLY FUNCTIONAL BODYBUILDING (4-Day)
// ============================================================
const FILLY_PROGRAM = [
  { id:1, name:"Upper A — Push", sub:"PreFatigue → Intensity → Balance", blocks:[
    { id:"fb1-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.bikerg, { sets:1, reps:300, rest:0, notes:"5 min easy" }),
      mkSets(LIB_BY_ID.bandpullapart, { sets:2, reps:15, rest:0 }),
      mkSets(LIB_BY_ID.scappushup, { sets:2, reps:10, rest:0 })
    ]},
    { id:"fb1-pf", letter:"PF", name:"PreFatigue", exercises:[
      mkSets(LIB_BY_ID.latraise, { sets:2, reps:15, rest:30, tempo:"2-0-1-0", notes:"Light. Activate shoulders before pressing." }),
      mkSets(LIB_BY_ID.facepull, { sets:2, reps:15, rest:30, tempo:"2-0-1-0", notes:"Warm up rear delts and upper back." })
    ]},
    { id:"fb1-is", letter:"IS", name:"Intensity SuperSet", exercises:[
      mkSets(LIB_BY_ID.cgbench, { sets:4, reps:5, rest:60, tempo:"20X0", notes:"Every 90s alternating. Explosive press off chest." }),
      mkSets(LIB_BY_ID.gorillarow, { sets:4, reps:8, rest:60, tempo:"2-0-1-1", notes:"Every 90s alternating. Control each rep." })
    ]},
    { id:"fb1-sb", letter:"SB", name:"Strength Balance", exercises:[
      mkSets(LIB_BY_ID.inclinedb, { sets:3, reps:10, rest:45, tempo:"3-0-1-0", notes:"Giant set: 3 rounds. Slow eccentric." }),
      mkSets(LIB_BY_ID.ringrow, { sets:3, reps:12, rest:45, tempo:"2-0-1-1", notes:"Giant set with press and pullover." }),
      mkSets(LIB_BY_ID.dbpullover, { sets:3, reps:12, rest:60, tempo:"3-0-1-0", notes:"Full lat stretch. 60s rest after round." })
    ]},
  ]},
  { id:2, name:"Lower A — Squat", sub:"PreFatigue → Intensity → Balance", blocks:[
    { id:"fb2-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.rower, { sets:1, reps:1000, rest:0, notes:"5 min easy" }),
      mkSets(LIB_BY_ID.cossacksquat, { sets:2, reps:8, rest:0 }),
      mkSets(LIB_BY_ID.hipswitch, { sets:2, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.deadbug, { sets:2, reps:10, rest:0 })
    ]},
    { id:"fb2-pf", letter:"PF", name:"PreFatigue", exercises:[
      mkSets(LIB_BY_ID.calfraise, { sets:2, reps:15, rest:30, tempo:"2-1-1-0", notes:"Light. Wake up lower legs." }),
      mkSets(LIB_BY_ID.deadbug, { sets:2, reps:10, rest:30, notes:"Activate core before squatting." })
    ]},
    { id:"fb2-is", letter:"IS", name:"Intensity SuperSet", exercises:[
      mkSets(LIB_BY_ID.frontsquat, { sets:4, reps:5, rest:60, tempo:"30X0", notes:"Every 90s alternating. 3-sec descent, explosive up." }),
      mkSets(LIB_BY_ID.rdl, { sets:4, reps:8, rest:60, tempo:"3-0-1-1", notes:"Every 90s alternating. Tempo control." })
    ]},
    { id:"fb2-sb", letter:"SB", name:"Strength Balance", exercises:[
      mkSets(LIB_BY_ID.bulgarian, { sets:3, reps:8, rest:45, tempo:"3-0-1-0", notes:"Giant set: 3 rounds. Each side." }),
      mkSets(LIB_BY_ID.stepup, { sets:3, reps:10, rest:45, notes:"Giant set. Drive through heel." }),
      mkSets(LIB_BY_ID.plank, { sets:3, reps:30, rest:60, notes:"30-sec hold. Complete the round." })
    ]},
  ]},
  { id:3, name:"Upper B — Pull", sub:"PreFatigue → Intensity → Balance", blocks:[
    { id:"fb3-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.skierg, { sets:1, reps:300, rest:0, notes:"5 min easy" }),
      mkSets(LIB_BY_ID.bandpullapart, { sets:2, reps:15, rest:0 }),
      mkSets(LIB_BY_ID.scappushup, { sets:2, reps:10, rest:0 })
    ]},
    { id:"fb3-pf", letter:"PF", name:"PreFatigue", exercises:[
      mkSets(LIB_BY_ID.revfly, { sets:2, reps:15, rest:30, tempo:"2-0-1-0", notes:"Light. Activate rear delts." }),
      mkSets(LIB_BY_ID.latraise, { sets:2, reps:15, rest:30, tempo:"2-0-1-0", notes:"Pre-fatigue shoulders before pulling." })
    ]},
    { id:"fb3-is", letter:"IS", name:"Intensity SuperSet", exercises:[
      mkSets(LIB_BY_ID.weightedpullup, { sets:4, reps:4, rest:60, tempo:"20X0", notes:"Every 90s alternating. Explosive pull." }),
      mkSets(LIB_BY_ID.inclinedb, { sets:4, reps:8, rest:60, tempo:"3-0-1-0", notes:"Every 90s alternating. Slow eccentric." })
    ]},
    { id:"fb3-sb", letter:"SB", name:"Strength Balance", exercises:[
      mkSets(LIB_BY_ID.csrow, { sets:3, reps:10, rest:45, tempo:"2-0-1-1", notes:"Giant set: 3 rounds. Squeeze at top." }),
      mkSets(LIB_BY_ID.facepull, { sets:3, reps:12, rest:45, tempo:"2-1-2-0", notes:"Giant set with row and curl." }),
      mkSets(LIB_BY_ID.hammer, { sets:3, reps:12, rest:60, tempo:"2-0-1-0", notes:"End of round. 60s rest." })
    ]},
  ]},
  { id:4, name:"Lower B — Hinge", sub:"PreFatigue → Intensity → Balance", blocks:[
    { id:"fb4-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.bikerg, { sets:1, reps:300, rest:0, notes:"5 min easy" }),
      mkSets(LIB_BY_ID.cossacksquat, { sets:2, reps:8, rest:0 }),
      mkSets(LIB_BY_ID.wgs, { sets:2, reps:5, rest:0 })
    ]},
    { id:"fb4-pf", letter:"PF", name:"PreFatigue", exercises:[
      mkSets(LIB_BY_ID.legcurl, { sets:2, reps:12, rest:30, tempo:"2-0-1-0", notes:"Light. Pre-fatigue hamstrings." }),
      mkSets(LIB_BY_ID.cossacksquat, { sets:2, reps:8, rest:30, notes:"Mobility + adductor activation." })
    ]},
    { id:"fb4-is", letter:"IS", name:"Intensity SuperSet", exercises:[
      mkSets(LIB_BY_ID.trapbar, { sets:4, reps:5, rest:60, tempo:"20X0", notes:"Every 90s alternating. Explosive pull." }),
      mkSets(LIB_BY_ID.bulgarian, { sets:4, reps:6, rest:60, tempo:"3-0-1-0", notes:"Every 90s alternating. Slow descent." })
    ]},
    { id:"fb4-sb", letter:"SB", name:"Strength Balance", exercises:[
      mkSets(LIB_BY_ID.hipthrust, { sets:3, reps:10, rest:45, tempo:"2-2-1-0", notes:"Giant set: 3 rounds. 2-sec squeeze at top." }),
      mkSets(LIB_BY_ID.slrdl, { sets:3, reps:8, rest:45, tempo:"3-0-1-1", notes:"Giant set. Balance + hamstring loading." }),
      mkSets(LIB_BY_ID.pallof, { sets:3, reps:10, rest:60, notes:"Each side. 60s rest after round." })
    ]},
  ]},
];