// ============================================================
// PROGRAM TEMPLATES
// ============================================================
const PROGRAM_TEMPLATES = [
  // Legacy programs — infinite rotation (no defined duration)
  { id:"conjugate5", name:"5-Day Conjugate", description:"Heavy/speed upper/lower split with a conditioning day.", days:DEFAULT_PROGRAM, totalWeeks:null, phases:null },
  { id:"jbrown3", name:"Functional Conjugate (3-Day)", description:"Jason Brown: 2 heavy full-body days + 1 speed day with conditioning.", days:JBROWN_PROGRAM, totalWeeks:null, phases:null },
  { id:"filly4", name:"Functional Bodybuilding (4-Day)", description:"Marcus Filly: tempo-driven upper/lower with giant sets.", days:FILLY_PROGRAM, totalWeeks:null, phases:null },
  // Structured programs — defined duration with phases
  { id:"hypertrophy5", name:"Hypertrophy PPL+UL (5-Day)", description:"Push/Pull/Legs/Upper/Lower — stretch-biased movements and delt emphasis.", days:PROGRAM_HYPERTROPHY,
    totalWeeks:10, phases:[
      { name:"Accumulation", weeks:[1,2,3,4], color:"#ff6b35", description:"Build volume — moderate weight, higher reps" },
      { name:"Intensification", weeks:[5,6,7,8], color:"#ff2d55", description:"Increase intensity — heavier loads, moderate reps" },
      { name:"Deload", weeks:[9,10], color:"#64d2ff", description:"Recovery — reduce load 40%, focus on form" }
    ]},
  { id:"athletic4", name:"Athletic Performance (4-Day)", description:"Power + strength days with jumps, carries, and conditioning finishers.", days:PROGRAM_ATHLETIC,
    totalWeeks:8, phases:[
      { name:"Foundation", weeks:[1,2,3], color:"#30d158", description:"Build base — movement quality and work capacity" },
      { name:"Power", weeks:[4,5,6], color:"#ff6b35", description:"Develop explosiveness — increase speed and load" },
      { name:"Peak & Deload", weeks:[7,8], color:"#64d2ff", description:"Peak performance then recover" }
    ]},
  { id:"minimal3", name:"Minimal Equipment (3-Day)", description:"Pull-up bar + kettlebells + bands. Full-body with density progression.", days:PROGRAM_MINIMAL,
    totalWeeks:8, phases:[
      { name:"Density", weeks:[1,2,3,4], color:"#bf5af2", description:"More work in less time — build conditioning" },
      { name:"Strength", weeks:[5,6,7], color:"#ff6b35", description:"Heavier loads, longer rest — build strength" },
      { name:"Deload", weeks:[8], color:"#64d2ff", description:"Active recovery — lighter sessions" }
    ]},
  { id:"glutes2", name:"Glute Builder (2-Day Add-On)", description:"Supplemental glute sessions — posterior chain and hip hypertrophy.", days:PROGRAM_GLUTES,
    totalWeeks:6, phases:[
      { name:"Activation", weeks:[1,2], color:"#30d158", description:"Mind-muscle connection — lighter loads, high reps" },
      { name:"Growth", weeks:[3,4,5], color:"#ff6b35", description:"Progressive overload — increase weight each week" },
      { name:"Deload", weeks:[6], color:"#64d2ff", description:"Recovery — maintain movement, reduce volume" }
    ]},
];