// ============================================================
// JASON BROWN FUNCTIONAL CONJUGATE (3-Day Full Body)
// ============================================================
const JBROWN_PROGRAM = [
  { id:1, name:"Heavy Full Body A", sub:"ME Lower Focus + Conditioning", blocks:[
    { id:"jb1-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.rower, { sets:3, reps:200, rest:0 }),
      mkSets(LIB_BY_ID.cossacksquat, { sets:3, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.bandpullapart, { sets:3, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.wgs, { sets:3, reps:5, rest:0 })
    ]},
    { id:"jb1-a", letter:"A", name:"Max Effort Lower", exercises:[
      mkSets(LIB_BY_ID.frontsquat, { sets:4, reps:3, rest:180, tempo:"3-1-1-0", notes:"Work to a heavy 3RM. Rotate variation every 3 weeks." })
    ]},
    { id:"jb1-b", letter:"B", name:"Compound Pair", exercises:[
      mkSets(LIB_BY_ID.floorpress, { sets:4, reps:5, rest:90, tempo:"2-1-1-0", notes:"Moderate load ~75%. Controlled press." }),
      mkSets(LIB_BY_ID.csrow, { sets:4, reps:8, rest:90, tempo:"2-1-1-0", notes:"Squeeze at top. Match pressing volume." })
    ]},
    { id:"jb1-c", letter:"C", name:"Full Body Circuit", exercises:[
      mkSets(LIB_BY_ID.kbswing, { sets:3, reps:12, rest:45, notes:"Circuit: KBs → Step-ups → Pull-aparts. Minimal rest between." }),
      mkSets(LIB_BY_ID.stepup, { sets:3, reps:8, rest:45, notes:"Alternating legs. Controlled step." }),
      mkSets(LIB_BY_ID.bandpullapart, { sets:3, reps:15, rest:60, notes:"End of circuit round. 60s rest, then repeat." })
    ]},
    { id:"jb1-d", letter:"D", name:"Conditioning", exercises:[
      mkSets(LIB_BY_ID.rower, { name:"3 Rounds: 250m Row / 15 KB Swings / 10 Push-Ups", sets:3, reps:1, rest:90, notes:"Functional capacity. 8-12 min total." })
    ]},
  ]},
  { id:2, name:"Heavy Full Body B", sub:"ME Upper Focus + Conditioning", blocks:[
    { id:"jb2-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.rower, { sets:3, reps:200, rest:0 }),
      mkSets(LIB_BY_ID.scappushup, { sets:3, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.facepull, { sets:3, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.hipswitch, { sets:3, reps:5, rest:0 })
    ]},
    { id:"jb2-a", letter:"A", name:"Max Effort Upper", exercises:[
      mkSets(LIB_BY_ID.trapbar, { sets:4, reps:5, rest:180, tempo:"2-1-1-0", notes:"Heavy submaximal ~80-85%. Full hip extension." }),
      mkSets(LIB_BY_ID.weightedpullup, { sets:4, reps:4, rest:120, notes:"Add weight progressively. Bodyweight if needed." })
    ]},
    { id:"jb2-b", letter:"B", name:"Accessory Pair", exercises:[
      mkSets(LIB_BY_ID.rdl, { sets:3, reps:8, rest:90, tempo:"3-0-1-1", notes:"Slow eccentric, feel the hamstrings." }),
      mkSets(LIB_BY_ID.facepull, { sets:3, reps:12, rest:60, tempo:"2-1-2-0", notes:"Shoulder health + rear delt work." })
    ]},
    { id:"jb2-c", letter:"C", name:"Core + Carry", exercises:[
      mkSets(LIB_BY_ID.pallof, { sets:3, reps:10, rest:60, notes:"Anti-rotation. Each side." }),
      mkSets(LIB_BY_ID.farmers, { sets:3, reps:40, rest:90, notes:"3 x 40m. Grip, core, full-body tension." })
    ]},
    { id:"jb2-d", letter:"D", name:"Conditioning", exercises:[
      mkSets(LIB_BY_ID.assaultbike, { sets:5, reps:20, rest:40, notes:"5 x 20s ON / 40s OFF. Max effort sprints." })
    ]},
  ]},
  { id:3, name:"Speed / Dynamic", sub:"DE Full Body + Conditioning", blocks:[
    { id:"jb3-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.rower, { sets:3, reps:200, rest:0 }),
      mkSets(LIB_BY_ID.goblet, { sets:3, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.bandpullapart, { sets:3, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.inchworm, { sets:3, reps:5, rest:0 })
    ]},
    { id:"jb3-a", letter:"A", name:"Dynamic Effort", exercises:[
      mkSets(LIB_BY_ID.deadlift, { name:"Speed Deadlift", sets:6, reps:2, rest:60, tempo:"X-0-X-0", notes:"70-75% 1RM. Reset each rep. Max bar speed." })
    ]},
    { id:"jb3-b", letter:"B", name:"Push + Pull", exercises:[
      mkSets(LIB_BY_ID.floorpress, { name:"Speed Floor Press", sets:6, reps:3, rest:60, tempo:"X-0-X-0", notes:"60-65% 1RM. Explosive off the floor." }),
      mkSets(LIB_BY_ID.csrow, { sets:4, reps:8, rest:60, tempo:"2-1-1-0", notes:"Controlled pulling to balance speed work." })
    ]},
    { id:"jb3-c", letter:"C", name:"Full Body Circuit", exercises:[
      mkSets(LIB_BY_ID.goblet, { sets:3, reps:10, rest:45, notes:"Circuit: Goblet squats → KB swings → Push-ups. Minimal rest." }),
      mkSets(LIB_BY_ID.kbswing, { sets:3, reps:15, rest:45, notes:"Explosive hip drive." }),
      mkSets(LIB_BY_ID.pushup, { sets:3, reps:12, rest:60, notes:"End of circuit round. 60s rest, repeat." })
    ]},
    { id:"jb3-d", letter:"D", name:"Conditioning", exercises:[
      mkSets(LIB_BY_ID.rower, { name:"AMRAP 10min: 200m Row / 10 KB Swings / 8 Burpees", sets:1, reps:1, rest:0, notes:"Sustained effort. Work capacity finisher." })
    ]},
  ]},
];