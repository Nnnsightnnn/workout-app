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

## Closed

- ~~Day-of-week selector~~ — already implemented (onboarding step 6, `selectedDays`)
- ~~Auto-fill previous weights~~ — already implemented (`getLastSetsFor()` pre-fills inputs)

---

## Tabled

- **AI workout suggestions** — needs product definition
- **AI tracker** — unclear intent, parked
