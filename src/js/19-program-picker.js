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
  updateUser(u => {
    u.templateId = tpl.id;
    u.program = deepClone(tpl.days);
    u.draft = null;
    u.lastDoneDayId = null;
  });
  stopSessionTimer();
  state.workoutStartedAt = null;
  state.currentDayId = 1;
  closeSheet();
  renderProgramPicker();
  renderWorkoutScreen();
  showToast(`Switched to ${tpl.name}`, "success");
}