// ============================================================
// HELPERS
// ============================================================
function getLastSetsFor(exId) {
  const u = userData();
  for (let i = u.sessions.length - 1; i >= 0; i--) {
    const sets = u.sessions[i].sets.filter(s => s.exId === exId);
    if (sets.length) return sets;
  }
  return [];
}

// Returns the sets for a given exercise from the most recent session of a specific day.
// Used to show "last time you did this workout day" per-exercise.
function getPrevDaySetsFor(dayId, exId) {
  const u = userData();
  for (let i = u.sessions.length - 1; i >= 0; i--) {
    if (u.sessions[i].dayId !== dayId) continue;
    const sets = u.sessions[i].sets.filter(s => s.exId === exId);
    if (sets.length) return sets;
  }
  return [];
}