// ============================================================
// DAY ROTATION LOGIC
// ============================================================
function determineDefaultDay() {
  const u = userData();
  if (!u) return 1;
  // If draft exists, show that day
  if (u.draft) return u.draft.dayId;
  // Else next in rotation
  const last = u.lastDoneDayId;
  if (last == null) return 1;
  return (last % u.program.length) + 1;
}

function getCurrentDay() {
  const u = userData();
  if (!u) return null;
  return u.program.find(d => d.id === state.currentDayId);
}