// ============================================================
// GLUTE BUILDER ADD-ON (2-Day)
// ============================================================
const PROGRAM_GLUTES = [
  { id:1, name:"Glute Focus A — Max & Posterior", sub:"Hip thrusts, deep squats, RDLs", blocks:[
    { id:"gl1-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.bikerg, { sets:1, reps:60, rest:0, notes:"5 min easy" }),
      mkSets(LIB_BY_ID.hipswitch, { sets:2, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.cossacksquat, { sets:2, reps:8, rest:0 }),
      mkSets(LIB_BY_ID.gluebridge, { sets:2, reps:12, rest:0, notes:"Bodyweight activation." })
    ]},
    { id:"gl1-a", letter:"A", name:"Primary Glute", exercises:[
      mkSets(LIB_BY_ID.hipthrust, { sets:4, reps:10, rest:90, tempo:"2-2-1-0", notes:"2-sec squeeze at top. Progressive overload — add weight when all sets hit 12." })
    ]},
    { id:"gl1-b", letter:"B", name:"Deep Squat + Hinge", exercises:[
      mkSets(LIB_BY_ID.goblet, { sets:3, reps:12, rest:60, tempo:"3-1-1-0", notes:"ATG depth. Pause at bottom. Forward lean for glute bias." }),
      mkSets(LIB_BY_ID.rdl, { sets:3, reps:10, rest:90, tempo:"3-0-1-1", notes:"Full hamstring stretch. Heavy posterior chain." })
    ]},
    { id:"gl1-c", letter:"C", name:"Single-Leg", exercises:[
      mkSets(LIB_BY_ID.bulgarian, { sets:3, reps:10, rest:60, tempo:"3-0-1-0", notes:"Forward trunk lean = more glute activation. Each side." }),
      mkSets(LIB_BY_ID.stepup, { sets:3, reps:10, rest:60, notes:"High box. Drive through heel. Each side. Highest glute EMG of any lower exercise." })
    ]},
    { id:"gl1-d", letter:"D", name:"Burnout", exercises:[
      mkSets(LIB_BY_ID.gluebridge, { sets:3, reps:20, rest:45, notes:"Light or bodyweight. High-rep pump finisher." })
    ]},
  ]},
  { id:2, name:"Glute Focus B — Med/Min & Unilateral", sub:"Abductions, single-leg RDLs, step-ups", blocks:[
    { id:"gl2-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.bikerg, { sets:1, reps:60, rest:0, notes:"5 min easy" }),
      mkSets(LIB_BY_ID.wgs, { sets:2, reps:5, rest:0 }),
      mkSets(LIB_BY_ID.deadbug, { sets:2, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.dbhipabduction, { sets:2, reps:15, rest:0, notes:"Band around knees. Activation." })
    ]},
    { id:"gl2-a", letter:"A", name:"Hip Abduction", exercises:[
      mkSets(LIB_BY_ID.dbhipabduction, { sets:4, reps:15, rest:45, notes:"Banded. Side-lying or standing. Each side. Glute med priority." })
    ]},
    { id:"gl2-b", letter:"B", name:"Unilateral Posterior", exercises:[
      mkSets(LIB_BY_ID.slrdl, { sets:3, reps:10, rest:60, tempo:"3-0-1-1", notes:"KB opposite hand. Glute and hamstring stretch. Each side." }),
      mkSets(LIB_BY_ID.reverselunge, { sets:3, reps:10, rest:60, tempo:"2-0-1-0", notes:"Long step back = more glute. Each side." })
    ]},
    { id:"gl2-c", letter:"C", name:"Hip Extension", exercises:[
      mkSets(LIB_BY_ID.hipthrust, { sets:3, reps:12, rest:60, tempo:"2-1-1-0", notes:"Single-leg or banded variation. Moderate load." }),
      mkSets(LIB_BY_ID.stepup, { sets:3, reps:10, rest:60, notes:"Lateral step-up variation if available. Each side." })
    ]},
    { id:"gl2-d", letter:"D", name:"Burnout", exercises:[
      mkSets(LIB_BY_ID.dbhipabduction, { sets:2, reps:20, rest:30, notes:"Banded. Burn it out. Glute med endurance." })
    ]},
  ]},
];
