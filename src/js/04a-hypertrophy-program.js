// ============================================================
// HYPERTROPHY PPL+UL (5-Day)
// ============================================================
const PROGRAM_HYPERTROPHY = [
  { id:1, name:"Push — Chest & Delts", sub:"Stretch-biased pressing + lateral delt focus", blocks:[
    { id:"hy1-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.bikerg, { sets:1, reps:60, rest:0, notes:"5 min easy" }),
      mkSets(LIB_BY_ID.bandpullapart, { sets:2, reps:15, rest:0 }),
      mkSets(LIB_BY_ID.scappushup, { sets:2, reps:10, rest:0 })
    ]},
    { id:"hy1-a", letter:"A", name:"Compound Press", exercises:[
      mkSets(LIB_BY_ID.incbench, { sets:4, reps:8, rest:90, tempo:"3-0-1-0", notes:"Stretch at bottom. Add weight when all sets hit 10 reps." })
    ]},
    { id:"hy1-b", letter:"B", name:"Stretch Superset", exercises:[
      mkSets(LIB_BY_ID.inclinedb, { sets:3, reps:12, rest:60, tempo:"3-0-1-0", notes:"Deep stretch at bottom. Hypertrophy range." }),
      mkSets(LIB_BY_ID.cablefly, { sets:3, reps:15, rest:60, tempo:"2-1-1-0", notes:"Cable from low position. Full stretch." })
    ]},
    { id:"hy1-c", letter:"C", name:"Delt Focus", exercises:[
      mkSets(LIB_BY_ID.latraise, { sets:4, reps:15, rest:45, tempo:"2-1-1-0", notes:"Partial reps at end of set if needed. Lateral delt priority." }),
      mkSets(LIB_BY_ID.arnold, { sets:3, reps:12, rest:60, tempo:"2-0-1-0", notes:"Full rotation. Shoulder cap work." })
    ]},
    { id:"hy1-d", letter:"D", name:"Triceps + Pump", exercises:[
      mkSets(LIB_BY_ID.pushdown, { sets:3, reps:15, rest:45, notes:"Squeeze at lockout." }),
      mkSets(LIB_BY_ID.dip, { sets:3, reps:12, rest:60, tempo:"2-0-1-0", notes:"Lean forward for chest. Bodyweight or weighted." })
    ]},
  ]},
  { id:2, name:"Pull — Back & Biceps", sub:"Width + thickness + stretch-biased curls", blocks:[
    { id:"hy2-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.rower, { sets:1, reps:60, rest:0, notes:"5 min easy" }),
      mkSets(LIB_BY_ID.bandpullapart, { sets:2, reps:15, rest:0 }),
      mkSets(LIB_BY_ID.thoracicrot, { sets:2, reps:8, rest:0 })
    ]},
    { id:"hy2-a", letter:"A", name:"Vertical Pull", exercises:[
      mkSets(LIB_BY_ID.pullup, { sets:4, reps:8, rest:90, notes:"Add weight when all sets hit 10. Width builder." })
    ]},
    { id:"hy2-b", letter:"B", name:"Row Superset", exercises:[
      mkSets(LIB_BY_ID.csrow, { sets:4, reps:10, rest:60, tempo:"2-1-1-1", notes:"Chest supported — full scapular retraction." }),
      mkSets(LIB_BY_ID.sarow, { sets:3, reps:10, rest:60, tempo:"2-0-1-1", notes:"Single-arm for anti-rotation and stretch." })
    ]},
    { id:"hy2-c", letter:"C", name:"Stretch Pulls", exercises:[
      mkSets(LIB_BY_ID.dbpullover, { sets:3, reps:12, rest:60, tempo:"3-0-1-0", notes:"Full lat stretch overhead. Controlled arc." }),
      mkSets(LIB_BY_ID.facepull, { sets:3, reps:15, rest:45, tempo:"2-1-2-0", notes:"Rear delt + upper back health." })
    ]},
    { id:"hy2-d", letter:"D", name:"Bicep Focus", exercises:[
      mkSets(LIB_BY_ID.inclinecurl, { sets:3, reps:12, rest:60, tempo:"3-0-1-0", notes:"Stretch-biased. Incline = longer muscle length." }),
      mkSets(LIB_BY_ID.hammer, { sets:3, reps:12, rest:45, notes:"Brachialis + forearm." })
    ]},
  ]},
  { id:3, name:"Legs — Quads & Hams", sub:"High-volume squat + hinge hypertrophy", blocks:[
    { id:"hy3-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.bikerg, { sets:1, reps:60, rest:0, notes:"5 min easy" }),
      mkSets(LIB_BY_ID.cossacksquat, { sets:2, reps:8, rest:0 }),
      mkSets(LIB_BY_ID.deadbug, { sets:2, reps:10, rest:0 })
    ]},
    { id:"hy3-a", letter:"A", name:"Primary Squat", exercises:[
      mkSets(LIB_BY_ID.backsquat, { sets:4, reps:8, rest:120, tempo:"3-0-1-0", notes:"Controlled descent. Progress when all sets reach 10." })
    ]},
    { id:"hy3-b", letter:"B", name:"Quad Superset", exercises:[
      mkSets(LIB_BY_ID.legpress, { sets:3, reps:12, rest:90, notes:"Full depth. High foot = glute bias, low foot = quad bias." }),
      mkSets(LIB_BY_ID.legext, { sets:3, reps:15, rest:45, tempo:"2-1-1-0", notes:"Squeeze at lockout. Quad isolation." })
    ]},
    { id:"hy3-c", letter:"C", name:"Posterior Chain", exercises:[
      mkSets(LIB_BY_ID.rdl, { sets:3, reps:10, rest:90, tempo:"3-0-1-1", notes:"Hamstring stretch under load. Go deep." }),
      mkSets(LIB_BY_ID.legcurl, { sets:3, reps:12, rest:45, tempo:"2-1-1-0", notes:"Slow negative. Full ROM." })
    ]},
    { id:"hy3-d", letter:"D", name:"Calves", exercises:[
      mkSets(LIB_BY_ID.calfraise, { sets:4, reps:15, rest:45, tempo:"2-1-1-0", notes:"Stretch at bottom. Full range." }),
      mkSets(LIB_BY_ID.seatedcalfraise, { sets:3, reps:15, rest:45, tempo:"2-1-1-0", notes:"Soleus emphasis. Seated." })
    ]},
  ]},
  { id:4, name:"Upper — Strength Hybrid", sub:"Heavier compound pressing + pulling", blocks:[
    { id:"hy4-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.skierg, { sets:1, reps:60, rest:0, notes:"5 min easy" }),
      mkSets(LIB_BY_ID.bandpullapart, { sets:2, reps:15, rest:0 }),
      mkSets(LIB_BY_ID.scappushup, { sets:2, reps:10, rest:0 })
    ]},
    { id:"hy4-a", letter:"A", name:"Heavy Press", exercises:[
      mkSets(LIB_BY_ID.bench, { sets:4, reps:6, rest:120, tempo:"2-1-1-0", notes:"Strength range. Add weight when all sets hit 8." })
    ]},
    { id:"hy4-b", letter:"B", name:"Pull + Press Pair", exercises:[
      mkSets(LIB_BY_ID.bbrow, { sets:4, reps:8, rest:90, tempo:"2-0-1-1", notes:"Match pressing volume. Squeeze at top." }),
      mkSets(LIB_BY_ID.dbshoulder, { sets:3, reps:10, rest:60, tempo:"2-0-1-0", notes:"Moderate load. Full overhead lockout." })
    ]},
    { id:"hy4-c", letter:"C", name:"Delt + Back Balance", exercises:[
      mkSets(LIB_BY_ID.latraise, { sets:3, reps:15, rest:45, notes:"Lateral delt — never skip." }),
      mkSets(LIB_BY_ID.revfly, { sets:3, reps:15, rest:45, tempo:"2-1-1-0", notes:"Rear delt balance. Posture." })
    ]},
    { id:"hy4-d", letter:"D", name:"Arms Superset", exercises:[
      mkSets(LIB_BY_ID.bbcurl, { sets:3, reps:10, rest:60, notes:"Straight bar. Squeeze at top." }),
      mkSets(LIB_BY_ID.skullcrusher, { sets:3, reps:10, rest:60, tempo:"3-0-1-0", notes:"Stretch at bottom. Tricep long head." })
    ]},
  ]},
  { id:5, name:"Lower — Glute & Single-Leg", sub:"Hip-dominant + unilateral emphasis", blocks:[
    { id:"hy5-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.rower, { sets:1, reps:60, rest:0, notes:"5 min easy" }),
      mkSets(LIB_BY_ID.hipswitch, { sets:2, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.wgs, { sets:2, reps:5, rest:0 })
    ]},
    { id:"hy5-a", letter:"A", name:"Hip Hinge", exercises:[
      mkSets(LIB_BY_ID.deadlift, { sets:4, reps:6, rest:150, tempo:"2-0-1-0", notes:"Moderate-heavy. Strength foundation for the week." })
    ]},
    { id:"hy5-b", letter:"B", name:"Glute Builders", exercises:[
      mkSets(LIB_BY_ID.hipthrust, { sets:3, reps:12, rest:90, tempo:"2-2-1-0", notes:"2-sec squeeze at top. Glute max." }),
      mkSets(LIB_BY_ID.bulgarian, { sets:3, reps:10, rest:60, tempo:"3-0-1-0", notes:"Forward lean for glute bias. Each side." })
    ]},
    { id:"hy5-c", letter:"C", name:"Hamstrings", exercises:[
      mkSets(LIB_BY_ID.slrdl, { sets:3, reps:10, rest:60, tempo:"3-0-1-1", notes:"Single-leg stretch. Balance + load." }),
      mkSets(LIB_BY_ID.nordiccurl, { sets:3, reps:5, rest:60, notes:"Eccentric focus. Use band assist if needed." })
    ]},
    { id:"hy5-d", letter:"D", name:"Calves + Core", exercises:[
      mkSets(LIB_BY_ID.calfraise, { sets:3, reps:15, rest:45, notes:"Standing. Full stretch." }),
      mkSets(LIB_BY_ID.hanglegr, { sets:3, reps:10, rest:60, notes:"Core finisher." })
    ]},
  ]},
];
