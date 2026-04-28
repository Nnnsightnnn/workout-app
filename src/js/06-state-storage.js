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
  restEndsAt: null, restTotal: 0, restIntervalId: null,
  restActiveSec: 90,
  pendingExAdd: null,  // { blockId }
  sidebarOpen: false,
  sidebarSelectedEx: null,
  sidebarSwapTarget: null, // { bi, ei }
  sidebarFilterCat: "All",
  dayChosen: false,
  paceIntervalId: null,
  trimmedBlocks: null,
  workoutView: "chapters",   // 'chapters' | 'focus'
  focusBlockIdx: null,        // index into day.blocks (-1 = cooldown)
  focusExIdx: 0,              // exercise index within focused block
  previewBlockIdx: null,       // pre-start block preview (null = auto, "cd" = cooldown)
  unavailableEquipment: new Set(), // equipment filter: tags user marked unavailable this session
  eqFilterOpen: false,             // whether the equipment filter bar is expanded
  // Future-date preview: when set, workout screen shows a banner with date + back-to-today
  previewDateMs: null,
  // Rest-day "Train anyway" override: when true, workout screen shows banner + back-to-rest
  restOverride: false,
  // Ad-hoc quick workout state
  adhocActive: false,
  adhocDay: null,
  adhocCustomName: null,
  adhocExercises: null,
  adhocStartedAt: null,
  adhocInputs: null,
  autoTimer: false,
};

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
function genId() {
  return "u_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

function newUserRecord(name, templateId, totalWeeks, daysPerWeek) {
  const tpl = PROGRAM_TEMPLATES.find(t => t.id === templateId) || PROGRAM_TEMPLATES[0];
  const tw = totalWeeks || 10;
  const dpw = daysPerWeek || tpl.daysPerWeek;
  const generated = (typeof resolveWeekProgram === "function") ? resolveWeekProgram(tpl.id, 1, tw, dpw) : null;
  const seedSchedule = (typeof buildDefaultWeeklySchedule === "function")
    ? buildDefaultWeeklySchedule({ program: generated || [], daysPerWeek: dpw })
    : null;
  return {
    id: genId(),
    name: String(name || "User").trim().slice(0, 40) || "User",
    templateId: tpl.id,
    program: generated || [],
    sessions: [],
    measurements: [],
    draft: null,
    lastDoneDayId: null,
    programStartDate: Date.now(),
    weeklySchedule: seedSchedule,
    currentWeek: 1,
    totalWeeks: tw,
    daysPerWeek: dpw,
    pinnedLifts: [],
    manualPRs: [],
    firstWorkoutCompleted: false
  };
}

function getDefaultStore() {
  return { _schemaVersion: APP_VERSION, unit: "lbs", users: [], currentUserId: null, onboarding: null, onboardingDismissedAt: null, autoTimer: false, _lastSeenChangelogVersion: latestChangelogVersion(), tutorialState: { completedAt: null, dismissedAt: null, lastStepId: null } };
}

// Latest changelog version available in this build, or null if no entries.
// Used for both fresh-install initialization and existing-user backfill so
// that the first-ever deploy of the changelog feature doesn't spam users
// with notes for releases they already have.
function latestChangelogVersion() {
  return (typeof CHANGELOG !== "undefined" && Array.isArray(CHANGELOG) && CHANGELOG[0]) ? CHANGELOG[0].version : null;
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
    // Defensive default for autoTimer preference
    if (s.autoTimer === undefined) s.autoTimer = false;
    // Defensive defaults for onboarding
    if (s.onboarding === undefined) s.onboarding = null;
    if (s.onboardingDismissedAt === undefined) s.onboardingDismissedAt = null;
    if (s.onboarding && s.onboarding.selectedDays === undefined) s.onboarding.selectedDays = null;
    if (s.onboarding && s.onboarding.equipmentDetail === undefined) s.onboarding.equipmentDetail = null;
    if (s.onboarding && s.onboarding.injuriesDeferred === undefined) s.onboarding.injuriesDeferred = false;
    // Defensive default for tutorialState (added in v16)
    if (!s.tutorialState) s.tutorialState = { completedAt: null, dismissedAt: null, lastStepId: null };
    // Defensive default for changelog last-seen marker. Backfilling to "latest"
    // here is intentional: it silences the changelog sheet on the first deploy
    // of this feature for everyone who already has a store. Future releases
    // (new entries with newer version strings) will trigger the sheet normally.
    if (s._lastSeenChangelogVersion === undefined || s._lastSeenChangelogVersion === null) {
      s._lastSeenChangelogVersion = latestChangelogVersion();
    }
    // Fill missing per-user fields
    s.users.forEach(u => {
      if (!u.id) u.id = genId();
      if (!u.name) u.name = "User";
      if (!u.program) u.program = [];
      if (!u.sessions) u.sessions = [];
      if (u.draft === undefined) u.draft = null;
      if (u.draft && u.draft.pausedAt === undefined) u.draft.pausedAt = null;
      if (u.lastDoneDayId === undefined) u.lastDoneDayId = null;
      if (!u.measurements) u.measurements = [];
      if (!u.templateId) u.templateId = "conjugate5";
      if (u.programStartDate === undefined) u.programStartDate = null;
      if (u.weeklySchedule === undefined) u.weeklySchedule = null;
      if (u.currentWeek === undefined) u.currentWeek = 1;
      if (u.totalWeeks === undefined) u.totalWeeks = null;
      if (u.daysPerWeek === undefined) u.daysPerWeek = null;
      // Defensive default for u.rp (added in v9)
      if (!u.rp) {
        u.rp = {
          enabled: false,
          rpeCalibrationCompletedAt: null,
          rpeCalibrationMethod: null,
          coldStartAnchors: {},
          lastDeloadRecommendedAt: null,
          dismissedDeloadForWeek: null
        };
      }
      // Defensive defaults for v10: mesocycle container + volume landmarks
      if (!u.rp.volumeLandmarks) u.rp.volumeLandmarks = null; // seeded by migration; null means not yet set
      if (!Array.isArray(u.rp.mesocycles)) u.rp.mesocycles = [];
      if (u.rp.currentMesocycleId === undefined) u.rp.currentMesocycleId = null;
      // Stamp blockType on all program blocks (default "strength"; v10 migration handles existing data,
      // this defensive default catches blocks created by resolveWeekProgram on new users)
      (u.program || []).forEach(day => {
        (day.blocks || []).forEach(block => {
          if (!block.blockType) {
            block.blockType = (block.type === "warmup") ? "warmup" : "strength";
          }
        });
      });
      // Defensive default for v13: manual PRs and pinned lifts
      if (!Array.isArray(u.manualPRs)) u.manualPRs = [];
      if (!Array.isArray(u.pinnedLifts)) u.pinnedLifts = [];
      if (u.firstWorkoutCompleted === undefined) u.firstWorkoutCompleted = false;
      // Defensive defaults for session edit fields (Workstream D)
      // Also cleans up _original audit entries older than 7 days.
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      (u.sessions || []).forEach(s => {
        if (s.editedAt === undefined) s.editedAt = null;
        if (s.originalFinishedAt === undefined) s.originalFinishedAt = null;
        // Defensive default for v11: session feedback
        if (!s.feedback) s.feedback = {};
        (s.sets || []).forEach(set => {
          if (set._original && set._original.editedAt < sevenDaysAgo) {
            delete set._original;
          }
        });
      });
    });
    return s;
  } catch (e) {
    // Don't silently wipe. Preserve raw bytes to a separate key so a later
    // saveStore() can't clobber recoverable data.
    preserveCorruptData(e);
    return getDefaultStore();
  }
}
function saveStore(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    console.error("KN Lifts: failed to save data:", e);
    if (typeof showToast === "function") {
      showToast("Storage full — export a backup and free space", "error");
    }
  }
}

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
  if (s.onboarding && s.onboarding.physiquePriority) {
    u.physiquePriority = s.onboarding.physiquePriority;
  }

  // Initialize u.rp (newUserRecord doesn't create it; loadStore defensive defaults only apply on read)
  if (!u.rp) {
    u.rp = {
      enabled: false,
      rpeCalibrationCompletedAt: null,
      rpeCalibrationMethod: null,
      coldStartAnchors: {},
      lastDeloadRecommendedAt: null,
      dismissedDeloadForWeek: null,
      volumeLandmarks: null,
      mesocycles: [],
      currentMesocycleId: null
    };
  }

  // Propagate body weight from onboarding
  if (s.onboarding && s.onboarding.bodyWeight) {
    u.measurements.push({
      date: new Date().toISOString().slice(0, 10),
      weight: s.onboarding.bodyWeight,
      unit: s.unit || "lbs"
    });
  }

  // Propagate smart suggestions preference from onboarding
  if (s.onboarding && s.onboarding.smartSuggestions === "yes") {
    u.rp.enabled = true;
    if (s.onboarding.rpeCalibration && s.onboarding.rpeCalibration.completedAt) {
      u.rp.rpeCalibrationCompletedAt = s.onboarding.rpeCalibration.completedAt;
      u.rp.rpeCalibrationMethod = "onboarding";
    }
  }

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
function renderDataInfo() {
  const el = document.getElementById("dataInfoCard");
  if (!el) return;
  const s = loadStore();
  const raw = localStorage.getItem(STORAGE_KEY) || "";
  const sizeBytes = new Blob([raw]).size;
  const sizeLabel = sizeBytes < 1024 ? sizeBytes + " B"
    : sizeBytes < 1048576 ? (sizeBytes / 1024).toFixed(1) + " KB"
    : (sizeBytes / 1048576).toFixed(1) + " MB";
  const totalSessions = s.users.reduce((n, u) => n + (u.sessions || []).length, 0);
  const totalMeasurements = s.users.reduce((n, u) => n + (u.measurements || []).length, 0);

  el.innerHTML = `
    <div class="data-info-card">
      <div class="data-info-header">Your data stays on this device</div>
      <div class="data-info-rows">
        <div class="data-info-row"><span class="data-info-label">Stored in</span><span>Browser localStorage</span></div>
        <div class="data-info-row"><span class="data-info-label">Privacy</span><span>No servers &middot; no cloud &middot; no tracking</span></div>
        <div class="data-info-row"><span class="data-info-label">Size</span><span>${sizeLabel}</span></div>
        <div class="data-info-row"><span class="data-info-label">Users</span><span>${s.users.length}</span></div>
        <div class="data-info-row"><span class="data-info-label">Sessions</span><span>${totalSessions}</span></div>
        <div class="data-info-row"><span class="data-info-label">Measurements</span><span>${totalMeasurements}</span></div>
      </div>
      <p class="data-info-help">Export downloads a backup file. Import restores from a backup. Reset restores default programs (keeps history).</p>
    </div>
  `;
}

function switchUser(id) {
  if (typeof clearUndoToast === 'function') clearUndoToast();
  const s = loadStore();
  if (!s.users.find(u => u.id === id)) return;
  s.currentUserId = id;
  saveStore(s);
  state.userId = id;
  stopSessionTimer();
  state.workoutStartedAt = null;
  state.currentDayId = determineDefaultDay();
  const d = getDraft();
  if (d && state.autoTimer) { state.workoutStartedAt = d.startedAt; startSessionTimer(); }
  renderWorkoutScreen();
  renderUserChip();
}