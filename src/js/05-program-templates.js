// ============================================================
// PROGRAM TEMPLATES
// ============================================================
const PROGRAM_TEMPLATES = [
  // All programs now use the periodization engine (04e) via PROGRAM_CONFIGS.
  // `days` kept as static fallback/preview. `daysPerWeek`, `minWeeks`, `maxWeeks` are new.
  // Phases are computed dynamically via allocatePhases() from the config's phaseConfig.

  { id:"conjugate5", name:"5-Day Conjugate", description:"Heavy/speed upper/lower split with a conditioning day.", daysPerWeek:5, days:DEFAULT_PROGRAM, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"jbrown3", name:"Functional Conjugate (3-Day)", description:"Jason Brown: 2 heavy full-body days + 1 speed day with conditioning.", daysPerWeek:3, days:JBROWN_PROGRAM, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"filly4", name:"Functional Bodybuilding (4-Day)", description:"Marcus Filly: tempo-driven upper/lower with giant sets.", daysPerWeek:4, days:FILLY_PROGRAM, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"hypertrophy5", name:"Hypertrophy PPL+UL (5-Day)", description:"Push/Pull/Legs/Upper/Lower — stretch-biased movements and delt emphasis.", daysPerWeek:5, days:PROGRAM_HYPERTROPHY, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"athletic4", name:"Athletic Performance (4-Day)", description:"Power + strength days with jumps, carries, and conditioning finishers.", daysPerWeek:4, days:PROGRAM_ATHLETIC, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"minimal3", name:"Minimal Equipment (3-Day)", description:"Pull-up bar + kettlebells + bands. Full-body with density progression.", daysPerWeek:3, days:PROGRAM_MINIMAL, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"glutes2", name:"Glute Builder (2-Day Add-On)", description:"Supplemental glute sessions — posterior chain and hip hypertrophy.", daysPerWeek:2, days:PROGRAM_GLUTES, minWeeks:6, maxWeeks:12, totalWeeks:null, phases:null },
  // New periodized programs (generated-only, no static fallback days needed)
  { id:"upperlower4", name:"Upper/Lower Split (4-Day)", description:"Classic U/L split — horizontal + vertical days with balanced volume.", daysPerWeek:4, days:DEFAULT_PROGRAM.slice(0,4), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"ppl3", name:"Push/Pull/Legs (3-Day)", description:"One push, one pull, one legs — simple and effective.", daysPerWeek:3, days:DEFAULT_PROGRAM.slice(0,3), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"ppl6", name:"Push/Pull/Legs x2 (6-Day)", description:"Each muscle 2x per week — high frequency hypertrophy.", daysPerWeek:6, days:DEFAULT_PROGRAM.slice(0,5).concat(DEFAULT_PROGRAM.slice(0,1)), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"beginner3", name:"Beginner Full Body (3-Day)", description:"Learn the lifts — simple compounds, gradual progression.", daysPerWeek:3, days:DEFAULT_PROGRAM.slice(0,3), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"powerlifting4", name:"Powerlifting (4-Day)", description:"Squat/Bench/Deadlift focus — competition-style periodization.", daysPerWeek:4, days:DEFAULT_PROGRAM.slice(0,4), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"brosplit5", name:"Classic Bodybuilding (5-Day)", description:"One body part per day — chest, back, shoulders, legs, arms.", daysPerWeek:5, days:DEFAULT_PROGRAM, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"masters3", name:"Over-40 Strength (3-Day)", description:"Joint-friendly, recovery-focused — build strength sustainably.", daysPerWeek:3, days:DEFAULT_PROGRAM.slice(0,3), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"strength_cond4", name:"Strength + Conditioning (4-Day)", description:"Heavy lifts + metcons — build strength and cardio together.", daysPerWeek:4, days:DEFAULT_PROGRAM.slice(0,4), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"runner2", name:"Runner's Strength (2-Day)", description:"Injury prevention + power for runners — minimal gym time.", daysPerWeek:2, days:DEFAULT_PROGRAM.slice(0,2), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"functional5", name:"Functional Fitness (5-Day)", description:"Strength, power, conditioning — well-rounded fitness.", daysPerWeek:5, days:DEFAULT_PROGRAM, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"calisthenics4", name:"Calisthenics + Weights (4-Day)", description:"Bodyweight skills combined with loaded strength work.", daysPerWeek:4, days:DEFAULT_PROGRAM.slice(0,4), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  // Methodology-based programs (from fitness-trainer plugin research)
  { id:"rpt3", name:"Reverse Pyramid (3-Day)", description:"Heaviest set first, drop 10% per set. Time-efficient strength.", daysPerWeek:3, days:DEFAULT_PROGRAM.slice(0,3), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"kot3", name:"Knees Over Toes / ATG (3-Day)", description:"Joint health first — full ROM, progressive knee conditioning.", daysPerWeek:3, days:DEFAULT_PROGRAM.slice(0,3), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"hybrid5", name:"Hybrid Athlete (5-Day)", description:"Concurrent strength + endurance — Viada method. Don't sacrifice either.", daysPerWeek:5, days:DEFAULT_PROGRAM, minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"prvn4", name:"PRVN / CrossFit GPP (4-Day)", description:"Strength block + MetCon per session. Periodized general fitness.", daysPerWeek:4, days:DEFAULT_PROGRAM.slice(0,4), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  // Named community programs
  { id:"wendler4", name:"5/3/1 Wendler (4-Day)", description:"Classic 5/3/1 waves — 3-week cycles with AMRAP sets + BBB accessories.", daysPerWeek:4, days:DEFAULT_PROGRAM.slice(0,4), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"gzcl4", name:"GZCL Method (4-Day)", description:"Tiered training — T1 heavy, T2 moderate, T3 pump. Structured progression.", daysPerWeek:4, days:DEFAULT_PROGRAM.slice(0,4), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"ss3", name:"Starting Strength (3-Day)", description:"Novice linear progression — squat every session, simple compounds, add weight each time.", daysPerWeek:3, days:DEFAULT_PROGRAM.slice(0,3), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
  { id:"gvt4", name:"German Volume Training (4-Day)", description:"10×10 shock protocol — extreme volume for rapid hypertrophy. Not for the faint.", daysPerWeek:4, days:DEFAULT_PROGRAM.slice(0,4), minWeeks:6, maxWeeks:10, totalWeeks:null, phases:null },
  { id:"phul4", name:"PHUL (4-Day)", description:"Power Hypertrophy Upper Lower — 2 heavy days + 2 volume days.", daysPerWeek:4, days:DEFAULT_PROGRAM.slice(0,4), minWeeks:8, maxWeeks:12, totalWeeks:null, phases:null },
];

// Resolve phases dynamically for any template + totalWeeks
function getPhasesForTemplate(tplId, totalWeeks) {
  var cfg = (typeof PROGRAM_CONFIGS !== "undefined") ? PROGRAM_CONFIGS[tplId] : null;
  if (!cfg || !cfg.phaseConfig) return null;
  return allocatePhases(totalWeeks || 10, cfg.phaseConfig);
}
