# Procedural Memory

Active patterns and procedures for the K&N Lifts workout app.

---

## Active Patterns

### Development Domain

## Pattern: Add New Exercise (2026-04-14)

### When to Use
- Adding a new exercise to the app's exercise library
- Expanding exercise options for a muscle group

### Success Metrics
- Exercise appears in library browser bottom sheet
- Exercise can be added to any block in edit mode
- Tests pass (`node test-v3.js`)

### Core Approach

**Problem**: Need to add a new exercise that integrates with the full system.

**Solution**:
1. Add exercise object to `LIBRARY` array (~line 801):
```js
{ id: "unique_id", name: "Exercise Name", muscles: ["Primary"], 
  defaultSets: 3, defaultReps: 10, defaultWeight: 0, 
  bodyweight: false, category: "Push" }
```
2. `LIB_BY_ID` auto-populates from `LIBRARY` (computed after array definition)
3. Exercise auto-appears in library picker filtered by category

**Critical Rules**:
- DON'T: Duplicate an existing `id` — IDs must be unique across LIBRARY
- DO: Use existing category names from `CATEGORIES` constant
- DO: Set `bodyweight: true` for exercises without external weight
- DO: Set `defaultWeight: 0` for bodyweight exercises

### Common Pitfalls
- Forgetting `bodyweight: true` causes weight input to show for bodyweight exercises
- Using a category not in `CATEGORIES` means exercise won't appear in filters

<!-- metadata
created: 2026-04-14
usage_count: 0
base_importance: 0.7
last_used: 2026-04-14
category: development
-->

---

## Pattern: Modify Program Structure (2026-04-14)

### When to Use
- Changing default workout days, blocks, or exercises
- Programmatic program modifications

### Success Metrics
- Program changes persist through `saveStore()`
- Existing user data not corrupted
- Day rotation still works correctly

### Core Approach

**Problem**: Need to modify a user's workout program safely.

**Solution**:
1. For current day mutations, use `mutateDay(fn)`:
```js
mutateDay(day => { day.blocks.push(newBlock); });
```
2. For broader changes, use `updateUser(fn)`:
```js
updateUser(u => { u.program[dayIdx].blocks = newBlocks; });
```
3. Both functions auto-call `saveStore()` and trigger re-render.

**Critical Rules**:
- DON'T: Directly mutate `store.users[n].program` — always use `updateUser()`
- DON'T: Change `DEFAULT_PROGRAM` at runtime — it's the reset template
- DO: Use `deepClone()` when copying program structures

### Common Pitfalls
- Mutating without `updateUser()` means changes won't persist
- Forgetting `deepClone()` creates shared references between users

<!-- metadata
created: 2026-04-14
usage_count: 0
base_importance: 0.8
last_used: 2026-04-14
category: development
-->

---

## Pattern: Draft Auto-Save System (2026-04-14)

### When to Use
- Understanding how in-progress workout data is saved
- Debugging lost input during workouts
- Adding new input types to the draft system

### Success Metrics
- Inputs survive page refresh during active workout
- Draft clears on `finishWorkout()`

### Core Approach

**Problem**: Preserve every user input during an active workout.

**Solution**:
The draft system uses a flat key-value store in `user.draft.inputs`:
1. `ensureDraft()` — creates draft object if none exists (called on workout start)
2. `savInput(key, value)` — writes to `draft.inputs[key]` via `updateUser()`
3. `getInput(key, fallback)` — reads from draft, falls back to last session data
4. Key format: `inputKey(blockId, exIdx, setIdx, field)` → `"d1-a|0|0|w"`

**Fields**: `w` (weight), `r` (reps), `e` (RPE), `bw` (bodyweight flag)

**Critical Rules**:
- DON'T: Store draft data outside the `user.draft` object
- DO: Always use `savInput()` which goes through `updateUser()` → `saveStore()`

### Common Pitfalls
- Draft is per-user — switching users loads a different draft
- Draft is null when no workout is active — check before reading

<!-- metadata
created: 2026-04-14
usage_count: 0
base_importance: 0.7
last_used: 2026-04-14
category: development
-->

---

## Pattern: PR Detection (2026-04-14)

### When to Use
- Understanding how personal records are calculated
- Modifying PR logic or adding new PR types

### Success Metrics
- PRs correctly detected on `finishWorkout()`
- PR badges shown in history and toast notifications

### Core Approach

**Problem**: Detect when a user sets a personal record for an exercise.

**Solution**:
In `finishWorkout()` (~line 1757):
1. For each set in the completed workout, calculate estimated 1RM:
   ```js
   e1rm = weight * (1 + reps / 30)  // Brzycki formula
   ```
2. Compare against all prior sessions' sets for the same exercise ID
3. If current e1RM exceeds all historical e1RMs → mark `set.isPR = true`
4. Count total PRs, show toast with count, badge sessions in history

**Critical Rules**:
- DON'T: Compare raw weight — always use estimated 1RM for fair comparison
- DO: Only compare within same exercise ID (not exercise name)
- DO: Skip bodyweight exercises or sets with 0 weight

### Common Pitfalls
- PR detection runs only in `finishWorkout()`, not during workout
- Sessions capped at 365 — very old PRs may be pruned

<!-- metadata
created: 2026-04-14
usage_count: 0
base_importance: 0.6
last_used: 2026-04-14
category: development
-->

---

## Pattern Index

| ID | Pattern Name | Category | Importance |
|----|--------------|----------|------------|
| 1 | Add New Exercise | development | 0.7 |
| 2 | Modify Program Structure | development | 0.8 |
| 3 | Draft Auto-Save System | development | 0.7 |
| 4 | PR Detection | development | 0.6 |

---

**Last Updated**: 2026-04-14
**Pattern Count**: 4
**File Size Target**: <150KB
