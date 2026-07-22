# Backlog — K&N Lifts

Known issues, bugs, and planned work. Check here before starting new work.
Delegation prompts with full context live in **TASKS.md** (say "do #N" to execute).

---

## Active Tasks (see TASKS.md)

| # | Type | Name | Conflicts with |
|---|------|------|----------------|
| 1 | Bug | PR entry not saving | — |
| 2 | Feature | Measurements tracking expansion | — |
| 3 | Feature | Workout overview (zoom out) | #8 |
| 4 | Feature | Onboarding visual polish | #6 |
| 5 | Feature | Equipment filter in overview | — |
| 6 | Feature | Equipment onboarding (optional detail) | #4 |
| 7 | Feature | Add days to program | — |
| 8 | Feature | Remove start workout gate | #3 |
| 9 | Feature | Arms superset program | — |

---

## From Nick (5/9) — needs triage

- **Two-program structure (supplemental on off-days)** — "Can we make it to add two programmings to the same structure. Like add ROM to whichever program to supplement the off days." Schema implication: a user would have a primary program plus a secondary that fills off-days (e.g. ROM/recovery/mobility). Touches `userData.program`, `templateId`, day rotation, and program-picker UX. Spec before building.
- **Auto-progression based on prior-week completion** — "Estimating your weight increases based on successful completion of the week before."
  - ✅ Shipped (5/9): simple linear-progression hint chip — when `u.rp.enabled === false` and last session was a clean sweep at the prescribed reps, an "↑ Last week clean — N lbs · Apply" chip appears above the sets. Apply pre-fills all set weights for the exercise. Logic lives in `injectLinearProgressionHint` in `src/js/11-helpers.js`.
  - Still open: the richer RP engine (`src/js/25-rp-engine.js`) already provides smarter suggestions for users who opt in via onboarding's "Smart suggestions". Discoverability for the RP toggle is still a gap — consider adding a settings entry to flip it on after onboarding.
- **2k row training plan** — "Do you want to to add a 2k row training plan lol." New program template (cardio-focused). Would need a row-specific exercise library, distance/time-based progression model, and a place in `05-program-templates.js`. Soft suggestion, not urgent.

---

## Option B follow-ups (v21 — Program Library)

The v21 migration replaced the single-active-slot per-user with `u.programs[]` + `u.activeProgramId`. Library entries can be templates with different params, custom builds, or RP mesocycles, and switching between them is non-destructive. v1 deferred these:

- **Per-program history filtering UI.** Sessions are tagged with `session.programId` already (planted in v21 migration + `finishWorkout`), but no UI surfaces it yet. Add a filter chip on the history screen so a user can see "Conjugate only" or "Filly4 only" sessions.
- **Edit an existing custom program in place.** Today the builder always appends a new entry (decision #2). Add an "edit" affordance from the library row that re-opens the builder seeded with the existing entry's days/blocks/exercises.
- **Rename undo / delete undo.** Library rename + delete fire immediately. A soft-undo toast (5s) would prevent fat-finger losses.
- **Recompute meso state across non-active programs.** `recomputeMesocycleState` walks every entry now, but multi-RP-program users might hit edge cases when sessions belong to an archived entry. Worth checking once anyone actually carries two RP programs.

## RPT followups (7/22)

- **Save-back flow for session RPT conversions.** Mid-workout "Convert to reverse pyramid" is session-only by design (override on `draft.schemeOverrides`, dies at finish). If Kenny wants a converted exercise to stick, add a "keep in program" affordance — likely a post-finish prompt or a second menu item that also writes `ex.scheme` via `mutateDay`. Deliberately not built yet.

## Noticed during RPT work (7/22) — pre-existing, needs triage

- **Paper skin never shows the linear-progression / RP hint chips.** `injectLinearProgressionHint` and `injectRpHint` are only called from the chunky `renderSetsTable` (`10-render-workout.js`), which is dead under the unconditional paper skin — `paperRenderSetsTable` doesn't call them. The new RPT chip is wired into both paths; the older chips should be too.
- **Exercise-head spec overlaps long wrapped names.** In `.paper-exercise-head` / `.paper-focus-ex-head`, a 2–3-line handwritten name (e.g. "Smith Machine Squat") collides with the right-aligned target spec. Affects all specs, not just rpt.
- **rpt3 week 1 resolves to the Deload loading row.** Fresh rpt3 programs show "RPT DELOAD: Light top set" with 2×8 in week 1 ("Base" phase) — phase allocation maps week 1 to a phase name that falls through to `scheme.Deload` in `getLoading`. May be intentional (light intro week) but reads odd.
- **Focus-view action bar says "workout complete · N/M" when only the block is complete.** `paperBuildActionBar` receives block-level `allDone` in focus view but labels it as workout-wide.

## Closed

- ~~Day-of-week selector~~ — already implemented (onboarding step 6, `selectedDays`)
- ~~Auto-fill previous weights~~ — already implemented (`getLastSetsFor()` pre-fills inputs)
- ~~Two-program structure (supplemental on off-days)~~ — addressed (broader than asked): v21 ships a full **program library** (`u.programs[]` + `u.activeProgramId`). Each program keeps its own week, day rotation, draft, schedule, and RP state. Switching between them in Settings (or the header chip when ≥2 are present) is non-destructive. See `src/js/06d-active-program.js` for the accessor layer.

---

## Tabled

- **AI workout suggestions** — needs product definition
- **AI tracker** — unclear intent, parked
