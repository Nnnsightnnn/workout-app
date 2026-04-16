// ============================================================
// PROGRAM TEMPLATES
// ============================================================
const PROGRAM_TEMPLATES = [
  // All programs use the periodization engine (04e) via PROGRAM_CONFIGS.
  // Phases are computed dynamically via allocatePhases() from the config's phaseConfig.

  { id:"conjugate5", name:"Conjugate", description:"Heavy/speed upper/lower split with a conditioning day.", daysPerWeek:5, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"jbrown3", name:"Functional Conjugate", description:"Jason Brown: 2 heavy full-body days + 1 speed day with conditioning.", daysPerWeek:3, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"filly4", name:"Functional Bodybuilding", description:"Marcus Filly: tempo-driven upper/lower with giant sets.", daysPerWeek:4, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"hypertrophy5", name:"Hypertrophy PPL+UL", description:"Push/Pull/Legs/Upper/Lower — stretch-biased movements and delt emphasis.", daysPerWeek:5, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"athletic4", name:"Athletic Performance", description:"Power + strength days with jumps, carries, and conditioning finishers.", daysPerWeek:4, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"minimal3", name:"Minimal Equipment", description:"Pull-up bar + kettlebells + bands. Full-body with density progression.", daysPerWeek:3, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"glutes2", name:"Glute Builder (Add-On)", description:"Supplemental glute sessions — posterior chain and hip hypertrophy.", daysPerWeek:2, minWeeks:6, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"upperlower4", name:"Upper/Lower Split", description:"Classic U/L split — horizontal + vertical days with balanced volume.", daysPerWeek:4, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"ppl3", name:"Push/Pull/Legs", description:"One push, one pull, one legs — simple and effective.", daysPerWeek:3, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"ppl6", name:"Push/Pull/Legs x2", description:"Each muscle 2x per week — high frequency hypertrophy.", daysPerWeek:6, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"beginner3", name:"Beginner Full Body", description:"Learn the lifts — simple compounds, gradual progression.", daysPerWeek:3, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"powerlifting4", name:"Powerlifting", description:"Squat/Bench/Deadlift focus — competition-style periodization.", daysPerWeek:4, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"brosplit5", name:"Classic Bodybuilding", description:"One body part per day — chest, back, shoulders, legs, arms.", daysPerWeek:5, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"masters3", name:"Over-40 Strength", description:"Joint-friendly, recovery-focused — build strength sustainably.", daysPerWeek:3, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"strength_cond4", name:"Strength + Conditioning", description:"Heavy lifts + metcons — build strength and cardio together.", daysPerWeek:4, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"runner2", name:"Runner's Strength", description:"Injury prevention + power for runners — minimal gym time.", daysPerWeek:2, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"functional5", name:"Functional Fitness", description:"Strength, power, conditioning — well-rounded fitness.", daysPerWeek:5, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"calisthenics4", name:"Calisthenics + Weights", description:"Bodyweight skills combined with loaded strength work.", daysPerWeek:4, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"rpt3", name:"Reverse Pyramid", description:"Heaviest set first, drop 10% per set. Time-efficient strength.", daysPerWeek:3, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"kot3", name:"Knees Over Toes / ATG", description:"Joint health first — full ROM, progressive knee conditioning.", daysPerWeek:3, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"hybrid5", name:"Hybrid Athlete", description:"Concurrent strength + endurance — Viada method. Don't sacrifice either.", daysPerWeek:5, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"prvn4", name:"PRVN / CrossFit GPP", description:"Strength block + MetCon per session. Periodized general fitness.", daysPerWeek:4, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"wendler4", name:"5/3/1 Wendler", description:"Classic 5/3/1 waves — 3-week cycles with AMRAP sets + BBB accessories.", daysPerWeek:4, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"gzcl4", name:"GZCL Method", description:"Tiered training — T1 heavy, T2 moderate, T3 pump. Structured progression.", daysPerWeek:4, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"ss3", name:"Starting Strength", description:"Novice linear progression — squat every session, simple compounds, add weight each time.", daysPerWeek:3, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"gvt4", name:"German Volume Training", description:"10×10 shock protocol — extreme volume for rapid hypertrophy. Not for the faint.", daysPerWeek:4, minWeeks:6, maxWeeks:10, totalWeeks:null, phases:null },
  { id:"phul4", name:"PHUL", description:"Power Hypertrophy Upper Lower — 2 heavy days + 2 volume days.", daysPerWeek:4, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
];

// Resolve phases dynamically for any template + totalWeeks
function getPhasesForTemplate(tplId, totalWeeks) {
  var cfg = (typeof PROGRAM_CONFIGS !== "undefined") ? PROGRAM_CONFIGS[tplId] : null;
  if (!cfg || !cfg.phaseConfig) return null;
  return allocatePhases(totalWeeks || 10, cfg.phaseConfig);
}
