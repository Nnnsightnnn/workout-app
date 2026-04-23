# exportWorkoutData() — JavaScript Function Spec

This document specifies the `exportWorkoutData()` function to be added to `workout-app.html`
(and its source in `src/js/17-export.js`). It allows external tools — including the
`fitness-trainer` Cowork plugin — to read a structured JSON dump of all workout data.

---

## Purpose

The existing `exportData()` function writes a JSON file download. This new function does the
same but returns a **clean, Claude-readable JSON object** (without browser file I/O) and can
also copy it to the clipboard for easy pasting into Cowork.

---

## Function Signature

```js
function exportWorkoutData(options = {}) {
  // options.format: "json" (default) | "clipboard" | "download"
  // returns: the data object (always, regardless of format)
}
```

---

## Return Schema

The function returns the full `kn-lifts-v3` localStorage value, cleaned and annotated:

```json
{
  "_schemaVersion": 3,
  "_exportedAt": "2026-04-15T10:30:00.000Z",
  "_appVersion": "3.x.x",
  "unit": "lbs",
  "currentUserId": "u_abc123_xyz",
  "users": [
    {
      "id": "u_abc123_xyz",
      "name": "Kenny",
      "templateId": "conjugate5",
      "lastDoneDayId": 3,
      "programStartDate": null,
      "weeklySchedule": null,
      "program": [
        {
          "id": 1,
          "name": "ME Lower",
          "sub": "Max Effort — Squat / Deadlift",
          "blocks": [
            {
              "id": "b_lower_main",
              "label": "Main Lift",
              "exercises": [
                {
                  "exId": "backsquat",
                  "name": "Back Squat",
                  "muscles": ["quads", "glutes", "hamstrings"],
                  "sets": 3,
                  "reps": "5",
                  "defaultWeight": 135,
                  "isWarmup": false
                }
              ]
            }
          ]
        }
      ],
      "sessions": [
        {
          "id": "s-1712345678901",
          "dayId": 1,
          "dayName": "ME Lower",
          "startedAt": 1712340000000,
          "finishedAt": 1712345678901,
          "duration": 3240,
          "volume": 14850,
          "prCount": 1,
          "manual": false,
          "sets": [
            {
              "exId": "backsquat",
              "exName": "Back Squat",
              "muscles": ["quads", "glutes", "hamstrings"],
              "setIdx": 1,
              "weight": 225,
              "reps": 5,
              "rpe": 8,
              "isPR": true
            }
          ]
        }
      ],
      "measurements": []
    }
  ]
}
```

---

## Fields Added by Export (Not in Raw localStorage)

| Field | Type | Description |
|-------|------|-------------|
| `_exportedAt` | ISO string | Timestamp of when export was called |
| `_appVersion` | string | Value of `APP_VERSION` constant |

The `draft` field (in-progress workout) is **excluded** from the export — it's transient state
and not useful for external analysis.

---

## Implementation Notes

### In `src/js/17-export.js`

```js
function exportWorkoutData(options = {}) {
  const format = options.format ?? "json";
  const raw = loadStore();

  // Strip draft (transient) and annotate
  const data = {
    _schemaVersion: raw._schemaVersion,
    _exportedAt: new Date().toISOString(),
    _appVersion: typeof APP_VERSION !== "undefined" ? APP_VERSION : "unknown",
    unit: raw.unit,
    currentUserId: raw.currentUserId,
    users: (raw.users || []).map(u => ({
      id: u.id,
      name: u.name,
      templateId: u.templateId,
      lastDoneDayId: u.lastDoneDayId ?? null,
      programStartDate: u.programStartDate ?? null,
      weeklySchedule: u.weeklySchedule ?? null,
      program: u.program ?? [],
      sessions: (u.sessions ?? []).map(s => ({
        id: s.id,
        dayId: s.dayId,
        dayName: s.dayName,
        startedAt: s.startedAt,
        finishedAt: s.finishedAt,
        duration: s.duration,
        volume: s.volume ?? 0,
        prCount: s.prCount ?? 0,
        manual: s.manual ?? false,
        sets: s.sets ?? []
      })),
      measurements: u.measurements ?? []
      // NOTE: draft intentionally omitted
    }))
  };

  const json = JSON.stringify(data, null, 2);

  if (format === "clipboard") {
    navigator.clipboard.writeText(json)
      .then(() => showToast("Workout data copied to clipboard", "success"))
      .catch(() => showToast("Clipboard failed — use Download instead", "error"));
  }

  if (format === "download") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kn-lifts-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return data;
}
```

### UI Integration

Add an **"Export for Claude"** button to the existing export/tools section:

```html
<button onclick="exportWorkoutData({ format: 'clipboard' })">
  Copy for Claude
</button>
```

This copies the JSON to clipboard so the user can paste directly into a Cowork conversation.

The existing `exportData()` function (full backup download) should remain unchanged.

---

## Usage in Cowork Plugin

When the fitness-trainer plugin needs data:

1. User opens K&N Lifts → menu → taps "Copy for Claude"
2. User pastes into Cowork conversation
3. Plugin parses the JSON using the schema in `skills/*/references/data-schema.md`

No MCP server or live connection is required — the export is a one-time paste.

---

## Testing

After implementation, verify via browser console:

```js
const data = exportWorkoutData();
console.assert(data._exportedAt, "has exportedAt");
console.assert(Array.isArray(data.users), "users is array");
console.assert(data.users[0].sessions.every(s => !('draft' in s)), "no draft in sessions");
console.assert(data.users[0].sessions[0].sets[0].hasOwnProperty('isPR'), "sets have isPR");
```
