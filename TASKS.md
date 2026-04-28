# Tasks — K&N Lifts

Numbered task prompts for delegation. Say "do #N" to execute.

---

## #1 — Fix: PR Entry Not Saving

```
Fix a bug in K&N Lifts workout app where manual PR entries may not persist.

CONTEXT:
- This is a single-file vanilla JS app. Source is in src/, built via `node build.js` into workout-app.html.
- Read CLAUDE.md for architecture rules and guard rails before making changes.

INVESTIGATION:
- Manual PRs are added via `_openAddManualPRSheet()` in src/js/24-pr-screen.js (line 336)
- It calls `addManualPR(exId, weight, reps, date)` in src/js/23-pr-tracking.js (line 184)
- That function pushes to `u.manualPRs[]` via `updateUser()` → `saveStore()` in src/js/06-state-storage.js
- Schema v13 migration added the manualPRs array (src/js/06b-migrations.js)
- Defensive default at src/js/06-state-storage.js line 146: `if (!Array.isArray(u.manualPRs)) u.manualPRs = [];`

LIKELY CAUSES:
1. Race condition — multiple rapid saves overwriting each other
2. UI re-renders before data is confirmed saved
3. The sheet closing before save completes
4. loadStore() defensive default resetting the array unexpectedly

TASK:
1. Read the full save flow from _openAddManualPRSheet → addManualPR → updateUser → saveStore
2. Trace the data lifecycle: when is loadStore() called after save? Could it overwrite?
3. Check if closeSheet() triggers a re-render that calls loadStore() before save finishes
4. Fix the root cause
5. Run `node build.js && node test-v3.js` to verify

ACCEPTANCE:
- Manual PR entries persist across app reload
- No regression in auto-detected PR tracking
```

---

## #2 — Feature: Measurements Tracking Expansion

```
Expand the body measurements tracking in K&N Lifts to be a more prominent, polished feature.

CONTEXT:
- Single-file vanilla JS app. Source in src/, built via `node build.js`. Read CLAUDE.md first.
- Current implementation: src/js/18-body-weight.js has BODY_METRICS (weight, bodyFat, arms, chest, waist, neck, thighs, hips)
- Data stored in u.measurements[] array (max 365 entries), each entry has date + metric values
- Sparkline charts already exist for metrics with >=2 data points
- Body weight can be set during onboarding (src/js/23-onboarding.js step 11)

TASK:
Add a dedicated measurements screen/section that makes tracking more engaging:
1. Progress over time visualization — expand sparklines to larger, tappable charts
2. Add a "quick log" entry point that's easier to find (currently buried in body section)
3. Add delta indicators (e.g. "+2 lbs since last entry", "-0.5 inches this month")
4. Consider adding measurement reminders or "last measured X days ago" nudges

CONSTRAINTS:
- No schema migration needed if you stay within existing BODY_METRICS fields
- If adding new metrics, you MUST add a migration in src/js/06b-migrations.js and bump APP_VERSION in src/js/06a-version.js
- Follow the chunky/bubbly design language (14px+ border-radius, pillow shadows, squish press states) — see .icon-btn and .sheet-item patterns in src/styles.css
- Use updateUser() → saveStore() for persistence (src/js/06-state-storage.js)
- Run `node build.js && node test-v3.js` when done
```

---

## #3 — Feature: Workout Overview (Zoom Out)

```
Add a day-level workout overview that shows all blocks and exercises at a glance before the user starts their workout.

CONTEXT:
- Single-file vanilla JS app. Source in src/, built via `node build.js`. Read CLAUDE.md first.
- Current flow: renderWorkoutScreen() in src/js/10-render-workout.js dispatches on state.workoutView:
  - "preview" → renderDayPreview() — current pre-start view
  - "chapters" → renderChaptersView() — block-by-block with expand
  - "focus" → renderFocusView() — single exercise fullscreen
- The "chapters" view (line 1519) already shows blocks with exercises, but users want a condensed birds-eye view

TASK:
Create a compact overview that shows the full day structure at a glance:
1. All blocks visible simultaneously (not expandable — always shown)
2. Each exercise shown as a compact row: name, sets x reps, target weight
3. Muscle group color coding (already exists in focus view, line 1756-1758)
4. Estimated workout duration based on sets × rest times
5. "Start Workout" button at bottom to transition to focus view

INTEGRATION:
- This should be the default view when a user taps a day (before state.workoutView = "focus")
- Wire it into the existing renderWorkoutScreen() dispatch
- The start gate is in src/js/13-start-finish.js — startWorkout() sets workoutView to "preview", then _beginWorkoutFocus() creates the draft and enters focus mode
- Reuse existing CSS patterns: .sheet-item for exercise rows, .lib-cat-btn for block headers

ACCEPTANCE:
- User sees full day overview before starting
- Can scroll through all blocks/exercises
- Tapping "Start" enters the existing focus flow
- Run `node build.js && node test-v3.js`
```

---

## #4 — Feature: Onboarding Visual Polish

```
Visually refresh the onboarding flow to be more beautiful and sleek. No structural changes — same steps, same logic, just better looking.

CONTEXT:
- Single-file vanilla JS app. Source in src/, built via `node build.js`. Read CLAUDE.md first.
- Onboarding flow: src/js/23-onboarding.js, showOnboardingFlow() → _renderObStep() for each of 14 steps
- CSS styles: src/styles.css (search for "onboarding", ".ob-")
- Steps include: goals, physique priority, body goal, experience, days/week, selected days, duration, gender, equipment, age, body weight, smart suggestions, RPE calibration, injuries
- Design language: chunky/bubbly Japanese-inspired aesthetic. See CLAUDE.md [DESIGN-00001].

TASK:
Polish the visual presentation of each onboarding step:
1. Better typography hierarchy — use --font-display (Oswald) for step titles
2. Smooth transitions between steps (fade/slide, not instant swap)
3. Progress indicator (step dots or progress bar)
4. More generous spacing and padding
5. Option cards should use pillow shadow effect (var(--pillow-sm)) and squish press states
6. Selected state should use accent glow (var(--accent), var(--accent-glow-soft))
7. Consider subtle background gradients or patterns per step

CONSTRAINTS:
- CSS-only changes preferred. Minimal JS changes (only if needed for transitions/animations).
- Do NOT change the step order, logic, or data collection. Same inputs, same flow.
- Must work on mobile (375px width minimum)
- Follow existing design tokens in src/styles.css (--bg, --accent, --pillow, --squish, etc.)
- Run `node build.js && node test-v3.js`
```

---

## #5 — Feature: Equipment Filter in Workout Overview

```
Add an equipment filter/substitution menu to the workout overview so users can swap exercises based on available equipment.

CONTEXT:
- Single-file vanilla JS app. Source in src/, built via `node build.js`. Read CLAUDE.md first.
- Equipment is modeled on exercises: each has an `equipment[]` array (e.g. ["barbell", "rack"])
- 14 equipment tags defined as EQUIPMENT_TAGS in src/js/01-exercise-library.js: barbell, dumbbell, kettlebell, cable, machine, bodyweight, bands, bench, rack, pullup_bar, box, sandbag, medball, sled
- An equipment filter UI already exists in the program builder: src/js/24-program-builder.js (lines 308-450) using `_builderEqFilter` Set and toggle chips
- Exercise swapping already exists via the bento sidebar: src/js/21-bento-sidebar.js — openSidebar(filterCat, targetBi, targetEi) with category filter and swap target
- Bottom sheet patterns in src/js/12-bottom-sheet.js — openSheet(html), closeSheet()

TASK:
1. Add an equipment availability filter to the workout overview (renderChaptersView or renderDayPreview in src/js/10-render-workout.js)
2. When user marks equipment as unavailable, highlight affected exercises with a warning badge
3. Offer one-tap swap suggestions: show alternative exercises that use available equipment
4. Reuse the existing swap mechanism from bento sidebar (onSidebarCardTap) and equipment filter pattern from program builder

DESIGN:
- Filter could be a collapsible bar at top of overview, or accessible via a filter icon button
- Use existing .lib-cat-btn style for equipment toggle chips
- Warning badges on affected exercises using existing injury warning pattern (line 827-882 in 10-render-workout.js)
- Follow chunky/bubbly design language (CLAUDE.md [DESIGN-00001])

ACCEPTANCE:
- User can mark equipment as unavailable
- Affected exercises are visually flagged
- One-tap swap to alternative exercise
- Run `node build.js && node test-v3.js`
```

---

## #6 — Feature: Equipment Onboarding (Optional Detail)

```
Add a more granular equipment selection step during onboarding, keeping it optional so it doesn't overwhelm new users.

CONTEXT:
- Single-file vanilla JS app. Source in src/, built via `node build.js`. Read CLAUDE.md first.
- Current onboarding: src/js/23-onboarding.js — step 9 is "equipment" with 3 options: full gym, barbell-only, bodyweight
- Equipment tags: EQUIPMENT_TAGS in src/js/01-exercise-library.js — 14 types (barbell, dumbbell, kettlebell, cable, machine, bodyweight, bands, bench, rack, pullup_bar, box, sandbag, medball, sled)
- Onboarding answers saved to s.onboarding object via saveOnboarding()
- Program recommendation: getRecommendedTemplate(a) in 23-onboarding.js (line 196) uses equipment answer

TASK:
1. After the existing equipment step (full/barbell/bodyweight), add an optional "fine-tune" sub-step
2. Pre-select equipment based on the broad answer (e.g. "full gym" = all selected, "barbell" = barbell + bench + rack)
3. Let users toggle individual equipment items on/off using chip-style buttons
4. Save the detailed selection to s.onboarding (e.g. s.onboarding.equipmentDetail = ["barbell", "bench", "rack", ...])
5. Wire into getRecommendedTemplate() to influence program selection
6. Make it skippable — "Looks good" button to accept defaults without toggling

CONSTRAINTS:
- This should feel lightweight, not intimidating. Group equipment logically (e.g. "Free Weights: barbell, dumbbell, kettlebell" / "Machines: cable, machine" / "Other: bands, box, etc.")
- Follow existing onboarding step patterns (_renderObStep, _obSelect)
- Use .ob- CSS classes and pillow shadow design language
- If adding new fields to storage, add a migration in src/js/06b-migrations.js and bump APP_VERSION
- Run `node build.js && node test-v3.js`
```

---

## #7 — Feature: Add Days to Program

```
Let users add training days to their program from an intuitive interface.

CONTEXT:
- Single-file vanilla JS app. Source in src/, built via `node build.js`. Read CLAUDE.md first.
- Program structure: u.program is an array of day objects, each with { id, name, sub, blocks[] }
- Days are generated by resolveWeekProgram() in src/js/04e-periodization.js (line 346)
- Day rotation: src/js/07-day-rotation.js — getCurrentDay(), determineDefaultDay()
- Program editing: src/js/09-program-editing.js — mutateDay(), resetCurrentDay(), resetAllProgram()
- Customize day sheet: src/js/12-bottom-sheet.js openCustomizeDay() (line 374) — can add blocks/exercises to current day
- Program picker: src/js/19-program-picker.js — handles daysPerWeek, template selection
- User has daysPerWeek field (e.g. 5) controlling program generation

TASK:
1. Add a "+" button or "Add Day" option accessible from the day picker or program overview
2. When tapped, create a new blank day with a default name (e.g. "Day 6") and empty blocks
3. Update u.daysPerWeek to reflect the new count
4. Allow the user to populate the new day using existing customize tools (openCustomizeDay, openLibrary)
5. Consider: should adding a day regenerate the program? Probably not — just append a custom day.

DESIGN:
- Access point: day picker sheet (openDayPicker in src/js/12-bottom-sheet.js, line 17)
- Add a "+" tile at the end of the day list, styled like existing sheet-item but with dashed border
- New day opens in edit/customize mode immediately
- Follow chunky/bubbly design language

CONSTRAINTS:
- Don't break existing program generation — custom days should coexist with template-generated days
- Use mutateDay() pattern from 09-program-editing.js for modifications
- Persist via updateUser() → saveStore()
- Run `node build.js && node test-v3.js`
```

---

## #8 — Feature: Remove Start Workout Gate

```
Remove the "Start Workout" gate screen so users can log sets directly without an intermediate step.

CONTEXT:
- Single-file vanilla JS app. Source in src/, built via `node build.js`. Read CLAUDE.md first.
- Current flow in src/js/13-start-finish.js:
  1. startWorkout() sets state.workoutView = "preview" (shows preview screen)
  2. User must tap to proceed → _beginWorkoutFocus() runs ensureDraft() and enters "focus" mode
  3. Only after ensureDraft() can saveInput() work (src/js/08-input-draft.js)
- The draft system (src/js/08-input-draft.js) is critical: ensureDraft() creates { dayId, startedAt, inputs:{} }
- Workout timer starts when draft.startedAt is set (src/js/14-timers.js)

TASK:
1. Skip the "preview" intermediate view — go directly to the workout view when user selects a day
2. Auto-create the draft (ensureDraft()) immediately when entering the workout
3. Keep the timer starting automatically (startedAt = Date.now())
4. Preserve the ability to pause/resume (draft.pausedAt)
5. The "chapters" view (renderChaptersView, line 1519 in 10-render-workout.js) should be the entry point — user sees all blocks and can tap into any exercise

CRITICAL:
- ensureDraft() MUST still be called — it's what enables set logging. The gate being removed is the UI step, not the draft creation.
- finishWorkout() in 13-start-finish.js must still work (it reads draft.inputs to build the session)
- Don't break the workout flow — just remove one tap from the sequence

ACCEPTANCE:
- Selecting a day immediately shows the workout with all blocks visible
- Sets can be logged immediately (draft auto-created)
- Timer starts on entry
- Finish workout still works correctly
- Run `node build.js && node test-v3.js`
```

---

## #9 — Feature: Arms Superset Program

```
Add a new arms superset program template featuring curl + overhead press supersets.

CONTEXT:
- Single-file vanilla JS app. Source in src/, built via `node build.js`. Read CLAUDE.md first.
- Program templates: src/js/05-program-templates.js — PROGRAM_TEMPLATES array, each with { id, name, description, daysPerWeek, minWeeks, maxWeeks }
- Program configs: src/js/04e1-program-configs.js — PROGRAM_CONFIGS object defining day structures with blocks and exercise pool slots
- Exercise library: src/js/01-exercise-library.js — LIB_BY_ID lookup. Relevant exercises:
  - Arms category: barbell_curl, dumbbell_curl, hammer_curl, preacher_curl, cable_curl, concentration_curl
  - Shoulders/triceps: overhead_press, strictpress, dumbbell_ohp, cable_tricep_pushdown, skull_crushers, dips
- mkSets() in src/js/01a-mksets.js builds exercise instances from library references
- Pool system: exercise pools (e.g. "curl_primary", "push_overhead") used in slot definitions for dynamic rotation

TASK:
1. Add a new template to PROGRAM_TEMPLATES: id "arms_superset3" (or similar), 3 days/week
2. Create the program config in PROGRAM_CONFIGS with superset-style blocks:
   - Day structure: Bicep/Tricep superset blocks (A: curl + overhead press, B: curl variant + tricep variant, C: optional compound)
   - 5 sets x 8-12 reps per exercise
   - Short rest between superset pairs (60-90s), longer between sets (120s)
3. Define exercise pools if needed for rotation (curls pool, overhead/tricep pool)
4. Add to getRecommendedTemplate() in src/js/23-onboarding.js if appropriate (e.g. when user selects "arms" as physique priority)

DESIGN:
- Superset blocks should pair exercises: first exercise in block = curl, second = press/extension
- Use existing block letter convention: A (main superset), B (secondary superset), C (finisher)
- 3 training days: could be Arms A (heavy), Arms B (volume), Arms C (pump/isolation)

ACCEPTANCE:
- Template appears in program picker
- Program generates valid days with superset pairings
- Exercises rotate across weeks (using pool system)
- Run `node build.js && node test-v3.js`
```

---

## Closed

- ~~Day-of-week selector~~ — Already implemented (onboarding step 6, `selectedDays` in src/js/23-onboarding.js)
- ~~Auto-fill previous weights~~ — Already implemented (`getLastSetsFor()` pre-fills inputs in src/js/10-render-workout.js)

## Tabled

- **AI workout suggestions** — needs product definition
- **AI tracker** — unclear intent, parked
