# Backlog — K&N Lifts

Known issues, bugs, and planned work. Check here before starting new work.

---

## Known Test Failures

### `render: set row prefills default weight`
- **Status**: Failing
- **Area**: `test-v3.js` / `10-render-workout.js`
- **Symptom**: Weight inputs not prefilled with default weight during render

### `migrations: bootstraps legacy store to v1`
- **Status**: Failing
- **Area**: `test-v3.js` / `06b-migrations.js`
- **Symptom**: Schema version is 2 instead of expected undefined after legacy bootstrap

### `corrupt data: loadStore preserves raw in backup key`
- **Status**: Failing
- **Area**: `test-v3.js` / `06-state-storage.js`
- **Symptom**: Schema version is 2 instead of expected undefined; defaults carry current schema version

---

## Bugs

_None currently tracked._

---

## 🔴 Up Next

1. **Onboarding navigation** — add back/next navigation so users can move between onboarding steps
2. **Day-of-week selector** — after "how many days/week" step, let user pick which specific days (Mon/Tue/Wed etc.)
3. **Glossary X button** — add a close/exit button to the glossary modal
4. **Measurements tracking** — in user profile, add body measurements (weight, body fat %, arms, chest, waist, etc.) so users can track progress over time
5. **Workout preview** — before starting a workout, show a preview screen listing all blocks/exercises so user knows what's coming; tap to start
6. **Rethink age-range gating** — the current age-range selection in onboarding may unfairly restrict users; make it informational/optional rather than a hard filter that changes exercise selection

---

## Planned Work

_None currently tracked._
