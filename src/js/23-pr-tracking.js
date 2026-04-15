// ============================================================
// PR TRACKING — personal records, pinned lifts, e1RM history
// ============================================================

const PR_DEFAULT_LIFT_IDS = ["bench", "backsquat", "deadlift", "strictpress"];

// Epley formula: weight × (1 + reps/30)
function calcE1RM(weight, reps) {
  if (!weight || weight <= 0 || !reps || reps <= 0) return 0;
  return weight * (1 + reps / 30);
}

// Returns pinned lift IDs for current user (stored in user record, falls back to defaults)
function getPinnedLifts() {
  const u = userData();
  if (!u) return PR_DEFAULT_LIFT_IDS.slice();
  if (!u.pinnedLifts) return PR_DEFAULT_LIFT_IDS.slice();
  return u.pinnedLifts.slice();
}

// Pin or unpin a lift. Returns true if now pinned, false if now unpinned.
function togglePinnedLift(exId) {
  const current = getPinnedLifts();
  const idx = current.indexOf(exId);
  let next;
  if (idx >= 0) {
    next = current.filter(id => id !== exId);
  } else {
    next = [...current, exId];
  }
  updateUser(u => { u.pinnedLifts = next; });
  return idx < 0; // true = newly pinned
}

// Returns all historical e1RM data points for one exercise, sorted oldest→newest.
// Each point: { date: timestamp, e1rm: number, weight: number, reps: number }
function getE1RMHistory(exId) {
  const u = userData();
  if (!u) return [];
  const points = [];
  u.sessions.forEach(s => {
    let sessionBestE1RM = 0;
    let sessionBestWeight = 0;
    let sessionBestReps = 0;
    s.sets.forEach(set => {
      if (set.exId !== exId) return;
      if (set.bodyweight || set.weight <= 0) return;
      const e = calcE1RM(set.weight, set.reps);
      if (e > sessionBestE1RM) {
        sessionBestE1RM = e;
        sessionBestWeight = set.weight;
        sessionBestReps = set.reps;
      }
    });
    if (sessionBestE1RM > 0) {
      points.push({
        date: s.finishedAt,
        e1rm: sessionBestE1RM,
        weight: sessionBestWeight,
        reps: sessionBestReps,
        sessionId: s.id
      });
    }
  });
  points.sort((a, b) => a.date - b.date);
  return points;
}

// All-time PR: highest e1RM ever for this exercise.
// Returns { e1rm, weight, reps, date } or null.
function getAllTimePR(exId) {
  const history = getE1RMHistory(exId);
  if (!history.length) return null;
  return history.reduce((best, p) => p.e1rm > best.e1rm ? p : best, history[0]);
}

// Personal bests by rep count (1, 3, 5, 10).
// Returns { 1: { weight, reps, date }, 3: ..., 5: ..., 10: ... }
function getPBsByRepCount(exId) {
  const u = userData();
  if (!u) return {};
  const repTargets = [1, 3, 5, 10];
  const bests = {};
  u.sessions.forEach(s => {
    s.sets.forEach(set => {
      if (set.exId !== exId) return;
      if (set.bodyweight || set.weight <= 0) return;
      repTargets.forEach(target => {
        // For each rep target, find highest weight at exactly that rep count
        // (or closest — accept sets within the rep count for 1RM/3RM/5RM/10RM)
        if (set.reps !== target) return;
        if (!bests[target] || set.weight > bests[target].weight) {
          bests[target] = { weight: set.weight, reps: set.reps, date: s.finishedAt };
        }
      });
    });
  });
  return bests;
}

// Trend: compare current (most recent session) e1RM to 30 days ago.
// Returns { direction: 'up'|'down'|'flat', delta: number, deltaPercent: number }
function getE1RMTrend(exId) {
  const history = getE1RMHistory(exId);
  if (history.length < 2) return { direction: "flat", delta: 0, deltaPercent: 0 };

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const recent = history[history.length - 1];

  // Find the most recent data point older than 30 days ago (or the oldest if nothing that old)
  let baseline = null;
  for (let i = history.length - 2; i >= 0; i--) {
    if (history[i].date <= thirtyDaysAgo) {
      baseline = history[i];
      break;
    }
  }
  // If no point older than 30 days, use the oldest available
  if (!baseline) baseline = history[0];
  if (baseline.sessionId === recent.sessionId) return { direction: "flat", delta: 0, deltaPercent: 0 };

  const delta = recent.e1rm - baseline.e1rm;
  const deltaPercent = baseline.e1rm > 0 ? (delta / baseline.e1rm) * 100 : 0;
  const direction = Math.abs(delta) < 1 ? "flat" : delta > 0 ? "up" : "down";
  return { direction, delta, deltaPercent };
}

// Recent sessions for an exercise: last 10 sessions that contain it.
// Returns array of { date, topSet: { weight, reps }, e1rm }
function getRecentSessions(exId, limit) {
  const u = userData();
  if (!u) return [];
  limit = limit || 10;
  const results = [];
  for (let i = u.sessions.length - 1; i >= 0 && results.length < limit; i--) {
    const s = u.sessions[i];
    let topSet = null;
    let topE1RM = 0;
    s.sets.forEach(set => {
      if (set.exId !== exId) return;
      if (set.bodyweight || set.weight <= 0) return;
      const e = calcE1RM(set.weight, set.reps);
      if (e > topE1RM) {
        topE1RM = e;
        topSet = { weight: set.weight, reps: set.reps };
      }
    });
    if (topSet) {
      results.push({ date: s.finishedAt, topSet, e1rm: topE1RM });
    }
  }
  return results.reverse(); // oldest first for the table display
}

// Called from finishWorkout — detect if any new session PRs were achieved and
// return the names of exercises that hit PRs (for the PR toast).
// priorSessions = u.sessions (before the new session is pushed)
function detectNewPRsInSession(newSets, priorSessions) {
  const priorBest = {};
  priorSessions.forEach(s => {
    s.sets.forEach(set => {
      const key = set.exId;
      const score = calcE1RM(set.weight, set.reps);
      if (!priorBest[key] || score > priorBest[key]) priorBest[key] = score;
    });
  });
  const prExIds = new Set();
  newSets.forEach(s => {
    if (!s.isPR) return;
    prExIds.add(s.exId);
  });
  return Array.from(prExIds);
}
