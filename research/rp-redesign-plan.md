# RP Redesign — Implementation Plan

**Companion to:** `research/rp-redesign-audit.md`
**Status:** Proposed (awaiting review)
**Author:** Claude (for Kenny)
**Date:** 2026-04-22
**Schema version at time of writing:** `APP_VERSION = 7` — this plan introduces v8 through v11.

---

## 0. How to use this document

This is a multi-workstream plan, not a single feature spec. It's meant to be read top-to-bottom once (Kenny sanity-checks the shape), then used chunk-by-chunk as implementation source-of-truth.

Each workstream is a **shippable unit** with its own acceptance criteria. The sequencing section at the end orders them. Risks and open questions are called out at the end — do not start implementation without resolving the ones flagged **BLOCKING**.

The principles in §1 are load-bearing. Every subsequent workstream was designed to honor them. If §1 is wrong, the rest of the plan is wrong.

Cross-references to the audit are `[audit §N]`.

---

## 1. Top-Level Principles

These principles bind every workstream below. They operationalize Kenny's North Star:

> "My RPE weight/reps for squats should be based on what effort I have to put in for where I'm at in my progression…not a default that everybody gets the same weight for."

### 1.1 The engine earns personalization by asking for data

**Rule:** The engine must never silently fall back to a global default for a personalized decision. If it's about to, it prompts the user gently, inline, for the missing input and caches the answer. No silent defaults for anything that influences prescription.

**What counts as a "personalized decision":**
- Suggesting a weight for a specific set
- Recommending a deload
- Setting volume targets (MEV/MAV/MRV)
- Picking a rotation candidate
- Computing bodyweight-lift intensity

**What's OK to default silently:**
- Cosmetic/UX (rest timer length, toast duration)
- First-render UI values that the user will type over anyway (today's date)
- Aggregates over data that already exists (volume chart binning)

**What's NOT OK to default silently:**
- RPE when a set was backfilled (today: hardcoded 7 at `13-start-finish.js:145` and `09a-timeline-strip.js:402`)
- Weight on a bodyweight lift (today: stored as 0, absolute intensity unknowable)
- Starting weight for a cold-start exercise (today: `ex.defaultWeight || 0`)
- MEV/MAV/MRV for a new user (today: doesn't exist)

**Catalog of engine inputs that may be missing at decision time:** §5 (Cross-Cutting Prompts Catalog).

### 1.2 No global defaults for prescription

Related to 1.1: the `LOADING` table (`04e-periodization.js:102–175`) currently hard-codes sets×reps×rest per style×phase×weekInPhase. That table is a **starting point for a cold-start user**, not a prescription for a user with history. Once a user has ≥ 1 logged session for an exercise, suggested prescriptions must read from the user's data, not from the table.

The table stays in the code — it's the cold-start seed. But the call site shifts from "read LOADING" to "if `suggestedWeight()` returns cold-start, then read LOADING".

### 1.3 History is truth; the engine's job is to listen

Every derived metric (e1RM, PR, volume, suggested weight) must be recomputable from `user.sessions[]` at any time. No cached derived values that can drift from truth. This means:
- Editing a past session must be supported (§4) without corrupting derived views
- Flags like `set.isPR` are authoritative-on-write but recomputed-globally on any mutation of session history

### 1.4 Fatigue signals recommend; they do not force

Week-boundary fatigue detection (see §3) must surface as a non-blocking recommendation. The phase engine stays calendar-driven by default. The user confirms or dismisses each recommendation. The system never rewrites the user's plan without their tap.

### 1.5 Every workstream ships with a rollback path

- Migrations auto-backup to `kn-lifts-backup-premigration` (already exists in `06b-migrations.js:134`)
- New features are gated by `user.rp.enabled` flag so a user on a non-RP program sees no change
- The library retag (§2) is additive-first: new tags are added before old tags are removed, so during the migration both taxonomies coexist for one build

---

## 2. Workstream A — Library Retag & Taxonomy Lock

### 2.1 What it does

Locks the exercise library's muscle taxonomy to a deliberate, RP-compatible vocabulary. Adds `setContribution` weights to every exercise. Migrates existing user sessions to preserve historical volume counts under the new taxonomy. This is the **foundation workstream** — nothing else in this plan is safe to ship without it.

### 2.2 Taxonomy decisions (from audit §6 review + Phase 1 confirmation)

**New muscle vocabulary** (19 entries, down from 31 freeform strings):

| Group | Muscles |
|---|---|
| Chest | `chest`, `upper chest` |
| Back | `lats`, `upper back`, `lower back`, `traps` |
| Shoulders | `front delts`, `side delts`, `rear delts` |
| Arms | `biceps`, `triceps`, `forearms` |
| Legs | `quads`, `hamstrings`, `glutes`, `adductors`, `calves` |
| Core | `core`, `obliques` |

**Retired / re-scoped:**
- `back` → dropped (redundant; was used where `lats + upper back` belongs)
- `shoulders` → dropped as a muscle; split into `front delts`, `side delts`, `rear delts`
- `knees` → moved to `patterns[]` (workflow tag, KOT-specific)
- `conditioning` → moved to `patterns[]`
- `full body` → moved to `patterns[]`
- `hips`, `hip flexors`, `thoracic`, `posterior chain` → moved to `patterns[]` (pattern tags, not RP muscles)
- `serratus`, `glute med`, `glute min`, `tibialis`, `grip` → kept as **optional sub-muscles** in a separate `subMuscles[]` array (not counted toward main-muscle volume but preserved for exercise categorization)

**Vocabulary is locked.** Any new muscle needs a migration.

### 2.3 `setContribution` shape

Every library entry gets a `setContribution` object mapping each muscle in `muscles[]` to a fractional set count. RP's convention:

- **Primary muscle on a compound:** 1.0 (full set)
- **Secondary muscle on a compound:** 0.5 (half set)
- **Tertiary / stabilizer:** 0.25
- **Isolation exercise primary muscle:** 1.0
- **Any muscle not listed:** implicit 0

Examples:
- Bench press → `muscles: ["chest", "triceps", "front delts"]`, `setContribution: { chest: 1.0, triceps: 0.5, "front delts": 0.5 }`
- Barbell row → `muscles: ["lats", "upper back", "biceps", "rear delts"]`, `setContribution: { lats: 1.0, "upper back": 1.0, biceps: 0.5, "rear delts": 0.5 }`
- Lateral raise → `muscles: ["side delts"]`, `setContribution: { "side delts": 1.0 }`
- Front squat → `muscles: ["quads", "glutes", "core"]`, `setContribution: { quads: 1.0, glutes: 0.5, core: 0.5 }`

### 2.4 Data model

**`LIBRARY` entry shape — additions:**

```js
// Before (01-exercise-library.js):
{ id: "bench", name: "Bench Press", cat: "Upper", muscles: ["chest", "triceps", "shoulders"] }

// After:
{
  id: "bench",
  name: "Bench Press",
  cat: "Upper",
  muscles: ["chest", "triceps", "front delts"],       // locked vocab only
  setContribution: { chest: 1.0, triceps: 0.5, "front delts": 0.5 },
  patterns: ["push_horizontal", "compound"],          // workflow tags (optional)
  subMuscles: []                                      // serratus, grip, etc. (optional)
}
```

**`Set` shape — no structural change.** `set.muscles[]` remains `string[]` but now holds locked-vocab values. `set.setContribution` is derived at render/aggregation time by looking up `LIB_BY_ID[exId].setContribution` — not stored per-set (avoids duplication + migration complexity on historical data).

### 2.5 Migration — v8

**File:** `src/js/06b-migrations.js`

```js
{
  version: 8,
  description: "Retag library taxonomy; remap session sets to new vocabulary",
  migrate(store) {
    // Map of legacy → new muscle names
    const MUSCLE_REMAP = {
      "shoulders": ["front delts", "side delts"],    // ambiguous — see exercise-specific remap below
      "back": ["lats", "upper back"],
      "knees": null,                                   // workflow tag — drop from muscles[]
      "conditioning": null,
      "full body": null,
      "hips": null,
      "hip flexors": null,
      "thoracic": null,
      "posterior chain": null,
      "grip": null,                                    // moves to subMuscles via LIB lookup
      "serratus": null,
      "glute med": null,
      "glute min": null,
      "tibialis": null,
      "upper chest": ["upper chest"],                  // preserved
      "rear delts": ["rear delts"],                    // preserved
      // identity mappings omitted for brevity
    };

    store.users.forEach(u => {
      (u.sessions || []).forEach(s => {
        (s.sets || []).forEach(set => {
          // Preferred path: look up the exercise in the NEW library and use its muscles[]
          const lib = (typeof LIB_BY_ID !== "undefined") ? LIB_BY_ID[set.exId] : null;
          if (lib && Array.isArray(lib.muscles)) {
            set.muscles = [...lib.muscles];
            return;
          }
          // Fallback: remap each tag via MUSCLE_REMAP.
          // Stamp _remappedAt:8 so the Library Audit surface (N-11) can find these
          // sets later and let the user reclassify manually.
          const next = [];
          (set.muscles || []).forEach(m => {
            const mapped = MUSCLE_REMAP[m];
            if (mapped === null) return;               // dropped
            if (Array.isArray(mapped)) next.push(...mapped);
            else next.push(m);                         // identity (already locked vocab)
          });
          set.muscles = Array.from(new Set(next));     // dedupe
          set._remappedAt = 8;
        });
      });
    });

    return store;
  }
}
```

**Preferred path** (lookup by `exId`) is important: it rebuilds `muscles[]` from the authoritative new library, not from a name remap. Name remap is a safety net for orphaned exercises.

**Backup:** Auto-backup to `kn-lifts-backup-premigration` already happens for every migration.

### 2.6 Library edit — scope of work

**File:** `src/js/01-exercise-library.js` (256 entries)

Every entry needs:
1. `muscles[]` re-audited against the locked vocabulary
2. `setContribution{}` added
3. Optional `patterns[]` and `subMuscles[]` fields where applicable

**Process for Kenny** (do this in a dedicated session with `fitness-trainer:program-advisor`):
- Work category-by-category (Upper / Lower / Core / KOT / Conditioning / Warmup)
- For each entry, confirm the muscle list + contribution with the advisor
- Entries with `noRpe: true` (conditioning, stretches) get `muscles: []` + `setContribution: {}` — they count zero volume

Rough effort: ~256 entries × ~45 sec/entry = 3–4 hours of focused retag work. Do it in one sitting with the advisor loaded.

### 2.7 New functions

```
File: src/js/01a-mksets.js (existing — add helper)
Function: setContributionFor(exId)
Purpose: Look up setContribution for an exercise at aggregation time.
Logic:
  const lib = LIB_BY_ID[exId];
  return (lib && lib.setContribution) ? lib.setContribution : {};
Returns: { [muscle]: number }
```

```
File: src/js/15-history.js (add near renderBalanceTab)
Function: effectiveSetsByMuscle(sessions, sinceMs)
Purpose: Compute weighted set counts per muscle across a window.
Logic:
  const totals = {};
  sessions.forEach(s => {
    if (s.finishedAt < sinceMs) return;
    s.sets.forEach(set => {
      const contrib = setContributionFor(set.exId);
      Object.entries(contrib).forEach(([muscle, weight]) => {
        totals[muscle] = (totals[muscle] || 0) + weight;
      });
    });
  });
  return totals;
Returns: { [muscle]: number }  // e.g. { chest: 8.5, triceps: 12.0, ... }
```

### 2.8 Modified functions

```
File: src/js/15-history.js
Function: renderBalanceTab()
Change: Replace the naive `(set.muscles || []).forEach(m => counts[g]++)` loop
        with effectiveSetsByMuscle(). Donut now shows weighted volume.
Risk: Visual rebalance — users will see their donut shift. Mitigation: call out
      the change in a first-load toast: "Volume counting now weights compound lifts."
```

```
File: src/js/15-history.js
Function: groupMuscle(m)
Change: Remove obsolete entries (back, shoulders, knees, conditioning, full body,
        hip flexors, etc.) and align with locked vocab.
        New groupings:
          "front delts","side delts","rear delts" → "Shoulders"
          "lats","upper back","lower back","traps" → "Back"
          "chest","upper chest" → "Chest"
          "biceps","triceps","forearms" → "Arms"
          "quads","hamstrings","glutes","adductors","calves" → "Legs"
          "core","obliques" → "Core"
Risk: Historical sessions rendered before migration completes may show stale
      groupings for ~1 render. Acceptable — migration runs before first render.
```

### 2.9 UI

No direct UI in this workstream. The Balance tab donut rebalances (above). Everything else surfaces in later workstreams.

### 2.10 Edge cases

1. **User on v7 has sessions with `muscles: ["shoulders"]`.** Migration remap uses `LIB_BY_ID` first (locked vocab), falls back to name-map. If exId missing (deleted custom exercise), name-map produces `["front delts", "side delts"]` — undercounts rear-delt volume for orphan entries. Per [R-2], such sets get `_remappedAt: 8` so the Library Audit surface [N-11] can surface them for manual reclassification. A one-shot changelog toast fires on first post-v8 launch (copy in [R-2]).
2. **Custom exercises** (if any — verify none). If a user added a non-library exercise in program-builder, its `muscles[]` may contain old vocab and no `setContribution`. Fallback: treat as 1.0 contribution per listed muscle.
3. **Empty `muscles[]` after migration** (e.g., exercise was all workflow tags). Counts zero volume — correct behavior.
4. **Data export format** (`17-export.js`) still emits `set.muscles[]`. Post-migration export contains new vocab. Old exports can't be imported without pre-processing; flag in §9.

### 2.11 Verification

```
Build: node build.js
Test: node test-v3.js
Manual check:
  1. Open app with existing data → migration runs → restorePreMigrationBackup() works
  2. Balance tab donut renders with weighted counts
  3. Sample 5 exercises in the library; confirm setContribution lookups are right
  4. Sample 3 historical sessions; confirm their muscles[] updated to new vocab
```

### 2.12 Acceptance criteria

- [ ] `APP_VERSION = 8` and migration v8 passes `node test-v3.js`
- [ ] Every entry in `LIBRARY` has `setContribution` populated (unit test: assert keys of `setContribution` are subset of `muscles[]`)
- [ ] Balance tab donut displays weighted counts (manual check)
- [ ] `restorePreMigrationBackup()` successfully reverts to v7 data
- [ ] No entry in `LIBRARY` contains retired vocab (`shoulders`, `back`, `knees`, `conditioning`, etc.)

---

## 3. Workstream B — A+ Autoregulation Layer

Implements the core of Kenny's North Star. Reads RPE/history to suggest weights. Handles cold-start, bodyweight lifts, and machines explicitly. Surfaces fatigue-based deload recommendations without forcing phase changes.

### 3.1 What it does

- Computes a **suggested weight** for every set the user is about to do, based on their recent session history, the target reps, and the target RIR.
- When history is missing or unreliable, prompts the user gently for the data it needs (cold-start, bodyweight, first-in-range).
- Computes a **fatigue signal** at week boundaries and surfaces a "Deload recommended" card that the user can accept or dismiss.
- All gated behind `user.rp.enabled`. Users who don't opt in see no behavior change (except the library retag, which is universal).

### 3.2 Assumptions (confirm before implementing)

1. **A+ ships before B (mesocycle)** — the RPE-aware prescription is foundational; the mesocycle/volume workstream consumes it.
2. **Opt-in at program level** — A+ auto-enables when a user picks an `rp-hypertrophy` program (§4) but can also be toggled on for any program via onboarding or Settings → Preferences. Off by default for existing users post-migration.
3. **RIR target comes from the week's phase config** when on an RP program; otherwise defaults to 2 with a prompt on first use.
4. **Epley is the e1RM formula** — already used in `23-pr-tracking.js:8`. Not changing.

### 3.3 Data model

**`UserRecord` — new `rp` container (v9):**

```js
u.rp = {
  enabled: false,                      // gate for A+ behavior

  // Calibration state
  rpeCalibrationCompletedAt: null,     // ms; null = never calibrated
  rpeCalibrationMethod: null,          // "guided" | "self-reported"

  // Cold-start anchors — user-provided starting weights for exercises
  // with no history. Keyed by exId.
  coldStartAnchors: {},                // { [exId]: { weight, reps, dateMs } }

  // Fatigue recommendation state
  lastDeloadRecommendedAt: null,       // ms; prevents re-prompting same week
  dismissedDeloadForWeek: null,        // integer currentWeek; if matches, suppress
};
```

**Bodyweight sourcing — resolved (see §9 [R-1]).** The RP engine does not own bodyweight. `u.measurements[]` is the single source of truth — it already has `{date, weight, unit}` entries via the body-weight tracker UI (`18-body-weight.js`). The engine reads it via `userBodyweightAt(dateMs)` (§3.5.4) which interpolates across the measurements array. No mirror in `u.rp`, no denorm on `Session`. When the engine encounters missing or stale bodyweight data, it fires the inline prompt (§6 rows 1 and 5), which writes to `u.measurements[]` — the same path the body-weight tab uses.

**`Set` shape — no change.** Existing fields (`weight`, `reps`, `rpe`, `bodyweight`, `isPR`) are sufficient.

### 3.4 Migration — v9

```js
{
  version: 9,
  description: "Add u.rp container for A+ autoregulation",
  migrate(store) {
    store.users.forEach(u => {
      if (!u.rp) {
        u.rp = {
          enabled: false,
          rpeCalibrationCompletedAt: null,
          rpeCalibrationMethod: null,
          coldStartAnchors: {},
          lastDeloadRecommendedAt: null,
          dismissedDeloadForWeek: null
        };
      }
      // Bodyweight data stays in u.measurements[] — no copy, no mirror.
      // userBodyweightAt() reads it directly at query time.
    });
    return store;
  }
}
```

### 3.5 New functions

#### 3.5.1 E1RM history with recency weighting

```
File: src/js/25-rp-engine.js (new)
Function: recentE1RM(exId, opts = {})
Purpose: Return a recency-weighted e1RM estimate for an exercise, with confidence.
Logic:
  1. Pull last N sessions (default 3) containing this exId via getRecentSessions.
  2. For each session, take the max calcE1RM(weight, reps) across that session's
     sets for this exId.
  3. If session.sets for this exId all have bodyweight=true, use bodyweight-adjusted
     e1RM (see §3.5.3).
  4. Apply recency weights [0.5, 0.3, 0.2] for N=3 sessions (configurable).
  5. Compute weighted average; classify confidence:
       - "high"   : N ≥ 3 sessions, all within last 14 days, all with RPE reported
       - "med"    : N ≥ 2 sessions OR some sessions > 14 days old
       - "low"    : N = 1 session OR backfilled RPE defaults in mix
       - "cold-start" : N = 0 sessions
Returns: { value: number | null, confidence: string, sampleSize: number, reason: string }
```

#### 3.5.2 Suggested weight (the core A+ API)

```
File: src/js/25-rp-engine.js
Function: suggestedWeight(exId, targetReps, targetRIR, opts = {})
Purpose: Compute the weight to prescribe for the user's next set of this exercise.
Logic:
  1. e1rm = recentE1RM(exId)
  2. if e1rm.confidence === "cold-start":
       return { weight: null, confidence: "cold-start", prompt: { ... } }
     // prompt payload is handled by UI; see §3.8 (cold-start prompt)
  3. If exercise is bodyweight:
       if no user bodyweight captured → return { prompt: { ask: "bodyweight" } }
       totalLoad = userBodyweight + (opts.addedWeight || 0)
       // Treat as if totalLoad is the "weight"; proceed with math below
  4. If exercise is a machine (equipment includes "machine") AND user's
     first-time on this machine (no history) → prompt for calibration
     ("Does your gym's machine feel standard?" — default yes)
  5. Solve Epley for weight given target reps + target RIR:
       // e1rm = weight × (1 + (reps + rir) / 30)
       // → weight = e1rm / (1 + (reps + rir) / 30)
       targetW = e1rm.value / (1 + (targetReps + targetRIR) / 30)
  6. Round to nearest plate-loadable weight (2.5 lbs / 1.25 kg per side = 5 lbs / 2.5 kg increment).
     For dumbbell exercises, round to nearest DB increment (5 lbs / 2.5 kg).
  7. Return { weight: targetW, confidence: e1rm.confidence, reason: "Based on last 3 sessions" }
Returns: { weight: number | null, confidence: string, prompt?: {}, reason: string }
```

#### 3.5.3 Bodyweight-adjusted e1RM

```
File: src/js/25-rp-engine.js
Function: bodyweightE1RM(set, userBwAtSessionTime)
Purpose: Compute e1RM for a bodyweight lift using total load.
Logic:
  // For pullups, dips, pushups: true load = bodyweight + added
  // For weighted-bw lifts (weighted pullup), set.weight holds the added weight
  const totalLoad = userBwAtSessionTime + (set.weight || 0);
  return calcE1RM(totalLoad, set.reps);
Returns: number
```

#### 3.5.4 Interpolated bodyweight at a date

```
File: src/js/25-rp-engine.js
Function: userBodyweightAt(dateMs)
Purpose: Find the user's bodyweight at or before a given date; linear interpolate if needed.
         Reads directly from u.measurements[] — single source of truth.
Logic:
  const u = userData();
  const entries = (u.measurements || [])
    .filter(m => m.weight > 0)
    .map(m => ({
      dateMs: typeof m.date === "string" ? Date.parse(m.date) : m.date,
      weight: m.weight,
      unit: m.unit || state.unit || "lbs"
    }))
    .filter(e => !isNaN(e.dateMs))
    .sort((a, b) => a.dateMs - b.dateMs);

  if (!entries.length) return null;                    // caller prompts
  if (dateMs <= entries[0].dateMs) return entries[0].weight;
  if (dateMs >= entries[entries.length-1].dateMs) return entries[entries.length-1].weight;

  // Linear interpolate between bracketing entries
  for (let i = 0; i < entries.length - 1; i++) {
    const a = entries[i], b = entries[i+1];
    if (dateMs >= a.dateMs && dateMs <= b.dateMs) {
      const t = (dateMs - a.dateMs) / (b.dateMs - a.dateMs);
      return a.weight + (b.weight - a.weight) * t;
    }
  }
  return entries[entries.length-1].weight;             // defensive
Returns: number | null
Performance note: called per bodyweight-lift suggestion. O(M log M) on first call
(sort); consider memoizing sorted array per frame if perf shows up.
```

#### 3.5.5 Fatigue signal (week-boundary)

```
File: src/js/25-rp-engine.js
Function: computeFatigueSignal()
Purpose: At week completion, score fatigue across trained muscles and recommend
         (not force) a deload.
Logic:
  Called from advanceWeek() in 07-day-rotation.js BEFORE incrementing currentWeek.

  1. Pull sessions where s.programWeek === u.currentWeek.
  2. Pull per-session feedback (§4.5 — 3-question pump/soreness/workload).
  3. For each muscle trained this week, compute:
       avgPump, avgSoreness, avgWorkload (0-3 each)
  4. Aggregate signal:
       highLoadMuscles = muscles where avgWorkload >= 2.5 && avgSoreness >= 2.0
       pct = highLoadMuscles.length / trainedMuscles.length
  5. If pct >= 0.4 AND u.currentWeek - u.rp.lastDeloadRecommendedAt (in weeks) >= 3:
       return { recommend: true, reason: "Fatigue across ${highLoadMuscles.join(', ')}" }
  6. Else: return { recommend: false }
Returns: { recommend: boolean, reason?: string, details?: {...} }
```

**Key design note:** This function RECOMMENDS. It does not change the phase. The UI (see §3.9) shows a card; the user taps Accept (which modifies next week's `currentWeek` to skip into a deload) or Dismiss (stores `dismissedDeloadForWeek = u.currentWeek`).

### 3.6 Modified functions

```
File: src/js/10-render-workout.js
Function: renderWorkoutScreen() and sub-renderers (specifically where set weight
          is pre-filled — around line 950 and the set-editor at 1084)
Change: Wrap pre-fill logic. If u.rp.enabled:
          - suggestion = suggestedWeight(ex.exId, ex.reps, currentTargetRIR)
          - If suggestion.prompt → render inline prompt card ABOVE the set row
          - If suggestion.weight → use as default; show small "Based on history"
            badge with tap-to-explain
          - If suggestion.confidence === "cold-start" → render cold-start prompt
        Else: fall through to existing behavior (ex.defaultWeight or last-set lookup)
Risk: The set-editor at line 1084 has inline quick-edit pills. Need to keep those
      functional — suggestion is just the default, user override always wins.
      Also: the `getLastSetsFor`-based prefill at `09a-timeline-strip.js:355` needs
      the same treatment for manual-log consistency.
```

```
File: src/js/13-start-finish.js
Function: finishWorkout() — PR detection block (lines 153-168)
Change: After computing isPR per set, call maybeComputeFatigueSignal() when the
        completion closes a week (condition at line 224). Store result on session
        as session.weekEndSignal for later surfacing.
Risk: Low. Fatigue signal is advisory; even if computation errors, fall back to
      no recommendation (wrap in try/catch, log to console).
```

```
File: src/js/07-day-rotation.js
Function: advanceWeek()
Change: Before incrementing currentWeek, read latest session's
        weekEndSignal. If recommend=true AND not dismissed for this week:
          - Set u.rp.lastDeloadRecommendedAt = Date.now()
          - Show a bottom sheet with the recommendation (see §3.9 UI)
          - User tap drives: either skip to deload week in phase OR proceed normally
Risk: Modifies the week-rollover path, which is critical. Must maintain the
      existing "proceed normally" default if u.rp.enabled = false. Write a test
      for: non-RP user finishes a week; advance proceeds without prompting.
```

### 3.7 UI — Inline prompt pattern

**Critical pattern for §1.1.** All prompts follow the same visual shape:

```
Location: Inline, above or below the element that needs the data. Never a modal
          that blocks the whole workout screen.
Shape: Rounded 14px-radius card, 2px border, accent-color highlight, with:
  - 1-line question ("What's your current bodyweight?")
  - 1-2 line context ("I need this to compute weight on your pullups.")
  - Input (stepper, pill grid, or text) — 44px touch targets
  - Primary button ("Save") + small text link ("Skip for now")
Interaction:
  - Save → writes to the appropriate u.rp field + resolves the suggestion
  - Skip → marks dismissed for this session only; falls back to existing default
           with a small footnote "Using gym default — tap ⓘ to calibrate"
```

**Inline prompt types** (see §5 Catalog for the full list):

1. **Bodyweight prompt** (first bodyweight-lift save, first measurements tab visit if RP enabled)
2. **Cold-start anchor prompt** (first time logging an exercise)
3. **RPE calibration prompt** (first set after RP enable)
4. **First-in-range prompt** (first time logging an exercise at a reps count > 2 away from history)
5. **Deload recommendation** (week-boundary, see §3.9)

### 3.8 UI — Cold-start anchor prompt (example)

```
Location: Replaces the pre-fill weight input on a fresh set row for an exercise
          with zero history (new exercise card).
Element:
  <div class="rp-prompt rp-prompt-cold-start">
    <div class="rp-prompt-q">First time logging {exName}</div>
    <div class="rp-prompt-ctx">Anchor today's weight so I can suggest for next time.</div>
    <div class="rp-prompt-input">
      <input type="number" class="rp-prompt-stepper" placeholder="weight" />
      <span>×</span>
      <input type="number" class="rp-prompt-stepper" placeholder="reps" />
    </div>
    <button class="primary rp-prompt-save">Save anchor</button>
    <button class="rp-prompt-skip">Skip — use gym default</button>
  </div>
Interaction:
  - Save → u.rp.coldStartAnchors[exId] = { weight, reps, dateMs: Date.now() }
           → close prompt, replace with normal set row pre-filled to anchor
  - Skip → render normal set row with 0 as weight (user enters manually this session)
```

### 3.9 UI — Deload recommendation card

```
Location: Bottom sheet, triggered at week-rollover (advanceWeek in 07-day-rotation.js)
Element:
  <div class="rp-deload-rec">
    <h3>Deload suggested</h3>
    <p>Fatigue across: {highLoadMuscles}. Taking an easier week next can protect recovery.</p>
    <div class="rp-rec-actions">
      <button class="primary">Accept — start deload next week</button>
      <button>Dismiss — I feel fine</button>
    </div>
    <small>Phase config already plans a deload week {X}. This would move it to next week.</small>
  </div>
Interaction:
  - Accept → fast-forward u.currentWeek to next deload week in phase; regenerate program
  - Dismiss → u.rp.dismissedDeloadForWeek = u.currentWeek; proceed normally
  - Close sheet without tapping either → treated as Dismiss (non-blocking)
```

### 3.10 Edge cases

1. **User on RP, zero history, zero bodyweight, first workout.** All three prompts fire: cold-start per exercise + bodyweight on first bw lift + RPE calibration. UX: tolerable because it's one-time. Order: RPE calibration → bodyweight → cold-start (in session flow).
2. **User disables RP mid-program.** `u.rp.enabled = false` → suggestions stop, all prompt cards unmount. Data in `u.rp` preserved.
3. **User re-enables RP after disabling.** History is still there; pick up where they left off. No re-prompt for calibration/bodyweight if captured.
4. **Bodyweight changes 10 lbs in a month.** `userBodyweightAt(dateMs)` interpolates, so old pullup e1RMs stay accurate. But prompt "We have your BW from 30 days ago. Update it?" when RP engine detects stale data (>30d old AND user hasn't opened body-weight tab).
5. **Machine at a new gym.** Flagged in suggestedWeight logic but implementation can defer (§9 open question).
6. **Editing a past set (see §5).** Invalidates e1RM for that exercise; next `suggestedWeight()` call will use updated data. No cache to invalidate.
7. **Tempo/isometric work.** Exercises with `noRpe: true` are excluded from A+ (suggestion returns null, falls through). Correct.
8. **User fills in a non-integer RPE (8.5, 9.5).** Epley + RIR math uses `rpe` raw. OK — decimals pass through.

### 3.11 Verification

```
Build: node build.js
Test: node test-v3.js  (add unit tests for recentE1RM, suggestedWeight, userBodyweightAt)
Manual check:
  1. Enable RP, log one session at known weights/reps/RPE
  2. Start next session of same exercise → suggestion renders, matches hand-calc
  3. Cold-start: delete a user's history for one exercise via console,
     start a set → cold-start prompt renders
  4. Bodyweight prompt: clear u.measurements (or delete the weight-type entries), try a pullup → prompt fires; saving writes to u.measurements
  5. Deload rec: seed a session with all muscle feedback at 3/3/3, advance week → card shows
```

### 3.12 Acceptance criteria

- [ ] `APP_VERSION = 9`; migration v9 passes test
- [ ] Unit tests exist for `recentE1RM`, `suggestedWeight`, `userBodyweightAt`, `bodyweightE1RM`
- [ ] RP-enabled user sees weight suggestions on every non-warmup set
- [ ] Cold-start exercise prompts for anchor; anchor persists
- [ ] Bodyweight prompt fires exactly once; subsequent BW lifts pull from history
- [ ] RPE calibration completes once; `rpeCalibrationCompletedAt` is set
- [ ] Non-RP user (e.g., still on default conjugate) sees zero behavior change
- [ ] Fatigue signal card surfaces when seeded feedback crosses threshold; accept/dismiss both work
- [ ] `restorePreMigrationBackup()` successfully reverts to v8 data

---

## 4. Workstream C — rp-hypertrophy Program Type (Mesocycle)

Direction B from the audit §5.2. Adds a real RP-style program: mesocycles, per-muscle volume landmarks (MEV/MAV/MRV), rep-range ramps, rotation rules, resensitization, and 3-question end-of-session feedback.

### 4.1 What it does

A new `templateId: "rp-hypertrophy"` program that generates a mesocycle (typically 4–6 weeks) where:
- Each muscle has per-user MEV/MAV/MRV targets (sets/week)
- Volume starts at MEV in week 1 and ramps toward MRV over the mesocycle
- Rep ranges are scheduled (e.g., week 1-2: 8-12, week 3-4: 6-10)
- RIR targets ramp from 4 → 3 → 2 → 1 across the mesocycle, then a deload
- Exercise selection rotates across mesocycles (resensitization)
- Per-session feedback drives next-week volume adjustments

Depends on: Workstream A (library retag with setContribution) + B (A+ autoregulation).

### 4.2 Assumptions

1. **Block-level, not program-level, markup.** A day can mix RP hypertrophy blocks with non-RP blocks (e.g., warmup, conditioning). We tag `block.blockType = "rp-hypertrophy"` instead of the whole program.
2. **Only one active mesocycle at a time per user.** If the user starts a new one, the old is archived.
3. **MEV/MAV/MRV defaults come from RP's canonical table.** Users can override in an advanced onboarding step.
4. **Resensitization is opt-in.** A "new mesocycle" flow asks about exercise swaps.

### 4.3 Data model

**New `blockType` field on Block:**

```js
// Block (existing shape)
{
  id, name, exercises: [...],
  blockType: "strength" | "rp-hypertrophy" | "warmup" | "accessory" | "metcon"
}
```

**New `u.rp.volumeLandmarks` (v10):**

```js
u.rp.volumeLandmarks = {
  // sets per week, per muscle
  chest:         { mev: 8,  mav: 14, mrv: 22 },
  "upper chest": { mev: 4,  mav: 8,  mrv: 12 },
  lats:          { mev: 10, mav: 16, mrv: 25 },
  "upper back":  { mev: 8,  mav: 14, mrv: 22 },
  "side delts":  { mev: 8,  mav: 16, mrv: 26 },
  "front delts": { mev: 0,  mav: 6,  mrv: 12 },
  "rear delts":  { mev: 8,  mav: 14, mrv: 22 },
  biceps:        { mev: 8,  mav: 14, mrv: 22 },
  triceps:       { mev: 8,  mav: 14, mrv: 22 },
  quads:         { mev: 8,  mav: 16, mrv: 22 },
  hamstrings:    { mev: 6,  mav: 12, mrv: 20 },
  glutes:        { mev: 0,  mav: 8,  mrv: 16 },
  calves:        { mev: 8,  mav: 14, mrv: 22 },
  core:          { mev: 0,  mav: 10, mrv: 25 },
  // ... full vocab
};
```

Defaults seeded on first RP program start from RP's canonical table.

**New `u.rp.currentMesocycleId` + `u.rp.mesocycles[]`:**

```js
u.rp.mesocycles = [
  {
    id: "meso-1710000000000",
    startedAt: 1710000000000,
    finishedAt: null,                    // null if active
    lengthWeeks: 5,                      // 4 accumulation + 1 deload
    currentWeek: 2,
    rirSchedule: [4, 3, 2, 1, "deload"], // week 1..5
    repRangeSchedule: [                  // per-muscle-group, per-week
      { weeks: [1,2], targetReps: [8, 12] },
      { weeks: [3,4], targetReps: [6, 10] }
    ],
    // Tracks prescribed volume for this mesocycle.
    // Populated when a week is generated. Used by feedback loop.
    perMuscleVolume: {
      // muscle → array of {week, plannedSets, completedSets}
      chest: [
        { week: 1, plannedSets: 8,  completedSets: 8 },
        { week: 2, plannedSets: 10, completedSets: null }
      ]
    },
    // Exercise selection for this mesocycle. Locked at mesocycle start; swapped
    // at next mesocycle via resensitization flow.
    exerciseSelection: {
      // muscle → [exId, exId, ...]  (the pool for this meso)
      chest: ["bench", "incline-db-press", "cable-fly"]
    }
  }
];

u.rp.currentMesocycleId = "meso-1710000000000";
```

**New per-session feedback (v11):**

```js
// Session — new field
session.feedback = {
  // muscle name → { pump, soreness, workload }  each 0-3
  chest:    { pump: 2, soreness: 2, workload: 2 },
  triceps:  { pump: 1, soreness: 1, workload: 2 }
}
```

### 4.4 Migrations

**v10:** Add `volumeLandmarks` + `mesocycles[]` + `currentMesocycleId` (defaults only).

```js
{
  version: 10,
  description: "Add RP volume landmarks and mesocycle container",
  migrate(store) {
    const DEFAULT_LANDMARKS = { /* full table from §4.3 */ };
    store.users.forEach(u => {
      if (!u.rp) u.rp = {};
      if (!u.rp.volumeLandmarks) u.rp.volumeLandmarks = deepClone(DEFAULT_LANDMARKS);
      if (!Array.isArray(u.rp.mesocycles)) u.rp.mesocycles = [];
      if (u.rp.currentMesocycleId === undefined) u.rp.currentMesocycleId = null;
    });
    return store;
  }
}
```

**v11:** Add `session.feedback` field (defaults to empty object per session).

```js
{
  version: 11,
  description: "Add session.feedback for RP 3-question check-in",
  migrate(store) {
    store.users.forEach(u => {
      (u.sessions || []).forEach(s => {
        if (!s.feedback) s.feedback = {};
      });
    });
    return store;
  }
}
```

### 4.5 New functions

```
File: src/js/25-rp-engine.js
Function: startMesocycle(opts = {})
Purpose: Initialize a new mesocycle, seed volume from MEV, build exerciseSelection.
Logic:
  1. Close any active mesocycle (set finishedAt).
  2. Create new meso with id, startedAt, lengthWeeks (default 5), rirSchedule.
  3. If opts.resensitize === true → call chooseNewExercises(...) to rotate.
  4. For each muscle with mev > 0, set perMuscleVolume week 1 = mev.
  5. Set u.rp.currentMesocycleId; updateUser/saveStore.
  6. Trigger program generation for week 1.
Returns: the new mesocycle object.
```

```
File: src/js/25-rp-engine.js
Function: chooseNewExercises(currentSelection, pool)
Purpose: Rotate exercise pool for resensitization (max ~50% overlap with prior meso).
Logic:
  1. For each muscle, take the muscle's exercise pool (from §4.3 selection rules).
  2. Exclude ≥50% of currentSelection[muscle]; keep user's favorites flag if set.
  3. Fill to 3 exercises/muscle from the pool, biasing variety (different movement
     patterns across the 3).
Returns: { [muscle]: exId[] }
```

```
File: src/js/25-rp-engine.js
Function: generateRpWeek(mesocycle, weekNum, u)
Purpose: Build the program for a specific week inside a mesocycle.
Logic:
  1. For each muscle, compute this week's target sets:
       baseSets = mesocycle.perMuscleVolume[muscle][weekNum-1]
       Adjusted: if prior week feedback says "overload" (workload=3, soreness=3)
         → hold sets flat (no progression); if "undershoot" → add sets.
  2. Distribute sets across exerciseSelection[muscle] and training days.
  3. For each day, build Day → Block (blockType: "rp-hypertrophy") → Exercise list.
  4. Apply this week's RIR from mesocycle.rirSchedule.
  5. Apply this week's rep range from repRangeSchedule.
  6. Return a UserRecord-compatible program[] array for this week.
Returns: Day[]
```

```
File: src/js/25-rp-engine.js
Function: captureSessionFeedback(sessionId, feedback)
Purpose: Save 3-question feedback at finishWorkout time.
Logic:
  updateUser(u => {
    const s = u.sessions.find(x => x.id === sessionId);
    if (s) s.feedback = feedback;
  });
Returns: void
```

```
File: src/js/25-rp-engine.js
Function: adjustVolumeFromFeedback(mesocycle, weekNum)
Purpose: At week boundary, use prior week's feedback to plan next week's sets.
Logic:
  1. For each muscle with > 0 sets last week:
       Aggregate pump/soreness/workload across sessions.
       Apply RP's progression rules:
         avgWorkload <= 1 → add 2 sets
         avgWorkload == 2 → add 1 set
         avgWorkload == 3 && soreness <= 2 → hold flat
         avgWorkload == 3 && soreness == 3 → remove 1 set (approaching MRV)
       Clamp to muscle's MRV.
  2. Write nextWeekPlanned into mesocycle.perMuscleVolume.
Returns: void (mutates mesocycle).
```

### 4.6 Modified functions

```
File: src/js/13-start-finish.js
Function: finishWorkout()
Change: After sets/volume/prCount, before updateUser, collect feedback from the
        UI's 3-question sheet (§4.7). Attach as session.feedback.
Risk: Adds a user step at finish time. Mitigation: feedback is skippable; dismiss
      = empty object.
```

```
File: src/js/05-program-templates.js
Function: N/A — add template entry
Change: Add templateId "rp-hypertrophy". Unlike other templates, this one has
        no pre-baked program[]; user.program is generated on-the-fly by
        generateRpWeek from u.rp.mesocycles[currentMesocycleId].
Risk: Breaks the pattern that templates are static. OK — documented as the
       first "generative" template.
```

```
File: src/js/07-day-rotation.js
Function: advanceWeek()
Change: If u.templateId === "rp-hypertrophy":
          - Call adjustVolumeFromFeedback(meso, u.currentWeek)
          - Call generateRpWeek(meso, u.currentWeek + 1, u) and write to u.program
          - Update meso.currentWeek
Risk: Path branches; write test for RP vs non-RP advance.
```

```
File: src/js/10-render-workout.js
Function: Day/Block rendering
Change: If block.blockType === "rp-hypertrophy":
          - Show current RIR target badge on the block header
          - Show "Week X of Y" within mesocycle in the block meta
          - Show per-muscle volume indicator (sets logged this week vs MEV/MAV/MRV
            as a small horizontal bar)
Risk: Visual clutter. Mitigation: use the existing chunky-card aesthetic but keep
      the indicator collapsible.
```

### 4.7 UI — End-of-session feedback sheet

```
Location: Bottom sheet, triggered at Finish Workout press on any session that
          trained ≥ 1 muscle with an rp-hypertrophy block.
Element: A 3-question card per muscle trained. Per muscle:
  <div class="rp-feedback-muscle">
    <h4>Chest</h4>
    <div class="rp-feedback-row">
      <label>Pump</label>
      <div class="rp-feedback-pills">
        [none] [mild] [good] [insane]     (0, 1, 2, 3)
      </div>
    </div>
    <div class="rp-feedback-row">
      <label>Soreness</label>
      [none] [mild] [notable] [painful]
    </div>
    <div class="rp-feedback-row">
      <label>Workload</label>
      [easy] [pretty good] [pushing it] [too much]
    </div>
  </div>
Interaction:
  - Tap pill → stores that value
  - Primary "Save feedback" button at bottom
  - Tertiary "Skip — ask me next time" link (dismissed for this session)
  - On Save → captureSessionFeedback; close sheet; show PR toast
Touch targets: 44px pills, chunky borders, press-translate. Per §1 Design Language.
```

### 4.8 UI — Mesocycle start / resensitization flow

```
Location: New "Start mesocycle" flow in Settings → Program or via program picker.
Flow:
  Step 1: "How long?" → pill grid [4 / 5 / 6] weeks
  Step 2: "Rep range preference?" → pills [strength-leaning 6-10 / balanced 8-12 / pump 10-15]
  Step 3: "New exercises?" → toggle resensitize (on/off) with preview of pool changes
  Step 4: "MEV/MAV/MRV?" → collapsible advanced panel; defaults shown
  Step 5: "Ready?" → "Start mesocycle" button → startMesocycle(opts)
```

### 4.9 Edge cases

1. **User on rp-hypertrophy skips feedback.** `session.feedback = {}`. `adjustVolumeFromFeedback` treats missing feedback as "hold flat" (no progression, no deload).
2. **User deletes a past session in the current mesocycle.** Recomputed `completedSets` for that week drops. Next-week plan adjusts. §5 (edit workstream) covers this interaction.
3. **User switches from rp-hypertrophy to another template mid-mesocycle.** Close current meso (set finishedAt); u.rp data preserved; new template takes over program generation.
4. **Day-to-day set distribution.** If a muscle needs 14 sets/week and user has 4 training days, distribute 3-4-4-3 or similar. Edge: 2 training days + 16 sets = 8+8 per day = very long session. Guard: cap per-session per-muscle volume at 8 sets; surplus triggers recommendation to add a training day.
5. **Partial mesocycle completion.** User quits at week 3 of 5. Mesocycle stays open until user explicitly ends it or starts a new one.
6. **Exercise in selection no longer in library.** Fall back: pick another exercise from the muscle's pool; toast the user.

### 4.10 Verification

```
Build: node build.js
Test: node test-v3.js  (add tests for: startMesocycle, generateRpWeek, adjustVolumeFromFeedback)
Manual check:
  1. Create RP meso → week 1 generated → log sessions with feedback
  2. Advance week → week 2 volume increased per feedback rule
  3. Advance to final week → deload week lands with reduced sets and RIR
  4. End meso → start new meso with resensitize on → exercises differ ≥ 50%
  5. RIR target displayed on each rp-hypertrophy block
```

### 4.11 Acceptance criteria

- [ ] `APP_VERSION = 11`; migrations v10 and v11 pass test
- [ ] rp-hypertrophy template exists and is selectable in the program picker
- [ ] A mesocycle runs end-to-end: generate week 1 → log → advance → feedback adjusts week 2 → … → deload week → end
- [ ] Per-session feedback sheet fires on finish for rp blocks only
- [ ] Volume indicator shows per-muscle position vs MEV/MAV/MRV on day render
- [ ] Resensitization swaps ≥ 50% of exercises across consecutive mesocycles
- [ ] Non-RP users see no feedback sheet, no RIR badges, no behavior change

---

## 5. Workstream D — Edit Past Workouts

New workstream from Kenny's requirement. Today there's no set-level edit path; only session-level delete (undo toast) and retroactive "manual" session add.

### 5.1 What it does

- On any session in the timeline detail sheet, allow editing: set weight, set reps, set RPE, add a set, delete a set, change the session timestamp.
- On save, recompute `volume` and `prCount` for the edited session, then run a global `isPR` recompute pass across all sessions (chronological, authoritative).
- Invalidate any A+ suggestion that references edited sets (recompute on next render — no cache today, so mostly a test requirement).
- Preserve the original set values in an `_original` shadow on each edited set, enabling a per-session "Revert changes" action for 7 days.

### 5.2 Current state (investigation summary)

**Existing paths:**
- `openSessionDetail(session)` in `09a-timeline-strip.js:230` — read-only display of grouped sets, only interactive button is "🗑 Delete this session" (line 259).
- `openAddWorkout(dateMs)` → `openLogSets(dateMs, day)` at line 308-445 — retroactive session log with editable weight/reps; saves with hardcoded `rpe: 7`, `duration: 3600`, `finishedAt` = noon on target date, `manual: true`.
- `deleteSession(sessionId)` at line 279 — filters out; no recompute.
- `undoDeleteSession()` at line 285 — restores from in-memory `_undoPending`; ~5s window.

**What's missing:**
- No per-set edit UI on finished sessions.
- No per-set delete on finished sessions.
- No timestamp edit for an existing session.
- RPE capture on manual/retroactive sessions (hardcoded 7).
- PR re-computation across all sessions when any session mutates.

**Invariants to maintain:**
- `session.prCount` = count of `set.isPR === true`
- `set.isPR` = this set was the best e1RM for its exId up to this session (chronological)
- `session.volume` = sum of `weight * reps` where not bodyweight
- `session.programWeek` unchanged by set-level edits; must be recomputed if `finishedAt` moves across a program-week boundary

### 5.3 Data model

**`Session` shape — add:**

```js
session.editedAt = null | number;      // ms of last edit; null if never edited
session.originalFinishedAt = null | number;  // only set if timestamp was edited
```

**`Set` shape — add (for edited sets):**

```js
set._original = null | {               // preserved for revert; cleared after 7 days
  weight, reps, rpe, bodyweight, isPR,
  editedAt: number
};
```

### 5.4 Migration — v12 (optional, additive)

Only needed if we want explicit defaults. Defensive reads handle missing fields; skip migration to minimize churn. Defensive defaults added in `loadStore`:

```js
// in loadStore — defensive
(u.sessions || []).forEach(s => {
  if (s.editedAt === undefined) s.editedAt = null;
  if (s.originalFinishedAt === undefined) s.originalFinishedAt = null;
});
```

### 5.5 New functions

```
File: src/js/15b-session-edit.js (new)
Function: openSessionEditor(session)
Purpose: Render the edit UI inside the detail sheet. Replaces current openSessionDetail
         in place when user taps "Edit".
Logic:
  1. Deep-clone the session for local editing state.
  2. For each set: render row with steppers for weight/reps and RPE bubble grid
     (reuse set-editor component from 10-render-workout.js:1084).
  3. Each row has an X button to delete.
  4. Sheet footer: "Add set" button (opens exercise picker), "Change date" button,
     "Save", "Cancel", "Revert to original" (only if session._original exists),
     "Delete session" (existing).
  5. Cancel → close, discard changes.
  6. Save → saveSessionEdits(editedSession) → closeSheet → re-render.
Returns: void
```

```
File: src/js/15b-session-edit.js
Function: saveSessionEdits(editedSession)
Purpose: Persist edits, recompute invariants, audit-trail.
Logic:
  1. Diff editedSession against the current session in u.sessions.
  2. For each set that changed, stamp set._original = deepClone(oldSet) + editedAt.
  3. If session.finishedAt changed, store session.originalFinishedAt.
  4. Recompute session.volume from sets.
  5. Update u.sessions (replace entry); resort if finishedAt changed.
  6. Recompute session.programWeek if finishedAt moved across week boundary.
  7. Call recomputeAllIsPR() — global chronological pass.
  8. updateUser / saveStore.
Returns: void
```

```
File: src/js/15b-session-edit.js
Function: recomputeAllIsPR()
Purpose: Global authoritative recompute of set.isPR flags and session.prCount.
Logic:
  1. Sort u.sessions by finishedAt asc.
  2. Maintain priorBest[exId] = { score, sessionId, setIdx }.
  3. Walk sessions in order; for each set:
       score = calcE1RM(set.weight, set.reps)
       if score > priorBest[exId].score (or no prior):
         set.isPR = true
         priorBest[exId] = { score, ... }
       else
         set.isPR = false
  4. Recompute s.prCount = s.sets.filter(x => x.isPR).length for every session.
Returns: void (mutates u.sessions in place within updateUser).
Performance: O(N * M) where N=sessions, M=sets/session. 365 × 30 = ~11k ops. Fast.
```

```
File: src/js/15b-session-edit.js
Function: revertSession(sessionId)
Purpose: Restore edited sets to their _original values.
Logic:
  1. For each set with set._original:
       restore weight, reps, rpe, bodyweight, isPR to originals
       delete set._original
  2. If session.originalFinishedAt, restore and clear.
  3. Clear session.editedAt.
  4. Recompute volume, prCount (local); call recomputeAllIsPR().
Returns: void
```

### 5.6 Modified functions

```
File: src/js/09a-timeline-strip.js
Function: openSessionDetail(session)
Change: Replace the read-only exercise list with a switch: default view read-only,
        top-right "Edit" button opens openSessionEditor(session). Keep existing
        "Delete session" button.
Risk: Low. Edit is behind an explicit tap.
```

```
File: src/js/09a-timeline-strip.js
Function: openLogSets(dateMs, day) — existing retroactive log
Change: Remove hardcoded rpe: 7. Add an RPE bubble grid per exercise row; default
        unselected ("skip" allowed → sets saved with rpe: null).
        Record duration from user input or keep 3600 default (minor).
Risk: Users may skip RPE on quick retroactive entries. That's fine; suggestedWeight
      downgrades confidence to "low" when RPE is null/default.
```

```
File: src/js/09a-timeline-strip.js
Function: deleteSession(sessionId)
Change: After filtering, call recomputeAllIsPR() so global PR flags stay authoritative.
Risk: Small performance cost on delete. Acceptable.
```

```
File: src/js/09a-timeline-strip.js
Function: undoDeleteSession()
Change: Call recomputeAllIsPR() after restoring.
Risk: Same as above.
```

### 5.7 UI — Session edit mode

```
Location: Bottom sheet, replaces openSessionDetail content when user taps Edit.
Element:
  <div class="session-editor">
    <h3>Edit Workout — {dateStr}</h3>
    <button>Change date</button>                         // opens date picker
    {for each set:
      <div class="session-editor-set">
        <span>{exName}</span>
        <stepper weight />  <span>×</span>  <stepper reps />
        <rpe-grid value={rpe} />
        <button class="danger-small">×</button>          // delete set
      </div>
    }
    <button>+ Add set</button>                           // picker → new set row
    <hr>
    <div class="session-editor-footer">
      <button>Cancel</button>
      {if session.editedAt}<button>Revert</button>{/}
      <button class="danger">Delete session</button>
      <button class="primary">Save</button>
    </div>
  </div>
Interaction:
  - Save → saveSessionEdits → close sheet → timeline re-renders → PR board re-renders
  - Cancel → discard, close sheet
  - Revert → revertSession(id), stays open with restored values, re-render editor
  - Delete session → existing flow with undo toast
Touch targets and styling match existing set-editor component.
```

### 5.8 Edge cases

1. **Edit a set's weight upward past all other sessions for that exId.** `recomputeAllIsPR()` reassigns PR to the edited set; prior session loses its PR. PR toast on save: "New all-time PR: +5 lbs on Bench" or "Edit changed 2 PR flags".
2. **Edit a past set's RPE from 7 to 10.** A+ suggestions for that exercise will be more conservative on next render. No user-visible immediate change until next workout.
3. **Edit session timestamp across a program-week boundary.** `session.programWeek` recomputes based on new `finishedAt` vs `u.programStartDate`. If this removes the week's completion trigger for advanceWeek, weekly rollover is unaffected (it only fires on finish). If it moves a session INTO the current week, the fatigue signal for this week's end recomputes.
4. **Revert after 7 days.** A weekly cleanup in `loadStore` clears `set._original` entries older than 7 days. Flag in §9.
5. **Delete all sets in an edit.** Save prompts: "This session will have zero sets. Delete the whole session instead?" Yes/No.
6. **Edit manual (retroactive) session.** Same editor; if RPE was null, show "—" and let user set it.
7. **Timestamp edit on a pre-RP migration session.** Legacy sessions without `feedback` field remain empty; no impact.
8. **PR-recompute on very large histories.** Cap at 365 sessions already enforced. Fine.

### 5.9 Verification

```
Build: node build.js
Test: node test-v3.js
Add tests:
  - Edit a set's weight → volume updates, prCount updates
  - Global isPR recompute correctness (seed 5 sessions chronologically, confirm flags)
  - Revert restores original values
  - Delete session then undo → isPR flags correct
Manual check:
  1. Open a past session → tap Edit → change one weight → Save → confirm value persists
  2. Change session date → timeline pill moves
  3. Delete a set → save → session shows one fewer set → prCount recomputed
  4. Revert → original values back
```

### 5.10 Acceptance criteria

- [ ] Edit UI accessible from session detail sheet
- [ ] Set-level edits persist and recompute volume + prCount
- [ ] Timestamp edits recompute programWeek correctly
- [ ] `recomputeAllIsPR()` is called on every session mutation (edit, delete, undo, add manual)
- [ ] Revert restores pre-edit values for 7 days
- [ ] Retroactive log (existing manual-add path) no longer hardcodes RPE
- [ ] Unit tests pass for saveSessionEdits, recomputeAllIsPR, revertSession

---

## 6. Cross-Cutting — Prompt-When-Missing Catalog

Per §1.1, here's the exhaustive list of engine inputs that may be missing at decision time, with prompt copy and storage location.

| # | Input | When missing | Trigger | Prompt copy | Storage | Workstream |
|---|---|---|---|---|---|---|
| 1 | User bodyweight | First BW-lift log after RP enable | Inline, above first BW set | "What's your current bodyweight? I need this to track your true load on {exName}." | `u.measurements[]` (single source of truth; read via `userBodyweightAt(dateMs)`) | B |
| 2 | RPE calibration | First RP-enabled set | Inline, once per user | "Quick calibration: RIR 4 means 4 reps left in the tank. RIR 0 is failure. Tap any RIR after each set." | `u.rp.rpeCalibrationCompletedAt` | B |
| 3 | Cold-start anchor | First log of an exercise | Replaces pre-fill weight | "First time logging {exName}. Anchor today's weight so I can suggest for next time." | `u.rp.coldStartAnchors[exId]` | B |
| 4 | First-in-range | First time logging exercise at reps > 2 away from history | Small inline note, not blocking | "Different rep range for {exName} — estimate may be less precise." | None (informational) | B |
| 5 | Stale bodyweight (>30d) | Bodyweight capture > 30d old | Small banner on body-weight tab | "Last BW entry was {X} days ago. Update to keep load math accurate?" | Writes to `u.measurements[]` | B |
| 6 | Target RIR | Non-RP program, A+ enabled, no meso | First set of session | "Target RIR for this session? (default 2 — grinders leave 0, easy leaves 3+)" | `u.draft.targetRIR` (session-level) | B |
| 7 | Machine calibration | First time on unfamiliar machine | Optional inline note on first set | "New to this machine? Start ~10% lighter than your plate math suggests." | None (advisory) | B (deferred) |
| 8 | MEV/MAV/MRV | New RP user | Advanced panel in mesocycle start flow | "Using RP defaults. Tap to customize per muscle." | `u.rp.volumeLandmarks` | C |
| 9 | Mesocycle length | New mesocycle | Step 1 of meso-start flow | "How long this mesocycle? 4 weeks (fast) / 5 / 6 (longer)" | `mesocycle.lengthWeeks` | C |
| 10 | Rep range preference | New mesocycle | Step 2 of meso-start flow | "Strength-leaning (6-10), balanced (8-12), or pump (10-15)?" | `mesocycle.repRangeSchedule` | C |
| 11 | Resensitization | New mesocycle | Step 3 of meso-start flow | "Swap ~50% of exercises for this meso?" | `mesocycle.exerciseSelection` | C |
| 12 | Per-session feedback | End of RP-block session | Sheet at finish | "Pump / Soreness / Workload for {muscle}?" (per-muscle) | `session.feedback[muscle]` | C |
| 13 | Retroactive RPE | Edit past session with null RPE | Inline in session editor | "This set had no RPE. Set one now?" | `set.rpe` via saveSessionEdits | D |
| 14 | Injuries / contraindications | Rotation picks contraindicated lift | Inline in mesocycle-start flow step 3 | "{exName} may not suit — we saw a knee flag in onboarding. Replace?" | Reads from `kn-lifts-trainer-profile` | C |

**Pattern rules:**
- Prompts are **inline cards**, never modal overlays.
- Every prompt has a **Skip** option that preserves behavior (with a visible "gym default" footnote).
- Skipping does NOT count as data; the prompt may re-surface next time for the same decision.
- Prompts cap at **one per view** — never stack. If multiple fire at once, queue and show sequentially with smooth transitions.

---

## 7. Sequencing & Acceptance

Order the workstreams by **dependency and risk**. Each chunk must pass its acceptance criteria before the next starts.

### Chunk 1: Library Retag (Workstream A)
**Blocks everything else.** No A+, no B, no edit-workstream can ship without a locked taxonomy.

**Status:** Ready — all blocking items resolved (§9.1).

**Deliverables:**
- Full library re-tagged with locked vocab + `setContribution`
- Migration v8 passing tests (stamps `_remappedAt: 8` on fallback-path sets per [R-2])
- Balance tab donut renders with weighted counts via `effectiveSetsByMuscle`
- One-shot changelog toast on first post-v8 launch ([R-2] copy)
- `groupMuscle(m)` updated to locked vocab groupings

**Estimated scope:** ~4 hours of library retag + ~2 hours of migration/code/test. Single sitting feasible.

**Gate:** All acceptance criteria in §2.12.

**Optional side task in Chunk 1:** stub the Library Audit surface [N-11] as a Settings entry that renders "No remapped entries" if `_remappedAt:8` count is zero. Full UI can land later; just reserve the surface.

---

### Chunk 2: A+ Autoregulation Core (Workstream B, excluding fatigue recommendation)
Ship `suggestedWeight`, cold-start, bodyweight prompts, RPE calibration. **Defer** fatigue recommendation to Chunk 3 (needs session.feedback from Workstream C).

**Deliverables:**
- `u.rp` container + migration v9
- `25-rp-engine.js` with recentE1RM, suggestedWeight, bodyweightE1RM, userBodyweightAt
- Inline prompt component + three prompt variants (cold-start, bodyweight, RPE calibration)
- Suggestions surface on set rows when `u.rp.enabled`
- Opt-in toggle in Settings

**Estimated scope:** 1-2 focused sessions.

**Gate:** All acceptance criteria in §3.12 except the fatigue-signal row (defer).

---

### Chunk 3: Edit Past Workouts (Workstream D)
Lands before C because: (a) it's a discrete user need independent of RP, (b) it establishes `recomputeAllIsPR()` which both A+ and B benefit from, (c) it unblocks honest historical RPE for A+'s e1RM confidence.

**Deliverables:**
- `15b-session-edit.js` with openSessionEditor, saveSessionEdits, recomputeAllIsPR, revertSession
- Edit UI on session detail sheet
- Retroactive log stops hardcoding RPE
- Delete/undo recompute PR flags
- Unit tests for invariant recomputation

**Estimated scope:** 1 session.

**Gate:** All acceptance criteria in §5.10.

---

### Chunk 4: Mesocycle + RP Hypertrophy Program (Workstream C)
Everything A and D have enabled: library weights, honest e1RM, editable history. Now build the real RP program.

**Deliverables:**
- Migrations v10 (landmarks + mesocycle container) and v11 (session.feedback)
- `rp-hypertrophy` template + generative program logic
- Mesocycle start flow (5 steps)
- Per-session feedback sheet
- `adjustVolumeFromFeedback` + volume indicator UI
- Resensitization flow

**Estimated scope:** 3-4 focused sessions. Largest chunk.

**Gate:** All acceptance criteria in §4.11.

---

### Chunk 5: Fatigue Recommendation (finish Workstream B)
Plugs into C's feedback data. Surfaces deload recommendations.

**Deliverables:**
- `computeFatigueSignal` in engine
- Deload recommendation card at week rollover
- Accept/dismiss both work
- Tests seeded with mock feedback

**Estimated scope:** half a session.

**Gate:** Fatigue-signal row of §3.12.

---

### Post-ship tasks (optional)
- Volume trend visualization (Chunk 6 — visualization of `effectiveSetsByMuscle` over time)
- Injury flag → rotation warning (part of §6 row 14)
- Machine calibration prompts (§6 row 7)

---

## 8. Data Model Diffs — At a Glance

| Field | Type | Location | Introduced in | Workstream |
|---|---|---|---|---|
| `LIBRARY[n].setContribution` | `{[muscle]:number}` | `01-exercise-library.js` | v8 | A |
| `LIBRARY[n].patterns` | `string[]` (optional) | `01-exercise-library.js` | v8 | A |
| `LIBRARY[n].subMuscles` | `string[]` (optional) | `01-exercise-library.js` | v8 | A |
| `u.rp` | object | `UserRecord` | v9 | B |
| `u.rp.enabled` | boolean | `UserRecord` | v9 | B |
| `u.rp.coldStartAnchors` | `{[exId]:{weight,reps,dateMs}}` | `UserRecord` | v9 | B |
| `u.rp.rpeCalibrationCompletedAt` | number \| null | `UserRecord` | v9 | B |
| `u.rp.lastDeloadRecommendedAt` | number \| null | `UserRecord` | v9 | B |
| `u.rp.dismissedDeloadForWeek` | number \| null | `UserRecord` | v9 | B |
| `u.rp.volumeLandmarks` | `{[muscle]:{mev,mav,mrv}}` | `UserRecord` | v10 | C |
| `u.rp.mesocycles` | `Mesocycle[]` | `UserRecord` | v10 | C |
| `u.rp.currentMesocycleId` | string \| null | `UserRecord` | v10 | C |
| `session.feedback` | `{[muscle]:{pump,soreness,workload}}` | `Session` | v11 | C |
| `session.editedAt` | number \| null | `Session` | defensive | D |
| `session.originalFinishedAt` | number \| null | `Session` | defensive | D |
| `set._original` | object \| null | `Set` | defensive | D |
| `block.blockType` | `"rp-hypertrophy" \| ...` | `Block` | v10 (soft) | C |

---

## 9. Risks & Open Questions

**RESOLVED** — decided by Kenny on 2026-04-22, locked into the plan above. **NON-BLOCKING** can be decided during implementation.

### 9.1 RESOLVED (no action required — plan reflects the decision)

1. **[R-1] Bodyweight storage — DECIDED: single source of truth in `u.measurements[]`.** The RP engine does not own bodyweight. `userBodyweightAt(dateMs)` (§3.5.4) reads directly from `u.measurements[]` and interpolates. No mirror in `u.rp`, no denorm on `Session`. Rationale: zero duplication, matches existing schema pattern (measurements[] already has `{date, weight, unit}`), eliminates sync concerns. Prompt-when-missing (§6 row 1) writes straight to `u.measurements[]` — same path as the body-weight tab.

2. **[R-2] "Shoulders" legacy remap — DECIDED: accept with changelog toast + Library Audit surface.** The v8 migration's name-map fallback treats legacy `"shoulders"` as `["front delts", "side delts"]`. Preferred-path exId lookup handles every library entry correctly, so the fallback only bites data tied to deleted or custom exercises — a narrow edge case. Rear-delt volume will read low for those orphaned entries.
    - **Changelog toast copy** (fires once on first launch post-v8, dismissible):
      > *"Some older entries tagged 'shoulders' were remapped to front/side delts. Rear-delt volume for those entries may read low — open Library → Audit to fix."*
    - **Library Audit surface** (new, lightweight — scoped as N-new below): a one-shot settings screen that lists sessions containing sets whose `muscles[]` came through the name-map fallback (trackable via a `_remappedAt: 8` flag set by the migration). User can tap a set and reclassify its muscles manually. If they never open it, no harm done; the app still functions with the slight undercount.

3. **[R-3] Mesocycle schema — DECIDED: ship at once in v10.** The full mesocycle object (`perMuscleVolume` with `plannedSets`/`completedSets`, `rirSchedule`, `repRangeSchedule`, `exerciseSelection`) lands together in migration v10. Splitting it would compound migration churn for a tightly coupled object and create a zombie state where a meso exists but can't progress. `adjustVolumeFromFeedback` (§4.5) may ship slightly after the rest of Workstream C if needed, but the schema is atomic.

### 9.2 NON-BLOCKING

4. **[N-1] Machine calibration.** §3.5.2 mentions machine detection but doesn't specify logic. Defer to a follow-up post-ship.

5. **[N-2] `set._original` cleanup.** §5.4 suggests 7-day TTL. Could also be: cleared on next meso, or never cleared. Recommendation: 7 days, cleaned up in `loadStore`.

6. **[N-3] Exports & imports across migrations.** `17-export.js` emits current-schema data. An export pre-v8 imported post-v8 would fail validation unless `06c-import.js` runs through the migration pipeline. Recommendation: document "re-export after each major version" in `README.md`.

7. **[N-4] Fatigue signal threshold.** §3.5.5 uses `pct >= 0.4 && weeks_since >= 3`. These are guesses; tune after dogfooding for a mesocycle.

8. **[N-5] Recency weights in `recentE1RM`.** §3.5.1 uses `[0.5, 0.3, 0.2]` across 3 sessions. Tunable; expose as `u.rp.suggestEnginePrefs` if we want per-user control.

9. **[N-6] Per-session per-muscle set cap.** §4.9 edge 4 hard-codes 8 sets/muscle/session as a warning. RP convention is ~10 but Israetel has noted diminishing returns past 8. Keep 8 as warning threshold; not a hard block.

10. **[N-7] `session.feedback` for sessions pre-v11.** Defensive default is `{}`. Fine. But the feedback-driven volume adjustment in §4.5 needs at least one week of feedback to work; first week of a new meso runs on MEV defaults only. Expected.

11. **[N-8] Reverting a session that was used to anchor a meso.** If Kenny deletes the first session of a mesocycle (which seeded cold-start anchors), the anchors remain but their grounding session is gone. Low-risk but worth a test.

12. **[N-9] Library retag: custom exercises.** Verify no user has a custom exercise via program-builder. `24-program-builder.js:255` mentions "Block editor for one day" — check whether custom exercises exist in any users' programs and, if so, fall back gracefully in migration.

13. **[N-10] Inline prompt queue UX.** §6's "one prompt per view" rule needs concrete render logic — where does the queue live? Recommendation: single `_rpPromptQueue` on `state` (not persisted), first element rendered, dequeued on dismiss or save.

14. **[N-11] Library Audit surface (follow-on from [R-2]).** Needs spec: where it lives (Settings → Library Audit or a direct top-level entry?), its render logic (list sessions with `_remappedAt: 8` flag on sets, grouped by exercise), and its reclassification UI (reuses the inline prompt pattern to pick new muscles from the locked vocab, then clears `_remappedAt`). Also requires: the v8 migration must stamp `set._remappedAt = 8` on any set that took the name-map fallback path (not the preferred exId-lookup path). Low priority — only users with custom/deleted exercises see the banner. Scope as a side task during Chunk 1.

15. **[N-12] Stale-bodyweight prompt timing (follow-on from [R-1]).** §6 row 5 fires a prompt when the latest `u.measurements[]` weight entry is > 30 days old. Open: does this block the suggestion (stale data may mean inaccurate load math) or just flag it? Recommendation: soft flag — show a small banner above the set row ("Bodyweight is 45 days old — update?") but still compute the suggestion using the most recent available. User can dismiss per-session.

---

## 10. What this plan does not cover

For scope clarity:
- **No UI visual design.** Chunky/bubbly aesthetic from `CLAUDE.md` [DESIGN-00001] carries through; exact colors/shadows per element TBD at implementation.
- **No exhaustive copy review.** Prompt copy in §6 is first-draft; run `design:ux-copy` before shipping.
- **No periodized cardio / hybrid concurrent training.** Out of scope per audit.
- **No KOT-specific programming.** Handled by separate future workstream.
- **No export-format changes.** v3 export format continues; new fields silently exported.

---

## 11. Next actions

1. ~~Kenny reviews this plan and resolves §9.1 blocking questions.~~ **Done 2026-04-22** — see §9.1 [R-1], [R-2], [R-3].
2. **Open Chunk 1 (Library Retag) as a working session.** Load `fitness-trainer:program-advisor` and walk the library category-by-category. Deliverables and gate in §7 Chunk 1.
3. **Ship Chunk 1.** Don't start Chunk 2 until all §2.12 acceptance criteria pass.
4. **Cross-link back:** when Chunk 1 ships, append a "Chunk 1 Complete" note at the top of this file with commit SHA.

---

**End of plan.**
