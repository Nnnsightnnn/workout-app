// ============================================================
// PROGRAM EDITING
// ============================================================
function mutateDay(fn) {
  updateUser(u => {
    const day = u.program.find(d => d.id === state.currentDayId);
    if (day) fn(day);
  });
}

function resetCurrentDay() {
  if (!confirm("Reset this day to the generated default? Your custom edits will be lost.")) return;
  const u = userData();
  // Regenerate from periodization engine for current week
  const generated = resolveWeekProgram(u.templateId, u.currentWeek || 1, u.totalWeeks || 10, u.daysPerWeek);
  const defDay = generated ? generated.find(d => d.id === state.currentDayId) : null;
  if (!defDay) { showToast("Day not found"); return; }
  updateUser(u => { u.program[u.program.findIndex(d => d.id === state.currentDayId)] = defDay; });
  renderWorkoutScreen();
  showToast("Day reset", "success");
}

function resetAllProgram() {
  if (!confirm("Reset every user's program to their current week default? Session history is kept.")) return;
  const s = loadStore();
  s.users.forEach(u => {
    const generated = resolveWeekProgram(u.templateId, u.currentWeek || 1, u.totalWeeks || 10, u.daysPerWeek);
    if (generated) {
      u.program = generated;
    }
    u.lastDoneDayId = null;
  });
  saveStore(s);
  renderWorkoutScreen();
  showToast("Programs reset", "success");
}