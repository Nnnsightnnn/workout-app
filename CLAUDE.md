# Claude Context — K&N Lifts Workout App

Essential project context. Full details in `.claude/specs/`.

## Tech Stack
HTML5 • CSS3 (variables, flexbox, grid) • Vanilla JS (ES6+) • LocalStorage • Web Audio API • Vibration API

**Zero external dependencies.** No CDN imports, no npm packages. Fully self-contained.

## Project Structure
```
src/
  template.html            ← HTML skeleton with {{CSS}} and {{JS}} placeholders
  styles.css               ← All CSS
  js/
    01-exercise-library.js ← CATEGORIES, LIBRARY, LIB_BY_ID
    02-default-program.js  ← mkSets(), DEFAULT_PROGRAM
    03-jbrown-program.js   ← JBROWN_PROGRAM
    04-filly-program.js    ← FILLY_PROGRAM
    05-program-templates.js← PROGRAM_TEMPLATES
    06-state-storage.js    ← state, loadStore, saveStore, userData, updateUser
    07-day-rotation.js     ← determineDefaultDay(), getCurrentDay()
    08-input-draft.js      ← getDraft, ensureDraft, saveInput
    09-program-editing.js  ← mutateDay, resetCurrentDay, resetAllProgram
    10-render-workout.js   ← renderWorkoutScreen and sub-renderers
    11-helpers.js          ← getLastSetsFor()
    12-bottom-sheet.js     ← openSheet, closeSheet, pickers, menus
    13-start-finish.js     ← startWorkout(), finishWorkout()
    14-timers.js           ← session timer, rest timer
    15-history.js          ← renderHistory()
    16-tools.js            ← plate calculator, 1RM estimator
    17-export.js           ← exportData()
    18-body-weight.js      ← renderBodySection()
    19-program-picker.js   ← renderProgramPicker()
    20-toast-nav.js        ← showToast, showScreen, initNav
    21-bento-sidebar.js    ← openSidebar, closeSidebar, initSidebar
    22-init.js             ← setupPWA, init, DOMContentLoaded
build.js                   ← Build script (zero deps, Node.js built-ins only)
workout-app.html           ← BUILD OUTPUT (single-file distributable)
test-v3.js                 ← Test harness (jsdom-based, 16 workflow tests)
CLAUDE.md                  ← This file
README.md                  ← User-facing documentation
.claude/                   ← Context system (specs, memory, commands, skills)
```

## Architecture
Source code lives in `src/`. Run `node build.js` to produce the single-file `workout-app.html`.
Numeric prefixes on JS files enforce concatenation order (alphabetical sort = dependency order).
All JS shares global scope — no module system, same as a single `<script>` tag.

## Data Flow
`state` → render functions → user input → `updateUser()` → `saveStore()` → re-render

## Storage
- **Key**: `kn-lifts-v3` in LocalStorage
- **Schema**: `{ unit, users[], currentUserId }`
- **Per user**: `{ id, name, program[], sessions[], draft, lastDoneDayId }`

---

## Critical Guard Rails

### Architecture [ARCH]
**[ARCH-00001]** Source code lives in `src/` (CSS, HTML template, JS modules). Run `node build.js` to produce the single-file `workout-app.html` distributable. The output must remain a single self-contained HTML file.
**[ARCH-00002]** Zero dependencies — no external libraries or CDN imports
**[ARCH-00003]** Use section comment headers when adding new code sections. New JS files use numeric prefix to set load order (e.g. `23-new-feature.js`).
**[ARCH-00004]** Shareable by design — the built `workout-app.html` must work when someone receives the file and opens it in a mobile browser. No server required, no external assets.
**[ARCH-00005]** Always run `node build.js` after editing `src/` files, before testing or committing.
> TRIGGER: When adding features or refactoring

### Design Language [DESIGN]
**[DESIGN-00001]** Chunky, bubbly, Japanese-inspired UI aesthetic. Buttons and interactive elements should feel tactile and 3D:
- Generous sizing (44px+ touch targets)
- Rounded corners (14px+ border-radius)
- Solid 2px borders with offset box-shadows (`0 3px 0`) for a raised/pillow effect
- Press state: `translateY(3px)` + shadow collapse to simulate physical button press
- Reference implementation: `.icon-btn` in workout-app.html
> TRIGGER: When adding or styling any new buttons, cards, or interactive elements

### Data [DATA]
**[DATA-00001]** Storage key is `kn-lifts-v3` — never change without migration
**[DATA-00002]** Always go through `updateUser()` → `saveStore()` for persistence
**[DATA-00003]** Deep clone with `deepClone()` (JSON round-trip) when copying objects
> TRIGGER: When modifying data layer

### Memory Check (REQUIRED)
**ALWAYS check first:** `.claude/memory/active/quick-reference.md`
> TRIGGER: Before starting any task

### Verification [VERIFY]
**[VERIFY-00001]** Read code before recommending changes
**[VERIFY-00002]** Run `node build.js && node test-v3.js` after modifications
> TRIGGER: Before proposing ANY changes

### Execution [EXEC]
**[EXEC-00001]** Parallelize independent operations
> TRIGGER: Before making tool calls

---

## Task Management [TASK]
**[TASK-00001]** Use task tracking for multi-step work
**[TASK-00002]** Commit format: `"Fix: [Description] (Task: <id>)"`
> TRIGGER: When starting complex tasks

## Context Management [CTX]
**[CTX-00001]** Memory: `.claude/memory/active/`
**[CTX-00002]** Search: quick-reference → structured → docs

## Pain Points [PAIN]
**[PAIN-00001]** Track friction: `.claude/pain-points/active-pain-points.md`

## Quick Reference
**Memory**: `.claude/memory/active/quick-reference.md`
**Architecture**: `.claude/specs/architecture.md`
**Pain Points**: `.claude/pain-points/active-pain-points.md`
**Commands**: `/focus`, `/investigate`, `/brainstorm-design`, `/plan-as-group`

---

## Important Reminders
Do what is asked; nothing more, nothing less.
Verify assumptions before acting.
Parallelize independent work.
