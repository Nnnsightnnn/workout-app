// ============================================================
// PROGRAM CONFIGURATIONS — slot-based day templates
// ============================================================
// Each program defines: phaseConfig (periodization phases), days (block/slot structure).
// Slots reference exercise pools from POOLS + a loading style from LOADING.
// The periodization engine (04e) generates concrete workouts from these configs.
// rotateEvery: N = exercise changes every N weeks (default 1 = every week).

var PROGRAM_CONFIGS = {

  // ---- 5-Day Conjugate ----
  conjugate5: {
    phaseConfig: [
      { name:"Accumulation",    ratio:0.35, color:"#ff6b35", description:"Build volume — moderate weight, higher reps" },
      { name:"Intensification", ratio:0.35, color:"#ff2d55", description:"Increase intensity — heavier loads, lower reps" },
      { name:"Peak",            ratio:0.15, color:"#bf5af2", description:"Peak performance — near-max loads" },
      { name:"Deload",          ratio:0.15, color:"#64d2ff", description:"Recovery — reduce load, focus on form" }
    ],
    days: [
      { name:"Lower Body — Strength", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A1", name:"Max Effort", slots:[{ pool:"squat_primary", loading:"me", rotateEvery:3 }] },
        { letter:"B",  name:"Upper Superset", slots:[{ pool:"push_secondary", loading:"accessory" }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"Posterior + Core", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] },
        { letter:"D",  name:"Finisher", slots:[{ pool:"carry", loading:"finisher" }] }
      ]},
      { name:"Upper Body — Strength", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A1", name:"Max Effort", slots:[{ pool:"press_primary", loading:"me", rotateEvery:3 }] },
        { letter:"B",  name:"Heavy Pull", slots:[{ pool:"hinge_primary", loading:"compound" }, { pool:"pull_vertical", loading:"accessory" }] },
        { letter:"C",  name:"Single-Leg + Carry", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"carry", loading:"finisher" }] },
        { letter:"D",  name:"Conditioning", slots:[{ pool:"conditioning", loading:"finisher" }] }
      ]},
      { name:"Lower Body — Power", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A1", name:"Dynamic Effort", slots:[{ pool:"hinge_primary", loading:"de", rotateEvery:4 }] },
        { letter:"B",  name:"Push + Pull", slots:[{ pool:"push_secondary", loading:"accessory" }, { pool:"delt", loading:"isolation" }] },
        { letter:"C",  name:"Single-Leg + Core", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] },
        { letter:"D",  name:"Conditioning", slots:[{ pool:"conditioning", loading:"finisher" }] }
      ]},
      { name:"Upper Body — Power", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A1", name:"Dynamic Effort", slots:[{ pool:"push_primary", loading:"de", rotateEvery:4 }] },
        { letter:"B",  name:"Squat + Row", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:3 }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"Press + Hinge", slots:[{ pool:"press_secondary", loading:"accessory" }, { pool:"hinge_secondary", loading:"accessory" }] },
        { letter:"D",  name:"Conditioning", slots:[{ pool:"conditioning", loading:"finisher" }] }
      ]},
      { name:"Full Body — Conditioning", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Conditioning Circuit", slots:[{ pool:"conditioning", loading:"finisher" }] },
        { letter:"B",  name:"Arms Superset", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"tricep", loading:"isolation" }] },
        { letter:"C",  name:"Shoulders Superset", slots:[{ pool:"delt", loading:"isolation" }, { pool:"delt", loading:"isolation" }] },
        { letter:"D",  name:"Core Circuit", slots:[{ pool:"core", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]}
    ]
  },

  // ---- 3-Day Functional Conjugate (Jason Brown) ----
  jbrown3: {
    phaseConfig: [
      { name:"Accumulation",    ratio:0.35, color:"#ff6b35", description:"Build base — moderate loads, full body volume" },
      { name:"Intensification", ratio:0.35, color:"#ff2d55", description:"Push intensity — heavier compound work" },
      { name:"Peak",            ratio:0.15, color:"#bf5af2", description:"Test strength — near-max effort" },
      { name:"Deload",          ratio:0.15, color:"#64d2ff", description:"Recovery week" }
    ],
    days: [
      { name:"Heavy Full Body A", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A1", name:"Max Effort Lower", slots:[{ pool:"squat_primary", loading:"me", rotateEvery:3 }] },
        { letter:"B",  name:"Upper Push + Pull", slots:[{ pool:"push_primary", loading:"compound" }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"Posterior + Core", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] },
        { letter:"D",  name:"Conditioning", slots:[{ pool:"conditioning", loading:"finisher" }] }
      ]},
      { name:"Heavy Full Body B", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A1", name:"Max Effort Upper", slots:[{ pool:"press_primary", loading:"me", rotateEvery:3 }] },
        { letter:"B",  name:"Hinge + Pull", slots:[{ pool:"hinge_primary", loading:"compound" }, { pool:"pull_vertical", loading:"accessory" }] },
        { letter:"C",  name:"Single-Leg + Shoulders", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"delt", loading:"isolation" }] },
        { letter:"D",  name:"Conditioning", slots:[{ pool:"conditioning", loading:"finisher" }] }
      ]},
      { name:"Speed + Conditioning", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A1", name:"Dynamic Effort", slots:[{ pool:"hinge_primary", loading:"de", rotateEvery:4 }] },
        { letter:"B",  name:"Power Circuit", slots:[{ pool:"power", loading:"power" }, { pool:"carry", loading:"finisher" }] },
        { letter:"C",  name:"Arms + Core", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"core", loading:"accessory" }] },
        { letter:"D",  name:"Finisher", slots:[{ pool:"conditioning", loading:"finisher" }] }
      ]}
    ]
  },

  // ---- 4-Day Functional Bodybuilding (Filly) ----
  filly4: {
    phaseConfig: [
      { name:"Accumulation",    ratio:0.40, color:"#ff6b35", description:"Tempo-driven volume — stretch and control" },
      { name:"Intensification", ratio:0.35, color:"#ff2d55", description:"Heavier tempo work — build strength" },
      { name:"Peak",            ratio:0.10, color:"#bf5af2", description:"Strength expression" },
      { name:"Deload",          ratio:0.15, color:"#64d2ff", description:"Recovery — light tempo" }
    ],
    days: [
      { name:"Upper A — Push", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"PF", name:"PreFatigue", slots:[{ pool:"delt", loading:"tempo" }, { pool:"push_secondary", loading:"tempo" }] },
        { letter:"IS", name:"Intensity Set", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"SB", name:"Strength Balance", slots:[{ pool:"pull_horizontal", loading:"accessory" }, { pool:"tricep", loading:"isolation" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Lower A — Squat", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"PF", name:"PreFatigue", slots:[{ pool:"squat_secondary", loading:"tempo" }, { pool:"glute", loading:"tempo" }] },
        { letter:"IS", name:"Intensity Set", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"SB", name:"Strength Balance", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"squat_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Upper B — Pull", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"PF", name:"PreFatigue", slots:[{ pool:"delt", loading:"tempo" }, { pool:"pull_horizontal", loading:"tempo" }] },
        { letter:"IS", name:"Intensity Set", slots:[{ pool:"pull_vertical", loading:"compound", rotateEvery:3 }] },
        { letter:"SB", name:"Strength Balance", slots:[{ pool:"push_secondary", loading:"accessory" }, { pool:"bicep", loading:"isolation" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Lower B — Hinge", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"PF", name:"PreFatigue", slots:[{ pool:"glute", loading:"tempo" }, { pool:"hinge_secondary", loading:"tempo" }] },
        { letter:"IS", name:"Intensity Set", slots:[{ pool:"hinge_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"SB", name:"Strength Balance", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"hinge_secondary", loading:"accessory" }, { pool:"carry", loading:"finisher" }] }
      ]}
    ]
  },

  // ---- 5-Day Hypertrophy PPL+UL ----
  hypertrophy5: {
    phaseConfig: [
      { name:"Accumulation",    ratio:0.40, color:"#ff6b35", description:"High volume — moderate weight, stretch-biased" },
      { name:"Intensification", ratio:0.35, color:"#ff2d55", description:"Progressive overload — heavier loads" },
      { name:"Deload",          ratio:0.25, color:"#64d2ff", description:"Recovery — reduce volume, maintain movement" }
    ],
    days: [
      { name:"Push — Chest & Delts", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Compound Press", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Stretch Superset", slots:[{ pool:"push_secondary", loading:"accessory" }, { pool:"push_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Delt Focus", slots:[{ pool:"delt", loading:"isolation" }, { pool:"delt", loading:"isolation" }] },
        { letter:"D",  name:"Triceps + Pump", slots:[{ pool:"tricep", loading:"isolation" }, { pool:"push_secondary", loading:"isolation" }] }
      ]},
      { name:"Pull — Back & Biceps", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Vertical Pull", slots:[{ pool:"pull_vertical", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Row Superset", slots:[{ pool:"pull_horizontal", loading:"accessory" }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"Stretch Pulls", slots:[{ pool:"pull_horizontal", loading:"accessory" }, { pool:"delt", loading:"isolation" }] },
        { letter:"D",  name:"Bicep Focus", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"bicep", loading:"isolation" }] }
      ]},
      { name:"Legs — Quads & Hams", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Primary Squat", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Quad Superset", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Posterior Chain", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"hinge_secondary", loading:"accessory" }] },
        { letter:"D",  name:"Calves + Core", slots:[{ pool:"squat_secondary", loading:"isolation" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Upper — Strength Hybrid", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Heavy Press", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Pull + Press Pair", slots:[{ pool:"pull_horizontal", loading:"accessory" }, { pool:"press_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Delt + Back Balance", slots:[{ pool:"delt", loading:"isolation" }, { pool:"delt", loading:"isolation" }] },
        { letter:"D",  name:"Arms Superset", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"tricep", loading:"isolation" }] }
      ]},
      { name:"Lower — Glute & Single-Leg", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Hip Hinge", slots:[{ pool:"hinge_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Glute Builders", slots:[{ pool:"glute", loading:"accessory" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Hamstrings", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"hinge_secondary", loading:"accessory" }] },
        { letter:"D",  name:"Core Finisher", slots:[{ pool:"core", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]}
    ]
  },

  // ---- 4-Day Athletic Performance ----
  athletic4: {
    phaseConfig: [
      { name:"Foundation", ratio:0.35, color:"#30d158", description:"Build base — movement quality and work capacity" },
      { name:"Power",      ratio:0.35, color:"#ff6b35", description:"Develop explosiveness — speed and load" },
      { name:"Peak",       ratio:0.15, color:"#bf5af2", description:"Peak performance — max output" },
      { name:"Deload",     ratio:0.15, color:"#64d2ff", description:"Recovery" }
    ],
    days: [
      { name:"Lower Power", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Plyometrics", slots:[{ pool:"power", loading:"power" }, { pool:"power", loading:"power" }] },
        { letter:"B",  name:"Explosive Hinge", slots:[{ pool:"hinge_primary", loading:"de", rotateEvery:4 }] },
        { letter:"C",  name:"Strength Pair", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:3 }, { pool:"hinge_secondary", loading:"accessory" }] },
        { letter:"D",  name:"Carry Finisher", slots:[{ pool:"carry", loading:"finisher" }] }
      ]},
      { name:"Upper Power", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Power Output", slots:[{ pool:"power", loading:"power" }, { pool:"press_primary", loading:"de" }] },
        { letter:"B",  name:"Speed Press", slots:[{ pool:"push_primary", loading:"de", rotateEvery:4 }] },
        { letter:"C",  name:"Pull + Core", slots:[{ pool:"pull_vertical", loading:"compound" }, { pool:"core", loading:"accessory" }] },
        { letter:"D",  name:"Conditioning", slots:[{ pool:"conditioning", loading:"finisher" }] }
      ]},
      { name:"Lower Strength", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Primary Squat", slots:[{ pool:"squat_primary", loading:"me", rotateEvery:3 }] },
        { letter:"B",  name:"Hinge + Accessory", slots:[{ pool:"hinge_secondary", loading:"compound" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Single-Leg + Core", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] },
        { letter:"D",  name:"Conditioning", slots:[{ pool:"conditioning", loading:"finisher" }] }
      ]},
      { name:"Upper Strength", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Heavy Press", slots:[{ pool:"press_primary", loading:"me", rotateEvery:3 }] },
        { letter:"B",  name:"Pull Superset", slots:[{ pool:"pull_horizontal", loading:"compound" }, { pool:"pull_vertical", loading:"accessory" }] },
        { letter:"C",  name:"Delt + Arms", slots:[{ pool:"delt", loading:"isolation" }, { pool:"bicep", loading:"isolation" }] },
        { letter:"D",  name:"Carry Finisher", slots:[{ pool:"carry", loading:"finisher" }] }
      ]}
    ]
  },

  // ---- 3-Day Minimal Equipment ----
  minimal3: {
    phaseConfig: [
      { name:"Density",  ratio:0.40, color:"#bf5af2", description:"More work in less time — build conditioning" },
      { name:"Strength", ratio:0.35, color:"#ff6b35", description:"Heavier loads, longer rest — build strength" },
      { name:"Deload",   ratio:0.25, color:"#64d2ff", description:"Active recovery — lighter sessions" }
    ],
    days: [
      { name:"Full Body A — Push Focus", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Push Compound", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Pull + Squat", slots:[{ pool:"pull_vertical", loading:"accessory" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Core + Carry", slots:[{ pool:"core", loading:"accessory" }, { pool:"carry", loading:"finisher" }] }
      ]},
      { name:"Full Body B — Hinge Focus", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Hinge Compound", slots:[{ pool:"hinge_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Push + Pull", slots:[{ pool:"push_secondary", loading:"accessory" }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"Single-Leg + Core", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Full Body C — Conditioning", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Squat Compound", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Press + Row", slots:[{ pool:"press_secondary", loading:"accessory" }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"Conditioning Finisher", slots:[{ pool:"conditioning", loading:"finisher" }, { pool:"core", loading:"accessory" }] }
      ]}
    ]
  },

  // ---- 2-Day Glute Builder Add-On ----
  glutes2: {
    phaseConfig: [
      { name:"Activation", ratio:0.30, color:"#30d158", description:"Mind-muscle connection — lighter loads, high reps" },
      { name:"Growth",     ratio:0.45, color:"#ff6b35", description:"Progressive overload — increase weight each week" },
      { name:"Deload",     ratio:0.25, color:"#64d2ff", description:"Recovery — maintain movement, reduce volume" }
    ],
    days: [
      { name:"Glute A — Hip Dominant", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Primary Hip Hinge", slots:[{ pool:"glute", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Glute Isolation", slots:[{ pool:"glute", loading:"accessory" }, { pool:"glute", loading:"accessory" }] },
        { letter:"C",  name:"Hamstring + Core", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Glute B — Squat Dominant", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Primary Squat", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Single-Leg + Glute", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"glute", loading:"accessory" }] },
        { letter:"C",  name:"Finisher", slots:[{ pool:"carry", loading:"finisher" }] }
      ]}
    ]
  },

  // ---- 4-Day Upper/Lower Split ----
  upperlower4: {
    phaseConfig: [
      { name:"Volume",        ratio:0.40, color:"#ff6b35", description:"Higher reps — build muscle base" },
      { name:"Strength",      ratio:0.35, color:"#ff2d55", description:"Heavier loads — build peak strength" },
      { name:"Deload",        ratio:0.25, color:"#64d2ff", description:"Recovery week" }
    ],
    days: [
      { name:"Upper A — Horizontal", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Bench Press", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Row + Press", slots:[{ pool:"pull_horizontal", loading:"compound" }, { pool:"press_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Arms", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"tricep", loading:"isolation" }] },
        { letter:"D",  name:"Shoulders", slots:[{ pool:"delt", loading:"isolation" }, { pool:"delt", loading:"isolation" }] }
      ]},
      { name:"Lower A — Squat Focus", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Primary Squat", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Hinge + Accessory", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Core + Carry", slots:[{ pool:"core", loading:"accessory" }, { pool:"carry", loading:"finisher" }] }
      ]},
      { name:"Upper B — Vertical", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Overhead Press", slots:[{ pool:"press_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Pull + Push", slots:[{ pool:"pull_vertical", loading:"compound" }, { pool:"push_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Arms", slots:[{ pool:"tricep", loading:"isolation" }, { pool:"bicep", loading:"isolation" }] },
        { letter:"D",  name:"Rear Delts", slots:[{ pool:"delt", loading:"isolation" }] }
      ]},
      { name:"Lower B — Hinge Focus", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Primary Hinge", slots:[{ pool:"hinge_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Squat + Glute", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"glute", loading:"accessory" }] },
        { letter:"C",  name:"Hamstrings + Core", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]}
    ]
  },

  // ---- 3-Day Push/Pull/Legs ----
  ppl3: {
    phaseConfig: [
      { name:"Accumulation",    ratio:0.40, color:"#ff6b35", description:"Volume phase — moderate loads, build work capacity" },
      { name:"Intensification", ratio:0.35, color:"#ff2d55", description:"Strength phase — heavier loads" },
      { name:"Deload",          ratio:0.25, color:"#64d2ff", description:"Recovery" }
    ],
    days: [
      { name:"Push — Chest, Delts, Triceps", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Heavy Press", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Shoulder + Chest", slots:[{ pool:"press_secondary", loading:"accessory" }, { pool:"push_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Isolation", slots:[{ pool:"delt", loading:"isolation" }, { pool:"tricep", loading:"isolation" }] }
      ]},
      { name:"Pull — Back, Biceps, Rear Delts", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Heavy Pull", slots:[{ pool:"pull_vertical", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Row Superset", slots:[{ pool:"pull_horizontal", loading:"accessory" }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"Biceps + Rear Delts", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"delt", loading:"isolation" }] }
      ]},
      { name:"Legs — Quads, Glutes, Hamstrings", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Primary Squat", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Hinge + Accessory", slots:[{ pool:"hinge_primary", loading:"compound" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Hamstrings + Core", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]}
    ]
  },

  // ---- 6-Day Push/Pull/Legs x2 ----
  ppl6: {
    phaseConfig: [
      { name:"Volume",    ratio:0.40, color:"#ff6b35", description:"High frequency volume — each muscle 2x/week" },
      { name:"Intensity", ratio:0.35, color:"#ff2d55", description:"Heavier loads — strength emphasis" },
      { name:"Deload",    ratio:0.25, color:"#64d2ff", description:"Recovery" }
    ],
    days: [
      { name:"Push A — Heavy", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Compound Press", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Shoulder Press", slots:[{ pool:"press_primary", loading:"compound" }] },
        { letter:"C",  name:"Chest + Triceps", slots:[{ pool:"push_secondary", loading:"accessory" }, { pool:"tricep", loading:"isolation" }] }
      ]},
      { name:"Pull A — Heavy", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Vertical Pull", slots:[{ pool:"pull_vertical", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Row", slots:[{ pool:"pull_horizontal", loading:"compound" }] },
        { letter:"C",  name:"Biceps + Rear Delts", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"delt", loading:"isolation" }] }
      ]},
      { name:"Legs A — Quad Focus", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Squat", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Quad Accessory", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Core + Carry", slots:[{ pool:"core", loading:"accessory" }, { pool:"carry", loading:"finisher" }] }
      ]},
      { name:"Push B — Volume", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Incline/DB Press", slots:[{ pool:"push_secondary", loading:"accessory" }] },
        { letter:"B",  name:"Flye + Lateral", slots:[{ pool:"push_secondary", loading:"isolation" }, { pool:"delt", loading:"isolation" }] },
        { letter:"C",  name:"Tricep Focus", slots:[{ pool:"tricep", loading:"isolation" }, { pool:"tricep", loading:"isolation" }] }
      ]},
      { name:"Pull B — Volume", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Row Focus", slots:[{ pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"B",  name:"Pulldown + Face Pull", slots:[{ pool:"pull_vertical", loading:"accessory" }, { pool:"delt", loading:"isolation" }] },
        { letter:"C",  name:"Bicep Focus", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"bicep", loading:"isolation" }] }
      ]},
      { name:"Legs B — Hinge Focus", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Hinge", slots:[{ pool:"hinge_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Glute + Hamstring", slots:[{ pool:"glute", loading:"accessory" }, { pool:"hinge_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Calves + Core", slots:[{ pool:"squat_secondary", loading:"isolation" }, { pool:"core", loading:"accessory" }] }
      ]}
    ]
  },

  // ---- 3-Day Full Body Beginner ----
  beginner3: {
    phaseConfig: [
      { name:"Learn",     ratio:0.40, color:"#30d158", description:"Build movement patterns — light loads, high reps" },
      { name:"Progress",  ratio:0.35, color:"#ff6b35", description:"Increase weight gradually — linear progression" },
      { name:"Deload",    ratio:0.25, color:"#64d2ff", description:"Rest and recover" }
    ],
    days: [
      { name:"Full Body A", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Squat", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:4 }] },
        { letter:"B",  name:"Press + Pull", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:4 }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"Core", slots:[{ pool:"core", loading:"accessory" }] }
      ]},
      { name:"Full Body B", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Hinge", slots:[{ pool:"hinge_primary", loading:"compound", rotateEvery:4 }] },
        { letter:"B",  name:"Overhead Press + Row", slots:[{ pool:"press_primary", loading:"compound", rotateEvery:4 }, { pool:"pull_vertical", loading:"accessory" }] },
        { letter:"C",  name:"Carry", slots:[{ pool:"carry", loading:"finisher" }] }
      ]},
      { name:"Full Body C", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Squat Variation", slots:[{ pool:"squat_secondary", loading:"compound" }] },
        { letter:"B",  name:"Push + Pull", slots:[{ pool:"push_secondary", loading:"accessory" }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"Arms + Core", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"core", loading:"accessory" }] }
      ]}
    ]
  },

  // ---- 4-Day Powerlifting ----
  powerlifting4: {
    phaseConfig: [
      { name:"Volume",    ratio:0.35, color:"#ff6b35", description:"Build work capacity with moderate loads" },
      { name:"Strength",  ratio:0.35, color:"#ff2d55", description:"Heavy singles, doubles, triples" },
      { name:"Peak",      ratio:0.15, color:"#bf5af2", description:"Test maxes" },
      { name:"Deload",    ratio:0.15, color:"#64d2ff", description:"Recovery" }
    ],
    days: [
      { name:"Squat Day", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Competition Squat", slots:[{ pool:"squat_primary", loading:"me", rotateEvery:4 }] },
        { letter:"B",  name:"Squat Accessory", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Posterior Chain", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Bench Day", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Competition Bench", slots:[{ pool:"push_primary", loading:"me", rotateEvery:4 }] },
        { letter:"B",  name:"Bench Accessories", slots:[{ pool:"push_secondary", loading:"accessory" }, { pool:"tricep", loading:"isolation" }] },
        { letter:"C",  name:"Upper Back", slots:[{ pool:"pull_horizontal", loading:"accessory" }, { pool:"delt", loading:"isolation" }] }
      ]},
      { name:"Deadlift Day", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Competition Deadlift", slots:[{ pool:"hinge_primary", loading:"me", rotateEvery:4 }] },
        { letter:"B",  name:"Hinge Accessories", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Grip + Core", slots:[{ pool:"carry", loading:"finisher" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Overhead + Accessories", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Overhead Press", slots:[{ pool:"press_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Pull + Push", slots:[{ pool:"pull_vertical", loading:"compound" }, { pool:"push_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Arms + Shoulders", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"delt", loading:"isolation" }] }
      ]}
    ]
  },

  // ---- 5-Day Bro Split (Bodybuilding) ----
  brosplit5: {
    phaseConfig: [
      { name:"Volume",      ratio:0.40, color:"#ff6b35", description:"High volume — pump and time under tension" },
      { name:"Progressive",  ratio:0.35, color:"#ff2d55", description:"Increase loads — progressive overload" },
      { name:"Deload",       ratio:0.25, color:"#64d2ff", description:"Light week — maintain movement" }
    ],
    days: [
      { name:"Chest", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Flat Press", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Incline + Flye", slots:[{ pool:"push_secondary", loading:"accessory" }, { pool:"push_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Pump Finisher", slots:[{ pool:"push_secondary", loading:"isolation" }, { pool:"push_secondary", loading:"isolation" }] }
      ]},
      { name:"Back", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Vertical Pull", slots:[{ pool:"pull_vertical", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Rows", slots:[{ pool:"pull_horizontal", loading:"compound" }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"Isolation", slots:[{ pool:"pull_horizontal", loading:"isolation" }, { pool:"delt", loading:"isolation" }] }
      ]},
      { name:"Shoulders", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Overhead Press", slots:[{ pool:"press_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Lateral + Front", slots:[{ pool:"delt", loading:"isolation" }, { pool:"delt", loading:"isolation" }] },
        { letter:"C",  name:"Rear Delts + Traps", slots:[{ pool:"delt", loading:"isolation" }, { pool:"pull_horizontal", loading:"isolation" }] }
      ]},
      { name:"Legs", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Squat", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Hinge + Quad", slots:[{ pool:"hinge_primary", loading:"compound" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Hamstrings + Calves", slots:[{ pool:"hinge_secondary", loading:"isolation" }, { pool:"squat_secondary", loading:"isolation" }] }
      ]},
      { name:"Arms", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Biceps Heavy", slots:[{ pool:"bicep", loading:"compound" }, { pool:"bicep", loading:"accessory" }] },
        { letter:"B",  name:"Triceps Heavy", slots:[{ pool:"tricep", loading:"compound" }, { pool:"tricep", loading:"accessory" }] },
        { letter:"C",  name:"Pump Superset", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"tricep", loading:"isolation" }] }
      ]}
    ]
  },

  // ---- 3-Day Over-40 Recovery-Focused ----
  masters3: {
    phaseConfig: [
      { name:"Foundation",  ratio:0.40, color:"#30d158", description:"Build base — joint-friendly movements, moderate volume" },
      { name:"Progression", ratio:0.35, color:"#ff6b35", description:"Gradual overload — listen to your body" },
      { name:"Deload",      ratio:0.25, color:"#64d2ff", description:"Recovery — extra rest, mobility focus" }
    ],
    days: [
      { name:"Full Body — Push Focus", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Press", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:4 }] },
        { letter:"B",  name:"Pull + Squat", slots:[{ pool:"pull_horizontal", loading:"accessory" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Core + Mobility", slots:[{ pool:"core", loading:"accessory" }] }
      ]},
      { name:"Full Body — Hinge Focus", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Hinge", slots:[{ pool:"hinge_primary", loading:"compound", rotateEvery:4 }] },
        { letter:"B",  name:"Press + Pull", slots:[{ pool:"press_secondary", loading:"accessory" }, { pool:"pull_vertical", loading:"accessory" }] },
        { letter:"C",  name:"Carry + Core", slots:[{ pool:"carry", loading:"finisher" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Full Body — Squat Focus", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Squat", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:4 }] },
        { letter:"B",  name:"Row + Shoulders", slots:[{ pool:"pull_horizontal", loading:"accessory" }, { pool:"delt", loading:"isolation" }] },
        { letter:"C",  name:"Arms", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"tricep", loading:"isolation" }] }
      ]}
    ]
  },

  // ---- 4-Day Strength + Conditioning ----
  strength_cond4: {
    phaseConfig: [
      { name:"Base",     ratio:0.35, color:"#30d158", description:"Build aerobic base + strength foundation" },
      { name:"Build",    ratio:0.35, color:"#ff6b35", description:"Increase intensity — heavier lifts + harder conditioning" },
      { name:"Peak",     ratio:0.15, color:"#bf5af2", description:"Peak fitness — max effort" },
      { name:"Deload",   ratio:0.15, color:"#64d2ff", description:"Recovery" }
    ],
    days: [
      { name:"Heavy Lower + Conditioning", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Squat", slots:[{ pool:"squat_primary", loading:"me", rotateEvery:3 }] },
        { letter:"B",  name:"Accessory", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] },
        { letter:"C",  name:"Conditioning", slots:[{ pool:"conditioning", loading:"finisher" }] }
      ]},
      { name:"Heavy Upper + Conditioning", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Press", slots:[{ pool:"push_primary", loading:"me", rotateEvery:3 }] },
        { letter:"B",  name:"Pull + Shoulders", slots:[{ pool:"pull_vertical", loading:"compound" }, { pool:"delt", loading:"isolation" }] },
        { letter:"C",  name:"Conditioning", slots:[{ pool:"conditioning", loading:"finisher" }] }
      ]},
      { name:"Power + Metabolic", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Power", slots:[{ pool:"power", loading:"power" }, { pool:"power", loading:"power" }] },
        { letter:"B",  name:"Strength Pair", slots:[{ pool:"hinge_primary", loading:"compound" }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"Finisher", slots:[{ pool:"conditioning", loading:"finisher" }, { pool:"carry", loading:"finisher" }] }
      ]},
      { name:"Full Body + Carries", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Press + Squat", slots:[{ pool:"press_primary", loading:"compound" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"B",  name:"Pull + Core", slots:[{ pool:"pull_horizontal", loading:"accessory" }, { pool:"core", loading:"accessory" }] },
        { letter:"C",  name:"Carry Medley", slots:[{ pool:"carry", loading:"finisher" }, { pool:"carry", loading:"finisher" }] }
      ]}
    ]
  },

  // ---- 2-Day Runner's Strength ----
  runner2: {
    phaseConfig: [
      { name:"Build",   ratio:0.45, color:"#30d158", description:"Build injury resistance + power for running" },
      { name:"Maintain", ratio:0.30, color:"#ff6b35", description:"Maintain strength — don't interfere with mileage" },
      { name:"Deload",   ratio:0.25, color:"#64d2ff", description:"Light week — focus on running" }
    ],
    days: [
      { name:"Lower Body + Core", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Single-Leg Strength", slots:[{ pool:"squat_secondary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Hip + Hamstring", slots:[{ pool:"glute", loading:"accessory" }, { pool:"hinge_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Core Anti-Rotation", slots:[{ pool:"core", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Upper Body + Power", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Push + Pull", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:4 }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"B",  name:"Power + Core", slots:[{ pool:"power", loading:"power" }, { pool:"core", loading:"accessory" }] }
      ]}
    ]
  },

  // ---- 5-Day Functional Fitness ----
  functional5: {
    phaseConfig: [
      { name:"GPP",       ratio:0.35, color:"#30d158", description:"General physical prep — build all-around fitness" },
      { name:"Intensity", ratio:0.35, color:"#ff6b35", description:"Push harder — heavier loads, faster conditioning" },
      { name:"Peak",      ratio:0.15, color:"#bf5af2", description:"Test fitness" },
      { name:"Deload",    ratio:0.15, color:"#64d2ff", description:"Recovery" }
    ],
    days: [
      { name:"Heavy Squat + Conditioning", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Squat", slots:[{ pool:"squat_primary", loading:"me", rotateEvery:3 }] },
        { letter:"B",  name:"Accessory", slots:[{ pool:"pull_vertical", loading:"accessory" }, { pool:"core", loading:"accessory" }] },
        { letter:"C",  name:"Metcon", slots:[{ pool:"conditioning", loading:"finisher" }, { pool:"power", loading:"power" }] }
      ]},
      { name:"Gymnastics + Press", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Press", slots:[{ pool:"press_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Pull + Push Skills", slots:[{ pool:"pull_vertical", loading:"compound" }, { pool:"push_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Core + Conditioning", slots:[{ pool:"core", loading:"accessory" }, { pool:"conditioning", loading:"finisher" }] }
      ]},
      { name:"Hinge + Carry", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Deadlift", slots:[{ pool:"hinge_primary", loading:"me", rotateEvery:3 }] },
        { letter:"B",  name:"Row + Single-Leg", slots:[{ pool:"pull_horizontal", loading:"accessory" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Carry Medley", slots:[{ pool:"carry", loading:"finisher" }, { pool:"carry", loading:"finisher" }] }
      ]},
      { name:"Speed + Power", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Plyometrics", slots:[{ pool:"power", loading:"power" }, { pool:"power", loading:"power" }] },
        { letter:"B",  name:"Speed Work", slots:[{ pool:"push_primary", loading:"de" }, { pool:"conditioning", loading:"finisher" }] },
        { letter:"C",  name:"Arms + Shoulders", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"delt", loading:"isolation" }] }
      ]},
      { name:"Mixed Conditioning", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Circuit", slots:[{ pool:"conditioning", loading:"finisher" }, { pool:"power", loading:"power" }] },
        { letter:"B",  name:"Strength Superset", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"push_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Core Finisher", slots:[{ pool:"core", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]}
    ]
  },

  // ---- 4-Day Calisthenics + Weights ----
  calisthenics4: {
    phaseConfig: [
      { name:"Skill",     ratio:0.40, color:"#30d158", description:"Build movement skills — bodyweight progressions" },
      { name:"Strength",  ratio:0.35, color:"#ff6b35", description:"Add load — weighted calisthenics + accessories" },
      { name:"Deload",    ratio:0.25, color:"#64d2ff", description:"Recovery — skill practice only" }
    ],
    days: [
      { name:"Upper Push", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Push Skill", slots:[{ pool:"push_secondary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Press + Chest", slots:[{ pool:"press_secondary", loading:"accessory" }, { pool:"push_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Triceps + Core", slots:[{ pool:"tricep", loading:"isolation" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Lower Body", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Squat", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Single-Leg + Hinge", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"hinge_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Carry + Core", slots:[{ pool:"carry", loading:"finisher" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Upper Pull", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Pull Skill", slots:[{ pool:"pull_vertical", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Row + Face Pull", slots:[{ pool:"pull_horizontal", loading:"accessory" }, { pool:"delt", loading:"isolation" }] },
        { letter:"C",  name:"Biceps + Core", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Full Body Power", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Power", slots:[{ pool:"power", loading:"power" }] },
        { letter:"B",  name:"Hinge + Push", slots:[{ pool:"hinge_primary", loading:"compound" }, { pool:"push_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Conditioning", slots:[{ pool:"conditioning", loading:"finisher" }] }
      ]}
    ]
  }
};
