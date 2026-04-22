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
        if (!u.program) u.program = [];
        if (!u.sessions) u.sessions = [];
        if (u.draft === undefined) u.draft = null;
        if (u.lastDoneDayId === undefined) u.lastDoneDayId = null;
        if (!u.measurements) u.measurements = [];
        if (!u.templateId) u.templateId = "conjugate5";
      });
      return store;
    }
  },
  {
    version: 2,
    description: "Add currentWeek and totalWeeks for periodized programs",
    migrate(store) {
      store.users.forEach(u => {
        // Set totalWeeks from template if it was a structured program
        if (u.totalWeeks === undefined || u.totalWeeks === null) {
          const tpl = (typeof PROGRAM_TEMPLATES !== "undefined")
            ? PROGRAM_TEMPLATES.find(t => t.id === u.templateId) : null;
          if (tpl && tpl.totalWeeks) {
            u.totalWeeks = tpl.totalWeeks;
          } else {
            u.totalWeeks = 10; // default for all programs
          }
        }
        // Estimate currentWeek from programStartDate if available
        if (u.currentWeek === undefined || u.currentWeek === null) {
          if (u.programStartDate) {
            const elapsed = Math.floor((Date.now() - u.programStartDate) / 604800000) + 1;
            u.currentWeek = Math.max(1, Math.min(elapsed, u.totalWeeks));
          } else {
            u.currentWeek = 1;
          }
        }
        // Ensure programStartDate is always set
        if (!u.programStartDate) u.programStartDate = Date.now();
        // Generate this week's program from the new engine
        if (typeof resolveWeekProgram === "function") {
          var generated = resolveWeekProgram(u.templateId, u.currentWeek, u.totalWeeks);
          if (generated) u.program = generated;
        }
      });
      return store;
    }
  },
  {
    version: 3,
    description: "Add onboardingDismissedAt flag for persistent onboarding prompt",
    migrate(store) {
      if (store.onboardingDismissedAt === undefined) store.onboardingDismissedAt = null;
      return store;
    }
  },
  {
    version: 4,
    description: "Add daysPerWeek per user for flexible day count",
    migrate(store) {
      store.users.forEach(u => {
        if (u.daysPerWeek === undefined) {
          const tpl = (typeof PROGRAM_TEMPLATES !== "undefined")
            ? PROGRAM_TEMPLATES.find(t => t.id === u.templateId) : null;
          u.daysPerWeek = tpl ? tpl.daysPerWeek : u.program ? u.program.length : 5;
        }
      });
      return store;
    }
  },
  {
    version: 5,
    description: "Add onboarding.selectedDays; measurements stay additive (no field rename)",
    migrate(store) {
      if (store.onboarding && store.onboarding.selectedDays === undefined) {
        store.onboarding.selectedDays = null;
      }
      // measurements[] is additive — old {date, weight} entries stay valid.
      // No per-entry rewrite needed.
      return store;
    }
  },
  {
    version: 6,
    description: "Add pausedAt to draft for session timer pause/resume",
    migrate(store) {
      store.users.forEach(u => {
        if (u.draft && u.draft.pausedAt === undefined) u.draft.pausedAt = null;
      });
      return store;
    }
  },
  {
    version: 7,
    description: "Convert onboarding.goal (string) to onboarding.goals (array) for multi-goal support",
    migrate(store) {
      if (store.onboarding) {
        if (!store.onboarding.goals) {
          store.onboarding.goals = store.onboarding.goal ? [store.onboarding.goal] : ["general"];
        }
        delete store.onboarding.goal;
      }
      return store;
    }
  },
  {
    version: 8,
    description: "Retag library taxonomy; remap session sets to locked 19-muscle vocabulary",
    migrate(store) {
      const MUSCLE_REMAP = {
        "shoulders": ["front delts", "side delts"],
        "back": ["lats", "upper back"],
        "knees": null,
        "conditioning": null,
        "full body": null,
        "hips": null,
        "hip flexors": null,
        "thoracic": null,
        "posterior chain": null,
        "grip": null,
        "serratus": null,
        "glute med": null,
        "glute min": null,
        "tibialis": null,
      };
      store.users.forEach(u => {
        (u.sessions || []).forEach(s => {
          (s.sets || []).forEach(set => {
            const lib = (typeof LIB_BY_ID !== "undefined") ? LIB_BY_ID[set.exId] : null;
            if (lib && Array.isArray(lib.muscles)) {
              set.muscles = [...lib.muscles];
              return;
            }
            // Fallback: name-map — stamp _remappedAt:8 for Library Audit surface
            const next = [];
            (set.muscles || []).forEach(m => {
              const mapped = MUSCLE_REMAP[m];
              if (mapped === null) return;
              if (Array.isArray(mapped)) next.push(...mapped);
              else next.push(m);
            });
            set.muscles = Array.from(new Set(next));
            set._remappedAt = 8;
          });
        });
      });
      store.v8ToastPending = true;
      return store;
    }
  },
  {
    version: 9,
    description: "Add u.rp container for A+ autoregulation (Workstream B)",
    migrate(store) {
      store.users.forEach(u => {
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
        // Bodyweight data stays in u.measurements[] — no copy, no mirror (§9.1 [R-1])
      });
      return store;
    }
  }
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

// ============================================================
// CORRUPT-DATA RECOVERY (console helpers)
// ============================================================
// When loadStore() hits a JSON parse error it preserves the raw bytes to
// a "kn-lifts-v3.corrupt.<hash>" key via preserveCorruptData(). These
// helpers let a user or support contact list and restore those backups
// without hand-editing localStorage.

function listCorruptBackups() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.indexOf(CORRUPT_BACKUP_PREFIX) === 0) keys.push(k);
  }
  if (keys.length === 0) {
    console.log("No corrupt-data backups found.");
    return [];
  }
  console.log("Corrupt-data backups (" + keys.length + "):");
  keys.forEach(k => {
    const bytes = (localStorage.getItem(k) || "").length;
    console.log(" - " + k + "  (" + bytes + " bytes)");
  });
  console.log("Restore one with: restoreCorruptBackup('<key>')");
  return keys;
}

function restoreCorruptBackup(key) {
  if (!key || typeof key !== "string" || key.indexOf(CORRUPT_BACKUP_PREFIX) !== 0) {
    console.error("Invalid backup key. Run listCorruptBackups() to see available keys.");
    return false;
  }
  const backup = localStorage.getItem(key);
  if (backup === null) {
    console.error("Backup not found: " + key);
    return false;
  }
  localStorage.setItem(STORAGE_KEY, backup);
  console.log(
    "Restored from " + key + ". Reload the page. " +
    "Note: this data was previously unparseable — if the app still can't read it, " +
    "you may need to hand-edit the JSON or import a known-good backup."
  );
  return true;
}
