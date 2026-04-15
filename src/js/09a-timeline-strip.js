// ============================================================
// TIMELINE STRIP — Journey Map calendar + program phase tracking
// ============================================================

function getStreakCount(sessions) {
  if (!sessions || !sessions.length) return 0;
  const dayMs = 86400000;
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  let streak = 0;
  let checkDate = todayStart.getTime();

  // Check if there's a session today first
  const hasToday = sessions.some(s => s.finishedAt >= checkDate && s.finishedAt < checkDate + dayMs);
  if (!hasToday) {
    // Check yesterday — streak might still be active
    checkDate -= dayMs;
    const hasYesterday = sessions.some(s => s.finishedAt >= checkDate && s.finishedAt < checkDate + dayMs);
    if (!hasYesterday) return 0;
  }

  // Walk backwards counting consecutive days
  while (true) {
    const hasSession = sessions.some(s => s.finishedAt >= checkDate && s.finishedAt < checkDate + dayMs);
    if (hasSession) { streak++; checkDate -= dayMs; } else break;
  }
  return streak;
}

function getProgramWeek(programStartDate) {
  if (!programStartDate) return null;
  return Math.floor((Date.now() - programStartDate) / 604800000) + 1;
}

function getCurrentPhase(tpl, weekNum) {
  if (!tpl || !tpl.phases || !weekNum) return null;
  return tpl.phases.find(p => p.weeks.includes(weekNum)) || null;
}

function getTemplateForUser(u) {
  if (!u) return null;
  return PROGRAM_TEMPLATES.find(t => t.id === u.templateId) || null;
}

function getDayPrimaryColor(session) {
  if (!session || !session.sets || !session.sets.length) return null;
  const counts = {};
  session.sets.forEach(s => {
    (s.muscles || []).forEach(m => {
      const g = groupMuscle(m);
      if (g && GROUP_COLORS[g]) counts[g] = (counts[g] || 0) + 1;
    });
  });
  const top = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];
  return top ? GROUP_COLORS[top[0]] : null;
}

function getSessionForDate(sessions, dateMs) {
  const dayStart = new Date(dateMs); dayStart.setHours(0,0,0,0);
  const dayEnd = dayStart.getTime() + 86400000;
  return sessions.find(s => s.finishedAt >= dayStart.getTime() && s.finishedAt < dayEnd) || null;
}

function isScheduledDay(weeklySchedule, dateMs) {
  if (!weeklySchedule) return false;
  const dow = new Date(dateMs).getDay(); // 0=Sun
  return weeklySchedule[dow] != null;
}

function renderTimelineStrip() {
  const container = document.getElementById("timelineStrip");
  if (!container) return;
  const u = userData();
  if (!u) { container.innerHTML = ""; container.style.display = "none"; return; }

  container.style.display = "";
  container.innerHTML = "";

  const tpl = getTemplateForUser(u);
  const sessions = u.sessions || [];
  const dayMs = 86400000;
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayMs = todayStart.getTime();

  // Build 28-day range: 14 past + today + 13 future
  const days = [];
  for (let i = -14; i <= 13; i++) {
    days.push(todayMs + i * dayMs);
  }

  // Streak
  const streak = getStreakCount(sessions);

  // Phase info — prefer user's workout-count-based week, fall back to date-based
  const weekNum = u.currentWeek || getProgramWeek(u.programStartDate);
  const dynamicPhases = getPhasesForTemplate(u.templateId, u.totalWeeks);
  const phase = dynamicPhases ? phaseForWeek(dynamicPhases, weekNum) : getCurrentPhase(tpl, weekNum);

  // Top row: streak + phase label
  const infoRow = document.createElement("div");
  infoRow.className = "tl-info-row";

  if (streak > 0) {
    const streakEl = document.createElement("div");
    streakEl.className = "tl-streak";
    streakEl.innerHTML = `<span class="tl-streak-num">${streak}</span><span class="tl-streak-label">day streak</span>`;
    infoRow.appendChild(streakEl);
  }

  var displayTotalWeeks = u.totalWeeks || (tpl && tpl.totalWeeks);
  if (displayTotalWeeks && weekNum) {
    const phaseEl = document.createElement("div");
    phaseEl.className = "tl-phase";
    if (weekNum > displayTotalWeeks) {
      phaseEl.innerHTML = `<span class="tl-phase-label" style="color:var(--success);">Program Complete!</span>`;
    } else {
      const phaseName = phase ? phase.name : "";
      const phaseColor = phase ? phase.color : "var(--text-dim)";
      phaseEl.innerHTML = `<span class="tl-week">Week ${weekNum} of ${displayTotalWeeks}</span>` +
        (phaseName ? `<span class="tl-phase-dot" style="background:${phaseColor};"></span><span class="tl-phase-label" style="color:${phaseColor};">${phaseName}</span>` : "");
    }
    infoRow.appendChild(phaseEl);
  }

  container.appendChild(infoRow);

  // Scrollable pill strip
  const strip = document.createElement("div");
  strip.className = "tl-strip";

  days.forEach(dateMs => {
    const pill = document.createElement("div");
    const d = new Date(dateMs);
    const isToday = dateMs === todayMs;
    const isPast = dateMs < todayMs;
    const session = isPast || isToday ? getSessionForDate(sessions, dateMs) : null;
    const scheduled = !isPast && !isToday && isScheduledDay(u.weeklySchedule, dateMs);
    const color = session ? getDayPrimaryColor(session) : null;

    pill.className = "tl-pill" +
      (isToday ? " today" : "") +
      (session ? " completed" : "") +
      (scheduled ? " scheduled" : "") +
      (!isPast && !isToday && !scheduled ? " future" : "");

    if (color) pill.style.setProperty("--pill-color", color);

    const dayNum = d.getDate();
    const dayLabel = ["S","M","T","W","T","F","S"][d.getDay()];
    pill.innerHTML = `<span class="tl-dow">${dayLabel}</span><span class="tl-date">${dayNum}</span>`;

    if (session) {
      pill.onclick = () => openSessionDetail(session);
    } else if (isPast || isToday) {
      pill.classList.add("tappable");
      pill.onclick = () => openAddWorkout(dateMs);
    }

    strip.appendChild(pill);
  });

  container.appendChild(strip);

  // Phase progress bar — use dynamic phases from periodization engine
  var barPhases = dynamicPhases || (tpl && tpl.phases);
  var barTotal = displayTotalWeeks || (tpl && tpl.totalWeeks);
  if (barPhases && barTotal && weekNum && weekNum <= barTotal) {
    const progBar = document.createElement("div");
    progBar.className = "tl-phase-bar";
    barPhases.forEach(p => {
      const seg = document.createElement("div");
      seg.className = "tl-phase-seg";
      const widthPct = (p.weeks.length / barTotal) * 100;
      seg.style.width = widthPct + "%";
      seg.style.background = p.color + "33";
      if (p.weeks.includes(weekNum)) {
        seg.classList.add("active");
        seg.style.background = p.color + "66";
        seg.style.borderColor = p.color;
      }
      seg.title = p.name;
      progBar.appendChild(seg);
    });
    container.appendChild(progBar);
  }

  // Auto-scroll to center today
  requestAnimationFrame(() => {
    const todayPill = strip.querySelector(".tl-pill.today");
    if (todayPill) {
      const offset = todayPill.offsetLeft - strip.offsetWidth / 2 + todayPill.offsetWidth / 2;
      strip.scrollLeft = offset;
    }
  });
}

function openSessionDetail(session) {
  const date = new Date(session.finishedAt);
  const dateStr = date.toLocaleDateString(undefined, { weekday:"long", month:"short", day:"numeric" });
  const prHtml = session.prCount ? `<div class="tl-detail-pr">🏆 ${session.prCount} PR${session.prCount>1?"s":""}</div>` : "";

  // Group sets by exercise
  const exGroups = {};
  session.sets.forEach(s => {
    if (!exGroups[s.exId]) exGroups[s.exId] = { name: s.exName, sets: [] };
    exGroups[s.exId].sets.push(s);
  });

  let exHtml = "";
  Object.values(exGroups).forEach(g => {
    const setsStr = g.sets.map(s =>
      s.bodyweight ? `${s.reps}r` : `${s.weight}×${s.reps}`
    ).join(", ");
    exHtml += `<div class="tl-detail-ex"><span class="tl-detail-exname">${g.name}</span><span class="tl-detail-sets">${setsStr}</span></div>`;
  });

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <h3>${dateStr}</h3>
    <div class="tl-detail-day">Day ${session.dayId} — ${session.dayName}</div>
    <div class="tl-detail-meta">${session.sets.length} sets · ${formatDuration(session.duration)} · ${session.volume > 0 ? formatVolume(session.volume) + " " + state.unit : "bodyweight"}</div>
    ${prHtml}
    <div class="tl-detail-exercises">${exHtml}</div>
  `;

  const del = document.createElement("button");
  del.className = "sheet-item danger";
  del.innerHTML = `<span class="icon">🗑</span> Delete this session`;
  del.style.marginTop = "14px";
  del.onclick = () => {
    if (!confirm("Delete this workout session? This can't be undone.")) return;
    deleteSession(session.id);
    closeSheet();
    renderTimelineStrip();
    renderHistory();
    showToast("Session deleted", "success");
  };
  wrap.appendChild(del);

  openSheet(wrap);
}

function deleteSession(sessionId) {
  updateUser(u => {
    u.sessions = u.sessions.filter(s => s.id !== sessionId);
  });
}

function openAddWorkout(dateMs) {
  const u = userData();
  if (!u) return;
  const d = new Date(dateMs);
  const dateStr = d.toLocaleDateString(undefined, { weekday:"long", month:"short", day:"numeric" });

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <h3>Log Workout</h3>
    <div style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">${dateStr}</div>
    <p style="color:var(--text-dim);font-size:12px;margin-bottom:10px;">Pick a workout day to log for this date.</p>
  `;

  // Day selection cards
  const next = determineDefaultDay();
  u.program.forEach(day => {
    const btn = document.createElement("button");
    btn.className = "sheet-item";
    const nextTag = day.id === next ? ' <span style="color:var(--accent);font-size:10px;font-weight:800;">NEXT</span>' : "";
    btn.innerHTML = `<span class="icon">${day.id}</span><span>${day.name}${nextTag}<div style="color:var(--text-dim);font-size:11px;font-weight:500;">${day.sub || ""}</div></span>`;
    btn.onclick = () => {
      openLogSets(dateMs, day);
    };
    wrap.appendChild(btn);
  });

  openSheet(wrap);
}

function openLogSets(dateMs, day) {
  const u = userData();
  const d = new Date(dateMs);
  const dateStr = d.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" });

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <h3>${day.name}</h3>
    <div style="color:var(--text-dim);font-size:12px;margin-bottom:10px;">${dateStr} — ${day.sub || ""}</div>
  `;

  // Build exercise rows with editable weight/reps
  const exRows = [];
  day.blocks.forEach(block => {
    block.exercises.forEach(ex => {
      if (ex.isWarmup) return;
      const lastSets = getLastSetsFor(ex.exId || ex.name);
      const lastSet = lastSets[0];
      const defW = lastSet ? lastSet.weight : (ex.defaultWeight || 0);
      const defR = lastSet ? lastSet.reps : (ex.reps || 8);

      const row = document.createElement("div");
      row.className = "tl-log-row";
      row.innerHTML = `
        <div class="tl-log-name">${ex.name}</div>
        <div class="tl-log-fields">
          <span class="tl-log-label">${ex.sets}×</span>
          ${ex.bodyweight ? "" : `<input type="number" class="tl-log-input" data-field="w" value="${defW}" min="0" placeholder="wt">`}
          <span class="tl-log-label">×</span>
          <input type="number" class="tl-log-input" data-field="r" value="${defR}" min="0" placeholder="reps">
        </div>
      `;
      wrap.appendChild(row);
      exRows.push({ ex, row, sets: ex.sets });
    });
  });

  const actions = document.createElement("div");
  actions.className = "sheet-actions";
  actions.style.marginTop = "14px";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.onclick = () => closeSheet();

  const saveBtn = document.createElement("button");
  saveBtn.className = "primary";
  saveBtn.textContent = "Save Workout";
  saveBtn.onclick = () => {
    // Build session from the form values
    const sets = [];
    exRows.forEach(({ ex, row, sets: numSets }) => {
      const wInput = row.querySelector('[data-field="w"]');
      const rInput = row.querySelector('[data-field="r"]');
      const w = wInput ? parseFloat(wInput.value) || 0 : 0;
      const r = parseFloat(rInput.value) || 0;
      if (r === 0) return;
      for (let i = 0; i < numSets; i++) {
        sets.push({
          exId: ex.exId || ex.name,
          exName: ex.name,
          muscles: ex.muscles || [],
          setIdx: i + 1,
          weight: ex.bodyweight ? 0 : w,
          reps: r,
          rpe: 7,
          bodyweight: !!ex.bodyweight,
          isPR: false
        });
      }
    });

    if (sets.length === 0) {
      if (!confirm("No sets with reps logged. Save an empty session?")) return;
    }

    const volume = sets.reduce((a, s) => a + s.weight * s.reps, 0);
    // Place the session at noon on the target date
    const noon = new Date(dateMs);
    noon.setHours(12, 0, 0, 0);
    const finishedAt = noon.getTime();

    const session = {
      id: "s-" + Date.now(),
      dayId: day.id,
      dayName: day.name,
      startedAt: finishedAt - 3600000, // assume 1hr
      finishedAt,
      duration: 3600,
      sets, volume,
      prCount: 0,
      manual: true
    };

    updateUser(u => {
      u.sessions.push(session);
      u.sessions.sort((a, b) => a.finishedAt - b.finishedAt);
      if (u.sessions.length > 365) u.sessions = u.sessions.slice(-365);
    });

    closeSheet();
    renderTimelineStrip();
    renderHistory();
    showToast("Workout logged", "success");
  };

  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  wrap.appendChild(actions);
  openSheet(wrap);
}
