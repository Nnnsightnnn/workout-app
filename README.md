# Workout App

A single-file workout tracker for lifting sessions. Built as a self-contained HTML file — no build step, no server, just open `workout-app.html` in a browser.

## Features

- Multi-user support with arbitrary names (add, switch, rename, delete)
- 5-day default program across squat, bench, deadlift, press, accessory work
- Library-driven default weights — every exercise prefills a sensible starting weight, editable per set
- Draft auto-save per user / per day, so you can close and come back
- Rest timer with Web Audio beep and haptic vibration
- Plate calculator and 1RM estimator tools
- History view with per-muscle volume breakdown
- LocalStorage persistence (`kn-lifts-v3`)

## Run

Open `workout-app.html` in any modern browser. That's it.

## Test

Uses [jsdom](https://github.com/jsdom/jsdom) to run an end-to-end test suite against the app.

```bash
npm install jsdom
node test-v3.js
```

The suite covers first-run flow, user CRUD, library defaults, render prefill, draft persistence, and finish-workout rotation.

## Storage

All state lives in `localStorage` under key `kn-lifts-v3`. Schema:

```
{
  unit: "lbs",
  users: [
    { id, name, program, sessions, draft, lastDoneDayId }
  ],
  currentUserId
}
```
