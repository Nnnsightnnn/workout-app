# Feature Spec: Program Look-Ahead

**Status:** Draft  
**Author:** Kenny (spec via Claude)  
**Date:** 2026-04-17

---

## Problem

Users can only see the current day's workout. There's no way to look ahead and understand what's coming — next session, next week, or the full program arc. This makes it hard to plan around travel, schedule conflicts, or just mentally prep for an upcoming heavy week.

---

## Goals

- Let users browse any day in their active program, past or future
- Show enough detail to plan around (muscles hit, estimated duration, workout name)
- Keep it fast and read-only for MVP — no editing from this view
- Respect the existing aesthetic: chunky, scannable cards, not a spreadsheet

---

## Scope Decision: Full Program

The full program (all weeks × days) should be browsable, not just the current week. Kenny's ask was "the entire program." A weekly-only view would be a half-measure.

**Natural unit:** The program has `currentWeek` and `totalWeeks` (e.g., week 3 of 10). The outer navigation is weeks; within each week, the inner navigation is days.

---

## Data Model

### What exists today

```
userData = {
  templateId,        // e.g. "conjugate5"
  currentWeek,       // 1-indexed week in the program
  totalWeeks,        // e.g. 10
  daysPerWeek,       // e.g. 5
  program: [day],    // current week's generated days (in memory)
  lastDoneDayId,     // rotation pointer
  draft,             // in-progress session
  sessions: []       // completed history
}
```

### Future weeks are already derivable

`resolveWeekProgram(templateId, weekNum, totalWeeks, daysPerWeek)` generates a deterministic
day array for any week. **No schema change needed** to support read-only look-ahead.

`getPhasesForTemplate(templateId, totalWeeks)` returns phase metadata (name, weeks, color,
description) for the full program arc — used to show context like "Week 7 is Peaking Phase."

### One gap: completed-week history

Past weeks are not stored — only `sessions[]` (completed workouts with recorded sets/reps).
For the look-ahead view, we only care about *future* days, so this is not a blocker.
If we later want to show "what you actually did in week 2" alongside "what week 2 prescribed,"
that's a separate feature.

### Custom programs

Users who built a custom program via the program builder have their full `program[]` stored
directly in `userData` rather than generated from a template. `templateId` may be `"custom"`.
The look-ahead view should fall back gracefully: show the current week's stored days;
for "future weeks" on a custom program, show a placeholder ("Custom programs repeat —
future weeks match week 1 pattern") or repeat week 1 if `totalWeeks` > 1.

---

## What a Day Shows

### List view (week overview) — summary card

Each day card in the week strip shows:
- Day number + name (e.g., "Day 3 — Heavy Lower")
- Phase badge (e.g., "Strength Block") in phase color
- Primary muscles targeted (e.g., "Quads • Glutes • Hamstrings") — derived from main block exercises
- Estimated session duration (e.g., "~65 min") — sum of `sets × rest` per block + warmup/cooldown constants
- Status indicator: Completed ✓ / Today ← / Upcoming (muted)

### Detail view (tap a day card) — full exercise list

Opens a bottom sheet showing:
- Day name + subtitle
- Each block as a collapsible section: block title, exercises, sets × reps (or RPE target)
- Cooldown section (generated from `getCooldownExercises(dayId)`)
- "Start This Workout" button — only if this is the current or next day; not for arbitrary future days
  (Prevents skipping ahead accidentally)

**Tradeoff:** The summary card is fast to scan; the detail sheet is what you actually need to plan
around ("Oh, Romanian deadlifts the day before my flight — I'll rearrange"). Both are read-only.

---

## Interaction Model: Read-Only for MVP

The MVP view is **read-only**. Users can browse and plan mentally but cannot:
- Skip days
- Swap exercises
- Reorder blocks

**Rationale:** The main utility is *awareness*, not editing. Editing introduces complex state
questions (what if you skip a deload? does the periodization engine recompute?) that are out of
scope here. The existing "week control" sheet already handles skip-to-week for power users.

Post-MVP candidates (not in this spec):
- Mark a day as "skip" (just skip the rotation pointer)
- Swap a day with another from the same phase
- Add a personal note to an upcoming session

---

## Navigation & Affordance

### Placement: New "Program" bottom sheet, accessible from the workout screen

**Proposed entry point:** A "View Program" button in the workout header or bento sidebar.

**Why not a new top-level screen?** There are already 4 screens (workout, history, settings, prs).
Adding a 5th for a planning view that people use occasionally would clutter the nav bar.
A bottom sheet matches how the program picker already works — heavy info, not always needed.

**Why not a swipe gesture?** Swipe gestures have discoverability problems on mobile. A visible
button is better for a feature users will reach for deliberately.

### The look-ahead sheet layout

```
┌─────────────────────────────────┐
│  My Program · Week 3 of 10      │
│  [◀ Prev Week]  [▶ Next Week]   │
│  ─────────────────────────────  │
│  Phase: Strength Block ●        │
│  ─────────────────────────────  │
│  Day 1  Heavy Upper   ✓         │
│  Day 2  Heavy Lower   ✓         │
│  Day 3  Dynamic Upper ← TODAY   │
│  Day 4  Dynamic Lower           │
│  Day 5  Accessory               │
│  ─────────────────────────────  │
│  [View Full Program Overview]   │
└─────────────────────────────────┘
```

Tapping any day card opens the day detail sheet (described above).

"View Full Program Overview" expands to a scrollable timeline view showing all weeks as rows,
color-coded by phase. This is the highest-level planning surface.

### Full program timeline (expanded)

```
Week 1   ████  Accumulation        ✓✓✓✓✓
Week 2   ████  Accumulation        ✓✓✓✓✓
Week 3   ████  Strength            ✓✓←
Week 4   ████  Strength
Week 5   ████  Strength
Week 6   ░░░░  Deload
Week 7   ████  Peaking
...
Week 10  ████  Peaking
```

Each row is tappable → opens week detail (the week strip layout above).

---

## Edge Cases

### Deload weeks

Deload weeks are generated by the periodization engine with reduced volume/intensity. They appear
in the program timeline automatically. The "Deload" phase badge signals to the user what kind of
week it is. No special handling needed — `resolveWeekProgram()` already handles this.

### AMRAP sets

AMRAP sets (e.g., "5+" reps) show the rep floor target. The look-ahead view can't predict how
many reps the user will actually hit. Display as "5+" and note "based on current training max"
if weight prescription is shown.

### RPE-based sets

Show the RPE target (e.g., "RPE 8.5"). Weight is not prescribed for RPE sets — the user
selects based on feel. The look-ahead view shows the prescription correctly; it cannot show
a projected weight. This is accurate and honest.

### Autoregulated programs

Some templates adjust intensity based on `trainingMax` values stored per user. The periodization
engine already has access to `userData` when called — it will produce the correct prescription
for the user's current strength level. No special handling needed in the look-ahead view.

### User mid-program with draft in progress

If a draft exists (workout started but not finished), the current day indicator should show
that session as "In Progress" rather than "Today →". The look-ahead should not interfere with
the draft state.

### Programs shorter than current week

If `currentWeek > totalWeeks` (shouldn't happen but can with edge cases), clamp the display
and show a "Program complete" banner at the top.

---

## Data Model Changes Required

**None for MVP read-only view.** All data is derivable from existing fields.

If post-MVP editing features are added (skip, swap, notes):
- `day.skipped: boolean` — lightweight skip flag per day
- `day.userNote: string` — optional personal note on an upcoming session
- Both would live in `userData.program[]` (current week) or require caching generated weeks

---

## New UI Components Required

| Component | Description |
|---|---|
| `ProgramLookAheadSheet` | Bottom sheet container, week navigation, day card list |
| `DayCard` | Summary card: day name, muscles, duration, status badge |
| `DayDetailSheet` | Full exercise list, block-by-block, launched from DayCard tap |
| `ProgramTimeline` | Full-program week-row view with phase color bars and completion dots |
| `PhaseBadge` | Colored pill showing current phase name (reuse/extend existing chip style) |

All components follow existing design language: chunky cards, 14px+ border-radius, 2px borders,
`0 3px 0` box-shadow, 44px+ touch targets.

---

## Interaction Flows

### Flow 1: Check next session

1. User is on workout screen, sees tomorrow is a rest day after a heavy leg session
2. Taps "View Program" button in workout header
3. `ProgramLookAheadSheet` opens, showing current week
4. User sees Day 4 is Dynamic Lower
5. Taps Day 4 card → `DayDetailSheet` shows: Warm-Up / Box Squats / Speed Pulls / Accessory
6. User closes sheet, plans accordingly

### Flow 2: Plan around travel

1. User has a trip in 10 days
2. Opens look-ahead, taps "▶ Next Week" twice
3. Sees Week 5 (Strength Phase) with 5 days
4. Identifies which days they'll miss
5. Taps "View Full Program Overview" → timeline shows Weeks 1–10
6. Decides to advance to Week 6 (Deload) before the trip using existing week controls

### Flow 3: Understand program arc

1. New user starts a 10-week program, wants to understand what they signed up for
2. Opens full program timeline
3. Sees: 3 weeks Accumulation → 3 weeks Strength → 1 week Deload → 3 weeks Peaking
4. Feels confident about the plan

---

## Implementation Milestones

### Milestone 1 — Current Week Strip (MVP, ship first)

**What:** Add "View Program" entry point on workout screen that opens a sheet showing
the current week's days as summary cards. Tap a card → day detail sheet.

**Effort:** Small. Reuses `renderSamplePreview()` logic that already exists in the
program picker. New code is mainly the sheet wrapper and `DayCard` component.

**Files touched:**
- `src/js/10-render-workout.js` — add "View Program" button to header
- `src/js/12-bottom-sheet.js` — new sheet opener for look-ahead
- New file: `src/js/23-look-ahead.js` — `renderLookAheadSheet()`, `renderDayCard()`, `renderDayDetailSheet()`
- `src/styles.css` — day card styles

### Milestone 2 — Week Navigation

**What:** Add Previous/Next Week navigation to the look-ahead sheet. Calls
`resolveWeekProgram()` for non-current weeks. Shows phase badge.

**Effort:** Small. The engine call exists; need to wire up navigation state and handle
the custom program fallback.

**Files touched:** `src/js/23-look-ahead.js` (primary)

### Milestone 3 — Full Program Timeline

**What:** "View Full Program Overview" expands to the week-row timeline view.
Phase-colored bars, completion dots, tappable rows.

**Effort:** Medium. New layout component, phase color system, completion state derivation.

**Files touched:** `src/js/23-look-ahead.js`, `src/styles.css`

### Milestone 4 (Post-MVP) — Day Notes & Skip Flags

Skip and personal notes per upcoming day. Requires schema change + migration.

---

## MVP Definition

**Ship after Milestone 2.** A user can:
- Open the look-ahead sheet from the workout screen
- See the current week's days with names, muscles, and status
- Navigate week-by-week through the full program
- Tap any day to see the full exercise list

Milestone 3 (timeline) is valuable but not blocking — the week-strip navigation already
satisfies "see the whole program" for most planning use cases.
