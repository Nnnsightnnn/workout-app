// ============================================================
// TIMELINE STRIP — Journey Map calendar + program phase tracking
// ============================================================

function getTrainingStreak(sessions, daysPerWeek) {
  if (!sessions || !sessions.length) return { count: 0, atRisk: false };
  const dayMs = 86400000;
  const maxGap = Math.ceil(7 / (daysPerWeek || 4)) + 1;
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayMs = todayStart.getTime();

  // Unique session dates sorted descending
  const seen = new Set();
  const sessionDays = [];
  [...sessions].sort((a, b) => b.finishedAt - a.finishedAt).forEach(s => {
    const ds = new Date(s.finishedAt); ds.setHours(0,0,0,0);
    const key = ds.getTime();
    if (!seen.has(key)) { seen.add(key); sessionDays.push(key); }
  });

  const daysSinceLast = Math.floor((todayMs - sessionDays[0]) / dayMs);
  if (daysSinceLast >= maxGap) return { count: 0, atRisk: false };

  let count = 1;
  for (let i = 1; i < sessionDays.length; i++) {
    const gap = Math.floor((sessionDays[i - 1] - sessionDays[i]) / dayMs);
    if (gap > maxGap) break;
    count++;
  }

  const atRisk = daysSinceLast >= maxGap - 1 && daysSinceLast > 0;
  return { count, atRisk };
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

  // Streak (training-frequency-aware)
  const { count: streak, atRisk: streakAtRisk } = getTrainingStreak(sessions, u.daysPerWeek);

  // Phase info — prefer user's workout-count-based week, fall back to date-based
  const weekNum = u.currentWeek || getProgramWeek(u.programStartDate);
  const dynamicPhases = getPhasesForTemplate(u.templateId, u.totalWeeks);
  const phase = dynamicPhases ? phaseForWeek(dynamicPhases, weekNum) : getCurrentPhase(tpl, weekNum);

  // Top row: streak + forge counter + phase label
  const infoRow = document.createElement("div");
  infoRow.className = "tl-info-row";

  if (streak > 0) {
    const streakEl = document.createElement("div");
    const flameTier = streak >= 30 ? "legendary" : streak >= 14 ? "lg" : streak >= 7 ? "md" : streak >= 3 ? "sm" : "ember";
    streakEl.className = "tl-streak flame-" + flameTier + (streakAtRisk ? " flame-risk" : "");
    streakEl.innerHTML = `<span class="tl-flame"></span><span class="tl-streak-num">${streak}</span><span class="tl-streak-label">streak</span>`;
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

  renderStampCard();
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
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><h3 style="margin:0;">${dateStr}</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div>
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
    if (_undoPending) clearUndoToast();
    const deletedSession = deepClone(session);
    const deletedUserId = state.userId;
    deleteSession(session.id);
    closeSheet();
    renderTimelineStrip();
    renderHistory();
    _undoPending = { session: deletedSession, userId: deletedUserId, timerId: null, onExpire: null };
    showUndoToast("Session deleted", () => { _undoPending = null; });
  };
  wrap.appendChild(del);

  openSheet(wrap);
}

function deleteSession(sessionId) {
  updateUser(u => {
    u.sessions = u.sessions.filter(s => s.id !== sessionId);
  });
}

function undoDeleteSession() {
  if (!_undoPending || !_undoPending.session) return;
  const { session: s, userId, timerId } = _undoPending;
  if (timerId) clearTimeout(timerId);
  const store = loadStore();
  const targetUser = store.users.find(u => u.id === userId);
  if (!targetUser) {
    _undoPending = null;
    showToast("Can\u2019t undo \u2014 user not found");
    return;
  }
  targetUser.sessions.push(s);
  targetUser.sessions.sort((a, b) => a.finishedAt - b.finishedAt);
  saveStore(store);
  _undoPending = null;
  const t = document.getElementById("toast");
  t.className = "toast";
  t.innerHTML = "";
  renderTimelineStrip();
  renderHistory();
  showToast("Session restored", "success");
}

function openAddWorkout(dateMs) {
  const u = userData();
  if (!u) return;
  const d = new Date(dateMs);
  const dateStr = d.toLocaleDateString(undefined, { weekday:"long", month:"short", day:"numeric" });

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><h3 style="margin:0;">Log Workout</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div>
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
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><h3 style="margin:0;">${day.name}</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div>
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

// ============================================================
// FUEL CELL — Weekly progress liquid fill (hero visual)
// ============================================================
function renderStampCard() {
  const el = document.getElementById("stampCard");
  if (!el) return;
  const u = userData();
  if (!u) { el.style.display = "none"; return; }

  el.style.display = "";
  el.innerHTML = "";

  const sessions = u.sessions || [];
  const target = u.program ? u.program.length : (u.daysPerWeek || 4);
  let completed = 0;

  if (u.currentWeek) {
    const weekSessions = sessions.filter(s => s.programWeek === u.currentWeek);
    completed = new Set(weekSessions.map(s => s.dayId)).size;
  } else {
    const weekAgo = Date.now() - 7 * 86400000;
    completed = sessions.filter(s => s.finishedAt >= weekAgo).length;
  }
  completed = Math.min(completed, target);
  const pct = target > 0 ? completed / target : 0;
  const isFull = pct >= 1;

  // Lifetime volume for subtitle
  const totalVol = sessions.reduce((sum, s) => sum + (s.volume || 0), 0);
  const volStr = totalVol >= 1000000 ? (totalVol / 1000000).toFixed(1) + "M"
    : totalVol >= 10000 ? (totalVol / 1000).toFixed(1) + "k"
    : totalVol > 0 ? totalVol.toLocaleString()
    : null;

  const card = document.createElement("div");
  card.className = "fuel-cell" + (isFull ? " fuel-full" : "");

  // Top line: label + count
  const header = document.createElement("div");
  header.className = "fuel-header";
  header.innerHTML = `<span class="fuel-title">Effort</span><span class="fuel-count">${completed} <span class="fuel-of">of</span> ${target}</span>`;
  card.appendChild(header);

  // Tank bar
  const tank = document.createElement("div");
  tank.className = "fuel-tank";

  const liquid = document.createElement("div");
  liquid.className = "fuel-liquid";
  liquid.style.setProperty("--pct", (pct * 100) + "%");

  // Animated wave surface at the leading edge
  if (pct > 0 && pct < 1) {
    const wave = document.createElement("div");
    wave.className = "fuel-wave";
    liquid.appendChild(wave);
  }

  // Inner shimmer
  if (pct > 0) {
    const sheen = document.createElement("div");
    sheen.className = "fuel-sheen";
    liquid.appendChild(sheen);
  }

  tank.appendChild(liquid);

  // Segment markers
  for (let i = 1; i < target; i++) {
    const seg = document.createElement("div");
    seg.className = "fuel-seg";
    seg.style.left = ((i / target) * 100) + "%";
    tank.appendChild(seg);
  }

  card.appendChild(tank);

  // Bottom line: volume + sessions
  if (volStr || sessions.length > 0) {
    const footer = document.createElement("div");
    footer.className = "fuel-footer";
    const parts = [];
    if (volStr) parts.push(volStr + " " + state.unit + " lifetime");
    if (sessions.length > 0) parts.push(sessions.length + " workouts total");
    footer.textContent = parts.join(" · ");
    card.appendChild(footer);
  }

  el.appendChild(card);
}
