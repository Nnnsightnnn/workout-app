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
  if (!confirm("Reset this day to the template default? Your custom edits will be lost.")) return;
  const u = userData();
  const tpl = PROGRAM_TEMPLATES.find(t => t.id === u.templateId) || PROGRAM_TEMPLATES[0];
  const defDay = deepClone(tpl.days.find(d => d.id === state.currentDayId));
  if (!defDay) { showToast("Day not found in template"); return; }
  updateUser(u => {
    const idx = u.program.findIndex(d => d.id === state.currentDayId);
    u.program[idx] = defDay;
  });
  renderWorkoutScreen();
  showToast("Day reset to default", "success");
}

function resetAllProgram() {
  if (!confirm("Reset every user's program to their template default? Session history is kept.")) return;
  const s = loadStore();
  s.users.forEach(u => {
    const tpl = PROGRAM_TEMPLATES.find(t => t.id === u.templateId) || PROGRAM_TEMPLATES[0];
    u.program = deepClone(tpl.days);
    u.lastDoneDayId = null;
  });
  saveStore(s);
  renderWorkoutScreen();
  showToast("Programs reset", "success");
}