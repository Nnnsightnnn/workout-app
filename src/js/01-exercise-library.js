// ============================================================
// EXERCISE LIBRARY
// ============================================================
const CATEGORIES = ["Squat","Hinge","Push","Pull","Arms","Shoulders","Core","Carry","Conditioning","Warmup"];
// defaultWeight is in lbs. For DB/KB exercises, it's the per-hand weight.
// For bodyweight and time/distance-only exercises, defaultWeight is 0.
const LIBRARY = [
  // Squat
  { id:"backsquat", name:"Back Squat", muscles:["quads","glutes","core"], cat:"Squat", defaultRest:180, defaultSets:3, defaultReps:5, defaultWeight:135, demoUrl:"https://www.youtube.com/watch?v=ultWZbUMPL8" },
  { id:"frontsquat", name:"Front Squat", muscles:["quads","core"], cat:"Squat", defaultRest:150, defaultSets:4, defaultReps:5, defaultWeight:115, demoUrl:"https://www.youtube.com/watch?v=m4ytaCJZpl0" },
  { id:"goblet", name:"Goblet Squat", muscles:["quads","glutes","core"], cat:"Squat", defaultRest:90, defaultSets:3, defaultReps:10, defaultWeight:50, demoUrl:"https://www.youtube.com/watch?v=MeIiIdhvXT4" },
  { id:"bulgarian", name:"Bulgarian Split Squat", muscles:["quads","glutes"], cat:"Squat", defaultRest:60, defaultSets:3, defaultReps:8, perSide:true, defaultWeight:30, demoUrl:"https://www.youtube.com/watch?v=2C-uNgKwPLE" },
  { id:"pausesquat", name:"Pause Squat", muscles:["quads","glutes","core"], cat:"Squat", defaultRest:180, defaultSets:4, defaultReps:4, defaultWeight:115, demoUrl:"https://www.youtube.com/watch?v=0ELH2NcFLZA" },
  { id:"ssbsquat", name:"Safety Bar Squat", muscles:["quads","glutes","core","upper back"], cat:"Squat", defaultRest:180, defaultSets:4, defaultReps:5, defaultWeight:135, demoUrl:"https://www.youtube.com/watch?v=IT6hMuj1Y4o" },
  { id:"ohsquat", name:"Overhead Squat", muscles:["quads","shoulders","core"], cat:"Squat", defaultRest:120, defaultSets:3, defaultReps:5, defaultWeight:65, demoUrl:"https://www.youtube.com/watch?v=RD_vUnqwqqI" },
  { id:"stepup", name:"Step-Up", muscles:["quads","glutes"], cat:"Squat", defaultRest:60, defaultSets:3, defaultReps:10, perSide:true, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=dQqApCGd5Ss" },
  // Hinge
  { id:"deadlift", name:"Conventional Deadlift", muscles:["posterior chain","hamstrings","glutes","back"], cat:"Hinge", defaultRest:180, defaultSets:3, defaultReps:5, defaultWeight:185, demoUrl:"https://www.youtube.com/watch?v=op9kVnSso6Q" },
  { id:"sumo", name:"Sumo Deadlift", muscles:["glutes","hamstrings","quads","back"], cat:"Hinge", defaultRest:180, defaultSets:3, defaultReps:5, defaultWeight:185, demoUrl:"https://www.youtube.com/watch?v=XsrD5y8EIKU" },
  { id:"trapbar", name:"Trap Bar Deadlift", muscles:["quads","glutes","hamstrings","back"], cat:"Hinge", defaultRest:120, defaultSets:4, defaultReps:5, defaultWeight:185, demoUrl:"https://www.youtube.com/watch?v=PWJU5grrh4Y" },
  { id:"rdl", name:"Romanian Deadlift", muscles:["hamstrings","glutes","lower back"], cat:"Hinge", defaultRest:90, defaultSets:3, defaultReps:8, defaultWeight:135, demoUrl:"https://www.youtube.com/watch?v=7j-2w4-P14I" },
  { id:"slrdl", name:"Single-Leg RDL", muscles:["hamstrings","glutes"], cat:"Hinge", defaultRest:60, defaultSets:3, defaultReps:8, perSide:true, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=Zfr6wizR8rs" },
  { id:"goodmorning", name:"Good Morning", muscles:["hamstrings","lower back","glutes"], cat:"Hinge", defaultRest:90, defaultSets:3, defaultReps:8, defaultWeight:95, demoUrl:"https://www.youtube.com/watch?v=YA-h3n9L4YU" },
  { id:"kbswing", name:"Kettlebell Swing", muscles:["glutes","hamstrings","core"], cat:"Hinge", defaultRest:60, defaultSets:4, defaultReps:15, defaultWeight:35, demoUrl:"https://www.youtube.com/watch?v=YSxHifyI6s8" },
  { id:"hipthrust", name:"Barbell Hip Thrust", muscles:["glutes","hamstrings"], cat:"Hinge", defaultRest:60, defaultSets:3, defaultReps:10, defaultWeight:135, demoUrl:"https://www.youtube.com/watch?v=SEdqd1n0cvg" },
  { id:"gluebridge", name:"Glute Bridge", muscles:["glutes"], cat:"Hinge", defaultRest:60, defaultSets:3, defaultReps:12, defaultWeight:95, demoUrl:"https://www.youtube.com/watch?v=OUgsJ8-Vi0E" },
  // Push (Horiz)
  { id:"bench", name:"Bench Press", muscles:["chest","triceps","shoulders"], cat:"Push", defaultRest:120, defaultSets:4, defaultReps:5, defaultWeight:135, demoUrl:"https://www.youtube.com/watch?v=vcBig73ojpE" },
  { id:"incbench", name:"Incline Bench Press", muscles:["upper chest","shoulders","triceps"], cat:"Push", defaultRest:120, defaultSets:4, defaultReps:6, defaultWeight:115, demoUrl:"https://www.youtube.com/watch?v=SrqOu55lrYU" },
  { id:"tempobench", name:"Tempo Bench Press", muscles:["chest","triceps","shoulders"], cat:"Push", defaultRest:90, defaultSets:4, defaultReps:5, defaultWeight:115, demoUrl:"https://www.youtube.com/watch?v=vcBig73ojpE" },
  { id:"cgbench", name:"Close-Grip Bench", muscles:["triceps","chest"], cat:"Push", defaultRest:120, defaultSets:4, defaultReps:6, defaultWeight:115, demoUrl:"https://www.youtube.com/watch?v=nEF0bv2FW94" },
  { id:"pushup", name:"Push-Up", muscles:["chest","triceps","shoulders","core"], cat:"Push", defaultRest:60, defaultSets:3, defaultReps:15, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=IODxDxX7oi4" },
  { id:"dbbench", name:"DB Bench Press", muscles:["chest","triceps","shoulders"], cat:"Push", defaultRest:90, defaultSets:4, defaultReps:8, defaultWeight:40, demoUrl:"https://www.youtube.com/watch?v=VmB1G1K7v94" },
  { id:"inclinedb", name:"Incline DB Press", muscles:["upper chest","shoulders","triceps"], cat:"Push", defaultRest:90, defaultSets:4, defaultReps:8, defaultWeight:35, demoUrl:"https://www.youtube.com/watch?v=8iPEnn-ltC8" },
  { id:"floorpress", name:"Floor Press", muscles:["chest","triceps"], cat:"Push", defaultRest:120, defaultSets:4, defaultReps:5, defaultWeight:115, demoUrl:"https://www.youtube.com/watch?v=riT31sLb8HU" },
  { id:"dip", name:"Dip", muscles:["chest","triceps","shoulders"], cat:"Push", defaultRest:90, defaultSets:3, defaultReps:8, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=2z8JmcrW-As" },
  // Shoulders
  { id:"strictpress", name:"Strict Press", muscles:["shoulders","triceps","core"], cat:"Shoulders", defaultRest:180, defaultSets:4, defaultReps:5, defaultWeight:75, demoUrl:"https://www.youtube.com/watch?v=2yjwXTZQDDI" },
  { id:"pushpress", name:"Push Press", muscles:["shoulders","triceps","quads","core"], cat:"Shoulders", defaultRest:120, defaultSets:4, defaultReps:3, defaultWeight:95, demoUrl:"https://www.youtube.com/watch?v=X6-DMh-t4nQ" },
  { id:"logpress", name:"Log Press", muscles:["shoulders","triceps","core"], cat:"Shoulders", defaultRest:150, defaultSets:4, defaultReps:5, defaultWeight:85, demoUrl:"https://www.youtube.com/watch?v=OrrPuoEZSHs" },
  { id:"dbshoulder", name:"DB Shoulder Press", muscles:["shoulders","triceps"], cat:"Shoulders", defaultRest:90, defaultSets:4, defaultReps:8, defaultWeight:30, demoUrl:"https://www.youtube.com/watch?v=qEwKCR5JCog" },
  { id:"hkpress", name:"Half-Kneeling KB Press", muscles:["shoulders","core"], cat:"Shoulders", defaultRest:60, defaultSets:3, defaultReps:8, perSide:true, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=-YRtKyJ0t90" },
  { id:"arnold", name:"Arnold Press", muscles:["shoulders","triceps"], cat:"Shoulders", defaultRest:60, defaultSets:3, defaultReps:10, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=6Z15_WdXmVw" },
  { id:"latraise", name:"Lateral Raise", muscles:["shoulders"], cat:"Shoulders", defaultRest:45, defaultSets:3, defaultReps:15, defaultWeight:15, demoUrl:"https://www.youtube.com/watch?v=3VcKaXpzqRo" },
  { id:"frontraise", name:"Front Raise", muscles:["shoulders"], cat:"Shoulders", defaultRest:45, defaultSets:3, defaultReps:12, defaultWeight:15, demoUrl:"https://www.youtube.com/watch?v=-t7fuZ0KhDA" },
  { id:"revfly", name:"Reverse Flye", muscles:["rear delts"], cat:"Shoulders", defaultRest:45, defaultSets:3, defaultReps:15, defaultWeight:15, demoUrl:"https://www.youtube.com/watch?v=QICCsyKVP-g" },
  { id:"facepull", name:"Face Pull", muscles:["rear delts","upper back"], cat:"Shoulders", defaultRest:60, defaultSets:4, defaultReps:12, defaultWeight:30, demoUrl:"https://www.youtube.com/watch?v=rep-qVOkqgk" },
  // Pull
  { id:"bbrow", name:"Barbell Row", muscles:["upper back","lats","rear delts"], cat:"Pull", defaultRest:90, defaultSets:4, defaultReps:8, defaultWeight:95, demoUrl:"https://www.youtube.com/watch?v=FWJR5Ve8bnQ" },
  { id:"pendlayrow", name:"Pendlay Row", muscles:["upper back","lats"], cat:"Pull", defaultRest:120, defaultSets:4, defaultReps:5, defaultWeight:115, demoUrl:"https://www.youtube.com/watch?v=ZlRrIsoDpKg" },
  { id:"csrow", name:"Chest-Supported DB Row", muscles:["upper back","lats","rear delts"], cat:"Pull", defaultRest:90, defaultSets:4, defaultReps:8, defaultWeight:40, demoUrl:"https://www.youtube.com/watch?v=H75im9fAUMc" },
  { id:"sarow", name:"Single-Arm DB Row", muscles:["lats","upper back"], cat:"Pull", defaultRest:60, defaultSets:4, defaultReps:8, perSide:true, defaultWeight:50, demoUrl:"https://www.youtube.com/watch?v=roCP6wCXPqo" },
  { id:"cablerow", name:"Seated Cable Row", muscles:["upper back","lats"], cat:"Pull", defaultRest:60, defaultSets:4, defaultReps:10, defaultWeight:100, demoUrl:"https://www.youtube.com/watch?v=GZbfZ033f74" },
  { id:"ringrow", name:"Ring/Inverted Row", muscles:["upper back","lats","rear delts"], cat:"Pull", defaultRest:60, defaultSets:3, defaultReps:12, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=Fl0UMfdEzsE" },
  { id:"pullup", name:"Pull-Up", muscles:["lats","biceps","upper back"], cat:"Pull", defaultRest:90, defaultSets:4, defaultReps:6, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=eGo4IYlbE5g" },
  { id:"weightedpullup", name:"Weighted Pull-Up", muscles:["lats","biceps","upper back"], cat:"Pull", defaultRest:90, defaultSets:4, defaultReps:5, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=C0I0gb76yaA" },
  { id:"chinup", name:"Chin-Up", muscles:["lats","biceps"], cat:"Pull", defaultRest:90, defaultSets:3, defaultReps:8, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=pspXcUhoygA" },
  { id:"pulldown", name:"Lat Pulldown", muscles:["lats","biceps","upper back"], cat:"Pull", defaultRest:60, defaultSets:4, defaultReps:10, defaultWeight:100, demoUrl:"https://www.youtube.com/watch?v=CAwf7n6Luuc" },
  { id:"gorillarow", name:"Gorilla Row", muscles:["lats","upper back","core"], cat:"Pull", defaultRest:60, defaultSets:4, defaultReps:8, perSide:true, defaultWeight:35, demoUrl:"https://www.youtube.com/watch?v=ZuhSSlKBAcI" },
  { id:"dbpullover", name:"DB Pullover", muscles:["lats","chest"], cat:"Pull", defaultRest:60, defaultSets:3, defaultReps:12, defaultWeight:30, demoUrl:"https://www.youtube.com/watch?v=FK4rHfWKEac" },
  // Arms
  { id:"bbcurl", name:"Barbell Curl", muscles:["biceps"], cat:"Arms", defaultRest:60, defaultSets:3, defaultReps:10, defaultWeight:45, demoUrl:"https://www.youtube.com/watch?v=kwG2ipFRgfo" },
  { id:"dbcurl", name:"DB Curl", muscles:["biceps"], cat:"Arms", defaultRest:60, defaultSets:3, defaultReps:10, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=ykJmrZ5v0Oo" },
  { id:"hammer", name:"Hammer Curl", muscles:["biceps"], cat:"Arms", defaultRest:45, defaultSets:3, defaultReps:12, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=zC3nLlEvin4" },
  { id:"inclinecurl", name:"Incline DB Curl", muscles:["biceps"], cat:"Arms", defaultRest:60, defaultSets:3, defaultReps:10, defaultWeight:20, demoUrl:"https://www.youtube.com/watch?v=soxrZlIl35U" },
  { id:"pushdown", name:"Cable Pushdown", muscles:["triceps"], cat:"Arms", defaultRest:45, defaultSets:3, defaultReps:12, defaultWeight:50, demoUrl:"https://www.youtube.com/watch?v=2-LAMcpzODU" },
  { id:"skullcrusher", name:"Skull Crusher", muscles:["triceps"], cat:"Arms", defaultRest:60, defaultSets:3, defaultReps:10, defaultWeight:65, demoUrl:"https://www.youtube.com/watch?v=d_KZxkY_0cM" },
  { id:"ohtri", name:"Overhead Tricep Extension", muscles:["triceps"], cat:"Arms", defaultRest:60, defaultSets:3, defaultReps:12, defaultWeight:45, demoUrl:"https://www.youtube.com/watch?v=YbX7Wd8jQ-Q" },
  // Core
  { id:"plank", name:"Plank", muscles:["core"], cat:"Core", defaultRest:45, defaultSets:3, defaultReps:30, bodyweight:true, isTime:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=ASdvN_XEl_c" },
  { id:"sideplank", name:"Side Plank", muscles:["core"], cat:"Core", defaultRest:45, defaultSets:3, defaultReps:30, bodyweight:true, isTime:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=K2VljzCC16g" },
  { id:"pallof", name:"Pallof Press", muscles:["core"], cat:"Core", defaultRest:60, defaultSets:3, defaultReps:10, perSide:true, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=AH_QZLm_0-s" },
  { id:"deadbug", name:"Dead Bug", muscles:["core"], cat:"Core", defaultRest:45, defaultSets:3, defaultReps:10, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=I5xbsA71v1A" },
  { id:"hangingkr", name:"Hanging Knee Raise", muscles:["core"], cat:"Core", defaultRest:60, defaultSets:3, defaultReps:10, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=Pr1ieGZ5atk" },
  { id:"hanglegr", name:"Hanging Leg Raise", muscles:["core"], cat:"Core", defaultRest:60, defaultSets:3, defaultReps:8, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=hdng3Nm1x_E" },
  { id:"abwheel", name:"Ab Wheel Rollout", muscles:["core"], cat:"Core", defaultRest:60, defaultSets:3, defaultReps:10, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=MinlHnG7j4k" },
  { id:"tgu", name:"Turkish Get-Up", muscles:["full body","core"], cat:"Core", defaultRest:60, defaultSets:3, defaultReps:2, perSide:true, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=0bWRPC49-KI" },
  // Carry
  { id:"farmers", name:"Farmer's Walk", muscles:["core","grip","traps"], cat:"Carry", defaultRest:90, defaultSets:4, defaultReps:1, isDistance:true, defaultWeight:50, demoUrl:"https://www.youtube.com/watch?v=Fkzk_RqlYig" },
  { id:"safwalk", name:"Single-Arm Farmer's Walk", muscles:["core","grip","traps"], cat:"Carry", defaultRest:60, defaultSets:3, defaultReps:1, isDistance:true, perSide:true, defaultWeight:50, demoUrl:"https://www.youtube.com/watch?v=Fkzk_RqlYig" },
  { id:"yoke", name:"Yoke Walk", muscles:["full body","core","traps"], cat:"Carry", defaultRest:120, defaultSets:3, defaultReps:1, isDistance:true, defaultWeight:200, demoUrl:"https://www.youtube.com/watch?v=Ii3-eUajYig" },
  { id:"sledpush", name:"Sled Push", muscles:["quads","glutes","core"], cat:"Carry", defaultRest:90, defaultSets:4, defaultReps:1, isDistance:true, defaultWeight:90, demoUrl:"https://www.youtube.com/watch?v=_EZcK45OucE" },
  // Conditioning
  { id:"assaultbike", name:"Assault Bike", muscles:["conditioning"], cat:"Conditioning", defaultRest:40, defaultSets:6, defaultReps:20, isTime:true, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=RPY7HTGfOiU" },
  { id:"rower", name:"Row", muscles:["conditioning"], cat:"Warmup", defaultRest:60, defaultSets:3, defaultReps:250, isDistance:true, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=zQ82RYIFLN8" },
  { id:"boxjump", name:"Box Jump", muscles:["conditioning","quads","glutes"], cat:"Conditioning", defaultRest:60, defaultSets:4, defaultReps:8, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=52r_Ul5k03g" },
  { id:"wallball", name:"Wall Ball", muscles:["conditioning","quads","shoulders"], cat:"Conditioning", defaultRest:60, defaultSets:3, defaultReps:15, defaultWeight:20, demoUrl:"https://www.youtube.com/watch?v=fpUD0mcFp_0" },
  { id:"burpee", name:"Burpee", muscles:["conditioning","full body"], cat:"Conditioning", defaultRest:60, defaultSets:3, defaultReps:10, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=dZgVxmf6jkA" },
  { id:"echobike", name:"Echo Bike", muscles:["conditioning"], cat:"Conditioning", defaultRest:40, defaultSets:6, defaultReps:20, isTime:true, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=RPY7HTGfOiU" },
  // Warmup / Mobility
  { id:"skierg", name:"Ski Erg", muscles:["conditioning","shoulders","core"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:60, isTime:true, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=14Rs6KJOTaY" },
  { id:"bikerg", name:"Bike Erg", muscles:["conditioning","quads"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:60, isTime:true, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=I2hfp443cwI" },
  { id:"stairmaster", name:"Stairmaster", muscles:["conditioning","quads","glutes"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:60, isTime:true, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=LM9lgFK4mkk" },
  { id:"treadmill", name:"Treadmill", muscles:["conditioning"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:400, isDistance:true, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=E7sgqy7r6yc" },
  { id:"bandpullapart", name:"Band Pull-Apart", muscles:["rear delts","upper back"], cat:"Warmup", defaultRest:0, defaultSets:3, defaultReps:15, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=t1k2IV9CRsU" },
  { id:"cossacksquat", name:"Cossack Squat", muscles:["hips","quads","adductors"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:8, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=tpczTeSkHz0" },
  { id:"inchworm", name:"Inchworm", muscles:["full body","hamstrings","shoulders"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:6, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=ZY2ji_Ho0dA" },
  { id:"wgs", name:"World's Greatest Stretch", muscles:["full body","hips","thoracic"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:5, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=-CiWQ2IvY34" },
  { id:"hipswitch", name:"90/90 Hip Switch", muscles:["hips"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:10, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=F5owFeKgpoc" },
  { id:"scappushup", name:"Scap Push-Up", muscles:["shoulders","serratus"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:10, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=fLAf2YG4flw" },
  { id:"thoracicrot", name:"Thoracic Rotation", muscles:["thoracic","upper back"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:8, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=h54us18qc20" },
  { id:"spiderman", name:"Spiderman Lunge", muscles:["hips","hip flexors","thoracic"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:5, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=NCCyBaxKJeA" },
  // Cooldown / Stretching
  { id:"hipflexorstretch", name:"Hip Flexor Stretch", muscles:["hip flexors","quads"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:45, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=Q4Ko275cluo" },
  { id:"hamstringstretch", name:"Hamstring Stretch", muscles:["hamstrings"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:45, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=dxYy8mZH1qs" },
  { id:"pigeonpose", name:"Pigeon Pose", muscles:["hips","glutes","hip flexors"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:60, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=0_zPqA65Nok" },
  { id:"childpose", name:"Child's Pose", muscles:["shoulders","hips","thoracic"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:60, bodyweight:true, isTime:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=eqVMAPM00DM" },
  // Extra Accessories
  { id:"cablefly", name:"Cable Flye", muscles:["chest"], cat:"Push", defaultRest:60, defaultSets:3, defaultReps:12, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=Iwe6AmxVf7o" },
  { id:"pecfly", name:"Pec Deck Flye", muscles:["chest"], cat:"Push", defaultRest:60, defaultSets:3, defaultReps:12, defaultWeight:80, demoUrl:"https://www.youtube.com/watch?v=g3T7LsEeDWQ" },
  { id:"legpress", name:"Leg Press", muscles:["quads","glutes"], cat:"Squat", defaultRest:90, defaultSets:4, defaultReps:10, defaultWeight:180, demoUrl:"https://www.youtube.com/watch?v=IZxyjW7MPJQ" },
  { id:"legext", name:"Leg Extension", muscles:["quads"], cat:"Squat", defaultRest:45, defaultSets:3, defaultReps:12, defaultWeight:80, demoUrl:"https://www.youtube.com/watch?v=YyvSfVjQeL0" },
  { id:"calfraise", name:"Calf Raise", muscles:["calves"], cat:"Squat", defaultRest:45, defaultSets:3, defaultReps:15, defaultWeight:90, demoUrl:"https://www.youtube.com/watch?v=gwLzBJYoWlI" },
  { id:"seatedcalfraise", name:"Seated Calf Raise", muscles:["calves"], cat:"Squat", defaultRest:45, defaultSets:3, defaultReps:15, defaultWeight:70, demoUrl:"https://www.youtube.com/watch?v=JbyjNymZOt0" },
  { id:"reverselunge", name:"Reverse Lunge", muscles:["quads","glutes"], cat:"Squat", defaultRest:60, defaultSets:3, defaultReps:10, perSide:true, defaultWeight:30, demoUrl:"https://www.youtube.com/watch?v=xrPteyQLGAo" },
  { id:"legcurl", name:"Lying Leg Curl", muscles:["hamstrings"], cat:"Hinge", defaultRest:45, defaultSets:3, defaultReps:12, defaultWeight:70, demoUrl:"https://www.youtube.com/watch?v=1Tq3QdYUuHs" },
  { id:"nordiccurl", name:"Nordic Curl", muscles:["hamstrings"], cat:"Hinge", defaultRest:60, defaultSets:3, defaultReps:5, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=sAB613IykjE" },
  { id:"shrug", name:"Barbell Shrug", muscles:["traps"], cat:"Pull", defaultRest:60, defaultSets:3, defaultReps:12, defaultWeight:135, demoUrl:"https://www.youtube.com/watch?v=cJRVVxmytaM" },
  { id:"meadowsrow", name:"Meadows Row", muscles:["lats","upper back"], cat:"Pull", defaultRest:60, defaultSets:3, defaultReps:10, perSide:true, defaultWeight:35, demoUrl:"https://www.youtube.com/watch?v=RNYwsF6cR7A" },
  { id:"uprightrow", name:"Upright Row", muscles:["traps","shoulders"], cat:"Shoulders", defaultRest:60, defaultSets:3, defaultReps:12, defaultWeight:45, demoUrl:"https://www.youtube.com/watch?v=amCU-ziHITM" },
  { id:"cablecurl", name:"Cable Curl", muscles:["biceps"], cat:"Arms", defaultRest:45, defaultSets:3, defaultReps:12, defaultWeight:40, demoUrl:"https://www.youtube.com/watch?v=NFzTWp2qpiE" },
  // Athletic + Minimal + Glute Additions
  { id:"hangpowerclean", name:"Hang Power Clean", muscles:["full body","traps","glutes","hamstrings"], cat:"Conditioning", defaultRest:120, defaultSets:4, defaultReps:3, defaultWeight:95, demoUrl:"https://www.youtube.com/watch?v=efHjodEVf9w" },
  { id:"jumpsquat", name:"Jump Squat", muscles:["quads","glutes","conditioning"], cat:"Conditioning", defaultRest:60, defaultSets:4, defaultReps:6, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=RVUgfoMW-UI" },
  { id:"medballslam", name:"Med Ball Slam", muscles:["core","shoulders","conditioning"], cat:"Conditioning", defaultRest:60, defaultSets:3, defaultReps:8, defaultWeight:20, demoUrl:"https://www.youtube.com/watch?v=b5mcZF93AZ8" },
  { id:"kbclean", name:"KB Clean & Press", muscles:["shoulders","core","glutes"], cat:"Shoulders", defaultRest:60, defaultSets:3, defaultReps:6, perSide:true, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=rhJ2RBcytbo" },
  { id:"bandrow", name:"Band Row", muscles:["upper back","lats","rear delts"], cat:"Pull", defaultRest:45, defaultSets:3, defaultReps:15, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=LSkyinhmA8k" },
  { id:"dbhipabduction", name:"Banded Hip Abduction", muscles:["glute med","glute min"], cat:"Hinge", defaultRest:45, defaultSets:3, defaultReps:15, perSide:true, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=aQqOrUmh0e8" },
  // KOT / ATG (Knees Over Toes)
  { id:"tibraise", name:"Tibialis Raise", muscles:["tibialis","calves"], cat:"Squat", defaultRest:45, defaultSets:3, defaultReps:20, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=gNS_QjGAs_k" },
  { id:"atgsplit", name:"ATG Split Squat", muscles:["quads","glutes","hip flexors"], cat:"Squat", defaultRest:60, defaultSets:3, defaultReps:8, perSide:true, defaultWeight:0, bodyweight:true, demoUrl:"https://www.youtube.com/watch?v=g6KrlrOq4mw" },
  { id:"slantboardsquat", name:"Slant Board Squat", muscles:["quads","knees"], cat:"Squat", defaultRest:60, defaultSets:3, defaultReps:10, defaultWeight:0, bodyweight:true, demoUrl:"https://www.youtube.com/watch?v=GO_q0NnMpCo" },
  { id:"poliquat", name:"Poliquin Step-Up", muscles:["quads","knees"], cat:"Squat", defaultRest:45, defaultSets:3, defaultReps:10, perSide:true, defaultWeight:10, demoUrl:"https://www.youtube.com/watch?v=4HTL_23ULuE" },
  { id:"reversesled", name:"Backward Sled Drag", muscles:["quads","knees","conditioning"], cat:"Carry", defaultRest:60, defaultSets:4, defaultReps:1, isDistance:true, defaultWeight:45, demoUrl:"https://www.youtube.com/watch?v=hbCeJFBFyYk" },
  // Variety Expansion — Tier 1: Critical Pool Bottlenecks
  // Hinge Primary
  { id:"deficitdl", name:"Deficit Deadlift", muscles:["posterior chain","hamstrings","glutes","back"], cat:"Hinge", defaultRest:180, defaultSets:3, defaultReps:5, defaultWeight:155, demoUrl:"https://www.youtube.com/watch?v=4NNYH6vBhqw" },
  { id:"blockpull", name:"Block Pull", muscles:["posterior chain","glutes","back","traps"], cat:"Hinge", defaultRest:180, defaultSets:3, defaultReps:3, defaultWeight:205, demoUrl:"https://www.youtube.com/watch?v=F6cZbkUOBiI" },
  // Hinge Secondary
  { id:"backext", name:"Back Extension", muscles:["lower back","hamstrings","glutes"], cat:"Hinge", defaultRest:60, defaultSets:3, defaultReps:12, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=ph3pddpKzzw" },
  { id:"seatedlegcurl", name:"Seated Leg Curl", muscles:["hamstrings"], cat:"Hinge", defaultRest:45, defaultSets:3, defaultReps:12, defaultWeight:70, demoUrl:"https://www.youtube.com/watch?v=Wy1SwoY2aaQ" },
  // Press Primary
  { id:"dbohp", name:"Standing DB OHP", muscles:["shoulders","triceps","core"], cat:"Shoulders", defaultRest:120, defaultSets:4, defaultReps:6, defaultWeight:35, demoUrl:"https://www.youtube.com/watch?v=OOe_HrNnQWw" },
  { id:"zspress", name:"Z Press", muscles:["shoulders","triceps","core"], cat:"Shoulders", defaultRest:120, defaultSets:4, defaultReps:6, defaultWeight:65, demoUrl:"https://www.youtube.com/watch?v=0fHdnBH9Gdo" },
  // Press Secondary + Delt
  { id:"landminepress", name:"Landmine Press", muscles:["shoulders","chest","core"], cat:"Shoulders", defaultRest:60, defaultSets:3, defaultReps:10, perSide:true, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=-mYbyc48wAk" },
  { id:"cablelatraise", name:"Cable Lateral Raise", muscles:["shoulders"], cat:"Shoulders", defaultRest:45, defaultSets:3, defaultReps:15, perSide:true, defaultWeight:10, demoUrl:"https://www.youtube.com/watch?v=SgyUoY0IZ7A" },
  { id:"behindneckpress", name:"Behind-the-Neck Press", muscles:["shoulders","triceps"], cat:"Shoulders", defaultRest:120, defaultSets:3, defaultReps:8, defaultWeight:55, demoUrl:"https://www.youtube.com/watch?v=3s17QjC4_qA" },
  // Pull Vertical
  { id:"neutralpullup", name:"Neutral-Grip Pull-Up", muscles:["lats","biceps","upper back"], cat:"Pull", defaultRest:90, defaultSets:3, defaultReps:8, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=fGv2Sxw9SDQ" },
  { id:"closegrippd", name:"Close-Grip Pulldown", muscles:["lats","biceps"], cat:"Pull", defaultRest:60, defaultSets:3, defaultReps:12, defaultWeight:90, demoUrl:"https://www.youtube.com/watch?v=hULDo1VUTsQ" },
  // Tricep
  { id:"dbtri", name:"DB Overhead Tricep Extension", muscles:["triceps"], cat:"Arms", defaultRest:60, defaultSets:3, defaultReps:12, defaultWeight:30, demoUrl:"https://www.youtube.com/watch?v=_gsUck-7M74" },
  { id:"kickback", name:"Tricep Kickback", muscles:["triceps"], cat:"Arms", defaultRest:45, defaultSets:3, defaultReps:15, defaultWeight:15, demoUrl:"https://www.youtube.com/watch?v=XuH2W_R5YoA" },
  // Bicep + Forearm
  { id:"preachercurl", name:"Preacher Curl", muscles:["biceps"], cat:"Arms", defaultRest:60, defaultSets:3, defaultReps:10, defaultWeight:35, demoUrl:"https://www.youtube.com/watch?v=1-xvtHS9PsU" },
  { id:"concurl", name:"Concentration Curl", muscles:["biceps"], cat:"Arms", defaultRest:45, defaultSets:3, defaultReps:12, perSide:true, defaultWeight:20, demoUrl:"https://www.youtube.com/watch?v=oPGBZHIxusU" },
  { id:"wristcurl", name:"Wrist Curl", muscles:["forearms"], cat:"Arms", defaultRest:45, defaultSets:3, defaultReps:15, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=SqwIBiru46w" },
  { id:"reversecurl", name:"Reverse Curl", muscles:["forearms","biceps"], cat:"Arms", defaultRest:45, defaultSets:3, defaultReps:12, defaultWeight:30, demoUrl:"https://www.youtube.com/watch?v=didEQUuieRQ" },
  // Carry
  { id:"overheadcarry", name:"Overhead Carry", muscles:["core","shoulders","traps"], cat:"Carry", defaultRest:90, defaultSets:3, defaultReps:1, isDistance:true, defaultWeight:35, demoUrl:"https://www.youtube.com/watch?v=u2zEzUeOI-o" },
  // Variety Expansion — Tier 2: Gap-Filling & Pool Depth
  // Core
  { id:"woodchop", name:"Cable Woodchop", muscles:["core","obliques"], cat:"Core", defaultRest:45, defaultSets:3, defaultReps:12, perSide:true, defaultWeight:30, demoUrl:"https://www.youtube.com/watch?v=pAplQXk3dkU" },
  { id:"russiantwist", name:"Russian Twist", muscles:["core","obliques"], cat:"Core", defaultRest:45, defaultSets:3, defaultReps:20, defaultWeight:15, demoUrl:"https://www.youtube.com/watch?v=fCHFQTBqm-U" },
  { id:"bearcrwl", name:"Bear Crawl", muscles:["core","shoulders","quads"], cat:"Core", defaultRest:60, defaultSets:3, defaultReps:1, isDistance:true, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=vIb3_6Qvt64" },
  { id:"copenhagenplank", name:"Copenhagen Plank", muscles:["adductors","core"], cat:"Core", defaultRest:45, defaultSets:3, defaultReps:30, perSide:true, bodyweight:true, isTime:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=YRRnnZsRs9U" },
  // Squat Secondary
  { id:"hacksquat", name:"Hack Squat", muscles:["quads","glutes"], cat:"Squat", defaultRest:90, defaultSets:3, defaultReps:10, defaultWeight:90, demoUrl:"https://www.youtube.com/watch?v=4cxt_Tldugw" },
  { id:"walkinglunge", name:"Walking Lunge", muscles:["quads","glutes"], cat:"Squat", defaultRest:60, defaultSets:3, defaultReps:12, perSide:true, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=D7KaRcUTQeE" },
  // Variety Expansion — Tier 3: Bodyweight Variant Depth
  { id:"pikepress", name:"Pike Push-Up", muscles:["shoulders","triceps"], cat:"Shoulders", defaultRest:60, defaultSets:3, defaultReps:10, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=9WM4O96Jf7I" },
  { id:"diamondpushup", name:"Diamond Push-Up", muscles:["triceps","chest"], cat:"Push", defaultRest:60, defaultSets:3, defaultReps:12, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=kGhDnFwMY3E" },
  { id:"archerpushup", name:"Archer Push-Up", muscles:["chest","triceps","core"], cat:"Push", defaultRest:60, defaultSets:3, defaultReps:6, perSide:true, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=eZNvTorsU6I" },
  { id:"bwsquat", name:"Bodyweight Squat", muscles:["quads","glutes"], cat:"Squat", defaultRest:30, defaultSets:3, defaultReps:20, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=cB0cOX7gePg" },
  { id:"lsit", name:"L-Sit Hold", muscles:["core","hip flexors"], cat:"Core", defaultRest:60, defaultSets:3, defaultReps:20, isTime:true, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=eywCpp0p7lg" },
  { id:"elevatedinvrow", name:"Feet-Elevated Inverted Row", muscles:["upper back","lats","rear delts"], cat:"Pull", defaultRest:60, defaultSets:3, defaultReps:10, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=Fl0UMfdEzsE" },
  // ============================================================
  // EXPANSION: Cooldown / Stretching
  // ============================================================
  { id:"quadstretch", name:"Standing Quad Stretch", muscles:["quads","hip flexors"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:45, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=kia2OzZiwqw" },
  { id:"seatedforward", name:"Seated Forward Fold", muscles:["hamstrings","lower back"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:60, bodyweight:true, isTime:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=oJX8EKF3TqM" },
  { id:"butterflystretch", name:"Butterfly Stretch", muscles:["hips","adductors"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:60, bodyweight:true, isTime:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=xreayWmd6QQ" },
  { id:"figurefour", name:"Figure-4 Stretch", muscles:["hips","glutes"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:45, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=-g0nuyTHMrI" },
  { id:"catcow", name:"Cat-Cow", muscles:["thoracic","lower back"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:10, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=vuyUwtHl694" },
  { id:"crossbodyshoulder", name:"Crossbody Shoulder Stretch", muscles:["shoulders"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:30, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=O5bFanxcpWE" },
  { id:"lyingtwist", name:"Lying Spinal Twist", muscles:["thoracic","hips"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:45, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=ucxY_Nq5cbA" },
  { id:"latstretch", name:"Lat Stretch", muscles:["lats","shoulders"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:30, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=vL7b8Wh-I1o" },
  { id:"cheststretch", name:"Doorway Chest Stretch", muscles:["chest","shoulders"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:30, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=M850sCj9LHQ" },
  { id:"cobrapose", name:"Cobra Pose", muscles:["lower back","hip flexors"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:45, bodyweight:true, isTime:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=YYudWYM5Q9g" },
  { id:"downdog", name:"Downward Dog", muscles:["hamstrings","calves","shoulders"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:45, bodyweight:true, isTime:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=w4iKQc2ebKw" },
  { id:"scorpionstretch", name:"Scorpion Stretch", muscles:["hip flexors","thoracic"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:5, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=fEonF-SVkdk" },
  { id:"standingcalfstretch", name:"Standing Calf Stretch", muscles:["calves"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:30, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=GTOBvb45lgg" },
  { id:"threadneedle", name:"Thread the Needle", muscles:["thoracic","shoulders"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:30, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=7C8-zj3nRro" },
  { id:"frogstretch", name:"Frog Stretch", muscles:["adductors","hips"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:60, bodyweight:true, isTime:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=mO8S7qOdcdU" },
  { id:"happybaby", name:"Happy Baby Pose", muscles:["hips","hamstrings"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:45, bodyweight:true, isTime:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=Rg8L0_ZDick" },
  { id:"kneelingquadstretch", name:"Kneeling Quad Stretch", muscles:["quads","hip flexors"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:45, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=1Aq9JgSPmGQ" },
  { id:"seatedtwist", name:"Seated Spinal Twist", muscles:["thoracic","hips"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:30, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=z9-FIjUozb0" },
  { id:"proneshoulder", name:"Prone Shoulder Stretch", muscles:["shoulders","chest"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:45, bodyweight:true, isTime:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=LW-SlgTfd-o" },
  { id:"wallhamstring", name:"Wall Hamstring Stretch", muscles:["hamstrings"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:45, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=DJW7-sQ6v9o" },
  { id:"supinespinal", name:"Supine Spinal Twist", muscles:["thoracic","hips","lower back"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:45, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=mNdJti7ZwKI" },
  { id:"standingside", name:"Standing Side Bend", muscles:["obliques","lats"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:30, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=5rJ4Y5UjIzo" },
  { id:"neckstretch", name:"Neck Side Stretch", muscles:["traps"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:20, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=54y0JAT46vE" },
  { id:"wriststretch", name:"Wrist Flexor Stretch", muscles:["grip"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:30, bodyweight:true, isTime:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=1Vpl8GkDjYY" },
  { id:"eaglearms", name:"Eagle Arms Stretch", muscles:["shoulders","upper back"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:30, bodyweight:true, isTime:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=VvK3V1TnVLo" },
  // ============================================================
  // EXPANSION: Warmup / Mobility
  // ============================================================
  { id:"firehydrant", name:"Fire Hydrant", muscles:["hips","glutes"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:10, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=12whZWUANRY" },
  { id:"legswingfwd", name:"Leg Swing (Front-Back)", muscles:["hips","hip flexors"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:10, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=JJcv4kzTq2I" },
  { id:"legswingside", name:"Leg Swing (Side-to-Side)", muscles:["hips","adductors"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:10, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=MWJ36dnb0AM" },
  { id:"armcircle", name:"Arm Circle", muscles:["shoulders"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:10, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=mwDgFY86zck" },
  { id:"anklecircle", name:"Ankle Circle", muscles:["calves"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:10, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=RI4BJd1oKCI" },
  { id:"shoulderpassthru", name:"Shoulder Pass-Through", muscles:["shoulders","thoracic"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:10, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=l5mCHgf8nwQ" },
  { id:"torsotwist", name:"Standing Torso Twist", muscles:["thoracic","core"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:10, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=haWuH3LRFI4" },
  { id:"birddog", name:"Bird Dog", muscles:["core","hips"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:8, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=UXvrNitcy4w" },
  { id:"wallslide", name:"Wall Slide", muscles:["shoulders","upper back"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:10, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=9ZBOvVO9JFs" },
  { id:"squattostand", name:"Squat-to-Stand", muscles:["hamstrings","hips"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:8, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=gr1WQvbdkAA" },
  { id:"quadhipcircle", name:"Quadruped Hip Circle", muscles:["hips"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:8, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=Pe3ICKEy9sk" },
  { id:"sidewindmill", name:"Side-Lying Windmill", muscles:["thoracic","shoulders"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:8, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=9E5BaCFC3LE" },
  { id:"pronetrap", name:"Prone Y-T-W Raise", muscles:["upper back","shoulders"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:8, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=ZpZEQ2JCXyc" },
  { id:"laterallunge", name:"Lateral Lunge", muscles:["hips","adductors"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:8, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=gwWv7aPcD88" },
  { id:"highknee", name:"High Knees", muscles:["hip flexors","conditioning"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:30, bodyweight:true, isTime:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=D0GwAezTvtg" },
  { id:"buttkick", name:"Butt Kicks", muscles:["hamstrings","quads"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:30, bodyweight:true, isTime:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=HqKgfMglmtw" },
  { id:"kneetowall", name:"Knee-to-Wall Ankle Mob", muscles:["calves"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:10, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=u3NbKOXl75k" },
  { id:"bootstrapper", name:"Bootstrapper", muscles:["hamstrings","hips"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:8, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=yhAUCGZnv3s" },
  { id:"openbook", name:"Open Book Stretch", muscles:["thoracic","shoulders"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:8, bodyweight:true, noRpe:true, perSide:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=peeW19ofFUg" },
  { id:"glutebridgemarch", name:"Glute Bridge March", muscles:["glutes","core"], cat:"Warmup", defaultRest:0, defaultSets:2, defaultReps:10, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=M8LAwv4Od2I" },
  // ============================================================
  // EXPANSION: Warmup Cardio
  // ============================================================
  { id:"jumprope", name:"Jump Rope", muscles:["conditioning","calves"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:60, isTime:true, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=FJmRQ5iTXKE" },
  { id:"elliptical", name:"Elliptical", muscles:["conditioning","quads"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:60, isTime:true, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=RakIFxUmSpA" },
  { id:"versaclimber", name:"VersaClimber", muscles:["conditioning","full body"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:60, isTime:true, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=7NwbzrU4Kvg" },
  { id:"jogplace", name:"Jog in Place", muscles:["conditioning","calves"], cat:"Warmup", defaultRest:0, defaultSets:1, defaultReps:60, isTime:true, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=naoA8YKiYZM" },
  // ============================================================
  // EXPANSION: Squat
  // ============================================================
  { id:"zerchersquat", name:"Zercher Squat", muscles:["quads","core","biceps"], cat:"Squat", defaultRest:120, defaultSets:3, defaultReps:6, defaultWeight:115, demoUrl:"https://www.youtube.com/watch?v=vpy4ADmlo1E" },
  { id:"splitsquat", name:"Split Squat", muscles:["quads","glutes"], cat:"Squat", defaultRest:60, defaultSets:3, defaultReps:10, perSide:true, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=zCsZwLeXrCg" },
  { id:"pistolsquat", name:"Pistol Squat", muscles:["quads","glutes","core"], cat:"Squat", defaultRest:60, defaultSets:3, defaultReps:5, perSide:true, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=NTf8YRWfOHY" },
  { id:"wallsit", name:"Wall Sit", muscles:["quads"], cat:"Squat", defaultRest:60, defaultSets:3, defaultReps:45, isTime:true, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=-cdph8hv0O0" },
  { id:"sissysquat", name:"Sissy Squat", muscles:["quads"], cat:"Squat", defaultRest:60, defaultSets:3, defaultReps:10, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=cHpDhoud8oo" },
  { id:"landminesquat", name:"Landmine Squat", muscles:["quads","core"], cat:"Squat", defaultRest:90, defaultSets:3, defaultReps:10, defaultWeight:45, demoUrl:"https://www.youtube.com/watch?v=u7TjVMeG0nw" },
  { id:"smithsquat", name:"Smith Machine Squat", muscles:["quads","glutes"], cat:"Squat", defaultRest:120, defaultSets:3, defaultReps:8, defaultWeight:135, demoUrl:"https://www.youtube.com/watch?v=AHnX-aimA4E" },
  { id:"pendlumsquat", name:"Pendulum Squat", muscles:["quads"], cat:"Squat", defaultRest:90, defaultSets:3, defaultReps:10, defaultWeight:90, demoUrl:"https://www.youtube.com/watch?v=dv3rHrODfhY" },
  // ============================================================
  // EXPANSION: Hinge
  // ============================================================
  { id:"snatchgriprdl", name:"Snatch-Grip RDL", muscles:["hamstrings","upper back","glutes"], cat:"Hinge", defaultRest:90, defaultSets:3, defaultReps:8, defaultWeight:115, demoUrl:"https://www.youtube.com/watch?v=0ed2L2XIO9E" },
  { id:"singlelegcurl", name:"Single-Leg Curl", muscles:["hamstrings"], cat:"Hinge", defaultRest:45, defaultSets:3, defaultReps:10, perSide:true, defaultWeight:35, demoUrl:"https://www.youtube.com/watch?v=XNmYE5DbBxE" },
  { id:"cablepullthru", name:"Cable Pull-Through", muscles:["glutes","hamstrings"], cat:"Hinge", defaultRest:60, defaultSets:3, defaultReps:12, defaultWeight:60, demoUrl:"https://www.youtube.com/watch?v=yXopOhzEoeo" },
  { id:"reversebackext", name:"Reverse Back Extension", muscles:["glutes","hamstrings","lower back"], cat:"Hinge", defaultRest:60, defaultSets:3, defaultReps:12, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=Uj8UVm_NkYk" },
  { id:"singleleghipthrust", name:"Single-Leg Hip Thrust", muscles:["glutes"], cat:"Hinge", defaultRest:60, defaultSets:3, defaultReps:10, perSide:true, defaultWeight:95, demoUrl:"https://www.youtube.com/watch?v=L4nTaesNm0E" },
  { id:"kbrdl", name:"KB Romanian Deadlift", muscles:["hamstrings","glutes"], cat:"Hinge", defaultRest:60, defaultSets:3, defaultReps:10, defaultWeight:35, demoUrl:"https://www.youtube.com/watch?v=slzkAoP8ioc" },
  { id:"jeffersonlift", name:"Jefferson Deadlift", muscles:["glutes","quads","hamstrings"], cat:"Hinge", defaultRest:120, defaultSets:3, defaultReps:6, defaultWeight:135, demoUrl:"https://www.youtube.com/watch?v=KIiRSnH00FU" },
  { id:"diagonallift", name:"Landmine RDL", muscles:["hamstrings","core","obliques"], cat:"Hinge", defaultRest:60, defaultSets:3, defaultReps:8, perSide:true, defaultWeight:45, demoUrl:"https://www.youtube.com/watch?v=ha3QACuaxTk" },
  // ============================================================
  // EXPANSION: Push
  // ============================================================
  { id:"spotopress", name:"Spoto Press", muscles:["chest","triceps"], cat:"Push", defaultRest:120, defaultSets:4, defaultReps:5, defaultWeight:115, demoUrl:"https://www.youtube.com/watch?v=wgd4zSPmwZM" },
  { id:"widepushup", name:"Wide Push-Up", muscles:["chest","shoulders"], cat:"Push", defaultRest:60, defaultSets:3, defaultReps:12, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=Z8nUVpSZAhE" },
  { id:"declinebench", name:"Decline Bench Press", muscles:["chest","triceps"], cat:"Push", defaultRest:120, defaultSets:4, defaultReps:6, defaultWeight:135, demoUrl:"https://www.youtube.com/watch?v=LfyQBUKR8SE" },
  { id:"declinedb", name:"Decline DB Press", muscles:["chest","triceps"], cat:"Push", defaultRest:90, defaultSets:3, defaultReps:8, defaultWeight:35, demoUrl:"https://www.youtube.com/watch?v=0xRvl4Qv3ZY" },
  { id:"larsenpress", name:"Larsen Press", muscles:["chest","triceps"], cat:"Push", defaultRest:120, defaultSets:4, defaultReps:5, defaultWeight:95, demoUrl:"https://www.youtube.com/watch?v=FwO2j6bBHpw" },
  { id:"machinepress", name:"Machine Chest Press", muscles:["chest","triceps"], cat:"Push", defaultRest:60, defaultSets:3, defaultReps:10, defaultWeight:100, demoUrl:"https://www.youtube.com/watch?v=xUm0BiZCWlQ" },
  { id:"handstandpushup", name:"Handstand Push-Up", muscles:["shoulders","triceps","core"], cat:"Push", defaultRest:90, defaultSets:3, defaultReps:5, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=7wSZnHQZChI" },
  { id:"dipweighted", name:"Weighted Dip", muscles:["chest","triceps","shoulders"], cat:"Push", defaultRest:90, defaultSets:3, defaultReps:8, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=UZ_kEpmACZ4" },
  // ============================================================
  // EXPANSION: Pull
  // ============================================================
  { id:"sealrow", name:"Seal Row", muscles:["upper back","lats"], cat:"Pull", defaultRest:90, defaultSets:3, defaultReps:8, defaultWeight:40, demoUrl:"https://www.youtube.com/watch?v=NRHiNw-xGSA" },
  { id:"renegaderow", name:"Renegade Row", muscles:["lats","core"], cat:"Pull", defaultRest:60, defaultSets:3, defaultReps:8, perSide:true, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=NTl_ALR8Tlc" },
  { id:"tbarrow", name:"T-Bar Row", muscles:["upper back","lats"], cat:"Pull", defaultRest:90, defaultSets:4, defaultReps:8, defaultWeight:90, demoUrl:"https://www.youtube.com/watch?v=j3Igk5nyZE4" },
  { id:"supinatedrow", name:"Supinated Barbell Row", muscles:["lats","biceps"], cat:"Pull", defaultRest:90, defaultSets:4, defaultReps:8, defaultWeight:95, demoUrl:"https://www.youtube.com/watch?v=HuK1ORkjr0Y" },
  { id:"straightarmpd", name:"Straight-Arm Pulldown", muscles:["lats"], cat:"Pull", defaultRest:60, defaultSets:3, defaultReps:12, defaultWeight:40, demoUrl:"https://www.youtube.com/watch?v=70Ajji0V9vk" },
  { id:"muscleup", name:"Muscle-Up", muscles:["lats","triceps","full body"], cat:"Pull", defaultRest:120, defaultSets:3, defaultReps:3, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=Al2P0nR2lB8" },
  { id:"widepullup", name:"Wide-Grip Pull-Up", muscles:["lats","upper back"], cat:"Pull", defaultRest:90, defaultSets:3, defaultReps:6, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=IK3sH7wOAWE" },
  { id:"supinatedinvrow", name:"Supinated Inverted Row", muscles:["upper back","biceps"], cat:"Pull", defaultRest:60, defaultSets:3, defaultReps:10, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=glyjer6nOjE" },
  // ============================================================
  // EXPANSION: Shoulders
  // ============================================================
  { id:"machinelateral", name:"Machine Lateral Raise", muscles:["shoulders"], cat:"Shoulders", defaultRest:45, defaultSets:3, defaultReps:15, defaultWeight:30, demoUrl:"https://www.youtube.com/watch?v=4uOsyJ4YOtk" },
  { id:"busdriver", name:"Bus Driver", muscles:["shoulders","core"], cat:"Shoulders", defaultRest:45, defaultSets:3, defaultReps:10, defaultWeight:10, demoUrl:"https://www.youtube.com/watch?v=AGjuA82-10c" },
  { id:"scaption", name:"Scaption", muscles:["shoulders"], cat:"Shoulders", defaultRest:45, defaultSets:3, defaultReps:12, defaultWeight:10, demoUrl:"https://www.youtube.com/watch?v=sJYXn8thNEQ" },
  { id:"bradfordpress", name:"Bradford Press", muscles:["shoulders","triceps"], cat:"Shoulders", defaultRest:90, defaultSets:3, defaultReps:8, defaultWeight:55, demoUrl:"https://www.youtube.com/watch?v=9VWorwEv48o" },
  { id:"reardeltcable", name:"Rear Delt Cable Fly", muscles:["rear delts"], cat:"Shoulders", defaultRest:45, defaultSets:3, defaultReps:15, defaultWeight:15, demoUrl:"https://www.youtube.com/watch?v=xGOOJnkXmdA" },
  { id:"dbcleanhigh", name:"DB Clean & High Pull", muscles:["shoulders","traps"], cat:"Shoulders", defaultRest:60, defaultSets:3, defaultReps:8, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=2oq8CDNM8ww" },
  // ============================================================
  // EXPANSION: Arms
  // ============================================================
  { id:"spidercurl", name:"Spider Curl", muscles:["biceps"], cat:"Arms", defaultRest:45, defaultSets:3, defaultReps:12, defaultWeight:20, demoUrl:"https://www.youtube.com/watch?v=IHXbgmXjOas" },
  { id:"crossbodyhammer", name:"Crossbody Hammer Curl", muscles:["biceps"], cat:"Arms", defaultRest:45, defaultSets:3, defaultReps:12, defaultWeight:20, demoUrl:"https://www.youtube.com/watch?v=Fp2_bsWULRg" },
  { id:"ropepushdown", name:"Rope Pushdown", muscles:["triceps"], cat:"Arms", defaultRest:45, defaultSets:3, defaultReps:15, defaultWeight:40, demoUrl:"https://www.youtube.com/watch?v=vB5OHsJ3EME" },
  { id:"closegripdip", name:"Close-Grip Bench Dip", muscles:["triceps"], cat:"Arms", defaultRest:60, defaultSets:3, defaultReps:12, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=c3ZGl4pAwZ4" },
  { id:"zottmancurl", name:"Zottman Curl", muscles:["biceps"], cat:"Arms", defaultRest:60, defaultSets:3, defaultReps:10, defaultWeight:20, demoUrl:"https://www.youtube.com/watch?v=ZrpRBgswtHs" },
  { id:"overheadcableext", name:"Overhead Cable Extension", muscles:["triceps"], cat:"Arms", defaultRest:45, defaultSets:3, defaultReps:12, defaultWeight:40, demoUrl:"https://www.youtube.com/watch?v=ns-RGsbzqok" },
  { id:"dragcurl", name:"Drag Curl", muscles:["biceps"], cat:"Arms", defaultRest:45, defaultSets:3, defaultReps:10, defaultWeight:40, demoUrl:"https://www.youtube.com/watch?v=LMdNTHH6G8I" },
  { id:"jmpress", name:"JM Press", muscles:["triceps"], cat:"Arms", defaultRest:90, defaultSets:3, defaultReps:8, defaultWeight:65, demoUrl:"https://www.youtube.com/watch?v=FjkZpK8JhO8" },
  // ============================================================
  // EXPANSION: Core
  // ============================================================
  { id:"dragonflag", name:"Dragon Flag", muscles:["core"], cat:"Core", defaultRest:60, defaultSets:3, defaultReps:5, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=QVYiBrqNHu4" },
  { id:"bodysawplank", name:"Body Saw Plank", muscles:["core"], cat:"Core", defaultRest:60, defaultSets:3, defaultReps:10, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=R9HJnAdJAUs" },
  { id:"ghdsitp", name:"GHD Sit-Up", muscles:["core","hip flexors"], cat:"Core", defaultRest:60, defaultSets:3, defaultReps:12, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=z3iXCn9KB1I" },
  { id:"toestobar", name:"Toes-to-Bar", muscles:["core"], cat:"Core", defaultRest:60, defaultSets:3, defaultReps:8, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=_03pCKOv4l4" },
  { id:"suitcasecrunch", name:"Suitcase Crunch", muscles:["core","obliques"], cat:"Core", defaultRest:45, defaultSets:3, defaultReps:12, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=OlzHNUVL4Qo" },
  { id:"halfkneelingchop", name:"Half-Kneeling Chop", muscles:["core","obliques"], cat:"Core", defaultRest:45, defaultSets:3, defaultReps:10, perSide:true, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=tKmTgQ_YajY" },
  { id:"birddogrow", name:"Bird Dog Row", muscles:["core","lats"], cat:"Core", defaultRest:45, defaultSets:3, defaultReps:8, perSide:true, defaultWeight:15, demoUrl:"https://www.youtube.com/watch?v=pt-SvOEQXuk" },
  { id:"revplank", name:"Reverse Plank", muscles:["core","shoulders"], cat:"Core", defaultRest:45, defaultSets:3, defaultReps:30, isTime:true, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=ZNAxdJ6Bt00" },
  // ============================================================
  // EXPANSION: Carry
  // ============================================================
  { id:"crossbodycarry", name:"Cross-Body Carry", muscles:["core","shoulders"], cat:"Carry", defaultRest:60, defaultSets:3, defaultReps:1, isDistance:true, defaultWeight:35, demoUrl:"https://www.youtube.com/watch?v=OYkf1Kgv1kE" },
  { id:"sandbagcarry", name:"Sandbag Carry", muscles:["core","full body"], cat:"Carry", defaultRest:90, defaultSets:3, defaultReps:1, isDistance:true, defaultWeight:80, demoUrl:"https://www.youtube.com/watch?v=sAOjLtEdxWs" },
  { id:"bottleupcarry", name:"Bottoms-Up KB Carry", muscles:["shoulders","grip","core"], cat:"Carry", defaultRest:60, defaultSets:3, defaultReps:1, isDistance:true, perSide:true, defaultWeight:25, demoUrl:"https://www.youtube.com/watch?v=rLNiGlKxzKk" },
  { id:"zerchercarry", name:"Zercher Carry", muscles:["core","biceps"], cat:"Carry", defaultRest:90, defaultSets:3, defaultReps:1, isDistance:true, defaultWeight:95, demoUrl:"https://www.youtube.com/watch?v=JnyVFyPHjUw" },
  // ============================================================
  // EXPANSION: Conditioning
  // ============================================================
  { id:"battlerope", name:"Battle Rope", muscles:["conditioning","shoulders","core"], cat:"Conditioning", defaultRest:40, defaultSets:6, defaultReps:30, isTime:true, bodyweight:true, noRpe:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=Lc89Iq_beBw" },
  { id:"dballovershoulder", name:"D-Ball Over Shoulder", muscles:["full body","conditioning"], cat:"Conditioning", defaultRest:60, defaultSets:3, defaultReps:8, defaultWeight:80, demoUrl:"https://www.youtube.com/watch?v=wP6L5tyqBR4" },
  { id:"thruster", name:"Thruster", muscles:["quads","shoulders","conditioning"], cat:"Conditioning", defaultRest:90, defaultSets:4, defaultReps:8, defaultWeight:75, demoUrl:"https://www.youtube.com/watch?v=RXlA1hMLbQ0" },
  { id:"manmaker", name:"Man Maker", muscles:["full body","conditioning"], cat:"Conditioning", defaultRest:90, defaultSets:3, defaultReps:6, defaultWeight:30, demoUrl:"https://www.youtube.com/watch?v=iQXSDoXW6dY" },
  { id:"devilspress", name:"Devil's Press", muscles:["full body","conditioning"], cat:"Conditioning", defaultRest:60, defaultSets:3, defaultReps:8, defaultWeight:30, demoUrl:"https://www.youtube.com/watch?v=qlSxJB5B7Kg" },
  { id:"ropeclimb", name:"Rope Climb", muscles:["lats","biceps","grip","conditioning"], cat:"Conditioning", defaultRest:90, defaultSets:3, defaultReps:3, bodyweight:true, defaultWeight:0, demoUrl:"https://www.youtube.com/watch?v=yiLV0Dr3ACU" },
];
const LIB_BY_ID = Object.fromEntries(LIBRARY.map(e => [e.id, e]));