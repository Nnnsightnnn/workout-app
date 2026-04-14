# Quick Reference

Top patterns for the K&N Lifts workout app. Check this FIRST before any task.

---

## App Architecture

**Multi-file source** in `src/`, built to single-file `workout-app.html` via `node build.js`.

**Data flow**: User Input → `saveInput()` → `updateUser(fn)` → `saveStore()` → re-render

**Storage**: LocalStorage key `kn-lifts-v3`
```js
{ unit, users: [{ id, name, program[], sessions[], draft, lastDoneDayId }], currentUserId }
```

**Build**: `node build.js` → concatenates `src/template.html` + `src/styles.css` + `src/js/*.js` → `workout-app.html`
**Test**: `node build.js && node test-v3.js`

---

## Code Section Map (src/js/)

| File | Key Functions |
|------|---------------|
| `01-exercise-library.js` | `LIBRARY`, `LIB_BY_ID`, `CATEGORIES` |
| `02-default-program.js` | `DEFAULT_PROGRAM`, `mkSets()` |
| `03-jbrown-program.js` | `JBROWN_PROGRAM` |
| `04-filly-program.js` | `FILLY_PROGRAM` |
| `05-program-templates.js` | `PROGRAM_TEMPLATES` |
| `06-state-storage.js` | `loadStore()`, `saveStore()`, `userData()`, `updateUser()` |
| `07-day-rotation.js` | `determineDefaultDay()`, `getCurrentDay()` |
| `08-input-draft.js` | `getDraft()`, `saveInput()`, `getInput()`, `ensureDraft()` |
| `09-program-editing.js` | `mutateDay()`, `resetCurrentDay()`, `resetAllProgram()` |
| `10-render-workout.js` | `renderWorkoutScreen()` |
| `12-bottom-sheet.js` | Day picker, library browser, edit menus |
| `13-start-finish.js` | `startWorkout()`, `finishWorkout()` — PR detection |
| `14-timers.js` | `startRest()`, `playBeep()` |
| `15-history.js` | `renderHistory()` |
| `16-tools.js` | Plate calculator, 1RM estimator |
| `22-init.js` | `init()`, PWA setup, event wiring |

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
