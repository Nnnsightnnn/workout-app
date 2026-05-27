// ============================================================
// ACTIVE PROGRAM ACCESSORS
// Single point of truth for "current program". After v21, per-user
// data has u.programs[] + u.activeProgramId; all per-program fields
// (templateId, program, currentWeek, draft, rp, …) live inside an
// entry of u.programs, not at the top of u.
// ============================================================

function genProgramId() {
  return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

function activeProgram() {
  const u = userData();
  if (!u) return null;
  if (!Array.isArray(u.programs) || !u.activeProgramId) return null;
  return u.programs.find(p => p.id === u.activeProgramId) || null;
}

// Use inside updateUser(u => {...}) callbacks where you already have the user object.
function activeProgramOf(u) {
  if (!u || !Array.isArray(u.programs) || !u.activeProgramId) return null;
  return u.programs.find(p => p.id === u.activeProgramId) || null;
}

function updateActiveProgram(fn) {
  updateUser(u => {
    if (!Array.isArray(u.programs) || !u.activeProgramId) return;
    const p = u.programs.find(x => x.id === u.activeProgramId);
    if (p) fn(p, u);
  });
}

// Case-insensitive uniqueness on displayName. Returns the input name
// unchanged if free, otherwise appends " (2)", " (3)", … until free.
function uniquifyDisplayName(name, existing) {
  const base = String(name || "Program").trim() || "Program";
  const taken = new Set((existing || []).map(p => String(p.displayName || "").trim().toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = base + " (" + i + ")";
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return base + " (" + Date.now().toString(36) + ")";
}

// Build a ProgramEntry shell. Caller fills program/days/weeks/etc.
function makeProgramEntry(partial) {
  const e = partial || {};
  return {
    id: e.id || genProgramId(),
    displayName: e.displayName || "Program",
    templateId: e.templateId || "custom",
    program: e.program || [],
    daysPerWeek: e.daysPerWeek || null,
    totalWeeks: (e.totalWeeks === undefined) ? null : e.totalWeeks,
    currentWeek: e.currentWeek || 1,
    programStartDate: e.programStartDate || Date.now(),
    weeklySchedule: (e.weeklySchedule === undefined) ? null : e.weeklySchedule,
    lastDoneDayId: (e.lastDoneDayId === undefined) ? null : e.lastDoneDayId,
    draft: (e.draft === undefined) ? null : e.draft,
    rp: e.rp || null
  };
}

// Adds entry to u.programs, optionally activating. Returns the entry id.
// opts: { activate: boolean }
function addProgramEntry(entry, opts) {
  const activate = !opts || opts.activate !== false; // default true
  let newId = null;
  updateUser(u => {
    if (!Array.isArray(u.programs)) u.programs = [];
    const e = makeProgramEntry(entry);
    e.displayName = uniquifyDisplayName(e.displayName, u.programs);
    u.programs.push(e);
    newId = e.id;
    if (activate) u.activeProgramId = e.id;
  });
  return newId;
}

// Sets activeProgramId, resets transient session UI state. Returns true if changed.
function switchActiveProgram(programId) {
  let changed = false;
  updateUser(u => {
    if (!Array.isArray(u.programs)) return;
    if (!u.programs.some(p => p.id === programId)) return;
    if (u.activeProgramId === programId) return;
    u.activeProgramId = programId;
    changed = true;
  });
  if (changed) {
    if (typeof stopSessionTimer === "function") stopSessionTimer();
    state.workoutStartedAt = null;
    state.currentDayId = 1;
    state.dayChosen = false;
  }
  return changed;
}

// Removes an entry from u.programs. Refuses if it's the only entry or
// if it's currently active (caller must switch away first).
// Returns { ok: boolean, reason?: string }.
function removeProgramEntry(programId) {
  let result = { ok: false, reason: "unknown" };
  updateUser(u => {
    if (!Array.isArray(u.programs)) { result = { ok: false, reason: "no-library" }; return; }
    if (u.programs.length <= 1) { result = { ok: false, reason: "last-program" }; return; }
    if (u.activeProgramId === programId) { result = { ok: false, reason: "active" }; return; }
    const idx = u.programs.findIndex(p => p.id === programId);
    if (idx < 0) { result = { ok: false, reason: "not-found" }; return; }
    u.programs.splice(idx, 1);
    result = { ok: true };
  });
  return result;
}
