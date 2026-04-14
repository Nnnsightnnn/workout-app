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