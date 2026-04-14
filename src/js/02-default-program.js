// ============================================================
// DEFAULT PROGRAM
// ============================================================
function mkSets(exRef, overrides = {}) {
  return Object.assign({
    exId: exRef.id,
    name: exRef.name,
    muscles: [...exRef.muscles],
    sets: exRef.defaultSets,
    reps: exRef.defaultReps,
    rest: exRef.defaultRest,
    defaultWeight: exRef.defaultWeight ?? 0,
    bodyweight: exRef.bodyweight || false,
    perSide: exRef.perSide || false,
    isTime: exRef.isTime || false,
    isDistance: exRef.isDistance || false,
    tempo: "",
    notes: ""
  }, overrides);
}

const DEFAULT_PROGRAM = [
  { id:1, name:"Lower Body — Strength", sub:"Heavy lower + upper accessory", blocks:[
    { id:"d1-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.rower, { sets:3, reps:200, rest:0 }),
      mkSets(LIB_BY_ID.cossacksquat, { sets:3, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.bandpullapart, { sets:3, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.wgs, { sets:3, reps:5, rest:0 })
    ]},
    { id:"d1-a", letter:"A1", name:"Max Effort", exercises:[
      mkSets(LIB_BY_ID.backsquat, { sets:5, reps:3, rest:210, tempo:"3-1-1-0", notes:"Work to 3RM. Controlled descent, drive hard. Rotate variation every 3 weeks." })
    ]},
    { id:"d1-b", letter:"B", name:"Upper Superset", exercises:[
      mkSets(LIB_BY_ID.tempobench, { sets:4, reps:5, rest:90, tempo:"3-1-1-0", notes:"Moderate load (~75%). Focus on chest stretch and control." }),
      mkSets(LIB_BY_ID.csrow, { sets:4, reps:8, rest:90, tempo:"2-1-1-0", notes:"Superset with bench. Squeeze at top." })
    ]},
    { id:"d1-c", letter:"C", name:"Posterior + Core", exercises:[
      mkSets(LIB_BY_ID.rdl, { sets:3, reps:8, rest:90, tempo:"3-0-1-1", notes:"Slow lowering, feel the hamstrings load." }),
      mkSets(LIB_BY_ID.pallof, { sets:3, reps:10, rest:60, tempo:"2-1-2-0", notes:"Anti-rotation stability. Each side." })
    ]},
    { id:"d1-d", letter:"D", name:"Finisher", exercises:[
      mkSets(LIB_BY_ID.farmers, { sets:4, reps:40, rest:90, notes:"4 × 40m. Full-body tension, grip, core." })
    ]},
  ]},
  { id:2, name:"Upper Body — Strength", sub:"Heavy upper + lower accessory", blocks:[
    { id:"d2-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.rower, { sets:3, reps:200, rest:0 }),
      mkSets(LIB_BY_ID.scappushup, { sets:3, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.facepull, { sets:3, reps:10, rest:0, notes:"Banded" }),
      mkSets(LIB_BY_ID.thoracicrot, { sets:3, reps:5, rest:0 })
    ]},
    { id:"d2-a", letter:"A1", name:"Max Effort", exercises:[
      mkSets(LIB_BY_ID.strictpress, { sets:5, reps:2, rest:210, tempo:"2-1-1-0", notes:"Work to 2RM. Rotate every 3 weeks (CG bench, incline, log press)." })
    ]},
    { id:"d2-b", letter:"B", name:"Heavy Pull Superset", exercises:[
      mkSets(LIB_BY_ID.trapbar, { sets:4, reps:5, rest:120, tempo:"2-1-1-0", notes:"Heavy submaximal (~80-85%). Full hip extension." }),
      mkSets(LIB_BY_ID.weightedpullup, { sets:4, reps:5, rest:90, tempo:"2-0-1-1", notes:"Add weight progressively. Bodyweight if needed." })
    ]},
    { id:"d2-c", letter:"C", name:"Single Leg + Carry", exercises:[
      mkSets(LIB_BY_ID.bulgarian, { sets:3, reps:8, rest:60, tempo:"3-1-1-0", notes:"Slow eccentric. DB or KB goblet." }),
      mkSets(LIB_BY_ID.safwalk, { sets:3, reps:40, rest:60, notes:"3 × 40m/side. Anti-lateral flexion." })
    ]},
    { id:"d2-d", letter:"D", name:"Finisher", exercises:[
      mkSets(LIB_BY_ID.assaultbike, { sets:6, reps:20, rest:40, notes:"6 × 20s ON / 40s OFF. Max effort sprints." })
    ]},
  ]},
  { id:3, name:"Lower Body — Power", sub:"Speed work + upper accessory", blocks:[
    { id:"d3-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.rower, { sets:3, reps:200, rest:0 }),
      mkSets(LIB_BY_ID.goblet, { sets:3, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.bandpullapart, { sets:3, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.inchworm, { sets:3, reps:5, rest:0 })
    ]},
    { id:"d3-a", letter:"A1", name:"Dynamic Effort", exercises:[
      mkSets(LIB_BY_ID.deadlift, { name:"Speed Deadlift", sets:8, reps:2, rest:60, tempo:"X-0-X-0", notes:"70-75% 1RM. Reset each rep. Max speed off floor." })
    ]},
    { id:"d3-b", letter:"B", name:"Push + Pull", exercises:[
      mkSets(LIB_BY_ID.inclinedb, { sets:4, reps:8, rest:90, tempo:"3-0-1-1", notes:"Tempo work — feel the stretch, control the press." }),
      mkSets(LIB_BY_ID.facepull, { sets:4, reps:12, rest:60, tempo:"2-1-2-0", notes:"Shoulder health + rear delt." })
    ]},
    { id:"d3-c", letter:"C", name:"Single-Leg + Core", exercises:[
      mkSets(LIB_BY_ID.slrdl, { sets:3, reps:8, rest:60, tempo:"3-0-1-1", notes:"Balance + hamstring + hip stability." }),
      mkSets(LIB_BY_ID.tgu, { sets:3, reps:2, rest:60, notes:"Full-body coordination and stability." })
    ]},
    { id:"d3-d", letter:"D", name:"Conditioning", exercises:[
      mkSets(LIB_BY_ID.wallball, { name:"EMOM 10min: 10 Wall Balls / 8 Box Jumps", sets:1, reps:1, rest:0, notes:"Athletic conditioning — power + stamina." })
    ]},
  ]},
  { id:4, name:"Upper Body — Power", sub:"Speed work + lower accessory", blocks:[
    { id:"d4-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.bikerg, { sets:3, reps:60, rest:0 }),
      mkSets(LIB_BY_ID.kbswing, { sets:3, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.ringrow, { sets:3, reps:10, rest:0 }),
      mkSets(LIB_BY_ID.spiderman, { sets:3, reps:5, rest:0 })
    ]},
    { id:"d4-a", letter:"A1", name:"Dynamic Effort", exercises:[
      mkSets(LIB_BY_ID.bench, { name:"Speed Bench Press", sets:8, reps:3, rest:60, tempo:"X-0-X-0", notes:"75-80% 1RM. Max bar speed. Vary grip weekly." })
    ]},
    { id:"d4-b", letter:"B", name:"Squat + Row", exercises:[
      mkSets(LIB_BY_ID.frontsquat, { sets:4, reps:5, rest:120, tempo:"3-0-1-1", notes:"Moderate-heavy (~80%). Upright torso, full depth." }),
      mkSets(LIB_BY_ID.sarow, { sets:4, reps:8, rest:60, tempo:"2-1-1-1", notes:"Anti-rotation from single arm." })
    ]},
    { id:"d4-c", letter:"C", name:"Press + Hinge", exercises:[
      mkSets(LIB_BY_ID.hkpress, { sets:3, reps:8, rest:60, tempo:"2-0-1-1", notes:"Filly-style press. Core + shoulder stability." }),
      mkSets(LIB_BY_ID.hipthrust, { sets:3, reps:10, rest:60, tempo:"2-2-1-0", notes:"2-sec hold at top for glute activation." })
    ]},
    { id:"d4-d", letter:"D", name:"Conditioning", exercises:[
      mkSets(LIB_BY_ID.rower, { name:"3 Rounds: 250m Row · 12 KB Swings · 8 Burpees", sets:3, reps:1, rest:120, notes:"Functional capacity. 8-12 min total." })
    ]},
  ]},
  { id:5, name:"Full Body — Conditioning", sub:"Cardio + pump work", blocks:[
    { id:"d5-wu", letter:"WU", name:"Warm-Up", type:"warmup", exercises:[
      mkSets(LIB_BY_ID.rower, { sets:1, reps:1000, rest:0, notes:"5 min easy pace" }),
      mkSets(LIB_BY_ID.inchworm, { sets:1, reps:6, rest:0 }),
      mkSets(LIB_BY_ID.wgs, { sets:1, reps:5, rest:0 }),
      mkSets(LIB_BY_ID.cossacksquat, { sets:1, reps:8, rest:0 })
    ]},
    { id:"d5-a", letter:"A", name:"Conditioning", exercises:[
      mkSets(LIB_BY_ID.rower, { name:"4 Rounds: 400m Row · 15 KB Swings · 10 Push-Ups · 10 Air Squats", sets:4, reps:1, rest:90, notes:"Sustained effort. Conversational pace. 16-20 min." })
    ]},
    { id:"d5-b", letter:"B", name:"Arms Superset", exercises:[
      mkSets(LIB_BY_ID.bbcurl, { sets:3, reps:12, rest:60, tempo:"2-0-1-1", notes:"Hypertrophy. Controlled reps." }),
      mkSets(LIB_BY_ID.dip, { sets:3, reps:12, rest:60, tempo:"2-0-1-1", notes:"Or cable pushdown." })
    ]},
    { id:"d5-c", letter:"C", name:"Shoulders Superset", exercises:[
      mkSets(LIB_BY_ID.latraise, { sets:3, reps:15, rest:45, tempo:"2-1-1-0", notes:"Light, high-rep. Shoulder cap work." }),
      mkSets(LIB_BY_ID.revfly, { sets:3, reps:15, rest:45, tempo:"2-1-1-0", notes:"Posture + shoulder balance." })
    ]},
    { id:"d5-d", letter:"D", name:"Core Circuit", exercises:[
      mkSets(LIB_BY_ID.plank, { sets:3, reps:30, rest:60, notes:"3 rounds: 30s Plank · 10 Dead Bugs · 10 Hanging Knee Raises" })
    ]},
  ]},
];