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

// Check if week needs to roll over and regenerate program
function checkWeekRollover() {
  const u = userData();
  if (!u || !u.totalWeeks || !u.currentWeek) return;
  // Don't roll over if there's a draft in progress
  if (u.draft) return;
  // Check if all days this week are done
  var daysInProgram = u.program.length;
  var weekSessions = (u.sessions || []).filter(function(s) {
    return s.programWeek === u.currentWeek;
  });
  var uniqueDays = new Set(weekSessions.map(function(s) { return s.dayId; }));
  if (uniqueDays.size >= daysInProgram && u.currentWeek < u.totalWeeks) {
    advanceWeek();
  }
}

function advanceWeek() {
  var u = userData();
  if (!u) return;
  var nextWeek = Math.min((u.currentWeek || 1) + 1, (u.totalWeeks || 12) + 1);
  updateUser(function(usr) {
    usr.currentWeek = nextWeek;
    usr.lastDoneDayId = null;
    usr.draft = null;
    var generated = resolveWeekProgram(usr.templateId, nextWeek, usr.totalWeeks, usr.daysPerWeek);
    if (generated) usr.program = preserveCustomDays(usr.program, generated);
  });
  state.currentDayId = 1;
  state.dayChosen = false;
}

function goBackWeek() {
  var u = userData();
  if (!u || !u.currentWeek || u.currentWeek <= 1) return;
  var prevWeek = u.currentWeek - 1;
  updateUser(function(usr) {
    usr.currentWeek = prevWeek;
    usr.lastDoneDayId = null;
    usr.draft = null;
    var generated = resolveWeekProgram(usr.templateId, prevWeek, usr.totalWeeks, usr.daysPerWeek);
    if (generated) usr.program = preserveCustomDays(usr.program, generated);
  });
  state.currentDayId = 1;
  state.dayChosen = false;
}