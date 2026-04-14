// ============================================================
// ATHLETIC PERFORMANCE (4-Day)
// ============================================================
const PROGRAM_ATHLETIC = [
  { id:1, name:"Lower Power", sub:"Jumps + explosive hinge + carries", blocks:[
    { id:"at1-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.rower, { sets:3, reps:200, rest:0 }),
      mkSets(LIB_BY_ID.cossacksquat, { sets:2, reps:8, rest:0 }),
      mkSets(LIB_BY_ID.inchworm, { sets:2, reps:6, rest:0 }),
      mkSets(LIB_BY_ID.deadbug, { sets:2, reps:10, rest:0 })
    ]},
    { id:"at1-a", letter:"A", name:"Plyometrics", exercises:[
      mkSets(LIB_BY_ID.boxjump, { sets:4, reps:5, rest:90, notes:"Step down, don't jump down. Full hip extension at top. Max height." }),
      mkSets(LIB_BY_ID.jumpsquat, { sets:3, reps:6, rest:60, notes:"Bodyweight. Soft landing. Explode up." })
    ]},
    { id:"at1-b", letter:"B", name:"Explosive Hinge", exercises:[
      mkSets(LIB_BY_ID.trapbar, { sets:5, reps:3, rest:120, tempo:"X-0-X-0", notes:"75-80% 1RM. Max bar speed. Reset each rep." })
    ]},
    { id:"at1-c", letter:"C", name:"Strength Pair", exercises:[
      mkSets(LIB_BY_ID.backsquat, { sets:4, reps:5, rest:150, tempo:"2-1-1-0", notes:"Submaximal ~80%. Build base strength." }),
      mkSets(LIB_BY_ID.slrdl, { sets:3, reps:8, rest:60, tempo:"3-0-1-1", notes:"Single-leg stability + hamstring." })
    ]},
    { id:"at1-d", letter:"D", name:"Carry Finisher", exercises:[
      mkSets(LIB_BY_ID.sledpush, { sets:4, reps:1, rest:90, notes:"4 × 40m. Drive hard through legs. Full-body conditioning." })
    ]},
  ]},
  { id:2, name:"Upper Power", sub:"Throws + speed press + pulls", blocks:[
    { id:"at2-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.skierg, { sets:1, reps:60, rest:0, notes:"5 min easy" }),
      mkSets(LIB_BY_ID.bandpullapart, { sets:2, reps:15, rest:0 }),
      mkSets(LIB_BY_ID.scappushup, { sets:2, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.thoracicrot, { sets:2, reps:8, rest:0 })
    ]},
    { id:"at2-a", letter:"A", name:"Power Output", exercises:[
      mkSets(LIB_BY_ID.medballslam, { sets:3, reps:8, rest:60, notes:"Full overhead extension → slam. Power output." }),
      mkSets(LIB_BY_ID.pushpress, { sets:4, reps:3, rest:120, notes:"Explosive dip-drive. Use leg power." })
    ]},
    { id:"at2-b", letter:"B", name:"Speed Press", exercises:[
      mkSets(LIB_BY_ID.bench, { name:"Speed Bench Press", sets:6, reps:3, rest:60, tempo:"X-0-X-0", notes:"65-70% 1RM. Max bar speed. Vary grip weekly." })
    ]},
    { id:"at2-c", letter:"C", name:"Pull + Core", exercises:[
      mkSets(LIB_BY_ID.weightedpullup, { sets:4, reps:5, rest:90, notes:"Strength pull. Add weight progressively." }),
      mkSets(LIB_BY_ID.hangingkr, { sets:3, reps:10, rest:60, notes:"Core stability under fatigue." })
    ]},
    { id:"at2-d", letter:"D", name:"Conditioning", exercises:[
      mkSets(LIB_BY_ID.assaultbike, { sets:6, reps:20, rest:40, notes:"6 × 20s ON / 40s OFF. Max effort sprints." })
    ]},
  ]},
  { id:3, name:"Lower Strength", sub:"Heavy squat + hinge + single-leg", blocks:[
    { id:"at3-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.bikerg, { sets:1, reps:60, rest:0, notes:"5 min easy" }),
      mkSets(LIB_BY_ID.goblet, { sets:2, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.hipswitch, { sets:2, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.wgs, { sets:2, reps:5, rest:0 })
    ]},
    { id:"at3-a", letter:"A", name:"Primary Squat", exercises:[
      mkSets(LIB_BY_ID.frontsquat, { sets:5, reps:3, rest:180, tempo:"3-1-1-0", notes:"Work to heavy 3RM. Upright torso. Rotate variation every 4 weeks." })
    ]},
    { id:"at3-b", letter:"B", name:"Hinge + Accessory", exercises:[
      mkSets(LIB_BY_ID.rdl, { sets:4, reps:6, rest:120, tempo:"3-0-1-1", notes:"Heavy submaximal. Hamstring + posterior chain." }),
      mkSets(LIB_BY_ID.reverselunge, { sets:3, reps:8, rest:60, tempo:"2-0-1-0", notes:"Each side. Controlled step-back." })
    ]},
    { id:"at3-c", letter:"C", name:"Posterior Chain", exercises:[
      mkSets(LIB_BY_ID.hipthrust, { sets:3, reps:8, rest:90, tempo:"2-2-1-0", notes:"Heavy. 2-sec hold at top." }),
      mkSets(LIB_BY_ID.goodmorning, { sets:3, reps:8, rest:90, tempo:"3-0-1-0", notes:"Moderate load. Back and hamstring." })
    ]},
    { id:"at3-d", letter:"D", name:"Conditioning", exercises:[
      mkSets(LIB_BY_ID.farmers, { sets:4, reps:1, rest:60, notes:"4 × 40m. EMOM style — go every 60s." })
    ]},
  ]},
  { id:4, name:"Upper Strength", sub:"Heavy press + row + power finisher", blocks:[
    { id:"at4-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.rower, { sets:3, reps:200, rest:0 }),
      mkSets(LIB_BY_ID.bandpullapart, { sets:2, reps:15, rest:0 }),
      mkSets(LIB_BY_ID.spiderman, { sets:2, reps:5, rest:0 }),
      mkSets(LIB_BY_ID.scappushup, { sets:2, reps:10, rest:0 })
    ]},
    { id:"at4-a", letter:"A", name:"Primary Press", exercises:[
      mkSets(LIB_BY_ID.strictpress, { sets:5, reps:3, rest:180, tempo:"2-1-1-0", notes:"Work to heavy 3RM. Rotate: strict, incline bench, CG bench." })
    ]},
    { id:"at4-b", letter:"B", name:"Heavy Pull", exercises:[
      mkSets(LIB_BY_ID.pendlayrow, { sets:4, reps:5, rest:120, notes:"Dead stop each rep. Explosive off floor." }),
      mkSets(LIB_BY_ID.chinup, { sets:4, reps:6, rest:90, notes:"Supinated grip. Bodyweight or weighted." })
    ]},
    { id:"at4-c", letter:"C", name:"Shoulder Health", exercises:[
      mkSets(LIB_BY_ID.hkpress, { sets:3, reps:8, rest:60, notes:"Each side. Core + shoulder stability." }),
      mkSets(LIB_BY_ID.facepull, { sets:3, reps:12, rest:60, tempo:"2-1-2-0", notes:"Rear delt + rotator cuff." })
    ]},
    { id:"at4-d", letter:"D", name:"Power Finisher", exercises:[
      mkSets(LIB_BY_ID.hangpowerclean, { sets:5, reps:3, rest:90, notes:"Moderate load. Clean technique — full hip extension." })
    ]},
  ]},
];
