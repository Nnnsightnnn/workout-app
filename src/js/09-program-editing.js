// ============================================================
// PROGRAM EDITING
// ============================================================
function mutateDay(fn) {
  updateUser(u => {
    const day = u.program.find(d => d.id === state.currentDayId);
    if (day) fn(day);
  });
}

// Preserve user-added custom days when the program is regenerated.
// Appends any isCustom days from oldProgram onto newProgram.
function preserveCustomDays(oldProgram, newProgram) {
  if (!Array.isArray(oldProgram) || !Array.isArray(newProgram)) return newProgram || [];
  var customDays = oldProgram.filter(function(d) { return d.isCustom; });
  if (!customDays.length) return newProgram;
  return newProgram.concat(customDays.map(function(d) { return deepClone(d); }));
}

// Add a new blank custom training day to the user's program.
function addTrainingDay() {
  var u = userData();
  if (!u) return;
  var nextId = u.program.length + 1;
  // Ensure unique day id (skip any already used)
  var usedIds = new Set(u.program.map(function(d) { return d.id; }));
  while (usedIds.has(nextId)) nextId++;
  var newDay = {
    id: nextId,
    name: "Day " + nextId,
    sub: "Custom",
    blocks: [],
    isCustom: true
  };
  updateUser(function(usr) {
    usr.program.push(newDay);
    usr.daysPerWeek = usr.program.length;
  });
  // Switch to the new day and open customize mode
  state.currentDayId = nextId;
  state.dayChosen = true;
  stopSessionTimer();
  state.workoutStartedAt = null;
  renderWorkoutScreen();
  showToast("Day " + nextId + " added", "success");
  // Small delay so the workout screen renders first, then open customize
  setTimeout(function() { openCustomizeDay(); }, 120);
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
      u.program = preserveCustomDays(u.program, generated);
    }
    u.lastDoneDayId = null;
  });
  saveStore(s);
  renderWorkoutScreen();
  showToast("Programs reset", "success");
}

// Remove a custom day from the program. Only custom (user-added) days can be removed.
function removeTrainingDay(dayId) {
  var u = userData();
  if (!u) return;
  var day = u.program.find(function(d) { return d.id === dayId; });
  if (!day || !day.isCustom) { showToast("Only custom days can be removed"); return; }
  if (!confirm("Remove " + day.name + "? This cannot be undone.")) return;
  updateUser(function(usr) {
    usr.program = usr.program.filter(function(d) { return d.id !== dayId; });
    usr.daysPerWeek = usr.program.length;
    // If we removed the current day, switch to day 1
    if (state.currentDayId === dayId) {
      state.currentDayId = usr.program.length > 0 ? usr.program[0].id : 1;
    }
  });
  state.dayChosen = true;
  renderWorkoutScreen();
  showToast("Day removed", "success");
}