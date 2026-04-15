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

## Planned Work

_None currently tracked._
