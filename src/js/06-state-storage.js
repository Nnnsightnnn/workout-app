// ============================================================
// STATE / STORAGE
// ============================================================
const STORAGE_KEY = "kn-lifts-v3";
let state = {
  userId: null,
  unit: "lbs",
  currentDayId: 1,
  workoutStartedAt: null,
  sessionIntervalId: null,
  restEndsAt: null, restTotal: 0, restIntervalId: null, restTimeoutId: null,
  editMode: false,
  lastCompletedTempo: null,  // tempo of last swiped-done set, shown in rest overlay
  pendingExAdd: null,  // { blockId }
  sidebarOpen: false,
  sidebarSelectedEx: null,
  sidebarSwapTarget: null, // { bi, ei }
  sidebarFilterCat: "All",
  dayChosen: false,
  paceIntervalId: null,
  trimmedBlocks: null,
};

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
function genId() {
  return "u_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

function newUserRecord(name, templateId) {
  const tpl = PROGRAM_TEMPLATES.find(t => t.id === templateId) || PROGRAM_TEMPLATES[0];
  return {
    id: genId(),
    name: String(name || "User").trim().slice(0, 40) || "User",
    templateId: tpl.id,
    program: deepClone(tpl.days),
    sessions: [],
    measurements: [],
    draft: null,
    lastDoneDayId: null,
    programStartDate: tpl.totalWeeks ? Date.now() : null,
    weeklySchedule: null
  };
}

function getDefaultStore() {
  return { _schemaVersion: APP_VERSION, unit: "lbs", users: [], currentUserId: null, onboarding: null };
}

// Stable prefix for corrupt-data backups. See preserveCorruptData().
const CORRUPT_BACKUP_PREFIX = STORAGE_KEY + ".corrupt.";

// Cheap string hash for deduping backups of identical corrupt raw strings.
function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// Called from loadStore's catch when JSON.parse fails on the stored blob.
// Copies the raw string to a stable-hashed backup key BEFORE loadStore
// returns defaults, so the next saveStore doesn't overwrite user data.
// Recover from console with: restoreCorruptBackup("<key>")
function preserveCorruptData(err) {
  let raw;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (_) { return; }
  if (!raw) return;
  const backupKey = CORRUPT_BACKUP_PREFIX + hashString(raw);
  try {
    // Already backed up (same hash) — don't spam duplicate keys.
    if (localStorage.getItem(backupKey) !== null) return;
    localStorage.setItem(backupKey, raw);
    console.error(
      "KN Lifts: stored data could not be parsed. Raw data preserved to '" +
      backupKey + "'. To recover, run: restoreCorruptBackup('" + backupKey +
      "'). Error:", err
    );
  } catch (e) {
    // Storage full, quota exceeded, etc. Last-ditch log so the user knows.
    console.error("KN Lifts: unparseable stored data AND could not save backup:", err, e);
  }
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultStore();
    const s = JSON.parse(raw);
    if (!Array.isArray(s.users)) s.users = [];
    if (s.currentUserId && !s.users.find(u => u.id === s.currentUserId)) {
      s.currentUserId = s.users[0]?.id || null;
    }
    // Defensive default for onboarding
    if (s.onboarding === undefined) s.onboarding = null;
    // Fill missing per-user fields
    s.users.forEach(u => {
      if (!u.id) u.id = genId();
      if (!u.name) u.name = "User";
      if (!u.program) u.program = deepClone(DEFAULT_PROGRAM);
      if (!u.sessions) u.sessions = [];
      if (u.draft === undefined) u.draft = null;
      if (u.lastDoneDayId === undefined) u.lastDoneDayId = null;
      if (!u.measurements) u.measurements = [];
      if (!u.templateId) u.templateId = "conjugate5";
      if (u.programStartDate === undefined) u.programStartDate = null;
      if (u.weeklySchedule === undefined) u.weeklySchedule = null;
    });
    return s;
  } catch (e) {
    // Don't silently wipe. Preserve raw bytes to a separate key so a later
    // saveStore() can't clobber recoverable data.
    preserveCorruptData(e);
    return getDefaultStore();
  }
}
function saveStore(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

function userData() {
  const s = loadStore();
  return s.users.find(u => u.id === state.userId) || null;
}
function updateUser(fn) {
  const s = loadStore();
  const u = s.users.find(x => x.id === state.userId);
  if (!u) return;
  fn(u); saveStore(s);
}
function getAllUsers() { return loadStore().users; }

function addUser(name, templateId) {
  const s = loadStore();
  const u = newUserRecord(name, templateId);
  s.users.push(u);
  s.currentUserId = u.id;
  saveStore(s);
  state.userId = u.id;
  return u;
}
function renameUserRec(id, name) {
  const s = loadStore();
  const u = s.users.find(x => x.id === id);
  if (!u) return;
  u.name = String(name || "").trim().slice(0, 40) || u.name;
  saveStore(s);
}
function deleteUserRec(id) {
  const s = loadStore();
  const idx = s.users.findIndex(x => x.id === id);
  if (idx < 0) return;
  s.users.splice(idx, 1);
  if (s.currentUserId === id) {
    s.currentUserId = s.users[0]?.id || null;
    state.userId = s.currentUserId;
  }
  saveStore(s);
}
function switchUser(id) {
  const s = loadStore();
  if (!s.users.find(u => u.id === id)) return;
  s.currentUserId = id;
  saveStore(s);
  state.userId = id;
  stopSessionTimer();
  state.workoutStartedAt = null;
  state.currentDayId = determineDefaultDay();
  const d = getDraft();
  if (d) { state.workoutStartedAt = d.startedAt; startSessionTimer(); }
  renderWorkoutScreen();
  renderUserChip();
}