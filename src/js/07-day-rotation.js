// ============================================================
// DAY ROTATION LOGIC
// ============================================================
function determineDefaultDay() {
  const p = activeProgram();
  if (!p) return 1;
  // If draft exists, show that day
  if (p.draft) return p.draft.dayId;
  // If today is mapped to a program day in the weekly schedule, prefer that
  if (Array.isArray(p.weeklySchedule) && p.weeklySchedule.length === 7) {
    const todaysId = p.weeklySchedule[new Date().getDay()];
    if (todaysId != null && p.program.find(d => d.id === todaysId)) {
      return todaysId;
    }
  }
  // Else next in rotation
  const last = p.lastDoneDayId;
  if (last == null) return 1;
  return (last % p.program.length) + 1;
}

function getCurrentDay() {
  const p = activeProgram();
  if (!p) return null;
  return p.program.find(d => d.id === state.currentDayId);
}

// Check if week needs to roll over and regenerate program
function checkWeekRollover() {
  const u = userData();
  const p = activeProgram();
  if (!u || !p || !p.totalWeeks || !p.currentWeek) return;
  // Don't roll over if there's a draft in progress
  if (p.draft) return;
  // Check if all days this week are done
  var daysInProgram = p.program.length;
  var weekSessions = (u.sessions || []).filter(function(s) {
    return s.programWeek === p.currentWeek && (!s.programId || s.programId === p.id);
  });
  var uniqueDays = new Set(weekSessions.map(function(s) { return s.dayId; }));
  if (uniqueDays.size >= daysInProgram && p.currentWeek < p.totalWeeks) {
    advanceWeek();
  }
}

function advanceWeek() {
  var p = activeProgram();
  if (!p) return;
  var nextWeek = Math.min((p.currentWeek || 1) + 1, (p.totalWeeks || 12) + 1);
  updateActiveProgram(function(entry) {
    entry.currentWeek = nextWeek;
    entry.lastDoneDayId = null;
    entry.draft = null;
    var generated = resolveWeekProgram(entry.templateId, nextWeek, entry.totalWeeks, entry.daysPerWeek);
    if (generated) entry.program = preserveCustomDays(entry.program, generated);
  });
  state.currentDayId = 1;
  state.dayChosen = false;
}

function goBackWeek() {
  var p = activeProgram();
  if (!p || !p.currentWeek || p.currentWeek <= 1) return;
  var prevWeek = p.currentWeek - 1;
  updateActiveProgram(function(entry) {
    entry.currentWeek = prevWeek;
    entry.lastDoneDayId = null;
    entry.draft = null;
    var generated = resolveWeekProgram(entry.templateId, prevWeek, entry.totalWeeks, entry.daysPerWeek);
    if (generated) entry.program = preserveCustomDays(entry.program, generated);
  });
  state.currentDayId = 1;
  state.dayChosen = false;
}
