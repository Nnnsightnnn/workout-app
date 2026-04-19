# Feature Spec: Workout Export & Print

**Status:** Draft — for review before implementation  
**Author:** Kenny  
**Date:** 2026-04-19

---

## 1. Problem Statement

Users need a way to take their workout plan out of the app — either to the gym floor (no phone screen required), or to share/archive the program they're running. Two distinct jobs-to-be-done:

| Use Case | User Need | Output Required |
|---|---|---|
| **Gym floor** | Quick scan between sets; no phone interaction | Single-day print, one page, scannable |
| **Share / Archive** | Send to a training partner; save the program as written | Full program export; readable reference doc |

---

## 2. Recommended Export Mechanism: Browser Print → PDF

**Recommendation: `window.print()` with print-specific CSS.**

Rationale:
- **Zero dependencies** — consistent with the project's zero-dep constraint. No jspdf, no pdfkit.
- **Free on mobile and desktop** — iOS Share Sheet includes "Print" (AirPrint) and "Save to Files" (PDF); Android Chrome has "Save as PDF". 
- **Already works** — the browser handles pagination, paper size, margins. We write CSS, not a PDF renderer.
- **No server** — the app is fully offline-capable; a server-rendered PDF would break that.
- **Web Share API** is a good complement for the single-day case on mobile (share the HTML/text snippet via iMessage, WhatsApp, etc.) but is optional and can come later.

**Rejected alternatives:**
- `jspdf` / `pdfkit` — adds a dep (hundreds of KB), complex to maintain, adds no user value over browser print.
- HTML/CSV download — useful for data portability (already covered by existing export), not for readable gym sheets.
- Server-side rendering — no server, rejected by ARCH-00004.

---

## 3. Single-Day Print Layout

### What to show

```
K&N LIFTS — [Program Name]
[Day Name]  ·  Week [N] of [N]  ·  [Phase Name]
Estimated time: [X] min
─────────────────────────────────────────────────

[Block A — Block Name]
┌────────────────────────┬──────┬──────┬───────┬──────┬──────────┐
│ Exercise               │ Sets │ Reps │ Tempo │ Rest │ Notes    │
├────────────────────────┼──────┼──────┼───────┼──────┼──────────┤
│ Back Squat             │  4   │  5   │ 3-1-1 │ 3min │ Heavy 5s │
│   Set 1: _____ × _____ RPE ___                                  │
│   Set 2: _____ × _____ RPE ___                                  │
│   Set 3: _____ × _____ RPE ___                                  │
│   Set 4: _____ × _____ RPE ___ (AMRAP if applicable)           │
└────────────────────────┴──────┴──────┴───────┴──────┴──────────┘

[Block B — Block Name]
... (same table structure)
```

### Key design decisions

- **One page target.** A typical training day is 4–6 exercises × 3–4 sets. Single page is achievable with compact row spacing. Add `page-break-inside: avoid` on blocks so a block never splits across pages.
- **Hand-log rows under each exercise** — `Sets × (weight blank) × (reps blank) RPE blank`. These are literal blank underlines printed for pen use.
- **Prescribed info visible at a glance** — sets, reps, tempo, rest period all in the header row. Coaching note (from loading scheme) shown truncated to one line.
- **Reps format** — handle the three types: numeric ("5"), time ("30s"), distance ("100m"). AMRAP gets a "+" suffix ("5+").
- **Weights column omitted from prescribed section** — the app cannot pre-fill weights (autoregulated, RPE-based). Instead: show "Last: [weight]" if a prior session exists for that exercise.
- **Warmup block** — collapsed to a bullet list (not the full table treatment). Warmup is randomized and typically not hand-logged.
- **Cooldown block** — same as warmup: bullet list only.

### Mid-workout export behavior

**Default: show prescribed (not partially-logged).**

Rationale: the print is primarily a reference card, not a session transcript. If the user is mid-workout and taps Print, they get the plan — what they should do, not what they've already done. Logged sets would be partial and confusing.

Post-workout: a future "session summary" export (separate feature) could show actual vs. prescribed. Not in MVP.

---

## 4. Whole-Program Print Layout

### Structure

```
K&N LIFTS — [Program Name]
[N] Weeks  ·  [N] Days/Week  ·  [Equipment]
─────────────────────────────────────────────────

PHASE OVERVIEW
  Accumulation   Weeks 1–3   Higher volume, moderate intensity
  Intensification Weeks 4–6  Lower volume, higher intensity  
  Peak           Weeks 7–8   Competition prep, max intensity
  Deload         Weeks 9–10  Recovery week, ~50% load

─────────────────────────────────────────────────

WEEK 1 — ACCUMULATION
  Day 1: [Day Name]
    [Block A]
      Back Squat — 4 × 5, 3-1-1 tempo, 3min rest
      "Build to heavy 5s. Leave 1–2 in reserve."
    [Block B]
      ...
  Day 2: [Day Name]
    ...

WEEK 2 — ACCUMULATION
  Day 1: [Day Name]
    [Block A]
      Trap Bar Deadlift — 4 × 5, 3-1-1 tempo, 3min rest
      ...
  ...
```

### Handling exercise rotation

Exercises rotate by `weekNum` — Week 1 gets Deadlift, Week 2 gets Trap Bar, etc. The full-program print resolves all weeks at generation time. This requires calling `resolveWeekProgram()` once per week (1 through totalWeeks) and collecting the results. See §7 (Data model implications).

### Page layout

- Each **phase** starts a new page (`page-break-before: always` on phase headers).
- Each **week** is a section within a phase — no forced page break, let natural flow.
- Each **day** within a week is a compact subsection: day name, then exercises listed as one-liners (no hand-log rows — this is a reference doc, not a logging sheet).
- **Time estimate** shown per day as `~X min`.
- **Warmup/Cooldown**: show "Dynamic warmup (randomized)" and "Cooldown stretches (randomized)" as single-line placeholders — the full exercise lists aren't useful at the program overview level.

### AMRAP notations

Where loading notes include AMRAP (e.g. "85% × 5+ AMRAP"), surface the "+" notation on the reps cell and surface the full note text.

### RPE-based autoregulation

The programs use prescribed rep counts + coaching notes (e.g. "Leave 1–2 in reserve") rather than explicit RPE targets. Print exactly what the loading scheme prescribes: reps and the note string. Do not attempt to infer or print RPE thresholds that aren't explicitly stored.

### Percentage-based loading

Some schemes note a percentage (e.g. "65% 1RM, max bar speed"). Print the note string verbatim. Concrete weights require user's 1RM data; leave a blank if not available. A future enhancement could pre-fill weights from the user's 1RM estimates.

---

## 5. Per-Program Variation

### Templates that work cleanly

Most templates (`jbrown3`, `filly4`, `hypertrophy5`, `conjugate5`, etc.) are slot-based with a defined `phaseConfig`. The phase overview + week-by-week breakdown works for all of them.

### Potential edge cases

| Scenario | Risk | Mitigation |
|---|---|---|
| Very long programs (12+ weeks) | Full print is 20+ pages | Offer "Summary view" (one row per day) vs "Detailed view" |
| Bodyweight-only user | Different exercise pool than "full" user | Export reflects *this user's* program (already filtered at generation) |
| Equipment injuries | Same — different pools | Same as above |
| Programs with no phaseConfig | No phase overview section | Show "Program Structure: [N] weeks, [N] days/week" without phase detail |
| Deload week | Low-intensity week, may feel sparse | Show deload label clearly; print as normal |
| `daysPerWeek` mismatches | Some templates support 2–6; short programs may feel repetitive | Print as-is; no special handling needed |

### Templates where naive export is least useful

- **Autoregulated / RPE-driven schemes** (like advanced conjugate): Concrete weights can't be filled in. Print is useful as a structure reference, not an absolute loading guide. Call this out in the print header: *"Loads are autoregulated — use RPE guidelines."*

---

## 6. Affordance (Where Do the Buttons Live?)

### Single-day print

**Location:** Current workout screen — inside the day header area, near the day name and estimated time. A small "Print day" icon button (printer icon) sits alongside the existing controls. Alternatively: inside the existing day overflow/options menu if one exists.

**Trigger:** `window.print()` with a print stylesheet that hides all navigation chrome and renders only the day content.

### Whole-program print

**Location:** Program picker screen / program overview screen. A "Print program" action in the program options menu (three-dot or sidebar). This is a deliberate, less-frequent action — it doesn't need to be a top-level button.

**Trigger:** Generates all weeks server-side (in-browser), builds a print DOM, opens a new tab or calls `window.print()` on a print-specific view.

---

## 7. Data Model Implications

### Single-day export

`renderWorkoutScreen()` already produces the full day DOM. The simplest implementation is a print stylesheet that hides nav and surfaces the workout DOM as-is. **No new data computation needed.**

The `getSessionBreakdown(day)` helper is available if we want to show a per-block time breakdown in the printout.

### Whole-program export

This requires generating all N weeks of the program. The app currently only generates and renders the *current* week. We need a helper:

```javascript
function resolveAllWeeks(templateId, totalWeeks, daysPerWeek) {
  var weeks = [];
  for (var w = 1; w <= totalWeeks; w++) {
    weeks.push(resolveWeekProgram(templateId, w, totalWeeks, daysPerWeek));
  }
  return weeks;
}
```

This is straightforward — `resolveWeekProgram()` is already deterministic and pure (no side effects, no storage writes). Generating 12 weeks × 5 days = 60 day-objects should be fast (< 100ms).

The phase breakdown is available from `allocatePhases(totalWeeks, config)` in `04e-periodization.js` — this can be called directly.

**No schema changes needed for MVP.** The export is read-only and derived from the existing data.

---

## 8. MVP Cutline

### MVP (shippable in ~1 day)

1. **Print-friendly CSS on the current-day view**
   - Add `@media print` rules to `styles.css` that hide nav, sidebar, bottom sheet, rest timer, and render the current day cleanly
   - A visible "Print" button on the workout day header that calls `window.print()`
   - Hand-log rows (blank lines for weight/reps/RPE) appear only in print view

2. **"Print program" action on the program picker / program overview screen**
   - New JS function `renderProgramForPrint()` that calls `resolveAllWeeks()` and builds a print DOM
   - Button in the program options area that opens a `window.print()` modal
   - Phase overview header + week-by-week day/exercise listing

This is a real, shippable, useful thing that covers both use cases with zero dependencies.

### Post-MVP enhancements (don't build now)

- **Web Share API** — "Share day" on mobile sends a text/HTML snippet via the system share sheet
- **Session summary export** — post-workout PDF with actual vs. prescribed (separate feature)
- **Weight pre-fill** — look up user's 1RM data to pre-fill percentage-based loads
- **Compact vs. detailed toggle** — for very long programs (12+ weeks)
- **QR code on printout** — links back to the live app (for sharing a "try this program" sheet)

---

## 9. Open Questions for Kenny

1. **Warmup detail in single-day print?** Full exercise list (randomized) or "Dynamic warmup — see app"? Full list is more useful at the gym; randomized text is honest about what the app generates.
2. **Last session's weight in single-day print?** Show "Last: 225 lb" under each exercise as a reference? Useful but requires a session lookup per exercise.
3. **Whole-program print: detailed (every exercise) or summary (one row per day)?** Or offer a toggle? Detailed is long; summary is more portable.
4. **Print button prominence?** Icon in day header (always visible) vs. buried in a menu (intentional, less clutter)?
