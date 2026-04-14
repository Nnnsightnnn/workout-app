# Quick Reference

Top patterns for the K&N Lifts workout app. Check this FIRST before any task.

---

## App Architecture

**Single file**: `workout-app.html` (2385 lines) — CSS + HTML + JS inline, zero dependencies.

**Data flow**: User Input → `savInput()` → `updateUser(fn)` → `saveStore()` → re-render

**Storage**: LocalStorage key `kn-lifts-v3`
```js
{ unit, users: [{ id, name, program[], sessions[], draft, lastDoneDayId }], currentUserId }
```

---

## Code Section Map

| Section | Line | Key Functions |
|---------|------|---------------|
| Exercise Library | 801 | `LIBRARY`, `LIB_BY_ID`, `CATEGORIES` |
| Default Program | 890 | `DEFAULT_PROGRAM`, `mkSets()` |
| State/Storage | 1009 | `loadStore()`, `saveStore()`, `userData()`, `updateUser()` |
| Day Rotation | 1121 | `determineDefaultDay()`, `getCurrentDay()` |
| Draft Management | 1141 | `getDraft()`, `savInput()`, `getInput()`, `ensureDraft()` |
| Program Editing | 1196 | `mutateDay()`, `resetCurrentDay()`, `resetAllProgram()` |
| Render: Workout | 1226 | `renderWorkoutScreen()` |
| Bottom Sheets | 1470 | Day picker, library browser, edit menus |
| Start/Finish | 1749 | `startWorkout()`, `finishWorkout()` — PR detection here |
| Rest Timer | 1848 | `startRest()`, `playBeep()` |
| History | 1949 | Session list, donut chart |
| Tools | 2049 | Plate calculator, 1RM estimator |
| Init | 2130 | `init()` at line 2341, event wiring |

---

## Naming Conventions

| Convention | Example |
|------------|---------|
| camelCase functions/vars | `userData()`, `getCurrentDay()` |
| UPPER_SNAKE constants | `LIBRARY`, `DEFAULT_PROGRAM`, `STORAGE_KEY` |
| User IDs | `u_<timestamp>_<random>` |
| Session IDs | `s-<timestamp>` |
| Input keys | `"d1-a\|0\|0\|w"` (block\|exIdx\|setIdx\|field) |
| Section headers | `// ====` comment blocks |

---

## Common Operations

### Add a new exercise to the library
Add object to `LIBRARY` array (line ~801). Fields: `id`, `name`, `muscles[]`, `defaultSets`, `defaultReps`, `defaultWeight`, `bodyweight`, `category`.

### Modify a user's program
Use `mutateDay(fn)` which calls `updateUser()` internally. Never mutate `program[]` directly.

### Persist any change
Always go through `updateUser(fn)` — it handles save and state update.

### Test changes
Run: `node test-v3.js` (11 tests covering user creation, drafts, finish, PR detection)

---

**Last Updated**: 2026-04-14
**Pattern Count**: 4
**Next Review**: 2026-04-21
