// ============================================================
// PROGRAM PICKER
// ============================================================
function renderProgramPicker() {
  const el = document.getElementById("programContent");
  if (!el) return;
  const u = userData();
  if (!u) { el.innerHTML = ''; return; }
  const tpl = PROGRAM_TEMPLATES.find(t => t.id === u.templateId) || PROGRAM_TEMPLATES[0];
  const weekInfo = u.totalWeeks ? ` · Week ${u.currentWeek || 1} of ${u.totalWeeks}` : "";
  const phases = getPhasesForTemplate(u.templateId, u.totalWeeks);
  const phase = phases ? phaseForWeek(phases, u.currentWeek || 1) : null;
  const phaseLabel = phase ? ` · <span style="color:${phase.color}">${phase.name}</span>` : "";
  el.innerHTML = `
    <div class="program-current">
      <div class="program-badge">${u.daysPerWeek || tpl.daysPerWeek}d</div>
      <div class="program-info">
        <div class="name">${tpl.name}</div>
        <div class="desc">${tpl.description}</div>
        <div class="desc" style="margin-top:2px;font-weight:600;">${weekInfo}${phaseLabel}</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px;">
      <button class="program-change-btn" style="flex:1" onclick="openProgramPicker()">Change Program</button>
      ${u.totalWeeks ? '<button class="program-change-btn" style="flex:0 0 auto;padding:8px 12px;" onclick="openWeekControl()">Week</button>' : ''}
    </div>
  `;
}

function openProgramPicker() {
  const u = userData();
  const current = u ? u.templateId : "conjugate5";
  let html = '<h3>Choose Program</h3><p style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">Switching replaces your current program. Session history is kept.</p>';
  html += '<button class="sheet-item" onclick="closeSheet();openFullGlossary();" style="margin-bottom:12px;"><span class="icon">?</span><span>Glossary — What do these terms mean?</span></button>';
  PROGRAM_TEMPLATES.forEach(tpl => {
    var glossaryKey = (typeof TEMPLATE_GLOSSARY !== "undefined") ? TEMPLATE_GLOSSARY[tpl.id] : null;
    var infoBtn = glossaryKey ? ' <span class="glossary-info" onclick="event.stopPropagation();openGlossary(\'' + glossaryKey.replace(/'/g,"\\'") + '\')">ⓘ</span>' : "";
    html += `
      <div class="tpl-option${tpl.id === current ? ' active' : ''}" onclick="openDurationPicker('${tpl.id}')">
        <div class="tpl-head">
          <div class="tpl-badge">${tpl.daysPerWeek}d</div>
          <div class="tpl-name">${tpl.name}${infoBtn}</div>
        </div>
        <div class="tpl-desc">${tpl.description}</div>
      </div>
    `;
  });
  openSheet(html);
}

function openDurationPicker(templateId) {
  const u = userData();
  if (u && u.templateId === templateId) { closeSheet(); return; }
  if (u && u.draft) {
    if (!confirm("You have a workout in progress. Switching programs will discard it. Continue?")) return;
  }

  const tpl = PROGRAM_TEMPLATES.find(t => t.id === templateId);
  if (!tpl) return;
  const minW = tpl.minWeeks || 8;
  const maxW = tpl.maxWeeks || 12;

  const tplNativeDays = tpl.daysPerWeek;
  const profile = (typeof getUserProfile === "function") ? getUserProfile() : {};
  let selectedDays = profile.daysPerWeek || tplNativeDays;

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <h3>${tpl.name}</h3>
    <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">${tpl.description}</p>
    <p style="font-weight:700;font-size:14px;margin-bottom:8px;">How many days per week?</p>
  `;

  // Days per week selector
  const dayBtnGrid = document.createElement("div");
  dayBtnGrid.style.cssText = "display:flex;gap:8px;margin-bottom:16px;";

  for (let d = 2; d <= 6; d++) {
    const btn = document.createElement("button");
    btn.className = "schedule-day-btn" + (d === selectedDays ? " selected" : "");
    btn.dataset.day = d;
    btn.textContent = d + "d" + (d === tplNativeDays ? " \u2605" : "");
    btn.style.cssText = "flex:1;padding:10px;font-size:14px;font-weight:700;";
    btn.onclick = function() {
      selectedDays = d;
      dayBtnGrid.querySelectorAll("button").forEach(function(b) {
        b.classList.toggle("selected", parseInt(b.dataset.day) === selectedDays);
      });
      updateStartBtn();
    };
    dayBtnGrid.appendChild(btn);
  }
  wrap.appendChild(dayBtnGrid);

  // Weeks selector
  const weeksLabel = document.createElement("p");
  weeksLabel.style.cssText = "font-weight:700;font-size:14px;margin-bottom:8px;";
  weeksLabel.textContent = "How many weeks?";
  wrap.appendChild(weeksLabel);

  const durations = [];
  if (minW <= 8 && maxW >= 8) durations.push(8);
  if (minW <= 10 && maxW >= 10) durations.push(10);
  if (minW <= 12 && maxW >= 12) durations.push(12);
  if (minW === 6) durations.unshift(6);
  if (!durations.length) durations.push(minW);

  let selectedWeeks = durations.includes(10) ? 10 : durations[Math.floor(durations.length / 2)];

  const btnGrid = document.createElement("div");
  btnGrid.style.cssText = "display:flex;gap:8px;margin-bottom:12px;";

  function updatePreview() {
    const phases = getPhasesForTemplate(templateId, selectedWeeks);
    if (phases && previewEl) {
      previewEl.innerHTML = phases.map(p =>
        `<span style="color:${p.color};font-weight:600;">${p.name}</span> <span style="color:var(--text-dim);font-size:11px;">(${p.weeks.length}wk)</span>`
      ).join(" \u2192 ");
    }
    btnGrid.querySelectorAll("button").forEach(b => {
      b.classList.toggle("selected", parseInt(b.dataset.wk) === selectedWeeks);
    });
  }

  durations.forEach(wk => {
    const btn = document.createElement("button");
    btn.className = "schedule-day-btn" + (wk === selectedWeeks ? " selected" : "");
    btn.dataset.wk = wk;
    btn.textContent = wk + " wk";
    btn.style.cssText = "flex:1;padding:10px;font-size:14px;font-weight:700;";
    btn.onclick = function() { selectedWeeks = wk; updatePreview(); updateStartBtn(); };
    btnGrid.appendChild(btn);
  });
  wrap.appendChild(btnGrid);

  const previewEl = document.createElement("div");
  previewEl.style.cssText = "font-size:12px;margin-bottom:16px;line-height:1.6;";
  wrap.appendChild(previewEl);
  updatePreview();

  const actions = document.createElement("div");
  actions.className = "sheet-actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.onclick = function() { closeSheet(); };

  const startBtn = document.createElement("button");
  startBtn.className = "primary";
  function updateStartBtn() {
    startBtn.textContent = "Start " + selectedDays + "d \u00d7 " + selectedWeeks + "wk Program";
  }
  updateStartBtn();
  startBtn.onclick = function() {
    applyProgramSwitch(tpl, selectedWeeks, selectedDays);
  };

  actions.appendChild(cancelBtn);
  actions.appendChild(startBtn);
  wrap.appendChild(actions);
  openSheet(wrap);
}

function applyProgramSwitch(tpl, totalWeeks, daysPerWeek) {
  const tw = totalWeeks || 10;
  const dpw = daysPerWeek || tpl.daysPerWeek;
  const generated = resolveWeekProgram(tpl.id, 1, tw, dpw);
  updateUser(u => {
    u.templateId = tpl.id;
    u.program = generated || [];
    u.draft = null;
    u.lastDoneDayId = null;
    u.programStartDate = Date.now();
    u.weeklySchedule = null;
    u.currentWeek = 1;
    u.totalWeeks = tw;
    u.daysPerWeek = dpw;
  });
  stopSessionTimer();
  state.workoutStartedAt = null;
  state.currentDayId = 1;
  state.dayChosen = false;
  closeSheet();
  renderProgramPicker();
  renderWorkoutScreen();
  showToast("Started " + dpw + "d × " + tw + "wk " + tpl.name, "success");
}

// Manual week controls
function openWeekControl() {
  const u = userData();
  if (!u) return;
  const phases = getPhasesForTemplate(u.templateId, u.totalWeeks);
  const phase = phases ? phaseForWeek(phases, u.currentWeek || 1) : null;

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <h3>Week ${u.currentWeek || 1} of ${u.totalWeeks || "?"}</h3>
    ${phase ? `<div style="color:${phase.color};font-weight:700;font-size:14px;margin-bottom:8px;">${phase.name}</div>
    <div style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">${phase.description || ""}</div>` : ""}
  `;

  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;flex-direction:column;gap:8px;";

  if (u.currentWeek > 1) {
    const backBtn = document.createElement("button");
    backBtn.className = "sheet-item";
    backBtn.innerHTML = '<span class="icon">←</span><span>Previous Week (Week ' + (u.currentWeek - 1) + ')</span>';
    backBtn.onclick = function() { goBackWeek(); closeSheet(); renderProgramPicker(); renderWorkoutScreen(); };
    actions.appendChild(backBtn);
  }

  if (u.currentWeek < (u.totalWeeks || 12)) {
    const fwdBtn = document.createElement("button");
    fwdBtn.className = "sheet-item";
    fwdBtn.innerHTML = '<span class="icon">→</span><span>Skip to Week ' + (u.currentWeek + 1) + '</span>';
    fwdBtn.onclick = function() { advanceWeek(); closeSheet(); renderProgramPicker(); renderWorkoutScreen(); };
    actions.appendChild(fwdBtn);
  }

  const restartBtn = document.createElement("button");
  restartBtn.className = "sheet-item";
  restartBtn.innerHTML = '<span class="icon">↺</span><span>Restart Program (Week 1)</span>';
  restartBtn.onclick = function() {
    if (!confirm("Restart from Week 1? Session history is kept.")) return;
    updateUser(function(usr) {
      usr.currentWeek = 1;
      usr.lastDoneDayId = null;
      usr.draft = null;
      usr.programStartDate = Date.now();
      var gen = resolveWeekProgram(usr.templateId, 1, usr.totalWeeks, usr.daysPerWeek);
      if (gen) usr.program = gen;
    });
    state.currentDayId = 1;
    state.dayChosen = false;
    closeSheet();
    renderProgramPicker();
    renderWorkoutScreen();
    showToast("Program restarted — Week 1", "success");
  };
  actions.appendChild(restartBtn);

  wrap.appendChild(actions);
  openSheet(wrap);
}
