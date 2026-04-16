// ============================================================
// INIT
// ============================================================
function setupPWA() {
  // Generate app icon via canvas
  const c = document.createElement("canvas");
  c.width = 180; c.height = 180;
  const x = c.getContext("2d");
  if (!x) return; // No canvas support (e.g. test environment)
  x.fillStyle = "#0a0a0a";
  x.fillRect(0, 0, 180, 180);
  x.fillStyle = "#ff6b35";
  x.font = "900 52px system-ui";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("K&N", 90, 72);
  x.fillStyle = "#f2f2f7";
  x.font = "700 20px system-ui";
  x.fillText("LIFTS", 90, 115);
  const iconUrl = c.toDataURL("image/png");

  // Apple touch icon
  const touchIcon = document.createElement("link");
  touchIcon.rel = "apple-touch-icon";
  touchIcon.href = iconUrl;
  document.head.appendChild(touchIcon);

  // Web app manifest (for Android "Add to Home Screen")
  const manifest = {
    name: "K&N Lifts", short_name: "K&N Lifts",
    display: "standalone", orientation: "portrait",
    background_color: "#0a0a0a", theme_color: "#ff6b35",
    icons: [{ src: iconUrl, sizes: "180x180", type: "image/png", purpose: "any" }]
  };
  const mLink = document.createElement("link");
  mLink.rel = "manifest";
  mLink.href = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: "application/json" }));
  document.head.appendChild(mLink);
}

function initUserPicker() {
  document.getElementById("userChip").onclick = () => showScreen('settings');
  document.getElementById("settingsCloseBtn").onclick = () => showScreen('workout');
  document.getElementById("historyCloseBtn").onclick = () => showScreen('workout');
}

function renderUserChip() {
  const u = userData();
  const chip = document.getElementById("userChip");
  if (!chip) return;
  const nameEl = document.getElementById("userChipName");
  const avEl = document.getElementById("userChipAvatar");
  if (!u) {
    nameEl.textContent = "Set up";
    avEl.textContent = "+";
    return;
  }
  nameEl.textContent = u.name;
  avEl.textContent = (u.name.trim()[0] || "U").toUpperCase();
}

function renderUserSection() {
  const container = document.getElementById("userSection");
  if (!container) return;
  const s = loadStore();
  container.innerHTML = "";
  s.users.forEach(u => {
    const row = document.createElement("div");
    row.className = "user-row" + (u.id === state.userId ? " active" : "");
    row.innerHTML = `
      <div class="avatar">${(u.name.trim()[0] || "U").toUpperCase()}</div>
      <div class="name"></div>
      <button class="row-icon-btn" title="Rename" data-action="rename">✎</button>
      <button class="row-icon-btn danger" title="Delete" data-action="delete">🗑</button>
    `;
    row.querySelector(".name").textContent = u.name;
    row.addEventListener("click", (e) => {
      if (e.target.closest(".row-icon-btn")) return;
      switchUser(u.id);
      renderUserSection();
      renderUserChip();
      renderWorkoutScreen();
    });
    row.querySelector("[data-action=rename]").onclick = (e) => {
      e.stopPropagation();
      openRenameDialog(u);
    };
    row.querySelector("[data-action=delete]").onclick = (e) => {
      e.stopPropagation();
      confirmDeleteUser(u);
    };
    container.appendChild(row);
  });
  const addBtn = document.createElement("button");
  addBtn.className = "user-add-row";
  addBtn.textContent = "＋ Add new user";
  addBtn.onclick = openAddUserDialog;
  container.appendChild(addBtn);
}

function openAddUserDialog(isFirstRun) {
  let tplCards = '';
  PROGRAM_TEMPLATES.forEach((tpl, i) => {
    tplCards += `
      <div class="tpl-option${i === 0 ? ' active' : ''}" data-tpl="${tpl.id}" onclick="selectNewUserTpl(this, '${tpl.id}')">
        <div class="tpl-head">
          <div class="tpl-badge">${tpl.daysPerWeek}d</div>
          <div class="tpl-name">${tpl.name}</div>
        </div>
        <div class="tpl-desc">${tpl.description}</div>
      </div>`;
  });
  const html = `
    <h3>${isFirstRun ? "Welcome — who's training?" : "Add a new user"}</h3>
    <p style="color:var(--text-dim); font-size:12px; margin-bottom:10px;">
      Each user gets their own program, weights, and session history.
    </p>
    <input type="text" class="name-input" id="newUserName" placeholder="Your name" maxlength="40" autocomplete="off">
    <div style="margin-top:12px;">
      <div style="font-size:12px;font-weight:700;color:var(--text-dim);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em;">Choose a program</div>
      ${tplCards}
    </div>
    <input type="hidden" id="newUserTpl" value="${PROGRAM_TEMPLATES[0].id}">
    <div class="sheet-actions">
      ${isFirstRun ? "" : `<button id="cancelAddBtn">Cancel</button>`}
      <button class="primary" id="saveAddBtn">Create</button>
    </div>
  `;
  openSheet(html);
  const input = document.getElementById("newUserName");
  setTimeout(() => input.focus(), 50);
  const save = () => {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    const tplId = document.getElementById("newUserTpl").value;
    const u = addUser(name, tplId);
    state.currentDayId = determineDefaultDay();
    closeSheet();
    renderUserChip();
    renderUserSection();
    renderWorkoutScreen();
    showToast(`Welcome, ${u.name}`, "success");
  };
  input.addEventListener("keydown", e => { if (e.key === "Enter") save(); });
  document.getElementById("saveAddBtn").onclick = save;
  const cancel = document.getElementById("cancelAddBtn");
  if (cancel) cancel.onclick = () => { closeSheet(); renderUserSection(); };
}
function selectNewUserTpl(el, tplId) {
  el.closest('.sheet, #sheetContent').querySelectorAll('.tpl-option').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  document.getElementById("newUserTpl").value = tplId;
}

function openRenameDialog(user) {
  const html = `
    <h3>Rename user</h3>
    <input type="text" class="name-input" id="renameInput" value="" maxlength="40" autocomplete="off">
    <div class="sheet-actions">
      <button id="renameCancel">Cancel</button>
      <button class="primary" id="renameSave">Save</button>
    </div>
  `;
  openSheet(html);
  const input = document.getElementById("renameInput");
  input.value = user.name;
  setTimeout(() => { input.focus(); input.select(); }, 50);
  const save = () => {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    renameUserRec(user.id, name);
    closeSheet();
    renderUserChip();
    renderUserSection();
    showToast("Renamed", "success");
  };
  input.addEventListener("keydown", e => { if (e.key === "Enter") save(); });
  document.getElementById("renameSave").onclick = save;
  document.getElementById("renameCancel").onclick = () => { closeSheet(); renderUserSection(); };
}

function confirmDeleteUser(user) {
  const count = loadStore().users.length;
  if (count <= 1) {
    showToast("Can't delete the only user");
    return;
  }
  const html = `
    <h3>Delete "${user.name}"?</h3>
    <p style="color:var(--text-dim); font-size:13px; line-height:1.5; margin-bottom:10px;">
      This removes their program, all session history, and any in-progress workout. This can't be undone.
    </p>
    <div class="sheet-actions">
      <button id="delCancel">Cancel</button>
      <button class="danger" id="delConfirm">Delete</button>
    </div>
  `;
  openSheet(html);
  document.getElementById("delCancel").onclick = () => { closeSheet(); renderUserSection(); };
  document.getElementById("delConfirm").onclick = () => {
    const wasCurrent = user.id === state.userId;
    deleteUserRec(user.id);
    closeSheet();
    if (wasCurrent) {
      // Switch UI to the new current user (or first-run if none left)
      const s = loadStore();
      if (s.currentUserId) {
        switchUser(s.currentUserId);
      } else {
        state.userId = null;
        renderUserChip();
        openAddUserDialog(true);
      }
    } else {
      renderUserChip();
    }
    renderUserSection();
    showToast("User deleted", "success");
  };
}
function initUnitToggle() {
  document.querySelectorAll("#unitToggle button").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll("#unitToggle button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.unit = btn.dataset.unit;
      const s = loadStore(); s.unit = state.unit; saveStore(s);
      renderWorkoutScreen(); renderPlates();
    };
  });
}
function initNav() {
  document.getElementById("logoBtn").onclick = () => showScreen("workout");
  document.querySelectorAll("nav.bottom button").forEach(btn => {
    btn.onclick = () => showScreen(btn.dataset.screen);
  });
}
function initTools() {
  document.getElementById("plateTarget").addEventListener("input", renderPlates);
  document.getElementById("barWeight").addEventListener("change", renderPlates);
  document.getElementById("ormWeight").addEventListener("input", renderOrm);
  document.getElementById("ormReps").addEventListener("input", renderOrm);
  renderPlates(); renderOrm(); renderBodySection(); renderProgramPicker();
}
function initWorkoutScreen() {
  document.getElementById("homeDayBtn").onclick = () => {
    state.dayChosen = false;
    renderWorkoutScreen();
  };
  document.getElementById("pickDayBtn").onclick = openDayPicker;
  document.getElementById("libraryBtn").onclick = () => {
    state.sidebarOpen ? closeSidebar() : openSidebar();
  };
  document.getElementById("customizeDayBtn").onclick = openCustomizeDay;
  document.getElementById("startBtn").onclick = startWorkout;
  document.getElementById("finishBtn").onclick = finishWorkout;
  document.getElementById("headerStartBtn").onclick = startWorkout;
  document.getElementById("headerFinishBtn").onclick = finishWorkout;
}
function initSidebar() {
  document.getElementById("sidebarCloseBtn").onclick = closeSidebar;
  document.getElementById("sidebarBg").addEventListener("click", e => {
    if (e.target.id === "sidebarBg") closeSidebar();
  });
  document.getElementById("sidebarSearch").oninput = renderSidebarGrid;
}
function initSheet() {
  document.getElementById("sheetBg").addEventListener("click", e => {
    if (e.target.id === "sheetBg") closeSheet();
  });
}

function init() {
  runMigrations();
  const s = loadStore();
  state.unit = s.unit || "lbs";
  document.querySelectorAll("#unitToggle button").forEach(b => b.classList.toggle("active", b.dataset.unit === state.unit));

  setupPWA();
  initUserPicker(); initUnitToggle(); initNav(); initTools();
  initWorkoutScreen(); initSheet(); initSidebar();

  const versionEl = document.getElementById("appVersionLabel");
  if (versionEl) versionEl.textContent = "v" + APP_DISPLAY_VERSION;
  const buildEl = document.getElementById("appBuildLabel");
  if (buildEl) buildEl.textContent = "Build " + APP_BUILD + " · Schema " + APP_VERSION;

  // First-run or empty user list → prompt to create first user
  if (!s.users.length || !s.currentUserId) {
    renderUserChip();
    // Render empty workout screen scaffolding, then prompt
    renderWorkoutScreen();
    openAddUserDialog(true);
    // Show onboarding questionnaire above the add-user dialog if not yet completed/dismissed
    if (!s.onboarding?.completedAt && !s.onboardingDismissedAt) {
      showOnboardingFlow();
    }
    return;
  }

  state.userId = s.currentUserId;
  state.currentDayId = determineDefaultDay();

  // Restore draft timer — if draft exists, skip picker and go straight to workout
  const draft = getDraft();
  if (draft) {
    state.dayChosen = true;
    state.workoutStartedAt = draft.startedAt;
    startSessionTimer();
    // Resume into focus view on first incomplete block
    const day = getCurrentDay();
    if (day) {
      let idx = 0;
      let allDone = true;
      for (let i = 0; i < day.blocks.length; i++) {
        const bp = calcBlockProgress(day.blocks[i]);
        if (bp.done < bp.total) { idx = i; allDone = false; break; }
      }
      state.workoutView = "focus";
      state.focusBlockIdx = allDone ? -1 : idx;
      state.focusExIdx = 0;
    }
  }

  renderUserChip();
  renderWorkoutScreen();

  // Show onboarding if not completed and not dismissed
  if (!s.onboarding?.completedAt && !s.onboardingDismissedAt) {
    showOnboardingFlow();
  }
}

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("dblclick", e => { if (e.target.closest("button")) e.preventDefault(); }, { passive: false });

// Expose internals on window for test harnesses (no-op for production behavior).
try {
  Object.defineProperty(window, "state", { get: () => state, set: v => { state = v; } });
  window.LIBRARY = LIBRARY;
  window.LIB_BY_ID = LIB_BY_ID;
  window.DEFAULT_PROGRAM = DEFAULT_PROGRAM;
  window.JBROWN_PROGRAM = JBROWN_PROGRAM;
  window.FILLY_PROGRAM = FILLY_PROGRAM;
  window.PROGRAM_HYPERTROPHY = PROGRAM_HYPERTROPHY;
  window.PROGRAM_ATHLETIC = PROGRAM_ATHLETIC;
  window.PROGRAM_MINIMAL = PROGRAM_MINIMAL;
  window.PROGRAM_GLUTES = PROGRAM_GLUTES;
  window.PROGRAM_TEMPLATES = PROGRAM_TEMPLATES;
  window.CATEGORIES = CATEGORIES;
} catch (e) {}