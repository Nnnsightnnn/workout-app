// ============================================================
// GLOSSARY — training term definitions + inline SVG artwork
// ============================================================

// Color palette matching app theme
var _gc = { orange:"#ff6b35", red:"#ff2d55", green:"#30d158", blue:"#64d2ff", purple:"#bf5af2", dim:"#888", bg:"#1a1a2e" };

var GLOSSARY = {
  // --- Program names ---
  "5/3/1": {
    short:"Wendler's 5/3/1",
    long:"3-week wave: sets of 5, then 3, then 1 at increasing percentages. Last set is AMRAP. One main lift per day + accessories. Created by Jim Wendler.",
    svg:'<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="50" height="80" rx="6" fill="'+_gc.green+'" opacity="0.8"/><rect x="75" y="30" width="50" height="60" rx="6" fill="'+_gc.orange+'" opacity="0.8"/><rect x="140" y="55" width="50" height="35" rx="6" fill="'+_gc.red+'" opacity="0.8"/><text x="35" y="58" text-anchor="middle" fill="#fff" font-size="20" font-weight="800">5</text><text x="100" y="68" text-anchor="middle" fill="#fff" font-size="20" font-weight="800">3</text><text x="165" y="78" text-anchor="middle" fill="#fff" font-size="20" font-weight="800">1</text><text x="35" y="8" text-anchor="middle" fill="'+_gc.dim+'" font-size="9">65-85%</text><text x="100" y="28" text-anchor="middle" fill="'+_gc.dim+'" font-size="9">70-90%</text><text x="165" y="53" text-anchor="middle" fill="'+_gc.dim+'" font-size="9">75-95%</text><line x1="25" y1="92" x2="180" y2="50" stroke="'+_gc.red+'" stroke-width="2" stroke-dasharray="4" opacity="0.5"/></svg>'
  },
  "GZCL": {
    short:"Tiered Training",
    long:"3 tiers per session: T1 heavy compound (3-5 reps), T2 moderate compound (8-10 reps), T3 pump isolation (15+ reps). Created by Cody Lefever.",
    svg:'<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg"><polygon points="100,5 170,40 155,40 155,40" fill="none"/><rect x="65" y="5" width="70" height="28" rx="6" fill="'+_gc.red+'" opacity="0.85"/><rect x="40" y="40" width="120" height="28" rx="6" fill="'+_gc.orange+'" opacity="0.85"/><rect x="15" y="75" width="170" height="28" rx="6" fill="'+_gc.green+'" opacity="0.85"/><text x="100" y="24" text-anchor="middle" fill="#fff" font-size="12" font-weight="800">T1 — Heavy 5×3</text><text x="100" y="59" text-anchor="middle" fill="#fff" font-size="12" font-weight="800">T2 — Moderate 3×10</text><text x="100" y="94" text-anchor="middle" fill="#fff" font-size="12" font-weight="800">T3 — Pump 3×15+</text></svg>'
  },
  "GVT": {
    short:"German Volume Training",
    long:"10 sets of 10 reps on one compound lift at ~60% 1RM with 60s rest. Extreme volume for rapid hypertrophy. Typically run 4-6 weeks.",
    svg:'<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">' + (function(){var s="";for(var r=0;r<10;r++)for(var c=0;c<10;c++)s+='<circle cx="'+(18+c*18)+'" cy="'+(10+r*9)+'" r="3" fill="'+_gc.orange+'" opacity="'+(0.4+r*0.06)+'"/>';return s;})() + '<text x="100" y="98" text-anchor="middle" fill="'+_gc.dim+'" font-size="9" font-weight="700">10 sets × 10 reps = 100 reps</text></svg>'
  },
  "RPT": {
    short:"Reverse Pyramid Training",
    long:"Heaviest set first when fresh, then drop weight 10-15% for subsequent sets. Time-efficient — sessions run 45-60 min instead of 90+.",
    svg:'<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="10" width="55" height="75" rx="6" fill="'+_gc.red+'" opacity="0.85"/><rect x="85" y="30" width="45" height="55" rx="6" fill="'+_gc.orange+'" opacity="0.85"/><rect x="140" y="48" width="40" height="37" rx="6" fill="'+_gc.green+'" opacity="0.85"/><text x="47" y="52" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">100%</text><text x="107" y="62" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">90%</text><text x="160" y="71" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">80%</text><text x="47" y="70" text-anchor="middle" fill="#fff" font-size="9">5 reps</text><text x="107" y="77" text-anchor="middle" fill="#fff" font-size="9">8 reps</text><text x="160" y="79" text-anchor="middle" fill="#fff" font-size="8">10 reps</text><path d="M30,8 L170,45" stroke="'+_gc.dim+'" stroke-width="1.5" stroke-dasharray="4" opacity="0.5"/></svg>'
  },
  "Conjugate": {
    short:"Westside Method",
    long:"Max Effort days (heavy 1-3 reps) + Dynamic Effort days (speed work at percentages). Exercises rotate every 3 weeks to prevent accommodation.",
    svg:'<svg viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="35" rx="8" fill="'+_gc.red+'" opacity="0.85"/><rect x="110" y="10" width="80" height="35" rx="8" fill="'+_gc.orange+'" opacity="0.85"/><text x="50" y="32" text-anchor="middle" fill="#fff" font-size="12" font-weight="800">ME</text><text x="150" y="32" text-anchor="middle" fill="#fff" font-size="12" font-weight="800">DE</text><text x="50" y="43" text-anchor="middle" fill="#fff" font-size="8">Heavy 1-3 RM</text><text x="150" y="43" text-anchor="middle" fill="#fff" font-size="8">Speed 60-80%</text><path d="M65,52 C65,72 135,72 135,52" stroke="'+_gc.purple+'" stroke-width="2" fill="none" marker-end="url(#arr)"/><path d="M135,52 C135,78 65,78 65,52" stroke="'+_gc.purple+'" stroke-width="2" fill="none" stroke-dasharray="4"/><text x="100" y="72" text-anchor="middle" fill="'+_gc.purple+'" font-size="9" font-weight="700">Rotate every 3 wk</text><defs><marker id="arr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L6,3 L0,6Z" fill="'+_gc.purple+'"/></marker></defs></svg>'
  },
  "KOT / ATG": {
    short:"Knees Over Toes",
    long:"Joint health program by Ben Patrick. Progressive full-range knee conditioning: tibialis raises, ATG split squats, backward sled drags, Nordic curls.",
    svg:'<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><line x1="100" y1="10" x2="100" y2="40" stroke="'+_gc.dim+'" stroke-width="3" stroke-linecap="round"/><line x1="100" y1="40" x2="80" y2="75" stroke="'+_gc.dim+'" stroke-width="3" stroke-linecap="round"/><line x1="80" y1="75" x2="75" y2="95" stroke="'+_gc.dim+'" stroke-width="3" stroke-linecap="round"/><circle cx="100" cy="8" r="6" fill="'+_gc.dim+'"/><circle cx="100" cy="40" r="4" fill="'+_gc.green+'"/><circle cx="80" cy="75" r="5" fill="'+_gc.green+'"/><path d="M68,60 A20,20 0 0,1 90,48" stroke="'+_gc.green+'" stroke-width="2" fill="none" marker-end="url(#karr)"/><text x="55" y="50" fill="'+_gc.green+'" font-size="9" font-weight="700">Full ROM</text><text x="130" y="35" fill="'+_gc.orange+'" font-size="10" font-weight="700">ATG depth</text><path d="M125,37 L105,40" stroke="'+_gc.orange+'" stroke-width="1"/><rect x="140" y="55" width="50" height="38" rx="6" fill="'+_gc.green+'" opacity="0.15" stroke="'+_gc.green+'" stroke-width="1"/><text x="165" y="70" text-anchor="middle" fill="'+_gc.green+'" font-size="8" font-weight="700">Week 1-2: BW</text><text x="165" y="82" text-anchor="middle" fill="'+_gc.green+'" font-size="8" font-weight="700">Week 5+: Load</text><defs><marker id="karr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L6,3 L0,6Z" fill="'+_gc.green+'"/></marker></defs></svg>'
  },
  "PPL": {
    short:"Push/Pull/Legs",
    long:"Push muscles one day (chest, shoulders, triceps), pull muscles next (back, biceps), legs last. Run 3 or 6 days per week.",
    svg:'<svg viewBox="0 0 200 70" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="10" width="60" height="50" rx="8" fill="'+_gc.red+'" opacity="0.8"/><rect x="70" y="10" width="60" height="50" rx="8" fill="'+_gc.blue+'" opacity="0.8"/><rect x="135" y="10" width="60" height="50" rx="8" fill="'+_gc.green+'" opacity="0.8"/><text x="35" y="32" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">PUSH</text><text x="100" y="32" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">PULL</text><text x="165" y="32" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">LEGS</text><text x="35" y="48" text-anchor="middle" fill="#fff" font-size="7" opacity="0.8">Chest Delts Tri</text><text x="100" y="48" text-anchor="middle" fill="#fff" font-size="7" opacity="0.8">Back Biceps</text><text x="165" y="48" text-anchor="middle" fill="#fff" font-size="7" opacity="0.8">Quads Glutes</text></svg>'
  },
  "PHUL": {
    short:"Power Hypertrophy Upper Lower",
    long:"4 days: 2 power days (heavy, low reps) and 2 hypertrophy days (moderate weight, higher reps). Best of both worlds.",
    svg:'<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="92" height="32" rx="6" fill="'+_gc.red+'" opacity="0.85"/><rect x="103" y="5" width="92" height="32" rx="6" fill="'+_gc.red+'" opacity="0.85"/><rect x="5" y="43" width="92" height="32" rx="6" fill="'+_gc.orange+'" opacity="0.85"/><rect x="103" y="43" width="92" height="32" rx="6" fill="'+_gc.orange+'" opacity="0.85"/><text x="51" y="25" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">Power Upper</text><text x="149" y="25" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">Power Lower</text><text x="51" y="63" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">Hyper Upper</text><text x="149" y="63" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">Hyper Lower</text></svg>'
  },
  "PRVN": {
    short:"Periodized CrossFit",
    long:"Strength block + MetCon (metabolic conditioning) per session. Builds strength and cardiovascular fitness concurrently.",
    svg:'<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="8" width="180" height="30" rx="6" fill="'+_gc.red+'" opacity="0.8"/><rect x="10" y="44" width="180" height="30" rx="6" fill="'+_gc.orange+'" opacity="0.8"/><text x="100" y="28" text-anchor="middle" fill="#fff" font-size="12" font-weight="800">Strength Block</text><text x="100" y="64" text-anchor="middle" fill="#fff" font-size="12" font-weight="800">MetCon / WOD</text><text x="195" y="28" text-anchor="end" fill="#fff" font-size="8" opacity="0.7">~20 min</text><text x="195" y="64" text-anchor="end" fill="#fff" font-size="8" opacity="0.7">8-25 min</text></svg>'
  },
  "BBB": { short:"Boring But Big", long:"5/3/1 accessory template: 5×10 of the main lift at 50-60% after the 5/3/1 sets. Simple, effective volume." },
  "Starting Strength": { short:"Novice Linear Progression", long:"3 days per week. Squat every session. Alternate bench/OHP and deadlift/row. Add 5 lbs each session. By Mark Rippetoe." },
  "StrongLifts": { short:"5×5 Linear Progression", long:"Similar to Starting Strength but 5 sets of 5 reps. Squat every session. Add 5 lbs each session until you stall." },

  // --- Training concepts ---
  "Periodization": {
    short:"Planned Variation",
    long:"Changing exercises, sets, reps, and intensity week-to-week in a structured way. Prevents plateaus and manages fatigue.",
    svg:'<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="55" width="45" height="18" rx="4" fill="'+_gc.orange+'" opacity="0.3"/><rect x="55" y="55" width="45" height="18" rx="4" fill="'+_gc.red+'" opacity="0.3"/><rect x="105" y="55" width="35" height="18" rx="4" fill="'+_gc.purple+'" opacity="0.3"/><rect x="145" y="55" width="50" height="18" rx="4" fill="'+_gc.blue+'" opacity="0.3"/><text x="27" y="67" text-anchor="middle" fill="'+_gc.orange+'" font-size="7" font-weight="700">Accum.</text><text x="77" y="67" text-anchor="middle" fill="'+_gc.red+'" font-size="7" font-weight="700">Intens.</text><text x="122" y="67" text-anchor="middle" fill="'+_gc.purple+'" font-size="7" font-weight="700">Peak</text><text x="170" y="67" text-anchor="middle" fill="'+_gc.blue+'" font-size="7" font-weight="700">Deload</text><path d="M10,45 Q30,20 55,30 T100,15 T145,25 T185,40" stroke="'+_gc.orange+'" stroke-width="2.5" fill="none"/><path d="M10,35 Q30,40 55,25 T100,10 T145,5 T185,15" stroke="'+_gc.red+'" stroke-width="2" fill="none" stroke-dasharray="4"/><text x="190" y="45" fill="'+_gc.orange+'" font-size="7">vol</text><text x="190" y="18" fill="'+_gc.red+'" font-size="7">load</text></svg>'
  },
  "Accumulation": { short:"Volume Phase", long:"Higher reps (8-12), moderate weight. Build work capacity and muscle tissue before transitioning to heavier loads." },
  "Intensification": { short:"Strength Phase", long:"Lower reps (3-5), heavier weight. Convert the muscle and work capacity into peak strength." },
  "Deload": {
    short:"Recovery Week",
    long:"Planned light week at ~60% of normal load. Lets your body recover, repair, and come back stronger. Not a sign of weakness.",
    svg:'<svg viewBox="0 0 200 70" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="35" height="50" rx="4" fill="'+_gc.red+'" opacity="0.7"/><rect x="50" y="15" width="35" height="45" rx="4" fill="'+_gc.orange+'" opacity="0.7"/><rect x="90" y="12" width="35" height="48" rx="4" fill="'+_gc.red+'" opacity="0.7"/><rect x="140" y="35" width="50" height="25" rx="6" fill="'+_gc.blue+'" opacity="0.8"/><text x="27" y="40" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">Wk1</text><text x="67" y="42" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">Wk2</text><text x="107" y="41" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">Wk3</text><text x="165" y="51" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">REST</text><text x="165" y="58" text-anchor="middle" fill="#fff" font-size="7">~60%</text></svg>'
  },
  "AMRAP": { short:"As Many Reps As Possible", long:"Push for maximum reps on the last set. Stop when form breaks down, not at a fixed number. Great for gauging progress." },
  "MetCon": { short:"Metabolic Conditioning", long:"Timed circuits or AMRAPs combining strength and cardio movements. Common in CrossFit and functional fitness." },
  "Superset": {
    short:"Back-to-Back Exercises",
    long:"Two exercises performed one after the other with no rest between. Saves time and increases training density.",
    svg:'<svg viewBox="0 0 200 70" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="15" width="70" height="40" rx="8" fill="'+_gc.orange+'" opacity="0.8"/><rect x="115" y="15" width="70" height="40" rx="8" fill="'+_gc.green+'" opacity="0.8"/><text x="50" y="39" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">Exercise A</text><text x="150" y="39" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">Exercise B</text><path d="M88,28 L112,28" stroke="'+_gc.purple+'" stroke-width="2.5" marker-end="url(#sarr)"/><path d="M112,42 L88,42" stroke="'+_gc.purple+'" stroke-width="2.5" marker-end="url(#sarr)"/><text x="100" y="62" text-anchor="middle" fill="'+_gc.dim+'" font-size="8" font-weight="700">No rest between</text><defs><marker id="sarr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L6,3 L0,6Z" fill="'+_gc.purple+'"/></marker></defs></svg>'
  },

  // --- Technical terms ---
  "RPE": {
    short:"Rate of Perceived Exertion",
    long:"1-10 scale. RPE 7 = could do 3 more reps. RPE 8 = could do 2 more. RPE 10 = absolute maximum effort.",
    svg:'<svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="rpeg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="'+_gc.green+'"/><stop offset="50%" stop-color="'+_gc.orange+'"/><stop offset="100%" stop-color="'+_gc.red+'"/></linearGradient></defs><rect x="10" y="15" width="180" height="18" rx="9" fill="url(#rpeg)" opacity="0.85"/><text x="28" y="28" text-anchor="middle" fill="#fff" font-size="9" font-weight="800">1</text><text x="100" y="28" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">5</text><text x="172" y="28" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">10</text><line x1="136" y1="12" x2="136" y2="36" stroke="#fff" stroke-width="2"/><text x="136" y="48" text-anchor="middle" fill="'+_gc.orange+'" font-size="8" font-weight="700">RPE 7: 3 reps left</text><line x1="154" y1="12" x2="154" y2="36" stroke="#fff" stroke-width="1.5" opacity="0.6"/><line x1="172" y1="12" x2="172" y2="36" stroke="#fff" stroke-width="1.5" opacity="0.6"/></svg>'
  },
  "Tempo": {
    short:"Rep Speed",
    long:"4 numbers: eccentric-pause-concentric-top. Example: 3-1-1-0 means 3s lowering, 1s pause, 1s lifting, 0s hold at top.",
    svg:'<svg viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg"><path d="M20,20 L20,65" stroke="'+_gc.red+'" stroke-width="3" stroke-linecap="round" marker-end="url(#td)"/><line x1="55" y1="65" x2="85" y2="65" stroke="'+_gc.orange+'" stroke-width="3" stroke-linecap="round" stroke-dasharray="6,4"/><path d="M120,65 L120,20" stroke="'+_gc.green+'" stroke-width="3" stroke-linecap="round" marker-end="url(#tu)"/><line x1="155" y1="20" x2="185" y2="20" stroke="'+_gc.blue+'" stroke-width="3" stroke-linecap="round" stroke-dasharray="6,4"/><text x="20" y="82" text-anchor="middle" fill="'+_gc.red+'" font-size="10" font-weight="800">3s</text><text x="70" y="82" text-anchor="middle" fill="'+_gc.orange+'" font-size="10" font-weight="800">1s</text><text x="120" y="82" text-anchor="middle" fill="'+_gc.green+'" font-size="10" font-weight="800">1s</text><text x="170" y="82" text-anchor="middle" fill="'+_gc.blue+'" font-size="10" font-weight="800">0s</text><text x="20" y="13" text-anchor="middle" fill="'+_gc.dim+'" font-size="7">Down</text><text x="70" y="58" text-anchor="middle" fill="'+_gc.dim+'" font-size="7">Pause</text><text x="120" y="13" text-anchor="middle" fill="'+_gc.dim+'" font-size="7">Up</text><text x="170" y="13" text-anchor="middle" fill="'+_gc.dim+'" font-size="7">Top</text><defs><marker id="td" viewBox="0 0 8 8" refX="4" refY="7" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L4,8 L8,0Z" fill="'+_gc.red+'"/></marker><marker id="tu" viewBox="0 0 8 8" refX="4" refY="1" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,8 L4,0 L8,8Z" fill="'+_gc.green+'"/></marker></defs></svg>'
  },
  "1RM": { short:"One Rep Max", long:"The heaviest weight you can lift for exactly one rep with good form. Used to calculate training percentages." },
  "Max Effort": { short:"ME — Heaviest Possible", long:"Work up to the heaviest weight you can lift for 1-3 reps. Builds absolute strength. Rotate the exercise every 3 weeks." },
  "Dynamic Effort": { short:"DE — Speed Work", long:"Lift 60-80% of max as fast as possible. Builds explosive power and rate of force development. Short rest (60s)." },
  "Progressive Overload": {
    short:"Do More Over Time",
    long:"Gradually increase weight, reps, or sets over weeks. The fundamental principle of getting stronger.",
    svg:'<svg viewBox="0 0 200 70" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="50" width="30" height="15" rx="4" fill="'+_gc.green+'" opacity="0.7"/><rect x="45" y="40" width="30" height="25" rx="4" fill="'+_gc.green+'" opacity="0.75"/><rect x="80" y="30" width="30" height="35" rx="4" fill="'+_gc.orange+'" opacity="0.8"/><rect x="115" y="20" width="30" height="45" rx="4" fill="'+_gc.orange+'" opacity="0.85"/><rect x="150" y="8" width="30" height="57" rx="4" fill="'+_gc.red+'" opacity="0.85"/><path d="M15,48 L165,6" stroke="#fff" stroke-width="1.5" stroke-dasharray="4" opacity="0.4"/><text x="25" y="62" text-anchor="middle" fill="#fff" font-size="7" font-weight="700">Wk1</text><text x="165" y="62" text-anchor="middle" fill="#fff" font-size="7" font-weight="700">Wk5</text></svg>'
  },
  "Volume": { short:"Total Work Done", long:"Sets × reps × weight. Higher volume = more growth stimulus, but also more fatigue. Balance is key." },
  "Hypertrophy": { short:"Muscle Growth", long:"Training for muscle size. Typically 3-4 sets of 8-12 reps with moderate weight and controlled tempo." },
  "Concurrent": { short:"Training Multiple Qualities", long:"Building strength and endurance at the same time. Requires careful programming to avoid interference." },

  // --- Set types & techniques ---
  "Drop Set": {
    short:"Strip Weight, Keep Going",
    long:"Hit failure, immediately reduce weight 20-30%, and rep out again. Can drop 2-3 times. Maximizes muscle fatigue and pump in minimal time.",
    svg:'<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="8" width="50" height="60" rx="6" fill="'+_gc.red+'" opacity="0.85"/><rect x="70" y="22" width="50" height="46" rx="6" fill="'+_gc.orange+'" opacity="0.85"/><rect x="130" y="38" width="50" height="30" rx="6" fill="'+_gc.green+'" opacity="0.85"/><text x="35" y="35" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">100%</text><text x="35" y="50" text-anchor="middle" fill="#fff" font-size="8">8 reps</text><text x="95" y="45" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">75%</text><text x="95" y="58" text-anchor="middle" fill="#fff" font-size="8">10 reps</text><text x="155" y="53" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">50%</text><text x="155" y="63" text-anchor="middle" fill="#fff" font-size="8">12 reps</text><path d="M62,38 L68,38" stroke="'+_gc.dim+'" stroke-width="2" marker-end="url(#darr)"/><path d="M122,48 L128,48" stroke="'+_gc.dim+'" stroke-width="2" marker-end="url(#darr)"/><text x="100" y="78" text-anchor="middle" fill="'+_gc.dim+'" font-size="8" font-weight="700">No rest between drops</text><defs><marker id="darr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L6,3 L0,6Z" fill="'+_gc.dim+'"/></marker></defs></svg>'
  },
  "Giant Set": { short:"3+ Exercises, No Rest", long:"Three or more exercises performed back-to-back with no rest between. Extremely time-efficient and great for hypertrophy. Common in functional bodybuilding." },
  "Rest-Pause": { short:"Micro-Rest, More Reps", long:"Hit failure, rack the weight for 10-15 seconds, then rep out again. Repeat 1-2 times. Squeezes more volume from a single working weight." },
  "Back-off Set": { short:"Lighter Set After Top Work", long:"After your heaviest sets, drop weight 10-20% for 1-2 additional sets. Adds quality volume without the fatigue cost of more heavy work." },
  "Time Under Tension": { short:"TUT — Slow & Controlled", long:"Deliberately slowing rep speed to keep muscles loaded longer. A 4-second eccentric turns a set of 8 into 40+ seconds of work. Drives hypertrophy through metabolic stress." },

  // --- Training splits & frequency ---
  "Full Body": { short:"Every Muscle, Every Session", long:"Hit all major muscle groups each workout. Typically 3 days per week. Great for beginners and time-crunched lifters. Higher frequency per muscle than bro splits." },
  "Upper/Lower": { short:"Split by Half", long:"Alternate upper-body and lower-body days. Usually 4 sessions per week. Good balance of frequency and recovery for intermediates." },
  "Bro Split": { short:"One Muscle Group Per Day", long:"Chest Monday, Back Tuesday, etc. Each muscle trained once per week with high volume. Popular in bodybuilding. Works if you can train 5-6 days." },
  "High Frequency": { short:"3+ Times Per Muscle Per Week", long:"Training each muscle group 3 or more times per week with moderate volume per session. Research suggests higher frequency can accelerate skill and strength gains." },

  // --- Periodization phases ---
  "Peak": { short:"Competition Prep Phase", long:"1-2 weeks of very heavy singles and doubles at 90-100% to express maximum strength. Follows an intensification block. Volume drops sharply." },
  "Linear Progression": {
    short:"Add Weight Every Session",
    long:"The simplest progression model: add 5 lbs to the bar each workout. Works until you can no longer recover between sessions. The foundation of novice programs like Starting Strength and StrongLifts.",
    svg:'<svg viewBox="0 0 200 70" xmlns="http://www.w3.org/2000/svg"><line x1="15" y1="60" x2="185" y2="10" stroke="'+_gc.green+'" stroke-width="3" stroke-linecap="round"/><circle cx="15" cy="60" r="4" fill="'+_gc.green+'"/><circle cx="57" cy="47" r="4" fill="'+_gc.green+'"/><circle cx="100" cy="34" r="4" fill="'+_gc.green+'"/><circle cx="142" cy="21" r="4" fill="'+_gc.orange+'"/><circle cx="185" cy="10" r="4" fill="'+_gc.red+'"/><text x="15" y="72" text-anchor="middle" fill="'+_gc.dim+'" font-size="7">135</text><text x="57" y="72" text-anchor="middle" fill="'+_gc.dim+'" font-size="7">145</text><text x="100" y="72" text-anchor="middle" fill="'+_gc.dim+'" font-size="7">155</text><text x="142" y="72" text-anchor="middle" fill="'+_gc.dim+'" font-size="7">165</text><text x="185" y="72" text-anchor="middle" fill="'+_gc.dim+'" font-size="7">175</text><text x="100" y="6" text-anchor="middle" fill="'+_gc.green+'" font-size="8" font-weight="700">+5 lbs each session</text></svg>'
  },
  "Wave Loading": {
    short:"Heavy-Light Alternating Sets",
    long:"Alternate between heavier and lighter sets within a session (e.g., 3 reps, 5 reps, 3 reps, 5 reps). The lighter sets feel easier after the heavy ones, letting you lift more than usual. Potentiates the nervous system.",
    svg:'<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="30" height="55" rx="4" fill="'+_gc.red+'" opacity="0.85"/><rect x="48" y="30" width="30" height="35" rx="4" fill="'+_gc.orange+'" opacity="0.85"/><rect x="86" y="8" width="30" height="57" rx="4" fill="'+_gc.red+'" opacity="0.85"/><rect x="124" y="28" width="30" height="37" rx="4" fill="'+_gc.orange+'" opacity="0.85"/><rect x="162" y="5" width="30" height="60" rx="4" fill="'+_gc.red+'" opacity="0.85"/><text x="25" y="42" text-anchor="middle" fill="#fff" font-size="9" font-weight="800">3 rep</text><text x="63" y="52" text-anchor="middle" fill="#fff" font-size="9" font-weight="800">5 rep</text><text x="101" y="40" text-anchor="middle" fill="#fff" font-size="9" font-weight="800">3 rep</text><text x="139" y="50" text-anchor="middle" fill="#fff" font-size="9" font-weight="800">5 rep</text><text x="177" y="39" text-anchor="middle" fill="#fff" font-size="9" font-weight="800">3 rep</text><path d="M25,68 Q44,75 63,68 T101,68 T139,68 T177,68" stroke="'+_gc.purple+'" stroke-width="2" fill="none"/></svg>'
  },

  // --- Other ---
  "Accommodation": { short:"Adaptation Stalls Gains", long:"Your body adapts to the same stimulus over time, and progress slows. The fix: rotate exercises, vary rep ranges, or change intensity. This is why conjugate training switches lifts every 3 weeks." },
  "RIR": {
    short:"Reps In Reserve",
    long:"How many reps you could still do. RIR 2 = stopped with 2 reps left. Closely related to RPE: RPE 8 = RIR 2. Some lifters find RIR more intuitive than the RPE scale.",
    svg:'<svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="rirg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="'+_gc.red+'"/><stop offset="50%" stop-color="'+_gc.orange+'"/><stop offset="100%" stop-color="'+_gc.green+'"/></linearGradient></defs><rect x="10" y="15" width="180" height="18" rx="9" fill="url(#rirg)" opacity="0.85"/><text x="28" y="28" text-anchor="middle" fill="#fff" font-size="9" font-weight="800">0</text><text x="100" y="28" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">3</text><text x="172" y="28" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">5+</text><text x="28" y="48" text-anchor="middle" fill="'+_gc.red+'" font-size="7" font-weight="700">Failure</text><text x="100" y="48" text-anchor="middle" fill="'+_gc.orange+'" font-size="7" font-weight="700">Hard but safe</text><text x="172" y="48" text-anchor="middle" fill="'+_gc.green+'" font-size="7" font-weight="700">Warm-up</text></svg>'
  }
};

// Get glossary term for a template ID (maps program IDs to glossary keys)
var TEMPLATE_GLOSSARY = {
  conjugate5:"Conjugate", jbrown3:"Conjugate", filly4:"Tempo", hypertrophy5:"Hypertrophy",
  athletic4:"Dynamic Effort", ppl3:"PPL", ppl6:"PPL", rpt3:"RPT", kot3:"KOT / ATG",
  hybrid5:"Concurrent", prvn4:"PRVN", wendler4:"5/3/1", gzcl4:"GZCL", ss3:"Starting Strength",
  gvt4:"GVT", phul4:"PHUL", powerlifting4:"Periodization", brosplit5:"Hypertrophy",
  beginner3:"Progressive Overload", masters3:"Deload", functional5:"MetCon",
  strength_cond4:"MetCon", calisthenics4:"Progressive Overload", upperlower4:"Volume",
  minimal3:"Progressive Overload", glutes2:"Hypertrophy", runner2:"Concurrent"
};

function openGlossary(term) {
  var entry = GLOSSARY[term];
  if (!entry) return;
  var html = '<div style="padding:4px 0;">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">';
  html += '<h3 style="margin:0;">' + term + '</h3>';
  html += '<button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>';
  html += '</div>';
  html += '<div style="color:var(--accent);font-weight:700;font-size:13px;margin-bottom:8px;">' + entry.short + '</div>';
  if (entry.svg) {
    html += '<div style="max-width:260px;margin:0 auto 12px;padding:8px;background:var(--card-bg);border-radius:12px;border:1px solid var(--border);">' + entry.svg + '</div>';
  }
  html += '<p style="color:var(--text);font-size:13px;line-height:1.6;margin:0;">' + entry.long + '</p>';
  html += '</div>';
  openSheet(html);
}

function openGlossaryForTemplate(tplId) {
  var key = TEMPLATE_GLOSSARY[tplId];
  if (key) openGlossary(key);
}

function openFullGlossary() {
  var keys = Object.keys(GLOSSARY).sort();
  var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">';
  html += '<h3 style="margin:0;">Glossary</h3>';
  html += '<button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>';
  html += '</div>';
  html += '<div style="max-height:60vh;overflow-y:auto;">';
  keys.forEach(function(k) {
    var e = GLOSSARY[k];
    html += '<div style="padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="closeSheet();setTimeout(function(){openGlossary(\'' + k.replace(/'/g,"\\'").replace(/\//g,"\\/") + '\');},150);">';
    html += '<div style="font-weight:800;font-size:13px;">' + k + ' <span style="color:var(--text-dim);font-weight:500;">— ' + e.short + '</span>';
    if (e.svg) html += ' <span style="color:var(--accent);font-size:10px;">has diagram</span>';
    html += '</div>';
    html += '<div style="color:var(--text-dim);font-size:12px;line-height:1.5;margin-top:2px;">' + e.long.slice(0,80) + (e.long.length > 80 ? '...' : '') + '</div>';
    html += '</div>';
  });
  html += '</div>';
  openSheet(html);
}
