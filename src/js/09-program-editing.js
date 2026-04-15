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
  const generated = resolveWeekProgram(u.templateId, u.currentWeek || 1, u.totalWeeks || 10);
  const defDay = generated ? generated.find(d => d.id === state.currentDayId) : null;
  if (!defDay) {
    // Fallback to static template
    const tpl = PROGRAM_TEMPLATES.find(t => t.id === u.templateId) || PROGRAM_TEMPLATES[0];
    const fallback = deepClone(tpl.days.find(d => d.id === state.currentDayId));
    if (!fallback) { showToast("Day not found"); return; }
    updateUser(u => { u.program[u.program.findIndex(d => d.id === state.currentDayId)] = fallback; });
  } else {
    updateUser(u => { u.program[u.program.findIndex(d => d.id === state.currentDayId)] = defDay; });
  }
  renderWorkoutScreen();
  showToast("Day reset", "success");
}

function resetAllProgram() {
  if (!confirm("Reset every user's program to their current week default? Session history is kept.")) return;
  const s = loadStore();
  s.users.forEach(u => {
    const generated = resolveWeekProgram(u.templateId, u.currentWeek || 1, u.totalWeeks || 10);
    if (generated) {
      u.program = generated;
    } else {
      const tpl = PROGRAM_TEMPLATES.find(t => t.id === u.templateId) || PROGRAM_TEMPLATES[0];
      u.program = deepClone(tpl.days);
    }
    u.lastDoneDayId = null;
  });
  saveStore(s);
  renderWorkoutScreen();
  showToast("Programs reset", "success");
}