// ============================================================
// IMPORT
// ============================================================
function validateImportData(data) {
  const errors = [];
  if (!data || typeof data !== "object") {
    errors.push("Not a valid JSON object");
    return errors;
  }
  if (!Array.isArray(data.users)) {
    errors.push("Missing or invalid 'users' array");
  } else {
    data.users.forEach((u, i) => {
      if (!u.id) errors.push("User " + i + " missing id");
      if (!u.name) errors.push("User " + i + " missing name");
      if (!Array.isArray(u.program)) errors.push("User " + i + " missing program");
      if (!Array.isArray(u.sessions)) errors.push("User " + i + " missing sessions");
    });
  }
  return errors;
}

function migrateImportedData(data) {
  const version = data._schemaVersion || 0;
  if (version >= APP_VERSION) return data;
  for (let i = 0; i < MIGRATIONS.length; i++) {
    const m = MIGRATIONS[i];
    if (m.version > version && m.version <= APP_VERSION) {
      data = m.migrate(data);
      data._schemaVersion = m.version;
    }
  }
  data._schemaVersion = APP_VERSION;
  return data;
}

function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      let data;
      try {
        data = JSON.parse(ev.target.result);
      } catch (err) {
        showToast("Invalid JSON file");
        return;
      }

      const errors = validateImportData(data);
      if (errors.length > 0) {
        showToast("Invalid backup: " + errors[0]);
        return;
      }

      // Confirm before overwriting
      const userCount = data.users.length;
      const sessionCount = data.users.reduce((n, u) => n + (u.sessions ? u.sessions.length : 0), 0);
      const html = `
        <h3>Import Backup?</h3>
        <p style="color:var(--text-dim); font-size:13px; line-height:1.5; margin-bottom:10px;">
          This will <strong>replace all current data</strong> with the backup file.<br>
          Backup contains <strong>${userCount} user${userCount !== 1 ? "s" : ""}</strong> and
          <strong>${sessionCount} session${sessionCount !== 1 ? "s" : ""}</strong>.
        </p>
        <div class="sheet-actions">
          <button id="importCancel">Cancel</button>
          <button class="danger" id="importConfirm">Replace Data</button>
        </div>
      `;
      openSheet(html);
      document.getElementById("importCancel").onclick = closeSheet;
      document.getElementById("importConfirm").onclick = function() {
        // Backup current data before import
        const currentRaw = localStorage.getItem(STORAGE_KEY);
        if (currentRaw) {
          localStorage.setItem("kn-lifts-backup-preimport", currentRaw);
        }

        // Migrate imported data if needed
        data = migrateImportedData(data);
        saveStore(data);

        // Re-initialize app state
        const s = loadStore();
        state.userId = s.currentUserId;
        state.unit = s.unit || "lbs";
        state.currentDayId = determineDefaultDay();
        state.workoutStartedAt = null;
        state.dayChosen = false;
        state.editMode = false;

        const draft = getDraft();
        if (draft) {
          state.dayChosen = true;
          state.workoutStartedAt = draft.startedAt;
          startSessionTimer();
        }

        document.querySelectorAll("#unitToggle button").forEach(b =>
          b.classList.toggle("active", b.dataset.unit === state.unit)
        );
        renderUserChip();
        renderWorkoutScreen();
        closeSheet();
        showToast("Data restored successfully", "success");
      };
    };
    reader.readAsText(file);
  };
  input.click();
}
