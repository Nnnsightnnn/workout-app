![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg) ![Single File](https://img.shields.io/badge/distribution-single--file-blue.svg) ![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-green.svg)

# K&N Lifts

A single-file, offline-first progressive overload workout tracker built for real lifters. No accounts, no server, no subscription — open it in a browser and start training. K&N Lifts tracks your sets, logs your PRs, times your rest, and auto-advances your program week over week so you never have to think about what to do next.

---

## Live Demo

**[nnnsightnnn.github.io/workout-app](https://nnnsightnnn.github.io/workout-app/)**

Works on mobile or desktop. Add to your home screen for a native app feel.

---

## Features

### Programs
- 27 program templates spanning every major methodology: Conjugate, Functional Conjugate, Functional Bodybuilding, Hypertrophy PPL+UL, Athletic Performance, 5/3/1 Wave Progression, Tiered Progression, Novice Linear Progression, German Volume Training, PHUL, Powerlifting, Reverse Pyramid, Upper/Lower, Push/Pull/Legs, Classic Bodybuilding, Beginner Full Body, Over-40 Strength, Minimal Equipment, Hybrid Athlete, Calisthenics + Weights, Full ROM Joint Health, Strength + MetCon GPP, Strength + Conditioning, Runner's Strength, Functional Fitness, Glute Builder, and more
- Configurable duration (6–12 weeks) and days per week (2–6)
- Automatic week-over-week phase progression (accumulation → intensification → peak)
- Manual week control — skip forward, go back, or restart without losing history
- Tempo prescriptions for programs that call for controlled rep speed

### Workout Tracking
- Rest timer with audio + vibration cues
- Session timer with estimated time remaining
- Auto-filled previous performance — you always see what you did last time
- Draft preservation — mid-workout state survives a page refresh
- Cool down sequence at session end
- Block-level set comments

### PR Board & History
- Personal records tracked per exercise: top weight, top e1RM, top reps
- Full session history with per-exercise set detail
- Muscle balance tab for volume analysis

### Tools
- Plate calculator — visual bar diagram, lbs and kg
- 1RM estimator (Epley formula)

### Profiles & Data
- Multi-user support — switch between lifters on a shared device
- Onboarding questionnaire (training age, physique goal, weekly availability)
- Body weight and measurement tracking
- Full JSON import / export
- Automatic schema migrations with pre-migration backup and console recovery (`restorePreMigrationBackup()`)

### Platform
- Installable as a PWA (home screen shortcut, standalone mode)
- Fully offline — all data lives in localStorage, nothing leaves your device
- Works when someone sends you `workout-app.html` and opens it cold — no server required

---

## Getting Started

Download [`workout-app.html`](https://github.com/Nnnsightnnn/workout-app/raw/main/workout-app.html) and open it in any browser.

That's it.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Markup | HTML5 |
| Styles | CSS3 (custom properties, flexbox, grid) |
| Logic | Vanilla JS (ES6+) |
| Storage | localStorage |
| Audio | Web Audio API |
| Haptics | Vibration API |
| Dependencies | **Zero** |
| Distribution | **Single file** |

---

## Development

Source lives in `src/`. The build script concatenates JS modules (ordered by numeric prefix) and inlines CSS into a single self-contained `workout-app.html`.

```bash
node build.js        # produce workout-app.html from src/
node test-v3.js      # run the test suite (jsdom, 16 workflow tests)
```

See [`CLAUDE.md`](CLAUDE.md) for full architecture details, guardrails, and schema migration instructions.

---

## Contributing

Pull requests are welcome. Open an issue first for anything substantial. The zero-dependency, single-file constraint is intentional — keep it that way.

---

## License

MIT © 2026 Kenny Autry. See [`LICENSE`](LICENSE).
