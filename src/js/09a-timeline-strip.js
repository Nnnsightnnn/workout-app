// ============================================================
// TIMELINE STRIP — Journey Map calendar + program phase tracking
// ============================================================

function getTrainingStreak(sessions, daysPerWeek) {
  if (!sessions || !sessions.length) return { count: 0, atRisk: false };
  const dayMs = 86400000;
  const maxGap = Math.ceil(7 / (daysPerWeek || 4)) + 1;
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayMs = todayStart.getTime();

  // Unique session dates sorted descending (exclude future pre-logged sessions)
  const seen = new Set();
  const sessionDays = [];
  const todayEnd = todayMs + dayMs;
  [...sessions].filter(s => s.finishedAt < todayEnd).sort((a, b) => b.finishedAt - a.finishedAt).forEach(s => {
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
    const session = getSessionForDate(sessions, dateMs);
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
    } else if (isPast) {
      pill.classList.add("tappable");
      pill.onclick = () => openAddWorkout(dateMs);
    } else if (isToday) {
      pill.classList.add("tappable");
      pill.onclick = () => openPlanWorkout(dateMs);
    } else {
      // Future pill — all future dates are tappable for planning
      pill.classList.add("tappable");
      pill.classList.remove("future");
      const dow = d.getDay();
      let scheduledDayId = null;
      if (Array.isArray(u.weeklySchedule) && u.weeklySchedule.length === 7) {
        scheduledDayId = u.weeklySchedule[dow];
      } else if (typeof _laTrainingPattern === "function" && u.daysPerWeek) {
        const pattern = _laTrainingPattern(u.daysPerWeek);
        const dayIdx = pattern.indexOf(dow);
        if (dayIdx !== -1 && dayIdx < u.program.length) {
          scheduledDayId = u.program[dayIdx].id;
        }
      }
      if (scheduledDayId != null && u.program.find(d => d.id === scheduledDayId)) {
        pill.classList.add("scheduled");
      }
      pill.onclick = () => openPlanWorkout(dateMs);
    }

    strip.appendChild(pill);
  });

  container.appendChild(strip);

  // Inline "Edit schedule" affordance — lets users move program days around
  const schedRow = document.createElement("div");
  schedRow.className = "tl-sched-row";
  const schedBtn = document.createElement("button");
  schedBtn.className = "tl-sched-btn";
  schedBtn.innerHTML = '<span class="tl-sched-ico">\u2630</span>Edit schedule';
  schedBtn.onclick = () => {
    if (typeof openWeeklyScheduleEditor === "function") openWeeklyScheduleEditor();
  };
  schedRow.appendChild(schedBtn);
  container.appendChild(schedRow);

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
  const editedBadge = session.editedAt ? `<div style="font-size:11px;color:var(--text-dim);margin-top:2px;">Edited ${new Date(session.editedAt).toLocaleDateString()}</div>` : "";

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
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">${dateStr}</h3>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="icon-btn" id="tl-edit-btn" title="Edit workout" style="font-size:13px;padding:4px 10px;">Edit</button>
        <button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>
      </div>
    </div>
    <div class="tl-detail-day">Day ${session.dayId} — ${session.dayName}</div>
    <div class="tl-detail-meta">${session.sets.length} sets · ${formatDuration(session.duration)} · ${session.volume > 0 ? formatVolume(session.volume) + " " + state.unit : "bodyweight"}</div>
    ${prHtml}
    ${editedBadge}
    <div class="tl-detail-exercises">${exHtml}</div>
  `;

  wrap.querySelector("#tl-edit-btn").onclick = () => {
    openSessionEditor(session);
  };

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
  recomputeAllIsPR();
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
  recomputeAllIsPR();
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

function openPlanWorkout(dateMs) {
  const u = userData();
  if (!u) return;
  const d = new Date(dateMs);
  const dateStr = d.toLocaleDateString(undefined, { weekday:"long", month:"short", day:"numeric" });
  const dow = d.getDay();
  const dowName = _DOW_LABELS_LONG[dow];

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const isToday = dateMs === todayStart.getTime();

  const sched = (Array.isArray(u.weeklySchedule) && u.weeklySchedule.length === 7) ? u.weeklySchedule : null;
  const scheduledDayId = sched ? sched[dow] : null;
  const scheduledDay = scheduledDayId != null ? u.program.find(dd => dd.id === scheduledDayId) : null;
  const isRest = sched && scheduledDayId == null;

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">${isToday ? "Today" : "Plan Workout"}</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>
    </div>
    <div style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">${dateStr}${isRest ? " · Rest day" : ""}</div>
  `;

  // For today, show a prominent Start button if a workout is scheduled
  if (isToday && scheduledDay) {
    const startBtn = document.createElement("button");
    startBtn.className = "sheet-item";
    startBtn.style.cssText = "background:var(--accent);color:#fff;border-color:var(--accent);";
    startBtn.innerHTML = `<span class="icon" style="background:rgba(255,255,255,0.2);color:#fff;">\u25B6</span><span style="font-weight:800;">Start ${scheduledDay.name}<div style="color:rgba(255,255,255,0.8);font-size:11px;font-weight:500;">${scheduledDay.sub || ""}</div></span>`;
    startBtn.onclick = () => {
      state.currentDayId = scheduledDay.id;
      state.dayChosen = true;
      closeSheet();
      if (typeof openWorkout === "function") openWorkout();
    };
    wrap.appendChild(startBtn);

    const divider = document.createElement("div");
    divider.style.cssText = "border-top:1px solid var(--border);margin:12px 0 8px;";
    wrap.appendChild(divider);

    const swapLabel = document.createElement("div");
    swapLabel.style.cssText = "font-size:11px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;";
    swapLabel.textContent = "Or swap to a different day";
    wrap.appendChild(swapLabel);
  }

  const next = determineDefaultDay();
  u.program.forEach(day => {
    const btn = document.createElement("button");
    btn.className = "sheet-item" + (day.id === scheduledDayId ? " current" : "");
    const tag = day.id === scheduledDayId
      ? ' <span style="color:var(--accent);font-size:10px;font-weight:800;">SCHEDULED</span>'
      : (day.id === next && !scheduledDayId ? ' <span style="color:var(--accent);font-size:10px;font-weight:800;">NEXT</span>' : "");
    btn.innerHTML = `<span class="icon">${day.id}</span><span>${day.name}${tag}<div style="color:var(--text-dim);font-size:11px;font-weight:500;">${day.sub || ""}</div></span>`;
    btn.onclick = () => {
      if (isToday) {
        // Today: jump straight into that workout (and update recurring schedule)
        updateUser(usr => {
          const s = ensureWeeklySchedule(usr);
          _assignDayToDow(s, dow, day.id);
        });
        state.currentDayId = day.id;
        state.dayChosen = true;
        closeSheet();
        if (typeof openWorkout === "function") openWorkout();
      } else {
        openLogSets(dateMs, day);
      }
    };
    wrap.appendChild(btn);
  });

  const divider = document.createElement("div");
  divider.style.cssText = "border-top:1px solid var(--border);margin:14px 0 10px;";
  wrap.appendChild(divider);

  // Set as rest day for this weekday going forward
  const restBtn = document.createElement("button");
  restBtn.className = "sheet-item" + (isRest ? " current" : "");
  restBtn.innerHTML = `<span class="icon">\u2014</span><span>Set ${dowName} as rest day<div style="color:var(--text-dim);font-size:11px;font-weight:500;">Recurring \u2014 every ${dowName} becomes a rest day</div></span>`;
  restBtn.onclick = () => {
    updateUser(usr => {
      const s = ensureWeeklySchedule(usr);
      s[dow] = null;
    });
    state.currentDayId = determineDefaultDay();
    closeSheet();
    if (typeof renderTimelineStrip === "function") renderTimelineStrip();
    if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
    if (typeof showToast === "function") showToast(dowName + "s set as rest", "success");
  };
  wrap.appendChild(restBtn);

  const adhocBtn = document.createElement("button");
  adhocBtn.className = "sheet-item";
  adhocBtn.style.marginTop = "8px";
  adhocBtn.innerHTML = `<span class="icon" style="font-size:16px;">+</span><span>Custom Workout<div style="color:var(--text-dim);font-size:11px;font-weight:500;">Pick exercises or log an activity for this date only</div></span>`;
  adhocBtn.onclick = () => openPlanAdhoc(dateMs);
  wrap.appendChild(adhocBtn);

  const schedBtn = document.createElement("button");
  schedBtn.className = "sheet-item";
  schedBtn.style.marginTop = "8px";
  schedBtn.innerHTML = `<span class="icon">\u2630</span><span>Edit weekly schedule<div style="color:var(--text-dim);font-size:11px;font-weight:500;">Change which weekdays your workouts fall on</div></span>`;
  schedBtn.onclick = () => {
    if (typeof openWeeklyScheduleEditor === "function") openWeeklyScheduleEditor();
  };
  wrap.appendChild(schedBtn);

  openSheet(wrap);
}

function openPlanAdhoc(dateMs) {
  const d = new Date(dateMs);
  const dateStr = d.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" });

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">Custom Workout</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>
    </div>
    <div style="color:var(--text-dim);font-size:12px;margin-bottom:14px;">${dateStr}</div>
  `;

  // Custom activity input
  const customRow = document.createElement("div");
  customRow.innerHTML = `
    <div class="section-title" style="margin-top:0;">Custom Activity</div>
    <div style="display:flex;gap:8px;align-items:center;">
      <input type="text" id="planCustomName" class="name-input" placeholder="e.g. Bike, Basketball, Yoga…" autocomplete="off" style="flex:1;">
      <button class="action-btn primary" id="planCustomSave" style="white-space:nowrap;">Save</button>
    </div>
  `;
  wrap.appendChild(customRow);

  // Exercise library picker
  const libSection = document.createElement("div");
  libSection.innerHTML = `<div class="section-title">Or pick exercises</div>`;

  const search = document.createElement("input");
  search.className = "lib-search";
  search.placeholder = "Search exercises\u2026";
  libSection.appendChild(search);

  const catRow = document.createElement("div");
  catRow.className = "lib-cat";
  let activeCat = "All";
  ["All", ...CATEGORIES].forEach(cat => {
    const b = document.createElement("button");
    b.className = "lib-cat-btn" + (cat === "All" ? " active" : "");
    b.textContent = cat;
    b.onclick = () => {
      activeCat = cat;
      catRow.querySelectorAll(".lib-cat-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      renderList();
    };
    catRow.appendChild(b);
  });
  libSection.appendChild(catRow);

  const list = document.createElement("div");
  list.className = "lib-items-grid";
  libSection.appendChild(list);

  // Selected exercises
  const selectedExercises = [];
  const selectedWrap = document.createElement("div");
  selectedWrap.id = "planSelectedList";
  selectedWrap.style.display = "none";
  selectedWrap.innerHTML = `<div class="section-title">Selected exercises</div>`;
  const selectedList = document.createElement("div");
  selectedList.className = "adhoc-selected-exercises";
  selectedWrap.appendChild(selectedList);

  const saveSelectedBtn = document.createElement("button");
  saveSelectedBtn.className = "action-btn primary";
  saveSelectedBtn.style.cssText = "width:100%;margin-top:10px;padding:14px;font-weight:700;";
  saveSelectedBtn.textContent = "Log Sets";
  saveSelectedBtn.onclick = () => {
    const syntheticDay = {
      id: "adhoc",
      name: "Custom Workout",
      sub: dateStr,
      blocks: [{
        id: "plan-block-1",
        letter: "A",
        name: "Custom Workout",
        exercises: selectedExercises.map(e => mkSets(e))
      }]
    };
    openLogSets(dateMs, syntheticDay);
  };
  selectedWrap.appendChild(saveSelectedBtn);

  function updateSelectedUI() {
    selectedWrap.style.display = selectedExercises.length ? "" : "none";
    selectedList.innerHTML = "";
    selectedExercises.forEach((ex, i) => {
      const row = document.createElement("div");
      row.className = "adhoc-selected-item";
      row.innerHTML = `
        <span class="adhoc-sel-name">${ex.name}</span>
        <button class="adhoc-sel-remove" title="Remove">\u00d7</button>
      `;
      row.querySelector(".adhoc-sel-remove").onclick = () => {
        selectedExercises.splice(i, 1);
        updateSelectedUI();
        renderList();
      };
      selectedList.appendChild(row);
    });
    saveSelectedBtn.textContent = "Log Sets (" + selectedExercises.length + " exercise" + (selectedExercises.length === 1 ? "" : "s") + ")";
  }

  function renderList() {
    const q = search.value.toLowerCase().trim();
    list.innerHTML = "";
    LIBRARY
      .filter(e => activeCat === "All" || e.cat === activeCat)
      .filter(e => !q || e.name.toLowerCase().includes(q) || (e.muscles || []).some(m => m.includes(q)))
      .forEach(e => {
        const b = document.createElement("button");
        b.className = "lib-item";
        const alreadyAdded = selectedExercises.some(s => s.id === e.id);
        b.innerHTML = `<div><div>${e.name}</div><div class="muscles">${(e.muscles || []).join(" \u00b7 ")}</div></div><span style="color:var(--accent);">${alreadyAdded ? "\u2713" : "+"}</span>`;
        b.onclick = () => {
          if (!alreadyAdded) {
            selectedExercises.push(e);
            updateSelectedUI();
            renderList();
          }
        };
        list.appendChild(b);
      });
  }

  search.oninput = renderList;
  renderList();

  wrap.appendChild(selectedWrap);
  wrap.appendChild(libSection);

  // Wire custom activity save
  setTimeout(() => {
    const customInput = document.getElementById("planCustomName");
    const customBtn = document.getElementById("planCustomSave");
    if (customInput && customBtn) {
      customBtn.onclick = () => {
        const name = customInput.value.trim();
        if (!name) { customInput.focus(); return; }
        // Save a custom activity session directly
        const noon = new Date(dateMs);
        noon.setHours(12, 0, 0, 0);
        const finishedAt = noon.getTime();
        const session = {
          id: "s-" + Date.now(),
          dayId: "adhoc",
          dayName: name,
          startedAt: finishedAt - 3600000,
          finishedAt,
          duration: 3600,
          sets: [],
          volume: 0,
          prCount: 0,
          manual: true,
          isAdhoc: true,
          adhocMeta: { activityName: name, duration: 3600, distance: "", notes: "" }
        };
        updateUser(u => {
          u.sessions.push(session);
          u.sessions.sort((a, b) => a.finishedAt - b.finishedAt);
          if (u.sessions.length > 365) u.sessions = u.sessions.slice(-365);
        });
        closeSheet();
        renderTimelineStrip();
        renderHistory();
        showToast("Planned: " + name, "success");
      };
      customInput.addEventListener("keydown", e => {
        if (e.key === "Enter") customBtn.click();
      });
    }
  }, 10);

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

  // Build exercise rows with editable weight/reps/RPE
  const exRows = [];
  day.blocks.forEach(block => {
    block.exercises.forEach(ex => {
      if (ex.isWarmup) return;
      const lastSets = getLastSetsFor(ex.exId || ex.name);
      const lastSet = lastSets[0];
      const defW = lastSet ? lastSet.weight : (ex.defaultWeight || 0);
      const defR = lastSet ? lastSet.reps : (ex.reps || 8);

      // Per-exercise state tracked in exRows entry
      const exEntry = { ex, sets: ex.sets, rpe: null };

      const row = document.createElement("div");
      row.className = "tl-log-row";

      const fieldsHtml = `
        <div class="tl-log-name">${ex.name}</div>
        <div class="tl-log-fields">
          <span class="tl-log-label">${ex.sets}×</span>
          ${ex.bodyweight ? "" : `<input type="number" class="tl-log-input" data-field="w" value="${defW}" min="0" placeholder="wt">`}
          <span class="tl-log-label">×</span>
          <input type="number" class="tl-log-input" data-field="r" value="${defR}" min="0" placeholder="reps">
        </div>
      `;
      row.innerHTML = fieldsHtml;

      // RPE picker — pills for null (skip) and 6-10
      const rpePicker = document.createElement("div");
      rpePicker.className = "tl-log-rpe";
      rpePicker.style.cssText = "display:flex;gap:3px;align-items:center;margin-top:4px;flex-wrap:wrap;";
      const rpeLabel = document.createElement("span");
      rpeLabel.style.cssText = "font-size:11px;color:var(--text-dim);margin-right:2px;";
      rpeLabel.textContent = "RPE:";
      rpePicker.appendChild(rpeLabel);

      [null, 6, 7, 8, 9, 10].forEach(val => {
        const pill = document.createElement("button");
        pill.style.cssText = "font-size:11px;padding:2px 6px;border-radius:6px;min-width:24px;";
        pill.textContent = val === null ? "—" : val;
        pill.title = val === null ? "Skip RPE" : "RPE " + val;
        pill.dataset.rpeVal = val === null ? "" : String(val);

        const updatePills = () => {
          rpePicker.querySelectorAll("button").forEach(b => {
            const bVal = b.dataset.rpeVal === "" ? null : Number(b.dataset.rpeVal);
            const sel = bVal === exEntry.rpe;
            b.style.background   = sel ? "var(--accent)"  : "";
            b.style.color        = sel ? "#fff"            : "";
            b.style.borderColor  = sel ? "var(--accent)"  : "";
          });
        };

        pill.onclick = () => {
          exEntry.rpe = val;
          updatePills();
        };
        rpePicker.appendChild(pill);
      });

      row.appendChild(rpePicker);
      wrap.appendChild(row);
      exRows.push({ ex, row, sets: ex.sets, exEntry });
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
    exRows.forEach(({ ex, row, sets: numSets, exEntry }) => {
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
          rpe: exEntry ? exEntry.rpe : null,  // null = user skipped RPE entry
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

    const isAdhoc = day.id === "adhoc";
    const session = {
      id: "s-" + Date.now(),
      dayId: day.id,
      dayName: day.name,
      startedAt: finishedAt - 3600000, // assume 1hr
      finishedAt,
      duration: 3600,
      sets, volume,
      prCount: 0,
      manual: true,
      isAdhoc: isAdhoc || undefined
    };

    updateUser(u => {
      u.sessions.push(session);
      u.sessions.sort((a, b) => a.finishedAt - b.finishedAt);
      if (u.sessions.length > 365) u.sessions = u.sessions.slice(-365);
    });

    recomputeAllIsPR();
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
