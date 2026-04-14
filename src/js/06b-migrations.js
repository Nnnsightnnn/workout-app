// ============================================================
// MIGRATIONS
// ============================================================
const MIGRATIONS = [
  {
    version: 1,
    description: "Bootstrap: add schema version, normalize fields",
    migrate(store) {
      if (!store.unit) store.unit = "lbs";
      if (!Array.isArray(store.users)) store.users = [];
      store.users.forEach(u => {
        if (!u.id) u.id = genId();
        if (!u.name) u.name = "User";
        if (!u.program) u.program = deepClone(DEFAULT_PROGRAM);
        if (!u.sessions) u.sessions = [];
        if (u.draft === undefined) u.draft = null;
        if (u.lastDoneDayId === undefined) u.lastDoneDayId = null;
        if (!u.measurements) u.measurements = [];
        if (!u.templateId) u.templateId = "conjugate5";
      });
      return store;
    }
  }
  // Future migrations:
  // { version: 2, description: "...", migrate(store) { ... return store; } },
];

function runMigrations() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  let store;
  try {
    store = JSON.parse(raw);
  } catch (e) {
    console.error("KN Lifts: corrupt store, cannot migrate");
    return;
  }

  const currentVersion = store._schemaVersion || 0;
  if (currentVersion >= APP_VERSION) return;

  // Auto-backup before migration
  localStorage.setItem("kn-lifts-backup-premigration", raw);
  localStorage.setItem("kn-lifts-backup-premigration-version", String(currentVersion));

  // Run each pending migration in sequence
  for (let i = 0; i < MIGRATIONS.length; i++) {
    const m = MIGRATIONS[i];
    if (m.version > currentVersion && m.version <= APP_VERSION) {
      try {
        store = m.migrate(store);
        store._schemaVersion = m.version;
      } catch (e) {
        console.error("KN Lifts: migration to v" + m.version + " failed:", e);
        break;
      }
    }
  }

  if (!store._schemaVersion) store._schemaVersion = APP_VERSION;
  saveStore(store);
}

// Recovery — callable from browser console: restorePreMigrationBackup()
function restorePreMigrationBackup() {
  const backup = localStorage.getItem("kn-lifts-backup-premigration");
  if (!backup) {
    console.log("No pre-migration backup found");
    return false;
  }
  localStorage.setItem(STORAGE_KEY, backup);
  console.log("Restored pre-migration backup. Reload the page.");
  return true;
}
