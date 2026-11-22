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

## Noticed 11/19 — open

- **The time budget's cuts can be steep for compound lifts in later blocks.** For Upper B, a 30-minute target cuts Chin-Up rest from 150s to 45s, because any exercise outside the first working block counts as an accessory (tier 1, `generateAdjustmentCandidates` in `23a-time-budget.js`). The cut is listed on the card before Start, so it is visible and one tap undoes it, but the rule may want a floor for compounds. Not changed.

## Noticed 11/21 — open

- **With the session clock running, the stats box draws over the bottom bar.** `renderStatsBar()` (`10-render-workout.js`) is `position: sticky; bottom: 68px` with a transparent paper background, so whenever `state.workoutStartedAt` is set (Auto timer on in Settings, or a newcomer's first workout through `startWorkout()`) its VOL / SETS / PRS / ELAPSED labels sit on top of the bar's Rest, Weight and Log set. Seen 11/21 in WebKit at 390x844, cream and dark (`director/walks/2026-11-21/f36-pace-trim/before-04-after-trim-*.png`). Same fault as the director map's F9 note for newcomers.

## Closed

- ~~The bottom bar didn't name the lift or its reps, and the list never followed the set being logged~~ — fixed 11/22. In list view the bar said only "set 1 of 4" and the page stayed at the top, so after Start and after every log the set being logged sat under the bar or below the fold (walked 11/22: 0 of 10 logs left the next set on screen; Back Squat's first working set logged with the finished Row warm-up showing). The bar now names the lift and the reps its row shows (`paperBarSetLabel`, also in focus view and the one-off bar), and list view scrolls the lift's name and the active set into view whenever the active set changes (`paperFollowActiveRow`), never on a tap that leaves it in place. Guarded by three tests in `test-v3.js` and a WebKit real-tap test in `e2e/personas.spec.js`, all failing on the old build. Still open: the reps shown are last session's, not the plan's (director map F5).
- ~~The pace trim wrote the trimmed day into the stored program~~ — fixed 11/21 (Kenny's call, 11/16). `trimSession()` now holds today's day on the draft (`draft.sessionDay`) before its first cut, the same way an "adjust time" start does, so `mutateDay` and Undo work on that copy and the stored program is never written; the held day ends with the draft. It only holds on a draft that already belongs to today, and never calls `ensureDraft()`, which would replace another day's draft. Once a session is trimmed, later edits in that session (add a set, swap) last for that session only, as in an adjusted session. The toast now says the trim is for today. Guarded by four tests in `test-v3.js` (three fail on the old build) and a WebKit real-tap test in `e2e/personas.spec.js`.

- ~~"Adjust time" on the day card never opened in paper, and "Start adjusted" rewrote the stored program~~ — fixed 11/19 (Kenny chose memo B on 11/16). The panel now opens (the paper card sets the grid row to `1fr`) with 30 and 45 quick picks under the stepper, lists its cuts in paper type, and moves its Start onto the card's own Start stamp ("Start ~33 min"), so the card has one Start and it does what the time line says. The card's Sets, Blocks and Est. follow the cut, a tap anywhere on the card does what the stamp does, and closing the panel puts the plan back. The cut day rides on the draft as `draft.sessionDay`: `getCurrentDay()`, `mutateDay()`, the two remove-set handlers and today's cooldown read and write it, `finishWorkout()` saves it, and clearing the draft drops it. The stored program is never written. A planned Start drops a held cut day while nothing is logged; once a set is logged, reopening keeps it. Drafts saved before this have no `sessionDay` and run the stored day as always (no migration, the same pattern as `draft.schemeOverrides`). `startFirstWorkout()` is unchanged by request. Guarded by five tests in `test-v3.js` and a WebKit real-tap test in `e2e/personas.spec.js`.

- ~~The action bar's weight stepper and Swap could change a logged set~~ — fixed 11/17. With nothing left to log (a block done in focus view, or the whole day done in either view, or a one-off workout done), the bar kept its stepper and Swap aimed at set 1 of a block already logged. In focus view, after "A done · next: B", a "+" meant for the next lift rewrote A's first set: walked, Back Squat lifted at 135 saved as 140 and flagged a PR. The bar now draws the stepper and Swap only while a set is left to log; the stamp holds the right edge. Guarded by three tests in `test-v3.js` and a WebKit tap test in `e2e/personas.spec.js`.
- ~~No visible Start on the returning open~~ — fixed 11/14. The only Start sat inside the collapsed "adjust time" panel (above), so the unmarked card was the only way in. The hero card now carries a red "Start workout" stamp beside "adjust time", on the first screen at 390x844, and it starts the day as planned, like the card tap. The card's default time target now rounds up, so its time line matches its Est. figure. The WebKit persona suite now taps Start for real instead of `element.click()`, which is how the gate missed this for six months.
- ~~Focus-view action bar says "workout complete · N/M" when only the block is complete~~ — fixed 11/12. Worse than the label: the stamp became Finish, and Finish runs `finishWorkout()` with untouched sets auto-completed, so one tap after a single block saved the whole day as lifted. The bar now offers Finish only when every set of the day is done; otherwise the stamp reads "Next: B" and moves focus to the next block with sets left. Guarded by three tests in `test-v3.js` and a WebKit tap test in `e2e/personas.spec.js`.

- ~~`allocatePhases` drops `loadingPhase`~~ — fixed 8/8. `phaseConfig` entries may set `loadingPhase` to map a display phase name onto a real `LOADING` key ("5s Week" → `Accumulation`), but `allocatePhases` rebuilt each phase without copying it through, so `getLoading` fell back to `scheme.Deload` and 18 of 29 programs served deload prescriptions for ~75% of their length (worst: gvt4 at 6×10 instead of its signature 10×10; wendler4's 5s/3s/1s weeks all at `40/50/60%`). This was the root cause of the earlier "rpt3 week 1 reads odd" note. No migration needed — `entry.program` holds only the current week and is regenerated by `advanceWeek`, so users pick up correct loading at their next week boundary without their in-progress week changing under them. Guarded by two tests in `test-v3.js`.
- ~~Day-of-week selector~~ — already implemented (onboarding step 6, `selectedDays`)
- ~~Auto-fill previous weights~~ — already implemented (`getLastSetsFor()` pre-fills inputs)
- ~~Two-program structure (supplemental on off-days)~~ — addressed (broader than asked): v21 ships a full **program library** (`u.programs[]` + `u.activeProgramId`). Each program keeps its own week, day rotation, draft, schedule, and RP state. Switching between them in Settings (or the header chip when ≥2 are present) is non-destructive. See `src/js/06d-active-program.js` for the accessor layer.

---

## Tabled

- **AI workout suggestions** — needs product definition
- **AI tracker** — unclear intent, parked
