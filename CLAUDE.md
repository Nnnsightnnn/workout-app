# Claude Context — K&N Lifts Workout App

Essential project context. Full details in `.claude/specs/`.

## Tech Stack
HTML5 • CSS3 (variables, flexbox, grid) • Vanilla JS (ES6+) • LocalStorage • Web Audio API • Vibration API

**Zero external dependencies.** No CDN imports, no npm packages. Fully self-contained.

## Project Structure
`workout-app.html` - **Entire application** (2385 lines: CSS + HTML + JS inline)
`test-v3.js` - Test harness (jsdom-based, 11 workflow tests)
`CLAUDE.md` - This file
`README.md` - User-facing documentation
`.claude/` - Context system (specs, memory, commands, skills)

## Architecture (Single-File)
All code lives in `workout-app.html`. Sections are separated by comment headers:
- **EXERCISE LIBRARY** (line 801) — 86 exercises across 9 categories
- **DEFAULT PROGRAM** (line 890) — 5-day program template
- **STATE / STORAGE** (line 1009) — LocalStorage persistence (`kn-lifts-v3`)
- **DAY ROTATION** (line 1121) — Auto-advance workout days
- **INPUT DRAFT** (line 1141) — Auto-save in-progress workouts
- **PROGRAM EDITING** (line 1196) — Mutate user programs
- **RENDER: Workout** (line 1226) — Main UI rendering
- **BOTTOM SHEET** (line 1470) — Modal pickers and menus
- **START / FINISH** (line 1749) — Workout lifecycle, PR detection
- **TIMERS** (line 1848) — Rest timer with audio/haptics
- **HISTORY** (line 1949) — Session list, donut chart
- **TOOLS** (line 2049) — Plate calculator, 1RM estimator
- **INIT** (line 2130) — Entry point, event wiring

## Data Flow
`state` → render functions → user input → `updateUser()` → `saveStore()` → re-render

## Storage
- **Key**: `kn-lifts-v3` in LocalStorage
- **Schema**: `{ unit, users[], currentUserId }`
- **Per user**: `{ id, name, program[], sessions[], draft, lastDoneDayId }`

---

## Critical Guard Rails

### Architecture [ARCH]
**[ARCH-00001]** Single-file app — all code stays in `workout-app.html`
**[ARCH-00002]** Zero dependencies — no external libraries or CDN imports
**[ARCH-00003]** Use section comment headers when adding new code sections
> TRIGGER: When adding features or refactoring

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
**[VERIFY-00002]** Run `test-v3.js` after modifications: `node test-v3.js`
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
