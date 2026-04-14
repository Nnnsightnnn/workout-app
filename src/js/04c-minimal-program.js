// ============================================================
// MINIMAL EQUIPMENT FULL BODY (3-Day)
// ============================================================
const PROGRAM_MINIMAL = [
  { id:1, name:"Full Body A — Squat & Push", sub:"KB squats, push-ups, pull-ups, carries", blocks:[
    { id:"mn1-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.inchworm, { sets:2, reps:6, rest:0 }),
      mkSets(LIB_BY_ID.cossacksquat, { sets:2, reps:8, rest:0 }),
      mkSets(LIB_BY_ID.bandpullapart, { sets:2, reps:15, rest:0 }),
      mkSets(LIB_BY_ID.deadbug, { sets:2, reps:10, rest:0 })
    ]},
    { id:"mn1-a", letter:"A", name:"Strength Circuit", exercises:[
      mkSets(LIB_BY_ID.goblet, { sets:4, reps:10, rest:60, tempo:"3-0-1-0", notes:"Heavy KB. Pause at bottom. Progress to 4×12 before adding weight." }),
      mkSets(LIB_BY_ID.pushup, { sets:4, reps:12, rest:60, tempo:"2-0-1-0", notes:"Chest to floor. Elevate feet for progression." })
    ]},
    { id:"mn1-b", letter:"B", name:"Pull + Press", exercises:[
      mkSets(LIB_BY_ID.pullup, { sets:4, reps:6, rest:90, notes:"Band-assisted if needed. Progress reps before removing band." }),
      mkSets(LIB_BY_ID.hkpress, { sets:3, reps:8, rest:60, notes:"Each side. KB overhead press from half-kneeling." })
    ]},
    { id:"mn1-c", letter:"C", name:"Accessory Pair", exercises:[
      mkSets(LIB_BY_ID.bandrow, { sets:3, reps:15, rest:45, notes:"Band anchored at chest height. Squeeze shoulder blades." }),
      mkSets(LIB_BY_ID.bandpullapart, { sets:3, reps:15, rest:30, notes:"High rep. Rear delt and posture." })
    ]},
    { id:"mn1-d", letter:"D", name:"Density Finisher", exercises:[
      mkSets(LIB_BY_ID.kbswing, { name:"AMRAP 8min: 15 KB Swings / 10 Goblet Squats / 5 Push-Ups", sets:1, reps:1, rest:0, notes:"Set timer for 8 minutes. Max rounds. Track rounds for progression." })
    ]},
  ]},
  { id:2, name:"Full Body B — Hinge & Pull", sub:"Swings, rows, TGU, core", blocks:[
    { id:"mn2-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.spiderman, { sets:2, reps:5, rest:0 }),
      mkSets(LIB_BY_ID.hipswitch, { sets:2, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.scappushup, { sets:2, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.wgs, { sets:2, reps:5, rest:0 })
    ]},
    { id:"mn2-a", letter:"A", name:"Hinge Power", exercises:[
      mkSets(LIB_BY_ID.kbswing, { sets:5, reps:15, rest:60, notes:"Heavy KB. Full hip snap. Submaximal sets — leave 2 reps in tank." })
    ]},
    { id:"mn2-b", letter:"B", name:"Pull + Core", exercises:[
      mkSets(LIB_BY_ID.chinup, { sets:4, reps:6, rest:90, notes:"Supinated grip. Slow negative if fewer than 6." }),
      mkSets(LIB_BY_ID.gorillarow, { sets:4, reps:8, rest:60, notes:"Double KB from floor. Anti-rotation pull." })
    ]},
    { id:"mn2-c", letter:"C", name:"Strength + Stability", exercises:[
      mkSets(LIB_BY_ID.tgu, { sets:3, reps:2, rest:60, notes:"Each side. Full get-up. Total-body coordination." }),
      mkSets(LIB_BY_ID.plank, { sets:3, reps:30, rest:45, notes:"30-sec hold. Squeeze everything." })
    ]},
    { id:"mn2-d", letter:"D", name:"Density Finisher", exercises:[
      mkSets(LIB_BY_ID.burpee, { name:"AMRAP 8min: 10 KB Swings / 8 Gorilla Rows / 6 Burpees", sets:1, reps:1, rest:0, notes:"Set timer for 8 minutes. Max rounds. Track rounds for progression." })
    ]},
  ]},
  { id:3, name:"Full Body C — Single-Leg & Carry", sub:"Lunges, cleans, carries, density work", blocks:[
    { id:"mn3-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.thoracicrot, { sets:2, reps:8, rest:0 }),
      mkSets(LIB_BY_ID.cossacksquat, { sets:2, reps:8, rest:0 }),
      mkSets(LIB_BY_ID.inchworm, { sets:2, reps:6, rest:0 }),
      mkSets(LIB_BY_ID.deadbug, { sets:2, reps:10, rest:0 })
    ]},
    { id:"mn3-a", letter:"A", name:"Single-Leg Strength", exercises:[
      mkSets(LIB_BY_ID.reverselunge, { sets:4, reps:8, rest:60, notes:"KB in goblet position. Each side. Controlled step-back." }),
      mkSets(LIB_BY_ID.bulgarian, { sets:3, reps:8, rest:60, notes:"Rear foot elevated. KB goblet hold. Each side." })
    ]},
    { id:"mn3-b", letter:"B", name:"KB Complex", exercises:[
      mkSets(LIB_BY_ID.kbclean, { sets:4, reps:6, rest:90, notes:"Each side. Clean to rack, press overhead, lower. Full-body compound." }),
      mkSets(LIB_BY_ID.slrdl, { sets:3, reps:8, rest:60, notes:"KB in opposite hand. Balance + hamstring." })
    ]},
    { id:"mn3-c", letter:"C", name:"Push + Pull", exercises:[
      mkSets(LIB_BY_ID.pushup, { sets:3, reps:15, rest:45, notes:"Vary hand width. Diamond, wide, or deficit." }),
      mkSets(LIB_BY_ID.bandrow, { sets:3, reps:15, rest:45, notes:"Anchored band. High-rep back work." })
    ]},
    { id:"mn3-d", letter:"D", name:"Density Finisher", exercises:[
      mkSets(LIB_BY_ID.farmers, { name:"EMOM 10min: Odd — 30s KB Carry / Even — 10 Push-Ups + 10 Swings", sets:1, reps:1, rest:0, notes:"KB farmer carry. Track total rounds completed." })
    ]},
  ]},
];
