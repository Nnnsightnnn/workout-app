# BACKLOG Execution Plan

Phased plan to complete `BACKLOG.md`. Each phase is **self-contained** and can be picked up by a different contributor / agent. Run `node build.js && node test-v3.js` after every phase. All 36 existing tests must stay green.

---

## Status of pre-existing backlog items

Verified before planning (do not redo):

- ✅ **All 3 "Known Test Failures"** actually pass (36/36 green). Stale entries.
- ✅ **Onboarding back/next navigation** — already implemented at `src/js/23-onboarding.js:327` (back button), `:343` (back handler), `:346` (continue handler).
- ✅ **Glossary X button** — already implemented at `src/js/04f-glossary.js:159` and `:179` using `.icon-btn` + `closeSheet()`.
- ✅ **No hard age-range filtering exists** in the codebase. Age only nudges template recommendation in `getRecommendedTemplate()` (`src/js/23-onboarding.js:157`). Soft gate, not hard filter.
- ✅ **`measurements[]` array already exists** per user (`src/js/06-state-storage.js:43`); UI just doesn't expose extra metrics yet.
- ✅ **Per-block preview already renders** at `src/js/10-render-workout.js:136-168`; backlog wants a NEW full-day summary in addition.
- ✅ Current `APP_VERSION = 4` (`src/js/06a-version.js:4`). Plan bumps to **5** with one combined migration covering Phases 3 + 4.

---

## Sequencing

Phases are ordered so file edits are **disjoint** wherever possible. Multiple phases append to `src/styles.css`, but each uses a clearly-labeled section header so there is no overlap.

| # | Phase | Primary files | Risk |
|---|---|---|---|
| 1 | BACKLOG cleanup | `BACKLOG.md` | Trivial |
| 2 | Schema bump → v5 ✅ | `06a-version.js`, `06b-migrations.js`, `06-state-storage.js` | Low |
| 3 | Onboarding (day-of-week + age) | `23-onboarding.js`, `styles.css` | Low |
| 4 | Multi-metric measurements ✅ | `18-body-weight.js`, `styles.css` | Low |
| 5 | Equipment tags on exercises | `01-exercise-library.js` | Mechanical |
| 6 | Workout preview screen ✅ | `10-render-workout.js`, `13-start-finish.js`, `styles.css` | Medium |
| 7 | Custom program builder + filters | new `24-program-builder.js`, `19-program-picker.js`, `05-program-templates.js`, `styles.css` | Large |

Phases 5 and 6 are independent and can be done in parallel by separate contributors. Phase 7 depends on Phase 5.

---

## Phase 1 — BACKLOG cleanup

**Goal:** Remove stale entries.

**Edit `BACKLOG.md`:**
- Delete the entire **"Known Test Failures"** section (all 3 entries pass).
- Delete **"Onboarding navigation"** (item 1) — implemented.
- Delete **"Glossary X button"** (item 3) — implemented.
- Renumber remaining "Up Next" items 1–6.

**Acceptance:**
- `BACKLOG.md` reflects reality.
- `node build.js && node test-v3.js` → still 36/36 green.

---

## Phase 2 — Schema bump to v5 ✅ COMPLETE

**Goal:** One migration that covers the additive fields introduced by Phases 3 and 4.

**Edit `src/js/06a-version.js`:**
- `const APP_VERSION = 5;` (was 4).

**Edit `src/js/06b-migrations.js`:**
- Append a v5 migration:
  ```js
  {
    version: 5,
    description: "Add onboarding.selectedDays; measurements stay additive (no field rename)",
    migrate(store) {
      if (store.onboarding && store.onboarding.selectedDays === undefined) {
        store.onboarding.selectedDays = null;
      }
      // measurements[] is additive — old {date, weight} entries stay valid.
      // No per-entry rewrite needed.
      return store;
    }
  }
  ```

**Edit `src/js/06-state-storage.js` `loadStore()`:**
- After existing `if (s.onboardingDismissedAt === undefined) ...`, add:
  ```js
  if (s.onboarding && s.onboarding.selectedDays === undefined) s.onboarding.selectedDays = null;
  ```

**Acceptance:**
- `node build.js && node test-v3.js` → 36/36 green.
- In browser console: an existing v4 blob loads, migrates, and saves with `_schemaVersion: 5`. `restorePreMigrationBackup()` still works as escape hatch.

---

## Phase 3 — Onboarding: day-of-week + age rethink ✅ DONE (2026-04-16)

Shipped: new `selectedDays` step (multi-select chip grid, skippable, persists to `s.onboarding.selectedDays`); age step retitled "Age range (optional)" with `skippable: true` and neutral sub-labels; `_buildHandoffReasons()` 40+ reason rephrased as informational. CSS: added `.ob-options.ob-chips` auto-fit grid in `src/styles.css`. Tests 36/36 green.

**Goal:** New optional day-of-week step; age step becomes informational/skippable.

### Day-of-week selector

**Edit `src/js/23-onboarding.js`:**
- Insert new step in `ONBOARDING_STEPS` immediately **after** the `days` step (currently lines 68–79):
  ```js
  {
    id: "selectedDays",
    title: "Which days work for you?",
    subtitle: "Pick the days you can train. We'll auto-pick if you skip.",
    type: "multi",
    skippable: true,
    layout: "grid",
    options: [
      { value: "mon", label: "Mon", icon: "M", sub: "" },
      { value: "tue", label: "Tue", icon: "T", sub: "" },
      { value: "wed", label: "Wed", icon: "W", sub: "" },
      { value: "thu", label: "Thu", icon: "T", sub: "" },
      { value: "fri", label: "Fri", icon: "F", sub: "" },
      { value: "sat", label: "Sat", icon: "S", sub: "" },
      { value: "sun", label: "Sun", icon: "S", sub: "" }
    ]
  }
  ```
- In `_obSelect()` (line 364), the existing multi-select branch (lines 372–383) handles this fine — just make sure the `"none"` exclusivity logic doesn't trigger (no option has value `"none"`, so it's already skipped).
- Optional UX polish: in `_renderObStep()` continue button, if `step.id === "selectedDays" && (_obAnswers.selectedDays?.length || 0) !== _obAnswers.days`, show a non-blocking hint ("Pick {N} days") but still allow continue.
- `saveOnboarding()` (line 240) already does `{ ...answers }`, so `selectedDays` will persist automatically.

### Age step rethink

**Edit `src/js/23-onboarding.js`:**
- Age step (lines 111–120):
  - Change `title` to `"Age range (optional)"`.
  - Add `skippable: true`.
  - Reword sub-labels to neutral framing:
    - `"under30"`: `"High volume, fast recovery"` → `"Generally faster recovery"`
    - `"30to40"`: `"Prime performance window"` → `"Balanced training capacity"`
    - `"40plus"`: `"Recovery-focused training"` → `"Recovery may benefit from extra attention"`
- `getRecommendedTemplate()` (line 157): leave the `if (a.age === "40plus")` branch as-is — it falls through correctly when `a.age` is undefined (skipped).
- `_buildHandoffReasons()` (line 422): change the 40+ message to neutral language: `"You mentioned 40+ — this template includes recovery-friendly programming"`. Drop the implied "you need this".

### CSS

**Append to `src/styles.css`:**
```css
/* === Day-of-week chips (onboarding) === */
.ob-options.ob-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  gap: 8px;
}
```
(The day-of-week step uses `layout: "grid"` so existing `.ob-grid` styles apply. Verify in browser; if existing grid is too wide, this rule shrinks chips. Skip the rule if existing `.ob-grid` already looks good.)

**Acceptance:**
- Walk onboarding fresh: after "How many days/week", new "Which days work for you?" step appears; multi-select; skippable.
- Age step shows "(optional)" in title; can be skipped.
- Handoff reasons read as informational, not prescriptive.
- `loadStore()` after onboarding shows `s.onboarding.selectedDays` is an array (or `null` if skipped).
- Tests green.

---

## Phase 4 — Multi-metric measurements tracking ✅

**Goal:** Track body fat %, arms, chest, waist, neck, thighs, hips alongside weight.

**Edit `src/js/18-body-weight.js`:**
- `logMeasurement()`: read all fields from inputs; build entry with only fields where the user entered a value. Always include `weight` (existing UX). Other fields: `bodyFat`, `arms`, `chest`, `waist`, `neck`, `thighs`, `hips`.
- `renderBodySection()`:
  - Keep the prominent weight display + sparkline at the top (current behavior).
  - Replace the single input row with: weight input + `[+ More measurements]` toggle. When expanded, reveal the optional fields in a compact grid.
  - Below the weight history, render mini-sparklines for each metric that has ≥2 logged values. Use a small label and the same orange line style.
- Generalize `drawSparkline()`:
  - Add a `metricKey` parameter (default `"weight"`).
  - Add a `canvasId` parameter so we can have multiple canvases.
  - Filter `data` to entries where `entry[metricKey] != null`.
  - Update unit label: weight uses `state.unit`; bodyFat uses `%`; lengths use `state.unit === "lbs" ? "in" : "cm"`.
- History list: each row shows date + a compact summary (e.g., `175 lbs · 14% · 14.5"` only including tracked fields).

**Append to `src/styles.css`:**
```css
/* === Multi-metric measurements === */
.body-more-toggle { /* chunky chip-style button to expand inputs */ }
.body-more-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.body-metric-card { /* card + small sparkline label */ }
```
(Use existing chunky-button language: 14px radius, 2px border, `0 3px 0` shadow.)

**Acceptance:**
- Log a weight-only entry → weight sparkline updates (existing behavior).
- Log a multi-metric entry → metric-specific mini sparklines appear for each tracked metric with ≥2 entries.
- Old `{date, weight}` rows still render (no error from missing fields).
- Tests green.

---

## Phase 5 — Equipment tags on exercises (mechanical data work)

**Goal:** Add `equipment: [...]` to every entry in `LIBRARY` so Phase 7 builder can filter.

**Edit `src/js/01-exercise-library.js`:**
- Near `CATEGORIES` (line 4), add canonical tag list:
  ```js
  const EQUIPMENT_TAGS = [
    "barbell","dumbbell","kettlebell","cable","machine",
    "bodyweight","bands","bench","rack","pullup_bar",
    "box","sandbag","medball","sled"
  ];
  ```
- Add `equipment: [...]` to every `LIBRARY` entry. Tagging heuristics:
  - Name starts with **"Barbell"** or is a barbell lift (Back Squat, Bench Press, Deadlift, Press, Row, etc.) → `["barbell"]` plus `["rack"]` if it requires a rack and `["bench"]` if it requires one.
  - **"DB ..."** or "Dumbbell ..." → `["dumbbell"]` (+ `["bench"]` if benched).
  - **"KB ..."** or "Kettlebell ..." → `["kettlebell"]`.
  - **"Cable ..."** → `["cable"]`.
  - Push-Up, Pull-Up, Dip, Plank, Hollow Hold, etc. → `["bodyweight"]` (+ `["pullup_bar"]` for Pull-Up; + `["bench"]` for Dip if applicable).
  - "Band ..." → `["bands"]`.
  - Step-Up, Box Jump → `["box"]` (+ `["bodyweight"]` if no weight).
  - Sandbag, Med Ball, Sled, Trap Bar → corresponding tag.
  - Any machine-specific name (Leg Press, Lat Pulldown, Leg Extension, Hamstring Curl, etc.) → `["machine"]` (+ `["cable"]` for cable-driven machines).
- **Defensive contract:** code in Phase 7 should treat a missing/empty `equipment` as "always pass the filter" so we don't lose exercises if any are missed.

**Acceptance:**
- Every `LIBRARY` entry has `equipment: [...]` (run `grep -c 'equipment:' src/js/01-exercise-library.js` and compare to the `id:` count for `LIBRARY` entries).
- Spot-check 5 random entries for plausible tags.
- Tests green.

---

## Phase 6 — Workout preview screen (full-day summary) ✅ Complete

**Goal:** Before jumping into the focus view, show a read-only summary of the entire day so the user knows what's coming.

**Edit `src/js/13-start-finish.js`:**
- Currently `startWorkout()` (line 4) immediately sets `state.workoutView = "focus"` and renders. Replace this entry-point: rename existing function to `_beginWorkoutFocus()` (private). Add a new public `startWorkout()` that sets `state.workoutView = "preview"` and renders.
- The preview screen's "Start" CTA calls `_beginWorkoutFocus()` (which sets `workoutView = "focus"` and runs the original logic — `ensureDraft()`, find first incomplete block, start session timer, show the random quote toast, render).

**Edit `src/js/10-render-workout.js`:**
- Add a branch to the main render switch for `state.workoutView === "preview"`. New `renderDayPreview()` function:
  - Header: day name + total estimated duration (sum of `block.exercises.length * (rest + ~30s)` if you want; otherwise just block count + exercise count).
  - For each block: title (`A: Squat`), then a list of exercises with `name · sets×reps · muscles[]`.
  - Re-use `renderBlockPreview()` (line 347) — it already renders a block's exercises in a bento grid.
  - Show warmup at the top and `renderCooldownPreview()` (line 410) at the bottom.
  - Bottom-fixed CTA: chunky "Start Workout" button calling `_beginWorkoutFocus()`.
  - Secondary "Back" button to return to chapters view (`state.workoutView = "chapters"`; render).

**Append to `src/styles.css`:**
```css
/* === Workout preview screen === */
.preview-screen { padding-bottom: 96px; /* room for fixed CTA */ }
.preview-cta-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px; background: var(--bg-base); border-top: 2px solid var(--bg-card-2); }
.preview-start-btn { /* chunky button: 16px padding, 18px radius, var(--pillow-accent) shadow */ }
```

**Acceptance:**
- Pick a day, tap Start → see full preview listing every block + exercise.
- Tap "Start Workout" CTA → focus view appears, session timer starts, quote toast fires.
- Tap "Back" from preview → returns to chapters view, no session started.
- Tests green.

---

## ~~Phase 7 — Custom program builder + Equipment/muscle filters~~ ✅ Done 2026-04-16

**Goal:** Multi-step flow to build a program from scratch, with dual filters powered by Phase 5 data.

### Sentinel template

**Edit `src/js/05-program-templates.js`:**
- Append:
  ```js
  { id: "custom", name: "Custom Program", description: "Built by you", daysPerWeek: 0, totalWeeks: 10, minWeeks: 4, maxWeeks: 16 }
  ```
- This keeps `PROGRAM_TEMPLATES.find(t => t.id === u.templateId)` lookups in `renderProgramPicker()` from returning undefined.

### Builder file

**Create `src/js/24-program-builder.js`** (numeric prefix sets load order to last):

Top-level state:
```js
let _builderState = null; // { name, daysPerWeek, totalWeeks, days: [ { id, name, blocks: [ { id, letter, name, exercises: [...] } ] } ] }
```

Public entry: `openProgramBuilder()`. Multi-step wizard inside the bottom sheet.

**Step 1 — Setup:**
- Inputs: name (text), days/week (chips 2–6), total weeks (chips 4/8/10/12).
- Re-use the chip pattern from `openDurationPicker()` (`19-program-picker.js:78-133`).
- "Next →" creates `_builderState.days = Array.from({length: daysPerWeek}, (_, i) => ({ id: i+1, name: "Day " + (i+1), blocks: [] }))`.

**Step 2 — Day list:**
- Show every day as a row with name + block count + "+" to edit.
- Each row → opens Step 3 for that day.
- "Save Program" CTA — disabled until every day has ≥1 block with ≥1 exercise.
- "← Back" returns to Step 1.

**Step 3 — Block editor (per day):**
- Show existing blocks; "+ Add Block" appends `{ id: "b" + Date.now(), letter: nextLetter(), name: "Block " + letter, exercises: [] }`.
- Each block row → opens Step 4 to add exercises; trailing trash icon to delete block.
- "Done" returns to Step 2.

**Step 4 — Exercise picker (per block):**
- **Equipment chips** (multi-select) populated from `EQUIPMENT_TAGS`.
- **Muscle chips** (multi-select) populated from `Array.from(new Set(LIBRARY.flatMap(e => e.muscles))).sort()`.
- Filter logic:
  ```js
  const eqSel = ...; // selected equipment tags
  const mSel = ...; // selected muscle groups
  const filtered = LIBRARY.filter(e => {
    if (eqSel.size && (!e.equipment || !e.equipment.some(t => eqSel.has(t)))) return false;
    if (mSel.size  && !e.muscles.some(m => mSel.has(m))) return false;
    return true;
  });
  ```
  Empty selection in either dimension = no filter on that dimension. Missing `equipment` field on an exercise → passes the equipment filter (defensive contract from Phase 5).
- Tapping an exercise appends:
  ```js
  {
    exId: e.id, name: e.name, muscles: e.muscles,
    cat: e.cat,
    sets: e.defaultSets, reps: e.defaultReps,
    defaultWeight: e.defaultWeight, rest: e.defaultRest,
    bodyweight: !!e.bodyweight, perSide: !!e.perSide
  }
  ```
- "Done" returns to Step 3.

**Save:**
```js
function saveCustomProgram() {
  const b = _builderState;
  updateUser(u => {
    u.templateId = "custom";
    u.program = b.days.map(d => ({ id: d.id, name: d.name, sub: "", blocks: d.blocks }));
    u.daysPerWeek = b.daysPerWeek;
    u.totalWeeks = b.totalWeeks;
    u.currentWeek = 1;
    u.programStartDate = Date.now();
    u.weeklySchedule = null;
    u.draft = null;
    u.lastDoneDayId = null;
  });
  _builderState = null;
  closeSheet();
  renderProgramPicker();
  renderWorkoutScreen();
  showToast("Custom program saved", "success");
}
```

### Picker entry point

**Edit `src/js/19-program-picker.js`:**
- In `openProgramPicker()` (line 30), add a top tile:
  ```js
  html += '<div class="tpl-option custom-builder-tile" onclick="closeSheet();openProgramBuilder()"><div class="tpl-head"><div class="tpl-badge">+</div><div class="tpl-name">Build Your Own</div></div><div class="tpl-desc">Pick days, blocks, and exercises yourself.</div></div>';
  ```
  Insert this **before** the existing `PROGRAM_TEMPLATES.forEach(...)` loop and **after** the glossary button.
- Filter `PROGRAM_TEMPLATES.forEach` to skip `id === "custom"` so the sentinel doesn't appear as a normal option.

### CSS

**Append to `src/styles.css`:**
```css
/* === Custom program builder === */
.custom-builder-tile { /* chunky outline tile with + badge */ }
.builder-step { padding: 12px; }
.builder-day-row, .builder-block-row { /* chunky row with name + meta + actions */ }
.builder-filter-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.builder-filter-chip { /* small chunky chip with selected state */ }
.builder-ex-row { /* compact exercise row with name, muscles, sets×reps */ }
```

**Acceptance:**
- Open program picker → "Build Your Own" tile appears.
- Walk through: setup → days → blocks → exercise picker.
- In exercise picker, select "barbell" equipment chip → only barbell exercises remain. Add "back" muscle chip → only barbell exercises that hit back remain.
- Save → program loads as the active program. Day picker shows custom days. Workout starts normally.
- `node build.js && node test-v3.js` → green.

---

## Final verification

```bash
cd /Users/kenny/workout-app && node build.js && node test-v3.js
```
- 36/36 tests green.
- Open `workout-app.html` in a mobile browser. Manual smoke test: onboarding → save → choose day → preview → start workout → finish → log measurements → switch to custom program builder → save → run a custom workout.

---

## Reused utilities (do not reinvent)

- `updateUser()` / `saveStore()` — `src/js/06-state-storage.js:143`
- `openSheet()` / `closeSheet()` — `src/js/12-bottom-sheet.js`
- `.icon-btn`, `.ob-option`, `.ob-continue-btn`, `.schedule-day-btn` — chunky button styles in `src/styles.css`
- `drawSparkline()` — generalize for multi-metric in Phase 4
- `renderBlockPreview()` (`src/js/10-render-workout.js:347`) and `renderCooldownPreview()` (`:410`) — reuse for Phase 6 preview screen
- Day/week chip pattern in `openDurationPicker()` (`src/js/19-program-picker.js:78-133`) — reuse for Phase 7 setup step
- `LIB_BY_ID` and `LIBRARY` from `src/js/01-exercise-library.js` for Phase 7 picker

---

## Critical guard rails (from `CLAUDE.md`)

- **[ARCH-00005]** Run `node build.js` after editing `src/` files, before testing or committing.
- **[DESIGN-00001]** Chunky/bubbly UI: 14px+ radius, 2px borders, `0 3px 0` offset shadows, `translateY(3px)` on press.
- **[DATA-00001]** Storage key `kn-lifts-v3` is sacred — never change.
- **[DATA-00002]** Always go through `updateUser()` → `saveStore()`.
- **[DATA-00004]** Schema changes require a migration in `06b-migrations.js` + bump `APP_VERSION`. (Phase 2 handles this once.)
- **[VERIFY-00002]** `node build.js && node test-v3.js` after every modification.
