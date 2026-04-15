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
      { name:"Foundation", loadingPhase:"Accumulation", ratio:0.35, color:"#30d158", description:"Build base — movement quality and work capacity" },
      { name:"Power",      loadingPhase:"Intensification", ratio:0.35, color:"#ff6b35", description:"Develop explosiveness — speed and load" },
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
      { name:"Density",  loadingPhase:"Accumulation", ratio:0.40, color:"#bf5af2", description:"More work in less time — build conditioning" },
      { name:"Strength", loadingPhase:"Intensification", ratio:0.35, color:"#ff6b35", description:"Heavier loads, longer rest — build strength" },
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
      { name:"Activation", loadingPhase:"Accumulation", ratio:0.30, color:"#30d158", description:"Mind-muscle connection — lighter loads, high reps" },
      { name:"Growth", loadingPhase:"Intensification", ratio:0.45, color:"#ff6b35", description:"Progressive overload — increase weight each week" },
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
      { name:"Volume", loadingPhase:"Accumulation", ratio:0.40, color:"#ff6b35", description:"Higher reps — build muscle base" },
      { name:"Strength", loadingPhase:"Intensification", ratio:0.35, color:"#ff2d55", description:"Heavier loads — build peak strength" },
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
      { name:"Volume", loadingPhase:"Accumulation", ratio:0.40, color:"#ff6b35", description:"High frequency volume — each muscle 2x/week" },
      { name:"Intensity", loadingPhase:"Intensification", ratio:0.35, color:"#ff2d55", description:"Heavier loads — strength emphasis" },
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
        { letter:"C",  name:"Tricep + Legs", slots:[{ pool:"tricep", loading:"isolation" }, { pool:"squat_secondary", loading:"isolation" }] }
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
      { name:"Accumulation",    ratio:0.40, color:"#30d158", description:"Build movement patterns — light loads, high reps" },
      { name:"Intensification", ratio:0.35, color:"#ff6b35", description:"Increase weight gradually — linear progression" },
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
      { name:"Accumulation",    ratio:0.35, color:"#ff6b35", description:"Build work capacity with moderate loads" },
      { name:"Intensification", ratio:0.35, color:"#ff2d55", description:"Heavy singles, doubles, triples" },
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
      { name:"Accumulation",    ratio:0.40, color:"#ff6b35", description:"High volume — pump and time under tension" },
      { name:"Intensification", ratio:0.35, color:"#ff2d55", description:"Increase loads — progressive overload" },
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
        { letter:"C",  name:"Hamstrings + Core", slots:[{ pool:"hinge_secondary", loading:"isolation" }, { pool:"core", loading:"accessory" }] }
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
      { name:"Accumulation",    ratio:0.40, color:"#30d158", description:"Build base — joint-friendly movements, moderate volume" },
      { name:"Intensification", ratio:0.35, color:"#ff6b35", description:"Gradual overload — listen to your body" },
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
        { letter:"C",  name:"Posterior + Arms", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"bicep", loading:"isolation" }] }
      ]}
    ]
  },

  // ---- 4-Day Strength + Conditioning ----
  strength_cond4: {
    phaseConfig: [
      { name:"Base", loadingPhase:"Accumulation", ratio:0.35, color:"#30d158", description:"Build aerobic base + strength foundation" },
      { name:"Build", loadingPhase:"Intensification", ratio:0.35, color:"#ff6b35", description:"Increase intensity — heavier lifts + harder conditioning" },
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
      { name:"Build", loadingPhase:"Accumulation", ratio:0.45, color:"#30d158", description:"Build injury resistance + power for running" },
      { name:"Maintain", loadingPhase:"Intensification", ratio:0.30, color:"#ff6b35", description:"Maintain strength — don't interfere with mileage" },
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
      { name:"GPP", loadingPhase:"Accumulation", ratio:0.35, color:"#30d158", description:"General physical prep — build all-around fitness" },
      { name:"Intensity", loadingPhase:"Intensification", ratio:0.35, color:"#ff6b35", description:"Push harder — heavier loads, faster conditioning" },
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
      { name:"Skill", loadingPhase:"Accumulation", ratio:0.40, color:"#30d158", description:"Build movement skills — bodyweight progressions" },
      { name:"Strength", loadingPhase:"Intensification", ratio:0.35, color:"#ff6b35", description:"Add load — weighted calisthenics + accessories" },
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
  },

  // ================================================================
  // METHODOLOGY-BASED PROGRAMS (from fitness-trainer plugin research)
  // ================================================================

  // ---- 3-Day Reverse Pyramid Training (RPT) ----
  rpt3: {
    phaseConfig: [
      { name:"Base", loadingPhase:"Accumulation", ratio:0.40, color:"#ff6b35", description:"Establish top-set baselines — RPT sets of 6-8" },
      { name:"Push", loadingPhase:"Intensification", ratio:0.35, color:"#ff2d55", description:"Push top sets heavier — RPT sets of 4-6" },
      { name:"Deload",   ratio:0.25, color:"#64d2ff", description:"Light top sets — recover" }
    ],
    days: [
      { name:"RPT Upper A", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Bench RPT", slots:[{ pool:"push_primary", loading:"rpt", rotateEvery:3 }] },
        { letter:"B",  name:"Row RPT", slots:[{ pool:"pull_horizontal", loading:"rpt", rotateEvery:3 }] },
        { letter:"C",  name:"Accessories", slots:[{ pool:"delt", loading:"isolation" }, { pool:"tricep", loading:"isolation" }] }
      ]},
      { name:"RPT Lower", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Squat RPT", slots:[{ pool:"squat_primary", loading:"rpt", rotateEvery:3 }] },
        { letter:"B",  name:"Hinge RPT", slots:[{ pool:"hinge_primary", loading:"rpt", rotateEvery:4 }] },
        { letter:"C",  name:"Single-Leg + Core", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"hinge_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"RPT Upper B", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"OHP RPT", slots:[{ pool:"press_primary", loading:"rpt", rotateEvery:3 }] },
        { letter:"B",  name:"Pull RPT", slots:[{ pool:"pull_vertical", loading:"rpt", rotateEvery:3 }] },
        { letter:"C",  name:"Accessories", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"delt", loading:"isolation" }] }
      ]}
    ]
  },

  // ---- 3-Day Knees Over Toes / ATG ----
  kot3: {
    phaseConfig: [
      { name:"Foundation", loadingPhase:"Accumulation", ratio:0.35, color:"#30d158", description:"Bodyweight only — build ROM and baseline tolerance" },
      { name:"Load", loadingPhase:"Intensification", ratio:0.40, color:"#ff6b35", description:"Add load progressively — full ATG depth" },
      { name:"Deload",     ratio:0.25, color:"#64d2ff", description:"Maintain ROM — reduce load" }
    ],
    days: [
      { name:"KOT Lower A — Knee Focus", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Tibialis + ATG", slots:[{ pool:"kot", loading:"accessory" }, { pool:"kot", loading:"accessory" }] },
        { letter:"B",  name:"Squat Pattern", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"C",  name:"Nordic + Calf", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"kot", loading:"accessory" }] }
      ]},
      { name:"KOT Upper", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Push + Pull", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:3 }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"B",  name:"Shoulders + Pull", slots:[{ pool:"press_secondary", loading:"accessory" }, { pool:"pull_vertical", loading:"accessory" }] },
        { letter:"C",  name:"Arms + Core", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"KOT Lower B — Hip Focus", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Sled + Split Squat", slots:[{ pool:"kot", loading:"accessory" }, { pool:"kot", loading:"accessory" }] },
        { letter:"B",  name:"Hinge Pattern", slots:[{ pool:"hinge_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"C",  name:"Glute + Core", slots:[{ pool:"glute", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]}
    ]
  },

  // ---- 5-Day Hybrid Athlete (Viada Concurrent Training) ----
  hybrid5: {
    phaseConfig: [
      { name:"Base Build", loadingPhase:"Accumulation", ratio:0.35, color:"#30d158", description:"Build aerobic base + strength foundation simultaneously" },
      { name:"Intensify", loadingPhase:"Intensification", ratio:0.35, color:"#ff6b35", description:"Push both strength and conditioning — manage interference" },
      { name:"Peak",          ratio:0.15, color:"#bf5af2", description:"Peak performance in both domains" },
      { name:"Deload",        ratio:0.15, color:"#64d2ff", description:"Full recovery" }
    ],
    days: [
      { name:"Heavy Lower", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Primary Squat", slots:[{ pool:"squat_primary", loading:"me", rotateEvery:3 }] },
        { letter:"B",  name:"Accessory", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Core", slots:[{ pool:"core", loading:"accessory" }] }
      ]},
      { name:"Zone 2 Cardio + Upper", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Easy Cardio", slots:[{ pool:"conditioning", loading:"finisher" }] },
        { letter:"B",  name:"Press + Pull", slots:[{ pool:"push_secondary", loading:"accessory" }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"Shoulders", slots:[{ pool:"delt", loading:"isolation" }] }
      ]},
      { name:"Heavy Upper", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Primary Press", slots:[{ pool:"push_primary", loading:"me", rotateEvery:3 }] },
        { letter:"B",  name:"Pull + Shoulders", slots:[{ pool:"pull_vertical", loading:"compound" }, { pool:"press_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Arms", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"tricep", loading:"isolation" }] }
      ]},
      { name:"Zone 2 Cardio + Lower", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Easy Cardio", slots:[{ pool:"conditioning", loading:"finisher" }] },
        { letter:"B",  name:"Hinge + Single-Leg", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Core + Carry", slots:[{ pool:"core", loading:"accessory" }, { pool:"carry", loading:"finisher" }] }
      ]},
      { name:"Power + Conditioning", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Power", slots:[{ pool:"power", loading:"power" }, { pool:"power", loading:"power" }] },
        { letter:"B",  name:"Strength Pair", slots:[{ pool:"hinge_primary", loading:"compound" }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"Finisher", slots:[{ pool:"conditioning", loading:"finisher" }] }
      ]}
    ]
  },

  // ---- 4-Day PRVN / CrossFit GPP ----
  prvn4: {
    phaseConfig: [
      { name:"GPP Build", loadingPhase:"Accumulation", ratio:0.35, color:"#30d158", description:"Build work capacity — moderate strength + conditioning" },
      { name:"Intensity", loadingPhase:"Intensification", ratio:0.35, color:"#ff6b35", description:"Push loads and MetCon intensity" },
      { name:"Peak",        ratio:0.15, color:"#bf5af2", description:"Test fitness — heavy + fast" },
      { name:"Deload",      ratio:0.15, color:"#64d2ff", description:"Recovery week" }
    ],
    days: [
      { name:"Squat + MetCon", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Strength: Squat", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Accessory Pair", slots:[{ pool:"pull_vertical", loading:"accessory" }, { pool:"core", loading:"accessory" }] },
        { letter:"C",  name:"MetCon", slots:[{ pool:"conditioning", loading:"finisher" }, { pool:"power", loading:"power" }] }
      ]},
      { name:"Press + MetCon", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Strength: Press", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Accessory Pair", slots:[{ pool:"pull_horizontal", loading:"accessory" }, { pool:"delt", loading:"isolation" }] },
        { letter:"C",  name:"MetCon", slots:[{ pool:"conditioning", loading:"finisher" }, { pool:"carry", loading:"finisher" }] }
      ]},
      { name:"Hinge + MetCon", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Strength: Hinge", slots:[{ pool:"hinge_primary", loading:"compound", rotateEvery:3 }] },
        { letter:"B",  name:"Accessory Pair", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"MetCon", slots:[{ pool:"conditioning", loading:"finisher" }, { pool:"power", loading:"power" }] }
      ]},
      { name:"Full Body MetCon", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Power Complex", slots:[{ pool:"power", loading:"power" }, { pool:"power", loading:"power" }] },
        { letter:"B",  name:"Strength Circuit", slots:[{ pool:"push_secondary", loading:"accessory" }, { pool:"squat_secondary", loading:"accessory" }, { pool:"pull_vertical", loading:"accessory" }] },
        { letter:"C",  name:"Conditioning Finisher", slots:[{ pool:"conditioning", loading:"finisher" }] }
      ]}
    ]
  },

  // ================================================================
  // NAMED COMMUNITY PROGRAMS
  // ================================================================

  // ---- Wendler's 5/3/1 (4-Day) ----
  wendler4: {
    phaseConfig: [
      { name:"5s Week", loadingPhase:"Accumulation", ratio:0.25, color:"#30d158", description:"3×5 at 65/75/85% — build base" },
      { name:"3s Week", loadingPhase:"Intensification", ratio:0.25, color:"#ff6b35", description:"3×3 at 70/80/90% — push intensity" },
      { name:"1s Week", loadingPhase:"Peak", ratio:0.25, color:"#ff2d55", description:"5/3/1 at 75/85/95% — AMRAP on last set" },
      { name:"Deload",    ratio:0.25, color:"#64d2ff", description:"3×5 at 40/50/60% — recover and reset" }
    ],
    days: [
      { name:"Squat Day", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"5/3/1 Squat", slots:[{ pool:"squat_primary", loading:"wendler531", rotateEvery:8 }] },
        { letter:"B",  name:"BBB Squat Accessory", slots:[{ pool:"squat_primary", loading:"accessory", rotateEvery:4 }] },
        { letter:"C",  name:"Assistance", slots:[{ pool:"hinge_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Bench Day", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"5/3/1 Bench", slots:[{ pool:"push_primary", loading:"wendler531", rotateEvery:8 }] },
        { letter:"B",  name:"BBB Press Accessory", slots:[{ pool:"push_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Assistance", slots:[{ pool:"pull_horizontal", loading:"accessory" }, { pool:"delt", loading:"isolation" }] }
      ]},
      { name:"Deadlift Day", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"5/3/1 Deadlift", slots:[{ pool:"hinge_primary", loading:"wendler531", rotateEvery:8 }] },
        { letter:"B",  name:"BBB Hinge Accessory", slots:[{ pool:"hinge_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Assistance", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"OHP Day", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"5/3/1 OHP", slots:[{ pool:"press_primary", loading:"wendler531", rotateEvery:8 }] },
        { letter:"B",  name:"BBB Shoulder Accessory", slots:[{ pool:"press_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Assistance", slots:[{ pool:"pull_vertical", loading:"accessory" }, { pool:"bicep", loading:"isolation" }] }
      ]}
    ]
  },

  // ---- GZCL Method (4-Day) ----
  gzcl4: {
    phaseConfig: [
      { name:"Base", loadingPhase:"Accumulation", ratio:0.40, color:"#30d158", description:"Build volume across all tiers" },
      { name:"Peak",      ratio:0.35, color:"#ff2d55", description:"Push T1 heavy, maintain T2/T3" },
      { name:"Deload",    ratio:0.25, color:"#64d2ff", description:"Recovery" }
    ],
    days: [
      { name:"GZCL — Squat", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"T1", name:"Tier 1: Heavy Squat", slots:[{ pool:"squat_primary", loading:"gzcl_t1", rotateEvery:4 }] },
        { letter:"T2", name:"Tier 2: Moderate Compound", slots:[{ pool:"hinge_secondary", loading:"gzcl_t2" }, { pool:"squat_secondary", loading:"gzcl_t2" }] },
        { letter:"T3", name:"Tier 3: Pump Work", slots:[{ pool:"core", loading:"isolation" }, { pool:"squat_secondary", loading:"isolation" }] }
      ]},
      { name:"GZCL — Bench", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"T1", name:"Tier 1: Heavy Bench", slots:[{ pool:"push_primary", loading:"gzcl_t1", rotateEvery:4 }] },
        { letter:"T2", name:"Tier 2: Moderate Compound", slots:[{ pool:"pull_horizontal", loading:"gzcl_t2" }, { pool:"push_secondary", loading:"gzcl_t2" }] },
        { letter:"T3", name:"Tier 3: Pump Work", slots:[{ pool:"tricep", loading:"isolation" }, { pool:"delt", loading:"isolation" }] }
      ]},
      { name:"GZCL — Deadlift", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"T1", name:"Tier 1: Heavy Deadlift", slots:[{ pool:"hinge_primary", loading:"gzcl_t1", rotateEvery:4 }] },
        { letter:"T2", name:"Tier 2: Moderate Compound", slots:[{ pool:"squat_secondary", loading:"gzcl_t2" }, { pool:"pull_horizontal", loading:"gzcl_t2" }] },
        { letter:"T3", name:"Tier 3: Pump Work", slots:[{ pool:"hinge_secondary", loading:"isolation" }, { pool:"core", loading:"isolation" }] }
      ]},
      { name:"GZCL — OHP", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"T1", name:"Tier 1: Heavy OHP", slots:[{ pool:"press_primary", loading:"gzcl_t1", rotateEvery:4 }] },
        { letter:"T2", name:"Tier 2: Moderate Compound", slots:[{ pool:"pull_vertical", loading:"gzcl_t2" }, { pool:"press_secondary", loading:"gzcl_t2" }] },
        { letter:"T3", name:"Tier 3: Pump Work", slots:[{ pool:"bicep", loading:"isolation" }, { pool:"delt", loading:"isolation" }] }
      ]}
    ]
  },

  // ---- Starting Strength / StrongLifts (3-Day) ----
  ss3: {
    phaseConfig: [
      { name:"Linear Gains", loadingPhase:"Accumulation", ratio:0.50, color:"#30d158", description:"Add weight every session — ride the novice wave" },
      { name:"Intermediate", loadingPhase:"Intensification", ratio:0.25, color:"#ff6b35", description:"Slower progression — weekly PRs" },
      { name:"Deload",        ratio:0.25, color:"#64d2ff", description:"Reset and rebuild" }
    ],
    days: [
      { name:"Workout A — Squat + Bench", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Squat", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:6 }] },
        { letter:"B",  name:"Bench Press", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:6 }] },
        { letter:"C",  name:"Row", slots:[{ pool:"pull_horizontal", loading:"compound" }] }
      ]},
      { name:"Workout B — Squat + OHP", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Squat", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:6 }] },
        { letter:"B",  name:"Overhead Press", slots:[{ pool:"press_primary", loading:"compound", rotateEvery:6 }] },
        { letter:"C",  name:"Deadlift", slots:[{ pool:"hinge_primary", loading:"compound" }] }
      ]},
      { name:"Workout C — Squat + Bench", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Squat", slots:[{ pool:"squat_primary", loading:"compound", rotateEvery:6 }] },
        { letter:"B",  name:"Bench Press", slots:[{ pool:"push_primary", loading:"compound", rotateEvery:6 }] },
        { letter:"C",  name:"Pull-Up + Core", slots:[{ pool:"pull_vertical", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]}
    ]
  },

  // ---- German Volume Training (4-Day) ----
  gvt4: {
    phaseConfig: [
      { name:"Shock", loadingPhase:"Accumulation", ratio:0.50, color:"#ff2d55", description:"10×10 — maximum volume stimulus" },
      { name:"Adapt", loadingPhase:"Intensification", ratio:0.25, color:"#ff6b35", description:"10×8 — heavier, slightly less volume" },
      { name:"Deload",   ratio:0.25, color:"#64d2ff", description:"6×10 — recover from the brutality" }
    ],
    days: [
      { name:"GVT Chest + Back", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"10×10 Press", slots:[{ pool:"push_primary", loading:"gvt", rotateEvery:4 }] },
        { letter:"B",  name:"10×10 Row", slots:[{ pool:"pull_horizontal", loading:"gvt", rotateEvery:4 }] },
        { letter:"C",  name:"Light Accessory", slots:[{ pool:"delt", loading:"isolation" }] }
      ]},
      { name:"GVT Legs", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"10×10 Squat", slots:[{ pool:"squat_primary", loading:"gvt", rotateEvery:4 }] },
        { letter:"B",  name:"10×10 Leg Curl", slots:[{ pool:"hinge_secondary", loading:"gvt" }] },
        { letter:"C",  name:"Light Accessory", slots:[{ pool:"core", loading:"isolation" }] }
      ]},
      { name:"GVT Shoulders + Arms", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"10×10 OHP", slots:[{ pool:"press_primary", loading:"gvt", rotateEvery:4 }] },
        { letter:"B",  name:"Superset Arms", slots:[{ pool:"bicep", loading:"accessory" }, { pool:"tricep", loading:"accessory" }] },
        { letter:"C",  name:"Rear Delts + Legs", slots:[{ pool:"delt", loading:"isolation" }, { pool:"squat_secondary", loading:"isolation" }] }
      ]},
      { name:"GVT Back + Hinge", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"10×10 Pull", slots:[{ pool:"pull_vertical", loading:"gvt", rotateEvery:4 }] },
        { letter:"B",  name:"10×10 Hinge", slots:[{ pool:"hinge_primary", loading:"gvt", rotateEvery:4 }] },
        { letter:"C",  name:"Light Accessory", slots:[{ pool:"carry", loading:"finisher" }] }
      ]}
    ]
  },

  // ---- PHUL: Power Hypertrophy Upper Lower (4-Day) ----
  phul4: {
    phaseConfig: [
      { name:"Volume", loadingPhase:"Accumulation", ratio:0.40, color:"#ff6b35", description:"Build base — higher reps on hypertrophy days" },
      { name:"Strength", loadingPhase:"Intensification", ratio:0.35, color:"#ff2d55", description:"Push power days heavier" },
      { name:"Deload",    ratio:0.25, color:"#64d2ff", description:"Recovery" }
    ],
    days: [
      { name:"Power Upper", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Heavy Bench", slots:[{ pool:"push_primary", loading:"me", rotateEvery:3 }] },
        { letter:"B",  name:"Heavy Row + OHP", slots:[{ pool:"pull_horizontal", loading:"compound" }, { pool:"press_primary", loading:"compound" }] },
        { letter:"C",  name:"Arms", slots:[{ pool:"bicep", loading:"accessory" }, { pool:"tricep", loading:"accessory" }] }
      ]},
      { name:"Power Lower", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Heavy Squat", slots:[{ pool:"squat_primary", loading:"me", rotateEvery:3 }] },
        { letter:"B",  name:"Heavy Deadlift", slots:[{ pool:"hinge_primary", loading:"compound" }] },
        { letter:"C",  name:"Single-Leg + Core", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"core", loading:"accessory" }] }
      ]},
      { name:"Hypertrophy Upper", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Volume Press", slots:[{ pool:"push_secondary", loading:"accessory" }, { pool:"push_secondary", loading:"accessory" }] },
        { letter:"B",  name:"Volume Pull", slots:[{ pool:"pull_vertical", loading:"accessory" }, { pool:"pull_horizontal", loading:"accessory" }] },
        { letter:"C",  name:"Isolation", slots:[{ pool:"delt", loading:"isolation" }, { pool:"bicep", loading:"isolation" }, { pool:"tricep", loading:"isolation" }] }
      ]},
      { name:"Hypertrophy Lower", blocks:[
        { letter:"WU", name:"Warm-Up", type:"warmup" },
        { letter:"A",  name:"Volume Squat", slots:[{ pool:"squat_secondary", loading:"accessory" }, { pool:"squat_secondary", loading:"accessory" }] },
        { letter:"B",  name:"Volume Hinge", slots:[{ pool:"glute", loading:"accessory" }, { pool:"hinge_secondary", loading:"accessory" }] },
        { letter:"C",  name:"Calves + Core", slots:[{ pool:"squat_secondary", loading:"isolation" }, { pool:"core", loading:"accessory" }] }
      ]}
    ]
  }
};
