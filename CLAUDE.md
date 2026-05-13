# Claude Context — K&N Lifts Workout App

Essential project context.

## Tech Stack
HTML5 • CSS3 (variables, flexbox, grid) • Vanilla JS (ES6+) • LocalStorage • Web Audio API • Vibration API

**Zero external dependencies.** No CDN imports, no npm packages. Fully self-contained.

## Project Structure
```
src/
  template.html            ← HTML skeleton with {{FONTS}}, {{CSS}}, {{JS}} placeholders
  styles.css               ← All CSS (paper-skin block scoped under body[data-skin="paper"])
  js/
    01-exercise-library.js ← CATEGORIES, LIBRARY, LIB_BY_ID
    02-default-program.js  ← mkSets(), DEFAULT_PROGRAM
    03-jbrown-program.js   ← JBROWN_PROGRAM
    04-filly-program.js    ← FILLY_PROGRAM
    05-program-templates.js← PROGRAM_TEMPLATES
    06-state-storage.js    ← state, loadStore, saveStore, userData, updateUser
    06a-version.js         ← APP_VERSION (schema int), APP_BUILD (build hash)
    06b-migrations.js      ← MIGRATIONS[], runMigrations(), restorePreMigrationBackup()
    06c-import.js          ← importData(), validateImportData()
    07-day-rotation.js     ← determineDefaultDay(), getCurrentDay()
    08-input-draft.js      ← getDraft, ensureDraft, saveInput
    09-program-editing.js  ← mutateDay, resetCurrentDay, resetAllProgram
    10-render-workout.js   ← renderWorkoutScreen and sub-renderers; paper dispatch at top
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
    23-paper-skin.js       ← PAPER tokens, primitives (Checkbox/Strike/Stamp/MarginNote/
                              Tape/TornEdge), applyPaperSkin(), Notebook Style picker
    24-paper-render.js     ← Flat-notepad render path: paperRenderBlock, paperRender-
                              Exercise, paperRenderSetsTable, paperWireSetRow,
                              paperRenderDayPicker, paperBuildDayCard, paperRebuild-
                              BottomNav, paperUpdateActiveNavTab
build.js                   ← Build script (zero deps, Node.js built-ins only)
workout-app.html           ← BUILD OUTPUT (single-file distributable)
index.html                 ← Redirect → workout-app.html (for GitHub Pages)
test-v3.js                 ← Test harness (jsdom-based, 16 workflow tests)
.github/workflows/pages.yml ← GitHub Pages auto-deploy on push to main
BACKLOG.md                 ← Known issues, bugs, and planned work
CLAUDE.md                  ← This file
README.md                  ← User-facing documentation
```

## Architecture
Source code lives in `src/`. Run `node build.js` to produce the single-file `workout-app.html`.
Numeric prefixes on JS files enforce concatenation order (alphabetical sort = dependency order).
All JS shares global scope — no module system, same as a single `<script>` tag.

## Fonts & Assets
Custom fonts (Oswald, JetBrains Mono) are **inlined at build time** — base64-encoded into the HTML. No CDN, no external requests.
- **Font files**: `mockups/fonts/*.woff2` (gitignored, downloaded via `node mockups/download-fonts.js`)
- **Font CSS**: `mockups/fonts/fonts.css` — `build.js` extracts Latin-only `@font-face` blocks and inlines them
- **CSS variables**: `--font-display` (Oswald) for headings/titles, `--font-mono` (JetBrains Mono) for numbers/timers
- **Graceful fallback**: if fonts aren't present, build succeeds with system fonts only
- **S3 asset infra** (for future images/textures): `mockups/infra/template.yaml` (SAM), `mockups/manage-assets.js` (CLI), `mockups/config.json` (bucket config). Assets download at build time and inline — never served to users directly.
- To add/change fonts: edit `mockups/download-fonts.js` URL → run it → `node build.js`

## Data Flow
`state` → render functions → user input → `updateUser()` → `saveStore()` → re-render

## Storage
- **Key**: `kn-lifts-v3` in LocalStorage
- **Schema**: `{ _schemaVersion, unit, users[], currentUserId }`
- **Per user**: `{ id, name, templateId, program[], sessions[], measurements[], draft, lastDoneDayId }`

## Hosting & Deploy
- **Live URL**: https://nnnsightnnn.github.io/workout-app/
- **Hosting**: GitHub Pages, auto-deploys from `main` branch via `.github/workflows/pages.yml`
- **Deploy workflow**: Edit `src/` → `node build.js` → commit → push to `main` → live in ~15s
- **User upgrade path**: Users open the URL (or their home screen shortcut) — they always get the latest code. localStorage persists across deploys since the origin stays the same.

## Schema Migrations
When changing the data schema (adding/renaming/removing fields in stored data):
1. Add a migration to `MIGRATIONS[]` in `src/js/06b-migrations.js`
2. Bump `APP_VERSION` in `src/js/06a-version.js` to match
3. Add a defensive default in `loadStore()` in `06-state-storage.js` as safety net
4. `node build.js && node test-v3.js`

Migrations run automatically on app load when stored `_schemaVersion` < `APP_VERSION`.
Pre-migration data is auto-backed up to `kn-lifts-backup-premigration` in localStorage.
Recovery from console: `restorePreMigrationBackup()`

---

## Critical Guard Rails

### Architecture [ARCH]
**[ARCH-00001]** Source code lives in `src/` (CSS, HTML template, JS modules). Run `node build.js` to produce the single-file `workout-app.html` distributable. The output must remain a single self-contained HTML file.
**[ARCH-00002]** Zero dependencies — no external libraries or CDN imports
**[ARCH-00003]** Use section comment headers when adding new code sections. New JS files use numeric prefix to set load order (e.g. `23-new-feature.js`).
**[ARCH-00004]** Shareable by design — the built `workout-app.html` must work when someone receives the file and opens it in a mobile browser. No server required, no external assets.
**[ARCH-00005]** Always run `node build.js` after editing `src/` files, before testing or committing.
> TRIGGER: When adding features or refactoring

### Design Language [DESIGN] — Paper Notepad
**[DESIGN-00001]** The app is skinned as a paper notepad. Cream paper, ruled (or dot / graph) backgrounds, fiber-noise + vignette overlays, handwriting + typewriter typography, hand-drawn SVG primitives. The previous chunky-bubbly aesthetic has been replaced — do not author new chrome with rounded corners, offset shadows, or pillow-press states. When adding any UI, match the paper layout: flat lines on paper, no cards, no chips, no `box-shadow: 0 3px 0` pillows.

**Paper skin is unconditional.** `body[data-skin="paper"]` is set at boot by `applyPaperSkin()` in `23-paper-skin.js`. There is no toggle; the user can only swap sub-options (paper rule, ink color, hand font) via the "Notebook style" picker in Settings.

**Color & type tokens** (defined in CSS variables on `body[data-skin="paper"]`):
- `--paper-bg` = `#f4ecd3` (cream)
- `--paper-bg-deep` = `#ead9ac` (cream-deep, used for bottom nav)
- `--paper-rule` = `rgba(40, 80, 150, 0.18)` (ruled-line color)
- `--paper-margin` = `rgba(190, 60, 60, 0.55)` (red left-margin line)
- `--paper-ink` resolves from `data-paper-ink`: `blue` (#1e3a72), `black` (#1a1612), `pencil` (#5a534a), `red` (#a83a2a)
- `--paper-ink-soft` = rgba variant of ink at 0.78 opacity (used for secondary text / target specs)
- `--paper-ink-faint` = `rgba(40, 30, 15, 0.55)` (typewriter labels, kickers)
- `--paper-ink-mist` = `rgba(40, 30, 15, 0.30)` (dotted dividers)
- `--paper-red` = `#a83a2a` (rubber-stamp red — used for primary CTAs, "now" / margin notes / Stamp components)
- `--paper-marker` / `--paper-marker-soft` = `#f4d33a` / 50% — highlighter yellow
- `--paper-postit` = `#ffe48a`
- `--paper-hand` resolves from `data-paper-hand`: Kalam / Caveat / Patrick Hand / Shadows Into Light (default). Used for body text, exercise names, set numbers.
- `--paper-form` = `"Special Elite", "Courier Prime", monospace`. Used for kickers, labels, all-caps headers, set indices, RPE labels.

**Primitives** (from `23-paper-skin.js` — return HTML strings, callers `innerHTML +=`):
- `paperRoughenDefs()` — injects the `<filter id="paper-roughen">` turbulence+displacement once at boot. SVG strokes can reference `style="filter:url(#paper-roughen);"` for the hand-drawn wobble.
- `paperCheckboxSvg(checked, ink, size)` — wobbly square; ink X when checked.
- `paperStrikeWrap(html, ink)` — wraps text in a wavy strikethrough (use for completed sets).
- `paperStamp(text, color, angle)` — rubber-stamp pill (Special Elite caps, 2.5px border, rotated, low opacity, inset shadow). Use for PR badges, "Active", "All-time", etc.
- `paperMarginNote(text, ink)` — scribbled arrow + handwritten note, rotated -2°, red ink. Use for exercise notes.
- `paperTape(opts)` — washi tape strip.
- `paperTornEdge(side, color)` — torn paper edge for top/bottom of cards (used in PaperNav).

**Flat-DOM render path** (`24-paper-render.js`):
- `renderChaptersView` (the active-workout overview) and `renderDayPicker` (the today's-workout selector) both delegate to paper renderers when paper skin is active.
- `paperRenderBlock` → emits `.paper-block` with `.paper-superset-label` ("A · Strength" left, "rest 2:00" right, typewriter caps) and one `.paper-exercise` per ex.
- `paperRenderExercise` → emits `.paper-exercise-head` ("A1) Back Squat" handwritten + right-aligned target spec) followed by `.paper-set-list`.
- `paperRenderSetsTable` → indented `.paper-set-row` elements: `idx. ☐ weight × reps ... RPE n`. No card, no chip, no offset shadow — just the line.
- `paperWireSetRow` — wires interaction to a `.paper-set-row`: checkbox tap → toggle done, swipe right → done, swipe left → skipped, row tap → openSetEditor, span tap → openInlineEditor.
- `paperRenderDayPicker` / `paperBuildDayCard` — flat day cards. Hero day = big handwritten name + small-caps subtitle + flat metric grid + dashed expand panel + red "Start workout" stamp button.

**Layout rules:**
- No `border-radius` on content elements. Cards/dividers/inputs are square.
- No `box-shadow: 0 3px 0` pillows. Shadows OK on stamp-style buttons (`2px 3px 0`) for the "ink pressed firmly" effect, but never on flat cards.
- Dotted (`1px dotted`) or dashed (`1px dashed`) borders for dividers; solid `1.2px–1.6px` for emphasis. Always ink color, never neon.
- Body text uses `--paper-hand` (handwriting). Labels, kickers, set indices, RPE labels, units, all-caps section headers use `--paper-form` (typewriter, letter-spacing 0.16–0.20em, lowercase or uppercase).
- Tap targets remain ≥44px even though there's no chunky chrome — use padding to expand the hit area around handwritten text.
- Active states: subtle yellow highlighter wash (`var(--paper-marker-soft)`) on inputs / pressed steppers; never blue glow.

**Adding new UI:**
1. Define a flat DOM shape that resembles a notebook row. Examples to copy from: `.paper-set-row`, `.paper-day-card`, `.paper-superset-label`.
2. Use `--paper-hand` for content and `--paper-form` for chrome labels.
3. For primary CTAs, use the rotated red-stamp pattern (see `.paper-start-stamp` or `.paper-stamp-btn`).
4. For secondary CTAs, use a 1.4px solid-ink border, no background, no border-radius.
5. Scope ALL new styles under `body[data-skin="paper"]`. Never write CSS that assumes the chunky look — there is no chunky look anymore.
6. Use the SVG `paper-roughen` filter on any decorative line (`filter: url(#paper-roughen)` or `style="filter:url(#paper-roughen);"`).

**In-app theming:** Settings → "Notebook style" picker switches `--paper-rule` (Ruled / Dot / Graph), `--paper-ink` (Blue / Black / Pencil / Red), and `--paper-hand` (Kalam / Caveat / Patrick / Loose) live, persisted as `paperRule` / `paperInk` / `paperHand` per user. There is no on/off toggle.

**Spec source of truth:** `/tmp/design-bundle/workout-app-notepad-look/` contains the full design bundle — `paper.jsx`, `paper-screens.jsx`, `paper-other-screens.jsx`. Read those when in doubt; they're the authoritative pixel-spec.
> TRIGGER: When adding or styling any new UI, anywhere in the app

### Data [DATA]
**[DATA-00001]** Storage key is `kn-lifts-v3` — never change. Schema version lives inside the data as `_schemaVersion`.
**[DATA-00002]** Always go through `updateUser()` → `saveStore()` for persistence
**[DATA-00003]** Deep clone with `deepClone()` (JSON round-trip) when copying objects
**[DATA-00004]** Schema changes require a migration in `06b-migrations.js` + bump `APP_VERSION` in `06a-version.js`. See "Schema Migrations" section above.
> TRIGGER: When modifying data layer

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

---

## Backlog [BACKLOG]
**[BACKLOG-00001]** Known issues, bugs, and planned work are tracked in `BACKLOG.md` at the project root. Check it before starting work to avoid duplicating effort or missing context on known failures.
**[BACKLOG-00002]** When discovering new bugs or test failures, add them to `BACKLOG.md` rather than leaving them undocumented. Remove entries when resolved.
> TRIGGER: When encountering test failures, bugs, or planning new work

---

## Important Reminders
Do what is asked; nothing more, nothing less.
Verify assumptions before acting.
Parallelize independent work.
