# Renaissance Periodization redesign — Step 1 audit & research

**Scope, per Kenny:** science-first and individualized. Prescriptions grounded in RP's published methodology, autoregulated per user from their own RPE/RIR feedback and training history — not global defaults. Broad-audience capable (not just Kenny). Choice of incremental vs. rewrite to be presented with tradeoffs.

**Companion document:** [`rp-redesign-plan.md`](./rp-redesign-plan.md) — the implementation plan built from this audit (A+ autoregulation, mesocycle/rp-hypertrophy program, library retag, edit-past-workouts, prompt-when-missing principle).

---

## 1. What "RP" looks like in the app today

There is no Renaissance Periodization implementation in the codebase by name. `grep -i "renaissance\|\\bRP\\b"` in `src/` returns zero hits outside of the unrelated "RPT" (Reverse Pyramid Training) abbreviation. The template that functions as the app's de-facto hypertrophy block is `hypertrophy5` — "Hypertrophy PPL+UL" — defined in `src/js/05-program-templates.js:11` and configured in `src/js/04e1-program-configs.js:128-171`. It is periodized by the generic engine in `src/js/04e-periodization.js` rather than by anything RP-specific.

**Structural model.** The data model (`src/js/06-state-storage.js:22-60` in `CLAUDE.md`'s summary) stores `Store → UserRecord → program: Day[] → blocks: Block[] → exercises: Exercise[]`, plus `sessions: Session[] → sets: Set[]`. A `Set` holds `weight, reps, rpe, isPR`. A `Session` holds a single `volume` number — total tonnage `weight × reps` summed across the whole workout (`src/js/13-start-finish.js:184`). There is no per-muscle-group volume tracking, no concept of MEV/MAV/MRV, no mesocycle object, no per-exercise autoregulation state.

**Periodization model.** Every template has a `phaseConfig` — for `hypertrophy5`: Accumulation 40%, Intensification 35%, Deload 25% (`04e1-program-configs.js:129-133`). `allocatePhases()` (`04e-periodization.js:7-19`) distributes total program weeks across those phases by ratio, which is how the engine knows which week is a deload. The `LOADING` table (`04e-periodization.js:102-175`) hard-codes sets×reps×rest per loading style × phase × weekInPhase. For `compound` exercises the progression across 4 accumulation weeks is literally `4×8 → 4×8 → 4×6 → 3×8` (line 116). The `accessory` progression is `3×12 → 3×12 → 4×10 → 3×10` (line 122). These numbers are identical for every user.

**RIR/RPE handling.** The exercise library supports a `noRpe` flag (`01a-mksets.js:17`), and the set editor renders an RPE bubble grid from 5 to 10 in half-point steps (`10-render-workout.js:1241`). RPE gets saved on every set (`13-start-finish.js:145`). Default RPE when the user doesn't touch the input is a hardcoded **7** (`13-start-finish.js:57, 122`). Nothing downstream reads RPE: it isn't used to adjust next session's weight, isn't used to detect stalling, isn't used to trigger deloads, isn't summarized anywhere in history. RIR does not exist as a first-class concept — it appears only in the glossary (`04f-glossary.js:135`) as a definition.

**Weight prescription.** Loads are never individualized. The starting weight for a new session is either the user's last logged weight for that exercise (`09a-timeline-strip.js:355`: `defW = lastSet ? lastSet.weight : ex.defaultWeight`) or the library default (e.g., back squat default is 135 lb, `01-exercise-library.js:14`). The DE loading scheme has percentage notes in the coaching string ("65% 1RM. Max bar speed." — `04e-periodization.js:110`) but those are display-only; no percent is ever applied to a true or estimated 1RM. E1RM is computed via Epley (`23-pr-tracking.js:10` and `13-start-finish.js:159-167`) but is only used for PR flagging — not for load recommendations.

**Deloads.** Deload weeks are calendar-scheduled via `phaseConfig` ratios. For `hypertrophy5` the last 25% of the program duration is flagged Deload, which for a 10-week run is weeks 8-10. A deload is not triggered by fatigue signs, missed reps, or RPE creep — it arrives on a fixed schedule.

**Volume, as the app uses the word.** Session tonnage (`volume = sets.reduce((a,s) => a + s.weight*s.reps, 0)` — `13-start-finish.js:184`) is used as a trend metric in the timeline (`09a-timeline-strip.js:254, 413, 477, 526`). This is not RP "volume" — RP volume is **hard sets per muscle group per week**. Those sets-per-muscle-per-week numbers are not computed anywhere.

**Net:** what exists is a generic concurrent-methodology engine that renders `hypertrophy5` as a block-structured PPL+UL program with fixed sets/reps per phase. The elements real RP depends on — per-muscle volume landmarks, mesocycle objects, RIR-driven set additions, performance/soreness autoregulation, individualized load targets — are absent.

---

## 2. What authentic Renaissance Periodization actually is

RP is the body of applied hypertrophy programming developed by Dr. Mike Israetel and colleagues, codified in *Scientific Principles of Hypertrophy Training* (Israetel, Hoffmann, Smith, Feather) and operationalized in the RP Hypertrophy App. The whole system orbits four ideas.

**Volume landmarks, per muscle, per week.** Every muscle group has four thresholds measured in weekly hard sets ([RP Strength — Training Volume Landmarks](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)). **MV** (Maintenance Volume, ≈6 sets/wk) is what preserves what you have. **MEV** (Minimum Effective Volume) is the least that grows anything and is where a mesocycle starts. **MAV** (Maximum Adaptive Volume) is the productive middle — the zone you ramp through. **MRV** (Maximum Recoverable Volume) is the ceiling; going past it produces more fatigue than stimulus. The landmarks are individual and shift over time. Chest for an intermediate male might sit around MEV 8, MRV 22; back MEV 10, MRV 25; side delts MEV 8, MRV 26 ([arvo.guru — RP Training Guide](https://arvo.guru/resources/methods/rp-training)). These are starting estimates, refined by your own recovery and pump feedback.

**The mesocycle is 4-6 weeks of accumulation plus one deload.** You open the block at MEV for each muscle. Each week you add 1-3 sets per muscle, driven by how the previous week went — the RP app calls this the "set progression algorithm" and it uses pump quality, soreness recovery by next session, and workload/performance feedback to decide whether to add 0, 1, 2, or 3 sets for each muscle next week ([dr-muscle.com — RP Hypertrophy App Review](https://dr-muscle.com/rp-hypertrophy-app-review/); [RP Strength — In Defense of Set Increases](https://rpstrength.com/blogs/articles/in-defense-of-set-increases-within-the-hypertrophy-mesocycle)). By the final week you're at or just past MRV — reps are grinding, soreness lingers, pump drops, performance stalls. That's the trigger.

**Intensity is managed via RIR, and RIR tightens as the block progresses.** Reps in Reserve is the primary autoregulation cue for load; RPE is the 1-10 effort inverse. A canonical 4-week accumulation runs **RIR 4 → 3 → 2 → 1**, with the final week brushing failure on the last set ([arvo.guru — RP Training Guide](https://arvo.guru/resources/methods/rp-training)). Load is chosen to hit the target rep range at the target RIR, then held or nudged up as long as reps can still be maintained. Early sets of an exercise often sit a touch further from failure; the back-off sets or final set target the RIR number.

**Deloads are a real week with real rules, not a light workout.** Volume drops roughly in half (to around MV / ~6 sets per muscle). Intensity drops to ~50-60% of working weights. Reps drop below 5 (no approach to failure). The purpose is to dissipate accumulated fatigue so the next mesocycle can start fresh again at MEV. Triggered either on schedule at end of mesocycle, or unscheduled if performance drops on matched loads ([RP Strength — Progressing for Hypertrophy](https://rpstrength.com/blogs/articles/progressing-for-hypertrophy); [BodySpec — RP Principles](https://www.bodyspec.com/blog/post/renaissance_periodization_principles_and_guide)).

**Exercise selection by Stimulus-to-Fatigue Ratio.** Pick movements that produce the most target-muscle tension and growth signal per unit of systemic and local fatigue ([Outlift — SFR Guide](https://outlift.com/stimulus-to-fatigue-ratio-sfr/); [FitBudd — SFR](https://www.fitbudd.com/academy/stimulus-to-fatigue-ratio-definition-and-examples)). Hack squats typically beat back squats for quad growth because you get quad tension without the low-back/core recovery cost. Pin press can beat bench for upper chest when shoulder irritation is the bottleneck. Machines and cables often beat free weights late in a mesocycle because their SFR holds up as fatigue rises. RP slots one compound per muscle plus 1-3 higher-SFR accessories, rotating when joint discomfort or stalls appear.

**Individualization is the core.** The app-shipped RP system doesn't prescribe weights directly — it asks the user to pick a weight that hits the target RIR for the prescribed reps, logs reps performed and optional pump/soreness, and adjusts sets for next week and for next mesocycle based on what happened. The RP app has the benefit of ~175k users' data refining its defaults, but the mechanism is local: **your MEV and MRV are inferred from how you responded to volume, not from a formula** ([RP Strength — Complete Hypertrophy Guide](https://rpstrength.com/blogs/articles/complete-hypertrophy-training-guide); [dr-muscle.com](https://dr-muscle.com/rp-hypertrophy-app-review/)).

---

## 3. Gap analysis — current app vs. real RP

Ranked by how much each missing piece degrades the user's actual training decisions.

**Gap 1 — no per-muscle weekly volume tracking (highest impact).** Volume in RP is "hard sets per muscle per week per landmark," and the entire feedback loop depends on it. The app stores `muscles[]` on each `Set` (`01a-mksets.js:16`), so the data is already flowing through. But nothing computes weekly sets-by-muscle, and nothing stores per-user MEV/MAV/MRV estimates. Without this number the user can't know if they're undershooting, in the growth zone, or past MRV. This is the foundation everything else rests on.

**Gap 2 — RPE/RIR is captured but not used (highest impact).** Every set already has an RPE field (`10-render-workout.js:1234-1257`). Kenny's North Star — "my RPE weight/reps for squats should be based on what effort I have to put in for where I'm at in my progression" — is exactly what RP autoregulation is. Today RPE is write-only metadata. Real RP reads last session's RIR, decides if the user progressed, stalled, or overshot, and adjusts next session's load or next week's set count accordingly. Closing this gap unlocks the individualization Kenny wants even without the full landmark system.

**Gap 3 — no mesocycle object, no set-progression state (high impact).** `phaseConfig` treats phases as percentages of an arbitrary total program length. A real RP block is "4 weeks accumulation + 1 deload, starting at MEV, adding 1-3 sets/muscle/week based on last week's response." This needs a first-class mesocycle on the user record with weekNum, targetRIR, per-muscle set counts, per-muscle MEV/MRV estimates, and a history of weekly performance/soreness scores. None of this exists.

**Gap 4 — deloads are calendar-based, not fatigue-based (medium-high impact).** Deloads fire at fixed week ratios (`04e1-program-configs.js:132`), regardless of whether the user is actually fatigued. Real RP deloads end the mesocycle when MRV is reached — signaled by failed reps at matched load, rising soreness that doesn't clear, or drop in pump. Today a user grinding through week 5 in great shape gets sent to a 25% deload block whether they need it or not; a user who blew past MRV in week 3 keeps accumulating until the calendar says so.

**Gap 5 — no individualized load recommendations (medium impact).** The app can suggest last session's weight. It cannot say "you hit RPE 7 for 10 last week, RP target is RPE 8 for 10 this week, try 5-10 lb heavier" — the direct translation of Kenny's ask. E1RM is computed for PR purposes (`23-pr-tracking.js:10`) but isn't used to back out load at target RIR. The math to do this is trivial once RPE is being read.

**Gap 6 — no SFR-aware exercise pool tagging (medium impact).** `POOLS` in `04e-periodization.js:37-58` groups exercises by movement pattern and equipment, which is correct for the conjugate engine. It has no notion of "which of these gives the most delt stimulus with the least recovery cost." Real RP ranks movements per muscle by SFR and shifts toward higher-SFR options late in a mesocycle. The library has `muscles[]` and `cat`; SFR/primary-muscle tagging would need to be added before the engine could pick intelligently.

**Gap 7 — no onboarding-captured training age or landmark seed (medium impact).** Good starting MEV/MRV estimates depend on training age, sex, bodyweight, and per-muscle history. The onboarding (`23-onboarding.js`) captures `experience` (beginner/intermediate/advanced) and some demographics, but doesn't seed landmarks. Real RP starts from reasonable published defaults for the user's profile and then moves them with each mesocycle.

**Gap 8 — "Volume" in the timeline means tonnage (low-medium impact).** `09a-timeline-strip.js:413, 477, 526` surfaces session tonnage as "volume." For a user trained on RP language this is misleading; RP "volume" is sets/muscle/week. This is fixable with a rename and an additional metric, but it mis-educates users reading the UI.

**Gap 9 — Deload loading is under-specified (low impact).** The deload `LOADING` entries (`04e-periodization.js:119, 125, 131`) are generic drop in sets/reps; RP's deload is more specific (roughly half-volume of MV, ~50-60% of working load, well below failure). The spec exists in one-off coaching notes, not in a structured deload rule.

---

## 4. Three redesign directions

Each presents a different tradeoff between how much of the existing architecture is kept and how faithfully RP is represented. Named A/B/C to be agnostic.

### Direction A — "Autoregulation Layer" (incremental, lowest risk)

Keep `hypertrophy5` as a program. Keep the existing phase engine. **Add an autoregulation layer on top of it** that (1) reads the RPE field the user is already entering, (2) computes per-muscle weekly set counts from session history and surfaces them on a new screen, (3) uses last session's RPE+reps+weight to suggest this session's working weight at a target RIR, and (4) replaces hardcoded deload timing with a fatigue-signal trigger that forces a deload if matched-load reps drop or RPE creeps above the target RIR for two sessions running.

**What changes:** a new `src/js/XX-rp-autoreg.js` module; a new `meso` object on the user record storing `{ startedAt, weekNum, targetRIR[], perMuscleSetTargets, observedSoreness, fatigueFlags }`; a new "Volume" screen that reads sessions and shows sets/muscle/week with MEV/MRV bands; changes to the set editor to suggest weight-for-RIR; small migration in `06b-migrations.js`. Existing `hypertrophy5` phaseConfig stays, but the engine consults the meso object before emitting sets.

**Pros:** minimum disruption to every other program in the app; nothing Kenny already logged gets orphaned; RP behaviors feel like features layered on the existing logging flow; quick to ship in pieces. Kenny's primary ask — "my RPE/weight should be based on my progression" — is directly satisfied by (3).

**Cons:** not truly RP-shaped underneath. No real mesocycle lifecycle; the "program" is still a static structure with periodized cells. The volume landmarks are displayed but not structurally integrated — users with the `conjugate5` or `phul4` template get the autoregulation but their programs still don't progress sets the RP way. It's RP-flavored, not RP-native.

### Direction B — "RP Program Type" (mid-effort, cleanest split)

Introduce `blockType: "rp-hypertrophy"` as a new program category alongside the existing phase-based templates. **RP-typed programs get a genuinely different generation and progression path**: a mesocycle lifecycle (Week 1 = MEV, Weeks 2-N = set ramp, final = MRV → auto-deload → new meso), per-muscle set targets regenerated weekly based on prior week's feedback, RIR progression baked in (4→3→2→1 across 4 weeks or 4→3→2→2→1 across 5), and SFR-tagged exercise selection. Other methodologies keep their current engine untouched.

**What changes:** a parallel `04g-rp-engine.js` that replaces the `allocatePhases → LOADING → buildDayFromConfig` chain for RP programs; new schema fields `user.rp = { landmarks: { chest: { mev, mrv, current }, ... }, currentMeso: {...}, mesoHistory: [...] }`; new exercise attributes `sfr: { muscle: score }` added to the library entries; a new program picker card; a dedicated "Week Recap" screen after each session-week that asks the 3-question RP feedback (soreness recovery, joint health, pump — the same ones the RP app asks) and adjusts next week's volume; the existing `hypertrophy5` either becomes an RP program or stays as a legacy "classic hypertrophy" option.

**Pros:** RP is represented the way it actually works, which matches Kenny's "scientifically backed" requirement. Individualization is real and structural, not bolted on. Users can pick RP or one of the other methodologies cleanly. The existing app's logic for conjugate, RPT, 5/3/1, etc., is untouched, so no regression risk for the other templates.

**Cons:** non-trivial schema additions (migration required). Library needs SFR metadata for every relevant exercise — a meaningful labeling pass. Two engines running in parallel means two code paths to maintain. The weekly recap UX is new — can feel heavy for users who just want to log sets, so it needs to be lightweight (Kenny has existing patterns for this — the bottom sheet).

### Direction C — "Full RP rewrite of the hypertrophy module" (highest effort, most faithful)

Replace `hypertrophy5` and related hypertrophy templates (`ppl3`, `ppl6`, `brosplit5`, `phul4`) with a single RP-driven hypertrophy system. **Program becomes fully generative from user landmarks**: user selects goal (hypertrophy), frequency (3-6 days), emphasis muscles, and experience; app computes starting MEV/MRV per muscle from published defaults adjusted by training age; generates a Week 1 session list that hits each muscle at MEV; regenerates Week N from the feedback log; auto-ends mesocycle and auto-starts next one with refined landmarks.

**What changes:** deletes or deprecates ~5 templates in `05-program-templates.js`; `04e-periodization.js` LOADING table is replaced with a load-at-target-RIR calculator for hypertrophy; a meaningful portion of the exercise library is retagged; onboarding adds 2-3 RP-specific questions (training age, priority muscles); Volume screen becomes the primary planning surface.

**Pros:** the hypertrophy experience is genuinely RP. Every concept — landmarks, mesocycles, RIR progression, autoregulation, SFR selection — is first-class. The app becomes the strongest open-source approximation of the RP app for users who want that model. Kenny's individualization requirement is deeply honored because nothing is prescribed globally.

**Cons:** this is a rewrite of the hypertrophy branch. Users on `hypertrophy5` or related templates need migration (their old program is gone). The "one methodology per domain" choice is opinionated — users who like PHUL or bro splits lose them unless they're kept as legacy. Highest engineering cost, highest QA surface, longest time to ship. May be overkill if RP-specific users are a subset of the app's audience.

---

## 5. Recommended path to the spec

Based on the North Star — science-first, individualized, broad-audience but correct — **Direction B is the likely sweet spot for a first pass**, with Direction A as a pragmatic Phase 1 that also delivers the autoregulation win immediately and Direction C held as the aspirational end-state if RP becomes the app's signature system.

A sensible sequencing is: (1) ship Direction A's autoregulation layer first — it costs little, it hits Kenny's stated ask directly, and it lays the data surface (RIR reads, per-muscle set counts) that Direction B requires anyway; (2) once that's live and the Volume screen is real, introduce the RP program type with a proper mesocycle lifecycle and the feedback-driven set progression.

Kenny's call on which direction to spec, and on whether the other hypertrophy templates get kept as-is alongside RP or folded in. Once picked, `fitness-trainer:feature-spec` is the next step to turn it into an implementation plan.

---

## Sources

- [RP Strength — Training Volume Landmarks for Muscle Growth](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)
- [RP Strength — Progressing for Hypertrophy](https://rpstrength.com/blogs/articles/progressing-for-hypertrophy)
- [RP Strength — In Defense of Set Increases Within the Hypertrophy Mesocycle](https://rpstrength.com/blogs/articles/in-defense-of-set-increases-within-the-hypertrophy-mesocycle)
- [RP Strength — Complete Hypertrophy Training Guide](https://rpstrength.com/blogs/articles/complete-hypertrophy-training-guide)
- [RP Strength — Hypertrophy App landing page](https://rpstrength.com/pages/hypertrophy-app)
- [Arvo — RP Training Volume Landmarks & Mesocycles Guide](https://arvo.guru/resources/methods/rp-training)
- [BodySpec — Renaissance Periodization Principles](https://www.bodyspec.com/blog/post/renaissance_periodization_principles_and_guide)
- [Dr-Muscle — Independent RP Hypertrophy App Review](https://dr-muscle.com/rp-hypertrophy-app-review/)
- [Dr-Muscle — RP Hypertrophy App 13-Point Critique](https://dr-muscle.com/rp-hypertrophy-app-critique/)
- [Outlift — How to Optimize Your Stimulus-to-Fatigue Ratio](https://outlift.com/stimulus-to-fatigue-ratio-sfr/)
- [FitBudd — Stimulus to Fatigue Ratio](https://www.fitbudd.com/academy/stimulus-to-fatigue-ratio-definition-and-examples)

---

## 6. Program Advisor Review

This section pressure-tests §§3-5 using the `fitness-trainer:program-advisor` framework — methodology → data model → UI → progression, then a prioritization pass against the 80% use case and schema-leverage test. The plugin's own `methodology-research.md` does not cover RP (it covers PRVN, KOT/ATG, Hybrid, RPT, 40+), so the review applies the skill's translation framework to the RP background established in §2 rather than to a bundled RP reference.

### 6.1 Methodology framing — where §2 simplifies in ways that bite later

The §2 summary is directionally correct but flattens four details that matter once you start writing schema:

**No per-session per-muscle volume cap — the "junk volume" axis is missing.** RP doesn't just constrain weekly volume, it constrains volume per session per muscle, because stimulus per set falls off after the first ~8-10 hard sets on the same muscle in one workout. An RP block that hits 22 back sets/week typically splits them across 3-4 sessions, not two. §3 and §4 both frame volume purely as a weekly target. If Direction B's engine distributes a weekly set target without a per-session cap, it will happily schedule 15 back sets in one Pull day and violate the underlying model. Per-session caps are a second-order data point that belongs in the RP landmarks record.

**Rep ranges ramp within a mesocycle — and they're muscle-specific.** The §2 summary ("RIR 4→3→2→1") is the intensity ramp but omits the rep ramp. Real RP generally compresses reps as the meso progresses for compounds (e.g., 8-12 → 6-10) and holds or narrows on isolations (12-20 throughout). Rep ranges are also muscle-specific — quads and hamstrings tolerate 5-30, side delts tend to 10-20+, triceps 10-20. Direction B's schema in §4 lists "rep-range progression within a meso" by implication but doesn't enumerate it — and without a per-muscle rep-range matrix stored somewhere, the engine will default to a single range across all muscles, which is not RP.

**Exercise rotation and swap cadence is a real rule, not an afterthought.** RP rotates exercises across mesocycles to combat staleness and manage joint stress, and will swap mid-meso when joint pain or stalls appear. The §3 Gap 6 note ("SFR-aware exercise pool tagging") touches this but frames it as a selection problem, not a rotation-over-time problem. The data model in §4-B needs `exerciseHistory` per muscle with last-used-meso timestamps, plus a swap affordance that preserves the week's set count when a user taps "this lift hurts."

**Resensitization phases are a thing past ~3 mesos.** Multi-meso RP programming includes periodic drops back to MEV-minus or brief maintenance phases to re-sensitize the muscle to training stimulus. Neither §3 nor §4 mentions this. It's a schema implication (`mesoCount` or `mesosSinceResensitization` on the user record) and a UX implication (after N mesos, suggest a lighter-volume meso rather than rolling straight into another full progression). Not blocking for v1, but worth knowing now so the meso object is designed to carry that counter.

**RP's actual feedback UX asks three questions, not one.** The RP Hypertrophy App queries **pump (0-3), soreness recovery by next session (0-3), and workload/performance (0-3)** per muscle per week — not just RPE per set. The §4-B weekly recap references this ("3-question RP feedback") but doesn't call out that this is a distinct data stream from per-set RPE and needs its own schema: `weeklyFeedback: { chest: { pump, soreness, workload }, ... }`. Conflating it with RPE (as the §4-A sketch risks doing) breaks the set-progression algorithm downstream.

### 6.2 Direction B — data-model completeness check

Applying the skill's "user/program/session/set" layering to B, here's what §4-B has covered and what's missing.

**Already in §4-B, correctly placed:**
- User-level: `user.rp.landmarks` per muscle (`mev`, `mrv`, `current`)
- User-level: `user.rp.currentMeso` + `user.rp.mesoHistory`
- Library-level: `sfr: { muscle: score }` on exercise entries
- Session-level: the existing `Set.rpe` stays as-is (no schema change)

**Missing or under-specified that should be added before spec-writing:**

1. **`user.rp.landmarks.<muscle>` needs more than `mev/mrv/current`.** Minimum viable field set: `{ mev, mav, mrv, maxSetsPerSession, repRangeByWeek: { w1: [min,max], ..., wN: [min,max] }, frequencyTarget: {min, max} }`. Without these the engine can't honor per-session caps, rep ramps, or frequency spread.

2. **Canonical muscle taxonomy must be locked.** The existing `Exercise.muscles[]` is a free-text tag list — current values include strings like `"quads", "glutes", "upper_chest"` with no enforced vocabulary. RP operates on ~13-15 muscles (chest, upper-back, lats, side-delts, rear-delts, front-delts, biceps, triceps, forearms, quads, hamstrings, glutes, calves, abs, maybe traps). If landmarks key on a muscle ID, every exercise needs to be retagged to that canonical set or the aggregator will drop sets. This retag is non-trivial — it's every library entry touched.

3. **Compound-vs-isolation set-counting rules are not a field, they're a function.** RP counts a heavy row as ~1.0 back set + ~0.5 biceps set, and some coaches fractionalize differently. The set aggregator that produces weekly sets-per-muscle needs a per-exercise `setContribution: { primaryMuscle: 1.0, secondaryMuscle: 0.5 }` map, or the engine will over-count sets for synergists. §4-B implies this via `muscles[]` but doesn't spell it out as a weighted contribution. The §3 Gap 1 framing ("per-muscle weekly sets") hides this subtlety.

4. **`weeklyFeedback` schema is missing from §4-B.** Needs a session-level or week-level object: `meso.weeks[n].feedback = { chest: { pump: 0-3, soreness: 0-3, workload: 0-3 }, ... }`. The set-progression algorithm reads this to decide +0/+1/+2/+3 sets for next week per muscle.

5. **Exercise rotation state.** `user.rp.exerciseHistory = { muscle: [ { exId, lastUsedMesoId, totalMesos } ] }` — allows the engine to rotate out a movement that's been used for 2-3 consecutive mesos or swap it mid-meso when joint pain is flagged.

6. **Resensitization counter.** `user.rp.mesosSinceResensitization` — simple integer, incremented per finished meso, resets when a low-volume/maintenance meso runs. Not critical for v1 but trivial to add now and expensive to bolt on later.

7. **Starting-meso generator needs an input.** `demographics.trainingAge` already exists in onboarding per §3 Gap 7, but the RP engine also needs `demographics.sex` (landmarks differ, e.g., upper body MEV lower for women) and `priorityMuscles: string[]` (emphasis muscles get +2 set offset to starting MEV). Without these the landmark seeder has to guess.

8. **Deload structure needs its own object, not a phase ratio.** `meso.deloadWeek = { volumeMultiplier: 0.5, loadMultiplier: 0.55, rirFloor: 3 }` — removes the deload-as-week-N-of-phase coupling and makes the deload parameterizable per user (40+ users need deeper deloads).

### 6.3 Does shipping A first lock decisions that make B awkward?

Three real lock-in risks. Not blocking, but worth resolving inside A rather than deferring to B.

**Lock-in 1 — muscle taxonomy.** A's Volume screen has to aggregate sets-per-muscle-per-week. The moment it ships, users see these numbers and will expect them to stay stable as B lands. If A uses the current free-text `muscles[]` as-is, B either has to retrofit historic comparisons against a shifting taxonomy or inherit whatever loose vocabulary A used. **Resolution:** A must ship the canonical muscle list + a one-time library retag migration. It's the same retag B needs; doing it in A is free.

**Lock-in 2 — A's deload heuristic vs. B's mesocycle boundary.** A proposes "force a deload if matched-load reps drop or RPE creeps above target for two sessions running" (§4-A, item 4). B's deload is "end of mesocycle when MRV is reached, plus a real structured deload week." If A's fatigue-signal deload fires in the middle of a B mesocycle, you now have two competing deload triggers. **Resolution:** A's deload trigger should be scoped to "suggest a deload / flag fatigue" rather than forcing a phase change. Leave the authority to end a meso to B. In A, surface the fatigue signal as a recommendation on the Volume screen and in the session post-save toast.

**Lock-in 3 — weight-for-RIR in A is last-session-based; B needs meso-aware.** §4-A item 3 ("use last session's RPE+reps+weight to suggest this session's working weight at a target RIR") is correct for week-over-week adjustment. But RP's target RIR changes across weeks (4→3→2→1). If A's `suggestedWeight()` computes from the last session's RIR without knowing what *this week's* target RIR should be, B will have to rewrite that function. **Resolution:** A should take `targetRIR` as a parameter from day one, default it to 2-3 (reasonable RP average) in non-meso programs, and let B supply the week-specific target when a meso is active. The meso container stub should be scaffolded in A even if unused — an empty `user.rp = { meso: null, landmarks: {} }` field so B is a fill-in rather than a migration.

### 6.4 Does A deliver Kenny's individualization, or is it missing pieces?

Kenny's North Star: "my RPE weight/reps for squats should be based on what effort I have to put in for where I'm at in my progression." A's §4-A item 3 addresses this in the abstract but has four gaps that keep it from actually delivering.

**Gap A-1 — "last session's RPE+reps+weight" is the wrong signal by itself.** One data point is noisy. A user who had a bad night's sleep last session will get a permanently depressed recommendation until the next session washes it out. **Resolution:** A's weight-for-RIR should use a per-exercise **recency-weighted e1RM with confidence bands** over the last N sessions (N=3-5), not the most recent single session. Low-confidence bands flag "we don't have enough data to suggest" rather than suggesting something wrong.

**Gap A-2 — cold start for new exercises is unhandled.** The moment a user adds a new exercise (or swaps an existing one), `lastSet` is empty and e1RM is 0. §4-A falls back to `ex.defaultWeight` — which is the global default Kenny explicitly called out as the problem. **Resolution:** cold-start via one of two paths: (a) % relationship to a tagged "anchor" lift the user has done (e.g., DB bench ≈ 0.4× barbell bench 1RM), or (b) a one-time 2-3 set "bench-test" pattern where the first session's suggested weight is conservative and the set editor asks for explicit RPE calibration. Without one of these, A cannot deliver Kenny's ask for new exercises, which is most of them as the library grows.

**Gap A-3 — multi-rep-range autoregulation is unaddressed.** `suggestedWeight(exerciseId, targetRIR)` is insufficient. A user squatting 5×5 @ RIR 2 this week and 3×10 @ RIR 2 next week needs *different* weights for the same RIR. The Epley e1RM makes this tractable: `weight_for_rir_reps(e1RM, targetReps, targetRIR) = e1RM / (1 + (targetReps + targetRIR) / 30)`. The function signature must be `suggestedWeight(exerciseId, reps, targetRIR)` from day one.

**Gap A-4 — bodyweight and machine handling.** The library has `bodyweight: true` exercises (e.g., pull-ups) and machines where "weight" is stack-relative. Weight-for-RIR math treats these as external load. **Resolution:** for bodyweight, include user's current bodyweight + added weight. For machines, let users enter their own weight but the recommendation should note "machine dependency — calibration varies." Neither is complex; both need to be in the spec.

Additionally, the per-mesocycle target-RIR curve (week 1 RIR 4, week 2 RIR 3, etc.) is a B-feature, not an A-feature, as currently scoped. But if A ships `suggestedWeight(exerciseId, reps, targetRIR)` with no concept of meso week, it can still honor Kenny's North Star manually (user picks their target RIR in the set editor) while being B-ready.

### 6.5 Revised recommendation — what to change in §5

§5's A→B sequencing is sound, but A as scoped in §4 is not enough to deliver Kenny's North Star alone and leaves enough lock-in risk to make the B transition awkward. Call the expanded version **A+**.

**A+ (enlarged Phase 1) ships alongside the originally-scoped A items:**
1. Canonical 13-15 muscle taxonomy + library retag migration (resolves lock-in 1 and B's dep #2)
2. `user.rp` container scaffolded with empty `meso: null, landmarks: {}, exerciseHistory: {}` (resolves lock-in 3 and makes B a fill-in not a migration)
3. `suggestedWeight(exerciseId, reps, targetRIR)` — recency-weighted e1RM with confidence bands, 3-arg signature from day one, cold-start via anchor-lift % or bench-test (resolves A-1, A-2, A-3)
4. Bodyweight + machine handling in the weight-for-RIR calc (resolves A-4)
5. A's fatigue-signal deload becomes a **recommendation surface**, not a forced phase change (resolves lock-in 2)
6. Set-contribution weights on library entries (`setContribution: { primary: 1.0, secondary: 0.5 }`) so the Volume screen aggregates correctly — ships with the retag

**B (Phase 2) then adds:** the mesocycle lifecycle itself (week ramp, RIR curve, auto-deload at MRV, auto-next-meso with refined landmarks); the 3-question weekly feedback UX; the set-progression algorithm; SFR scoring on library entries; exercise rotation state.

**Complexity estimate:** A as originally scoped = Low. **A+** = Medium (the retag migration is the tax). B after A+ = Medium (most schema already in place). C = High, and I'd hold until B is live and adoption data shows whether a pure-RP rewrite is justified.

**Build-after:** the library retag (A+ item 1) is the first concrete task — it's prerequisite for items 3 and 6 and for all of B. Spec that before anything else.

**Net change to §5's recommendation:** keep A→B sequencing. Expand A to A+ with the six items above. Direction B remains the sweet spot; Direction C remains aspirational. The muscle taxonomy decision is the single biggest lock-in and should be made as a standalone spec first.

