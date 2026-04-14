// ============================================================
// PROGRAM PICKER
// ============================================================
function renderProgramPicker() {
  const el = document.getElementById("programContent");
  if (!el) return;
  const u = userData();
  if (!u) { el.innerHTML = ''; return; }
  const tpl = PROGRAM_TEMPLATES.find(t => t.id === u.templateId) || PROGRAM_TEMPLATES[0];
  el.innerHTML = `
    <div class="program-current">
      <div class="program-badge">${tpl.days.length}d</div>
      <div class="program-info">
        <div class="name">${tpl.name}</div>
        <div class="desc">${tpl.description}</div>
      </div>
    </div>
    <button class="program-change-btn" onclick="openProgramPicker()">Change Program</button>
  `;
}

function openProgramPicker() {
  const u = userData();
  const current = u ? u.templateId : "conjugate5";
  let html = '<h3>Choose Program</h3><p style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">Switching replaces your current program. Session history is kept.</p>';
  PROGRAM_TEMPLATES.forEach(tpl => {
    html += `
      <div class="tpl-option${tpl.id === current ? ' active' : ''}" onclick="switchProgram('${tpl.id}')">
        <div class="tpl-head">
          <div class="tpl-badge">${tpl.days.length}d</div>
          <div class="tpl-name">${tpl.name}</div>
        </div>
        <div class="tpl-desc">${tpl.description}</div>
      </div>
    `;
  });
  openSheet(html);
}

function switchProgram(templateId) {
  const u = userData();
  if (u.templateId === templateId) { closeSheet(); return; }
  if (u.draft) {
    if (!confirm("You have a workout in progress. Switching programs will discard it. Continue?")) return;
  }
  if (!confirm("Switch to this program? Your current program edits will be replaced.")) return;
  const tpl = PROGRAM_TEMPLATES.find(t => t.id === templateId);

  // If structured program, show schedule picker first
  if (tpl.totalWeeks) {
    closeSheet();
    openSchedulePicker(tpl);
    return;
  }

  applyProgramSwitch(tpl, null);
}

function applyProgramSwitch(tpl, schedule) {
  updateUser(u => {
    u.templateId = tpl.id;
    u.program = deepClone(tpl.days);
    u.draft = null;
    u.lastDoneDayId = null;
    u.programStartDate = tpl.totalWeeks ? Date.now() : null;
    u.weeklySchedule = schedule;
  });
  stopSessionTimer();
  state.workoutStartedAt = null;
  state.currentDayId = 1;
  closeSheet();
  renderProgramPicker();
  renderWorkoutScreen();
  showToast(`Switched to ${tpl.name}`, "success");
}

function openSchedulePicker(tpl) {
  const dayCount = tpl.days.length;
  const dayLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  // Pre-select weekdays matching program day count (default spread)
  const defaults = dayCount >= 5 ? [1,2,3,4,5]
    : dayCount === 4 ? [1,2,4,5]
    : dayCount === 3 ? [1,3,5]
    : dayCount === 2 ? [2,4]
    : [1];
  const selected = new Set(defaults);

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <h3>Set Your Training Days</h3>
    <p style="color:var(--text-dim);font-size:12px;margin-bottom:4px;">
      ${tpl.name} has <strong>${dayCount} training days</strong> per week.
      Pick which days you'll train.
    </p>
    ${tpl.phases ? `<p style="color:var(--text-dim);font-size:11px;margin-bottom:8px;">
      ${tpl.totalWeeks}-week program with ${tpl.phases.length} phases: ${tpl.phases.map(p => p.name).join(" → ")}
    </p>` : ""}
  `;

  const grid = document.createElement("div");
  grid.className = "schedule-picker";

  dayLabels.forEach((label, dow) => {
    const btn = document.createElement("button");
    btn.className = "schedule-day-btn" + (selected.has(dow) ? " selected" : "");
    btn.textContent = label.charAt(0);
    btn.title = label;
    btn.onclick = () => {
      if (selected.has(dow)) { selected.delete(dow); btn.classList.remove("selected"); }
      else { selected.add(dow); btn.classList.add("selected"); }
      countEl.textContent = `${selected.size} of ${dayCount} days selected`;
      countEl.style.color = selected.size === dayCount ? "var(--success)" : selected.size > dayCount ? "var(--warn)" : "var(--text-dim)";
    };
    grid.appendChild(btn);
  });
  wrap.appendChild(grid);

  const countEl = document.createElement("div");
  countEl.style.cssText = "text-align:center;font-size:12px;font-weight:700;margin-bottom:12px;";
  countEl.textContent = `${selected.size} of ${dayCount} days selected`;
  countEl.style.color = selected.size === dayCount ? "var(--success)" : "var(--text-dim)";
  wrap.appendChild(countEl);

  const actions = document.createElement("div");
  actions.className = "sheet-actions";

  const skipBtn = document.createElement("button");
  skipBtn.textContent = "Skip";
  skipBtn.onclick = () => { applyProgramSwitch(tpl, null); };

  const saveBtn = document.createElement("button");
  saveBtn.className = "primary";
  saveBtn.textContent = "Start Program";
  saveBtn.onclick = () => {
    // Build weeklySchedule: array[7] mapping dow to program dayId (rotation order)
    const sortedDays = [...selected].sort((a,b) => a - b);
    const schedule = [null, null, null, null, null, null, null];
    sortedDays.forEach((dow, i) => {
      schedule[dow] = (i % dayCount) + 1; // cycle through program days
    });
    applyProgramSwitch(tpl, schedule);
  };

  actions.appendChild(skipBtn);
  actions.appendChild(saveBtn);
  wrap.appendChild(actions);
  openSheet(wrap);
}