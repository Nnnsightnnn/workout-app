// ============================================================
// PROGRAM PICKER + LIBRARY (v21)
// ============================================================
// v21: u.programs[] is the library, u.activeProgramId points at the
// currently-running program. Settings now renders a library card with
// Set Active / Add / Rename / Archive / Delete actions instead of a
// single-program tile. The Add flow reuses openProgramPicker() +
// openDurationPicker() — applyProgramSwitch creates a NEW library
// entry (auto-naming "Program (2)" on template collision) and sets
// it active.

var _previewCache = {};

function generateSamplePreview(templateId, daysPerWeek, totalWeeks) {
  var key = templateId + "|" + daysPerWeek + "|" + totalWeeks;
  if (_previewCache[key]) return _previewCache[key];
  var week = resolveWeekProgram(templateId, 1, totalWeeks, daysPerWeek);
  _previewCache[key] = week;
  return week;
}

function renderSamplePreview(container, templateId, daysPerWeek, totalWeeks) {
  container.innerHTML = "";
  var week = generateSamplePreview(templateId, daysPerWeek, totalWeeks);
  if (!week || !week.length) {
    container.innerHTML = '<div style="color:var(--text-dim);font-size:12px;padding:8px;">No preview available for this program.</div>';
    return;
  }

  var selectedIdx = 0;
  var dayContent = document.createElement("div");

  function renderDay(idx) {
    dayContent.innerHTML = "";
    var day = week[idx];
    var breakdown = getSessionBreakdown(day);

    var hdr = document.createElement("div");
    hdr.style.cssText = "padding:8px 0 4px;";
    hdr.innerHTML = '<div style="font-size:16px;font-weight:700;">' + day.name + '</div>'
      + '<div style="color:var(--text-dim);font-size:12px;">' + (day.sub || '') + '</div>'
      + '<div style="font-size:12px;margin-top:4px;">⏱ ~' + breakdown.totalMin + ' min'
      + ' <span style="color:var(--text-dim);">· WU ' + Math.round(breakdown.warmupSec / 60) + 'm · Work ' + Math.round(breakdown.workingSec / 60) + 'm · CD ' + Math.round(breakdown.cooldownSec / 60) + 'm</span></div>';
    dayContent.appendChild(hdr);

    day.blocks.forEach(function(block, bi) {
      dayContent.appendChild(renderBlockPreview(day, block, bi, true));
    });

    dayContent.appendChild(renderCooldownPreviewForDay(day.id));

    strip.querySelectorAll(".block-strip-chip").forEach(function(chip, ci) {
      chip.classList.toggle("active", ci === idx);
    });
  }

  // Day tabs
  var strip = document.createElement("div");
  strip.className = "block-strip";
  week.forEach(function(day, di) {
    var chip = document.createElement("div");
    chip.className = "block-strip-chip" + (di === 0 ? " active" : "");
    chip.innerHTML = '<span class="block-strip-letter">D' + (di + 1) + '</span><span class="block-strip-name">' + day.name.split("—")[0].trim() + '</span>';
    chip.addEventListener("click", function() { selectedIdx = di; renderDay(di); });
    strip.appendChild(chip);
  });
  container.appendChild(strip);
  container.appendChild(dayContent);
  renderDay(0);
}

// --- Programs library card (Settings) ------------------------------
// Replaces the single-program tile. Shows every entry in u.programs[]
// (non-archived) plus an Add Program CTA and a View Archived link.
function renderProgramPicker() {
  const el = document.getElementById("programContent");
  if (!el) return;
  const u = userData();
  if (!u || !Array.isArray(u.programs) || !u.programs.length) {
    let emptyHtml = `
      <div class="paper-settings-block">
        <div class="paper-settings-title">No programs yet</div>
        <div class="paper-settings-actions">
          <button class="paper-stamp-btn" onclick="openProgramPicker()">+ Add Program</button>
        </div>
      </div>
    `;
    if (typeof renderSavedWorkoutsSection === "function") {
      emptyHtml += renderSavedWorkoutsSection();
    }
    el.innerHTML = emptyHtml;
    if (typeof wireSavedWorkoutsActions === "function") wireSavedWorkoutsActions(el);
    return;
  }

  const active = (u.programs.find(p => p.id === u.activeProgramId)) || null;
  const visible = u.programs.filter(p => !p.archivedAt);
  const archivedCount = u.programs.length - visible.length;

  let html = '<div class="paper-settings-block paper-library">';
  html += '<div class="paper-settings-title">Programs</div>';
  html += '<div class="paper-settings-sub">Switch active program · add others to your library.</div>';
  html += '<div class="paper-library-list">';

  visible.forEach(entry => {
    const isActive = active && entry.id === active.id;
    const tpl = PROGRAM_TEMPLATES.find(t => t.id === entry.templateId);
    const weekInfo = entry.totalWeeks ? `Week ${entry.currentWeek || 1} of ${entry.totalWeeks}` : "";
    const phases = getPhasesForTemplate(entry.templateId, entry.totalWeeks);
    const phase = phases ? phaseForWeek(phases, entry.currentWeek || 1) : null;
    const subParts = [];
    if (weekInfo) subParts.push(weekInfo);
    if (phase) subParts.push(`<span style="color:${phase.color};font-weight:700;">${phase.name}</span>`);
    if (tpl && tpl.description && !weekInfo) subParts.push(tpl.description);
    const sub = subParts.join(' <span class="paper-settings-meta-dot">·</span> ');

    html += `<div class="paper-library-row${isActive ? ' active' : ''}" data-pid="${entry.id}">`;
    html += `  <div class="paper-library-bullet" aria-hidden="true">${isActive ? '●' : '○'}</div>`;
    html += `  <div class="paper-library-body">`;
    html += `    <div class="paper-library-name">${escapeHtmlMaybe(entry.displayName || (tpl && tpl.name) || 'Program')}${isActive ? ' <span class="paper-library-tag">active</span>' : ''}</div>`;
    if (sub) html += `    <div class="paper-library-meta">${sub}</div>`;
    html += `    <div class="paper-library-actions">`;
    if (!isActive) {
      html += `      <button class="paper-stamp-btn paper-stamp-btn-sm" data-act="set-active">Set active</button>`;
    } else if (entry.totalWeeks) {
      html += `      <button class="paper-link-btn" data-act="week">Week ▾</button>`;
    }
    html += `      <button class="paper-link-btn" data-act="rename">Rename</button>`;
    if (entry.weeklySchedule) {
      html += `      <button class="paper-link-btn" data-act="schedule">Schedule</button>`;
    }
    if (!isActive) {
      html += `      <button class="paper-link-btn" data-act="archive">Archive</button>`;
      if (u.programs.length > 1) {
        html += `      <button class="paper-link-btn paper-link-btn-danger" data-act="delete">Delete</button>`;
      }
    }
    html += `    </div>`;
    html += `  </div>`;
    html += `</div>`;
  });

  html += '</div>';

  html += '<div class="paper-library-footer">';
  html += '  <button class="paper-stamp-btn" onclick="openProgramPicker()">+ Add Program</button>';
  if (archivedCount > 0) {
    html += `  <button class="paper-link-btn" onclick="openArchivedPrograms()">View archived (${archivedCount})</button>`;
  }
  html += '</div>';

  html += '</div>';

  // Append the Saved Workouts library as a sibling block.
  if (typeof renderSavedWorkoutsSection === "function") {
    html += renderSavedWorkoutsSection();
  }

  el.innerHTML = html;

  // Wire saved-workouts row actions (handles its own data-sw-id / data-sw-act).
  if (typeof wireSavedWorkoutsActions === "function") wireSavedWorkoutsActions(el);

  // Wire row actions
  el.querySelectorAll(".paper-library-row[data-pid]").forEach(row => {
    const pid = row.dataset.pid;
    row.querySelectorAll("[data-act]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const act = btn.dataset.act;
        if (act === "set-active") setActiveProgramFromLibrary(pid);
        else if (act === "rename") renameLibraryProgram(pid);
        else if (act === "archive") archiveLibraryProgram(pid);
        else if (act === "delete") deleteLibraryProgram(pid);
        else if (act === "week") openWeekControl();
        else if (act === "schedule") {
          if (typeof openWeeklyScheduleEditor === "function") openWeeklyScheduleEditor();
        }
      });
    });
  });
}

// Minimal HTML escape fallback. Most rendering paths already supply one,
// so this only fires if no global escapeHtml is defined.
function escapeHtmlMaybe(s) {
  if (typeof escapeHtml === "function") return escapeHtml(s);
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function setActiveProgramFromLibrary(programId) {
  const u = userData();
  if (!u) return;
  if (u.activeProgramId === programId) return;
  const active = (u.programs || []).find(p => p.id === u.activeProgramId);
  if (active && active.draft) {
    if (!confirm("You have a workout in progress on " + (active.displayName || "the current program") + ". Switching will pause it — you can resume by switching back. Continue?")) {
      return;
    }
  }
  switchActiveProgram(programId);
  stopSessionTimer();
  state.workoutStartedAt = null;
  state.currentDayId = (typeof determineDefaultDay === "function") ? determineDefaultDay() : 1;
  state.dayChosen = false;
  renderProgramPicker();
  renderWorkoutScreen();
  const u2 = userData();
  const switched = u2 && u2.programs.find(p => p.id === programId);
  showToast("Now active: " + (switched ? switched.displayName : "program"), "success");
}

function renameLibraryProgram(programId) {
  const u = userData();
  const entry = u && u.programs.find(p => p.id === programId);
  if (!entry) return;
  const next = prompt("Rename program:", entry.displayName || "");
  if (next == null) return;
  const trimmed = String(next).trim();
  if (!trimmed) return;
  if (trimmed === entry.displayName) return;
  updateUser(usr => {
    const e = usr.programs.find(p => p.id === programId);
    if (!e) return;
    const others = usr.programs.filter(p => p.id !== programId);
    e.displayName = uniquifyDisplayName(trimmed, others);
  });
  renderProgramPicker();
  showToast("Renamed", "success");
}

function archiveLibraryProgram(programId) {
  const u = userData();
  const entry = u && u.programs.find(p => p.id === programId);
  if (!entry) return;
  if (u.activeProgramId === programId) {
    showToast("Switch to another program before archiving");
    return;
  }
  updateUser(usr => {
    const e = usr.programs.find(p => p.id === programId);
    if (!e) return;
    e.archivedAt = Date.now();
  });
  renderProgramPicker();
  showToast("Archived " + (entry.displayName || "program"), "success");
}

function deleteLibraryProgram(programId) {
  const u = userData();
  const entry = u && u.programs.find(p => p.id === programId);
  if (!entry) return;
  if (!confirm("Delete \"" + (entry.displayName || "program") + "\"? Session history is kept (stamped with this program's id). This cannot be undone.")) return;
  const result = removeProgramEntry(programId);
  if (!result.ok) {
    showToast("Cannot delete: " + (result.reason || "unknown"));
    return;
  }
  renderProgramPicker();
  showToast("Deleted", "success");
}

function openArchivedPrograms() {
  const u = userData();
  if (!u) return;
  const archived = (u.programs || []).filter(p => p.archivedAt);
  const wrap = document.createElement("div");
  let html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><h3 style="margin:0;">Archived programs</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div>';
  if (!archived.length) {
    html += '<p style="color:var(--text-dim);font-size:13px;">Nothing archived yet.</p>';
  } else {
    html += '<div class="paper-library-list">';
    archived.forEach(entry => {
      const tpl = PROGRAM_TEMPLATES.find(t => t.id === entry.templateId);
      const dateStr = new Date(entry.archivedAt).toLocaleDateString();
      html += '<div class="paper-library-row" data-pid="' + entry.id + '">';
      html += '  <div class="paper-library-bullet" aria-hidden="true">○</div>';
      html += '  <div class="paper-library-body">';
      html += '    <div class="paper-library-name">' + escapeHtmlMaybe(entry.displayName || (tpl && tpl.name) || "Program") + '</div>';
      html += '    <div class="paper-library-meta">Archived ' + dateStr + '</div>';
      html += '    <div class="paper-library-actions">';
      html += '      <button class="paper-link-btn" data-act="restore">Restore</button>';
      if (u.programs.length > 1) {
        html += '      <button class="paper-link-btn paper-link-btn-danger" data-act="delete">Delete</button>';
      }
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    });
    html += '</div>';
  }
  wrap.innerHTML = html;
  wrap.querySelectorAll(".paper-library-row").forEach(row => {
    const pid = row.dataset.pid;
    row.querySelectorAll("[data-act]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const act = btn.dataset.act;
        if (act === "restore") {
          updateUser(usr => {
            const e2 = usr.programs.find(p => p.id === pid);
            if (e2) e2.archivedAt = null;
          });
          closeSheet();
          renderProgramPicker();
          showToast("Restored", "success");
        } else if (act === "delete") {
          if (!confirm("Permanently delete this archived program?")) return;
          const result = removeProgramEntry(pid);
          if (!result.ok) { showToast("Cannot delete: " + result.reason); return; }
          closeSheet();
          renderProgramPicker();
          showToast("Deleted", "success");
        }
      });
    });
  });
  openSheet(wrap);
}

// --- Add Program flow (template chooser + duration picker) ----------
// Unchanged shell — applyProgramSwitch is the one that's different:
// it now appends to the library instead of overwriting.
function openProgramPicker() {
  const u = userData();
  const ap = (typeof activeProgram === "function") ? activeProgram() : null;
  const current = ap ? ap.templateId : "conjugate5";
  let html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><h3 style="margin:0;">Add Program</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div><p style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">Pick a template. We\'ll add it to your library and make it active. Existing programs stay put — their week and history are preserved.</p>';
  html += '<button class="sheet-item" onclick="closeSheet();openFullGlossary();" style="margin-bottom:12px;"><span class="icon">?</span><span>Glossary — What do these terms mean?</span></button>';
  html += '<div class="tpl-option custom-builder-tile" onclick="closeSheet();openProgramBuilder()">' +
    '<div class="tpl-head"><div class="tpl-badge">+</div><div class="tpl-name">Build Your Own</div></div>' +
    '<div class="tpl-desc">Pick days, blocks, and exercises yourself.</div></div>';
  PROGRAM_TEMPLATES.forEach(tpl => {
    if (tpl.id === "custom") return;
    var glossaryKey = (typeof TEMPLATE_GLOSSARY !== "undefined") ? TEMPLATE_GLOSSARY[tpl.id] : null;
    var infoBtn = glossaryKey ? ' <span class="glossary-info" onclick="event.stopPropagation();openGlossary(\'' + glossaryKey.replace(/'/g,"\\'") + '\')">ⓘ</span>' : "";
    html += `
      <div class="tpl-option${tpl.id === current ? ' active' : ''}" onclick="openDurationPicker('${tpl.id}')">
        <div class="tpl-head">
          <div class="tpl-name">${tpl.name}${infoBtn}</div>
        </div>
        <div class="tpl-desc">${tpl.description}</div>
      </div>
    `;
  });
  openSheet(html);
}

function openDurationPicker(templateId) {
  const ap = (typeof activeProgram === "function") ? activeProgram() : null;
  if (ap && ap.draft) {
    if (!confirm("You have a workout in progress on " + (ap.displayName || "your active program") + ". Adding a new program will pause it. Continue?")) return;
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
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><h3 style="margin:0;">${tpl.name}</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div>
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
    btn.textContent = d + "d" + (d === tplNativeDays ? " ★" : "");
    btn.style.cssText = "flex:1;padding:10px;font-size:14px;font-weight:700;";
    btn.onclick = function() {
      selectedDays = d;
      dayBtnGrid.querySelectorAll("button").forEach(function(b) {
        b.classList.toggle("selected", parseInt(b.dataset.day) === selectedDays);
      });
      updateStartBtn();
      if (previewOpen) renderSamplePreview(previewContainer, templateId, selectedDays, selectedWeeks);
    };
    dayBtnGrid.appendChild(btn);
  }
  wrap.appendChild(dayBtnGrid);

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
      ).join(" → ");
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
    btn.onclick = function() { selectedWeeks = wk; updatePreview(); updateStartBtn(); if (previewOpen) renderSamplePreview(previewContainer, templateId, selectedDays, selectedWeeks); };
    btnGrid.appendChild(btn);
  });
  wrap.appendChild(btnGrid);

  const previewEl = document.createElement("div");
  previewEl.style.cssText = "font-size:12px;margin-bottom:16px;line-height:1.6;";
  wrap.appendChild(previewEl);
  updatePreview();

  var previewOpen = false;
  const previewToggle = document.createElement("button");
  previewToggle.className = "schedule-day-btn";
  previewToggle.textContent = "Preview Sample Workout ▾";
  previewToggle.style.cssText = "width:100%;padding:10px;font-size:13px;font-weight:700;margin-bottom:8px;";
  const previewContainer = document.createElement("div");
  previewContainer.className = "sample-preview-wrap";
  previewContainer.style.display = "none";
  previewToggle.onclick = function() {
    previewOpen = !previewOpen;
    previewContainer.style.display = previewOpen ? "" : "none";
    previewToggle.textContent = previewOpen ? "Hide Preview ▴" : "Preview Sample Workout ▾";
    if (previewOpen) {
      renderSamplePreview(previewContainer, templateId, selectedDays, selectedWeeks);
    }
  };
  wrap.appendChild(previewToggle);
  wrap.appendChild(previewContainer);

  const actions = document.createElement("div");
  actions.className = "sheet-actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.onclick = function() { closeSheet(); };

  const startBtn = document.createElement("button");
  startBtn.className = "primary";
  function updateStartBtn() {
    startBtn.textContent = "Add " + selectedDays + "d × " + selectedWeeks + "wk Program";
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

// v21: append a new program entry to the library + set it active.
// Auto-name on template collision ("Conjugate Strength" → "Conjugate Strength (2)").
// RP hypertrophy entries start without an rp container — startMesocycle will
// build one on first run.
function applyProgramSwitch(tpl, totalWeeks, daysPerWeek) {
  const tw = totalWeeks || 10;
  const dpw = daysPerWeek || tpl.daysPerWeek;
  const generated = resolveWeekProgram(tpl.id, 1, tw, dpw) || [];
  const weekly = (typeof buildDefaultWeeklySchedule === "function")
    ? buildDefaultWeeklySchedule({ program: generated, daysPerWeek: dpw }) : null;

  const entry = makeProgramEntry({
    displayName: tpl.name,
    templateId: tpl.id,
    program: generated,
    daysPerWeek: dpw,
    totalWeeks: tw,
    currentWeek: 1,
    programStartDate: Date.now(),
    weeklySchedule: weekly,
    lastDoneDayId: null,
    draft: null,
    rp: null
  });

  const newId = addProgramEntry(entry, { activate: true });

  // For RP hypertrophy, kick off the first mesocycle now (mirrors prior behavior)
  if (tpl.id === "rp-hypertrophy" && typeof startMesocycle === "function") {
    startMesocycle({ lengthWeeks: tw, daysPerWeek: dpw });
  }

  stopSessionTimer();
  state.workoutStartedAt = null;
  state.currentDayId = (typeof determineDefaultDay === "function") ? determineDefaultDay() : 1;
  state.dayChosen = false;
  closeSheet();
  renderProgramPicker();
  renderWorkoutScreen();
  const u = userData();
  const added = u && u.programs.find(p => p.id === newId);
  showToast("Added " + (added ? added.displayName : tpl.name), "success");
}

// Manual week controls — operates on the active program
function openWeekControl() {
  const ap = (typeof activeProgram === "function") ? activeProgram() : null;
  if (!ap) return;
  const phases = getPhasesForTemplate(ap.templateId, ap.totalWeeks);
  const phase = phases ? phaseForWeek(phases, ap.currentWeek || 1) : null;

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><h3 style="margin:0;">Week ${ap.currentWeek || 1} of ${ap.totalWeeks || "?"}</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div>
    ${phase ? `<div style="color:${phase.color};font-weight:700;font-size:14px;margin-bottom:8px;">${phase.name}</div>
    <div style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">${phase.description || ""}</div>` : ""}
  `;

  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;flex-direction:column;gap:8px;";

  if (ap.currentWeek > 1) {
    const backBtn = document.createElement("button");
    backBtn.className = "sheet-item";
    backBtn.innerHTML = '<span class="icon">←</span><span>Previous Week (Week ' + (ap.currentWeek - 1) + ')</span>';
    backBtn.onclick = function() { goBackWeek(); closeSheet(); renderProgramPicker(); renderWorkoutScreen(); };
    actions.appendChild(backBtn);
  }

  if (ap.currentWeek < (ap.totalWeeks || 12)) {
    const fwdBtn = document.createElement("button");
    fwdBtn.className = "sheet-item";
    fwdBtn.innerHTML = '<span class="icon">→</span><span>Skip to Week ' + (ap.currentWeek + 1) + '</span>';
    fwdBtn.onclick = function() { advanceWeek(); closeSheet(); renderProgramPicker(); renderWorkoutScreen(); };
    actions.appendChild(fwdBtn);
  }

  const restartBtn = document.createElement("button");
  restartBtn.className = "sheet-item";
  restartBtn.innerHTML = '<span class="icon">↺</span><span>Restart Program (Week 1)</span>';
  restartBtn.onclick = function() {
    if (!confirm("Restart from Week 1? Session history is kept.")) return;
    updateActiveProgram(function(entry) {
      entry.currentWeek = 1;
      entry.lastDoneDayId = null;
      entry.draft = null;
      entry.programStartDate = Date.now();
      var gen = resolveWeekProgram(entry.templateId, 1, entry.totalWeeks, entry.daysPerWeek);
      if (gen) entry.program = gen;
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

// --- Header chip + switcher sheet (v21) ----------------------------
// Tiny chip in the day-bar that reads "Conjugate · W3D2 ▾". Tapping
// opens a compact switcher (Set-Active only — Add/Archive/Delete live
// in Settings). Re-rendered by renderWorkoutScreen() each time.
function renderHeaderProgramChip() {
  const chip = document.getElementById("headerProgramChip");
  if (!chip) return;
  const u = userData();
  const ap = (typeof activeProgram === "function") ? activeProgram() : null;
  if (!u || !ap || !Array.isArray(u.programs) || u.programs.filter(p => !p.archivedAt).length < 2) {
    chip.style.display = "none";
    chip.innerHTML = "";
    return;
  }
  const name = ap.displayName || "Program";
  const wk = ap.currentWeek || 1;
  const dayId = (state && state.currentDayId) || 1;
  chip.style.display = "";
  chip.innerHTML = `<span class="paper-chip-name">${escapeHtmlMaybe(name)}</span><span class="paper-chip-meta">W${wk}D${dayId}</span><span class="paper-chip-arrow">▾</span>`;
  chip.onclick = openProgramSwitcher;
}

function openProgramSwitcher() {
  const u = userData();
  if (!u || !Array.isArray(u.programs)) return;
  const active = u.programs.find(p => p.id === u.activeProgramId);
  const visible = u.programs.filter(p => !p.archivedAt);
  const wrap = document.createElement("div");
  let html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><h3 style="margin:0;">Switch program</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div>';
  html += '<p style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">Each program keeps its own week, draft, and schedule.</p>';
  html += '<div class="paper-library-list">';
  visible.forEach(entry => {
    const isActive = active && entry.id === active.id;
    const tpl = PROGRAM_TEMPLATES.find(t => t.id === entry.templateId);
    const sub = (entry.totalWeeks ? "Week " + (entry.currentWeek || 1) + " of " + entry.totalWeeks : (tpl ? tpl.description : ""));
    html += '<div class="paper-library-row paper-switcher-row' + (isActive ? ' active' : '') + '" data-pid="' + entry.id + '">';
    html += '  <div class="paper-library-bullet" aria-hidden="true">' + (isActive ? '●' : '○') + '</div>';
    html += '  <div class="paper-library-body">';
    html += '    <div class="paper-library-name">' + escapeHtmlMaybe(entry.displayName || (tpl && tpl.name) || "Program") + (isActive ? ' <span class="paper-library-tag">active</span>' : '') + '</div>';
    if (sub) html += '    <div class="paper-library-meta">' + escapeHtmlMaybe(sub) + '</div>';
    html += '  </div>';
    html += '</div>';
  });
  html += '</div>';
  html += '<div class="paper-library-footer">';
  html += '  <button class="paper-link-btn" onclick="closeSheet();showScreen(\'settings\');">Manage in Settings →</button>';
  html += '</div>';
  wrap.innerHTML = html;
  wrap.querySelectorAll(".paper-switcher-row").forEach(row => {
    row.addEventListener("click", () => {
      const pid = row.dataset.pid;
      closeSheet();
      setActiveProgramFromLibrary(pid);
    });
  });
  openSheet(wrap);
}
