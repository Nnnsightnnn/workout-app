// ============================================================
// LOOK-AHEAD: Program Browse Sheet (read-only)
// ============================================================

var _laWeek = 1;
var _laDays = null;
var _laPhase = null;
var _laAllPhases = null;
var _laView = "week";       // "week" | "day"
var _laDetailDay = null;
var _laMode = "list";        // "list" | "calendar"
var _laCalYear = 0;
var _laCalMonth = 0;         // 0-indexed
var _laSessionMap = null;
var _laProjectionMap = null;  // dateStr → { weekNum, dayIdx }
var _laSelectedDate = null;

// --- Entry point ---
function openLookAhead() {
  var u = userData();
  if (!u || !u.program || !u.program.length) {
    showToast("No program loaded");
    return;
  }
  _laWeek = u.currentWeek || 1;
  _laDays = _laResolveDays(u, _laWeek);
  _laPhase = _laPhaseForWeek(u, _laWeek);
  _laAllPhases = _laGetAllPhases(u);
  _laView = "week";
  _laDetailDay = null;
  // Calendar defaults to current month
  var now = new Date();
  _laCalYear = now.getFullYear();
  _laCalMonth = now.getMonth();
  _laSessionMap = _buildLaSessionMap(u);
  _laProjectionMap = _buildLaProjectionMap(u);
  _laSelectedDate = null;
  _renderLookAheadContent();
}

// --- Dispatcher ---
function _renderLookAheadContent() {
  var wrap = document.createElement("div");
  wrap.className = "la-wrap";
  if (_laPhase && _laPhase.color) {
    wrap.style.setProperty("--la-phase-color", _laPhase.color);
  } else {
    wrap.style.setProperty("--la-phase-color", "transparent");
  }
  if (_laView === "day") {
    _renderLaDayDetail(wrap);
  } else if (_laMode === "calendar") {
    _renderLaCalendarView(wrap);
  } else {
    _renderLaWeekView(wrap);
  }
  openSheet(wrap);
}

// --- Shared header with mode toggle ---
function _buildLaHeader(container) {
  var u = userData();
  var tplName = "";
  var tpl = PROGRAM_TEMPLATES.find(function(t) { return t.id === u.templateId; });
  if (tpl) tplName = tpl.name;

  var hdr = document.createElement("div");
  hdr.className = "la-header";

  var title = document.createElement("h3");
  title.style.margin = "0";
  title.textContent = tplName || "My Program";
  hdr.appendChild(title);

  var right = document.createElement("div");
  right.style.cssText = "display:flex;align-items:center;gap:6px;";

  // Mode toggle
  var toggle = document.createElement("div");
  toggle.className = "la-mode-toggle";

  var listBtn = document.createElement("button");
  listBtn.className = "la-mode-btn" + (_laMode === "list" ? " active" : "");
  listBtn.innerHTML = '<svg viewBox="0 0 18 18" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="4" x2="15" y2="4"/><line x1="3" y1="9" x2="15" y2="9"/><line x1="3" y1="14" x2="15" y2="14"/></svg>';
  listBtn.title = "List view";
  listBtn.onclick = function() {
    _laMode = "list";
    _laView = "week";
    _renderLookAheadContent();
  };

  var calBtn = document.createElement("button");
  calBtn.className = "la-mode-btn" + (_laMode === "calendar" ? " active" : "");
  calBtn.innerHTML = '<svg viewBox="0 0 18 18" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="14" height="13" rx="2"/><line x1="2" y1="8" x2="16" y2="8"/><line x1="6" y1="3" x2="6" y2="6"/><line x1="12" y1="3" x2="12" y2="6"/></svg>';
  calBtn.title = "Calendar view";
  calBtn.onclick = function() {
    _laMode = "calendar";
    _laView = "week";
    _laSelectedDate = null;
    _renderLookAheadContent();
  };

  toggle.appendChild(listBtn);
  toggle.appendChild(calBtn);
  right.appendChild(toggle);

  var closeBtn = document.createElement("button");
  closeBtn.className = "icon-btn";
  closeBtn.title = "Close";
  closeBtn.textContent = "\u2715";
  closeBtn.onclick = closeSheet;
  right.appendChild(closeBtn);
  hdr.appendChild(right);

  container.appendChild(hdr);
}

// ============================================================
// LIST VIEW (decluttered)
// ============================================================
function _renderLaWeekView(container) {
  var u = userData();
  var totalWeeks = u.totalWeeks || 1;

  _buildLaHeader(container);

  // Compact nav: ◀ [Phase · Week X/Y] ▶
  var nav = document.createElement("div");
  nav.className = "la-nav-row";

  if (totalWeeks > 1) {
    var prevBtn = document.createElement("button");
    prevBtn.className = "la-nav-btn";
    prevBtn.textContent = "\u25C0";
    prevBtn.disabled = _laWeek <= 1;
    prevBtn.onclick = function() { _laGoToWeek(_laWeek - 1); };
    nav.appendChild(prevBtn);
  }

  var label = document.createElement("div");
  label.className = "la-week-label";
  var labelParts = [];
  if (_laPhase && _laPhase.name) {
    var phaseSpan = document.createElement("span");
    phaseSpan.className = "la-phase-pill";
    if (_laPhase.color) phaseSpan.style.color = _laPhase.color;
    phaseSpan.textContent = _laPhase.name;
    label.appendChild(phaseSpan);
    var sep = document.createTextNode(" \u00B7 ");
    label.appendChild(sep);
  }
  var weekText = totalWeeks > 1
    ? "Week " + _laWeek + " of " + totalWeeks
    : "Week " + _laWeek;
  label.appendChild(document.createTextNode(weekText));
  nav.appendChild(label);

  if (totalWeeks > 1) {
    var nextBtn = document.createElement("button");
    nextBtn.className = "la-nav-btn";
    nextBtn.textContent = "\u25B6";
    nextBtn.disabled = _laWeek >= totalWeeks;
    nextBtn.onclick = function() { _laGoToWeek(_laWeek + 1); };
    nav.appendChild(nextBtn);
  }
  container.appendChild(nav);

  // Custom program note
  if (u.templateId === "custom" && _laWeek !== (u.currentWeek || 1)) {
    var note = document.createElement("div");
    note.className = "la-custom-note";
    note.textContent = "Custom programs repeat the same pattern each week.";
    container.appendChild(note);
  }

  // Program complete note
  if (u.currentWeek && u.totalWeeks && u.currentWeek > u.totalWeeks) {
    var completeNote = document.createElement("div");
    completeNote.className = "la-custom-note";
    completeNote.textContent = "Program complete! Start a new program or continue repeating.";
    container.appendChild(completeNote);
  }

  // Day cards
  if (!_laDays || !_laDays.length) {
    var empty = document.createElement("div");
    empty.style.cssText = "color:var(--text-dim);font-size:13px;padding:20px 0;text-align:center;";
    empty.textContent = "No workout data for this week.";
    container.appendChild(empty);
  } else {
    var completedIds = _laGetCompletedDayIds(u, _laWeek);
    _laDays.forEach(function(day, i) {
      var card = _buildLaDayCard(day, _laWeek, u, completedIds);
      card.style.setProperty("--card-index", i);
      container.appendChild(card);
    });
  }
}

// --- Day card builder ---
function _buildLaDayCard(day, weekNum, u, completedIds) {
  var status = _getDayStatus(day, weekNum, u, completedIds);
  var card = document.createElement("div");
  card.className = "la-day-card" + (status === "done" ? " done" : "") + (status === "today" || status === "in-progress" ? " today" : "");
  card.onclick = function() {
    _laDetailDay = day;
    _laView = "day";
    _renderLookAheadContent();
  };

  var badge = document.createElement("div");
  badge.className = "la-day-badge";
  badge.textContent = status === "done" ? "\u2713" : day.id;
  card.appendChild(badge);

  var info = document.createElement("div");
  info.className = "la-day-info";

  var nameRow = document.createElement("div");
  nameRow.className = "la-day-name";
  nameRow.textContent = day.name || ("Day " + day.id);
  info.appendChild(nameRow);

  if (day.sub) {
    var sub = document.createElement("div");
    sub.className = "la-day-sub";
    sub.textContent = day.sub;
    info.appendChild(sub);
  }

  var muscles = _getDayMuscles(day);
  if (muscles.length) {
    var muscleRow = document.createElement("div");
    muscleRow.className = "la-day-muscles";
    muscles.forEach(function(m) {
      var chip = document.createElement("span");
      chip.className = "la-muscle-chip";
      chip.textContent = m.name;
      if (m.color) {
        chip.style.background = m.color + "22";
        chip.style.color = m.color;
      }
      muscleRow.appendChild(chip);
    });
    info.appendChild(muscleRow);
  }

  var meta = document.createElement("div");
  meta.className = "la-day-meta";
  var breakdown = getSessionBreakdown(day);
  if (breakdown && breakdown.totalMin) {
    meta.textContent = "~" + breakdown.totalMin + " min";
  }
  if (status !== "upcoming") {
    var statusEl = document.createElement("span");
    statusEl.className = "la-status " + status;
    if (status === "done") statusEl.textContent = "\u2713 Done";
    else if (status === "today") statusEl.textContent = "\u2190 Today";
    else if (status === "in-progress") statusEl.textContent = "\u25CF In Progress";
    meta.appendChild(statusEl);
  }
  info.appendChild(meta);

  var spark = _buildLaSparkBar(day);
  if (spark) info.appendChild(spark);

  card.appendChild(info);
  return card;
}

// ============================================================
// CALENDAR VIEW
// ============================================================
var _MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function _renderLaCalendarView(container) {
  var u = userData();
  _buildLaHeader(container);

  // Month nav
  var nav = document.createElement("div");
  nav.className = "la-nav-row";

  var prevBtn = document.createElement("button");
  prevBtn.className = "la-nav-btn";
  prevBtn.textContent = "\u25C0";
  prevBtn.onclick = function() {
    _laCalMonth--;
    if (_laCalMonth < 0) { _laCalMonth = 11; _laCalYear--; }
    _laSelectedDate = null;
    _renderLookAheadContent();
  };
  nav.appendChild(prevBtn);

  var monthLabel = document.createElement("div");
  monthLabel.className = "la-week-label";
  monthLabel.textContent = _MONTH_NAMES[_laCalMonth] + " " + _laCalYear;
  nav.appendChild(monthLabel);

  var nextBtn = document.createElement("button");
  nextBtn.className = "la-nav-btn";
  nextBtn.textContent = "\u25B6";
  nextBtn.onclick = function() {
    _laCalMonth++;
    if (_laCalMonth > 11) { _laCalMonth = 0; _laCalYear++; }
    _laSelectedDate = null;
    _renderLookAheadContent();
  };
  nav.appendChild(nextBtn);
  container.appendChild(nav);

  // Day-of-week headers
  var dowRow = document.createElement("div");
  dowRow.className = "la-cal-dow";
  ["S","M","T","W","T","F","S"].forEach(function(d) {
    var cell = document.createElement("div");
    cell.className = "la-cal-dow-cell";
    cell.textContent = d;
    dowRow.appendChild(cell);
  });
  container.appendChild(dowRow);

  // Month grid
  var grid = document.createElement("div");
  grid.className = "la-cal-grid";

  var firstDay = new Date(_laCalYear, _laCalMonth, 1).getDay();
  var daysInMonth = new Date(_laCalYear, _laCalMonth + 1, 0).getDate();
  var now = new Date();
  var todayStr = _laDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  // Leading empty cells
  for (var e = 0; e < firstDay; e++) {
    var empty = document.createElement("div");
    empty.className = "la-cal-cell empty";
    grid.appendChild(empty);
  }

  // Day cells
  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = _laDateStr(_laCalYear, _laCalMonth, d);
    var cell = document.createElement("div");
    cell.className = "la-cal-cell";
    if (dateStr === todayStr) cell.classList.add("today");
    if (dateStr === _laSelectedDate) cell.classList.add("selected");

    var num = document.createElement("span");
    num.className = "la-cal-num";
    num.textContent = d;
    cell.appendChild(num);

    var sessions = _laSessionMap ? _laSessionMap[dateStr] : null;
    var projection = _laProjectionMap ? _laProjectionMap[dateStr] : null;
    if (sessions && sessions.length) {
      cell.classList.add("has-session");
      var dot = document.createElement("div");
      dot.className = "la-cal-dot";
      dot.style.background = _getSessionDotColor(sessions[0]);
      cell.appendChild(dot);
    } else if (projection) {
      cell.classList.add("planned");
      var dot = document.createElement("div");
      dot.className = "la-cal-dot";
      cell.appendChild(dot);
    }

    cell.onclick = (function(ds) {
      return function() {
        _laSelectedDate = (_laSelectedDate === ds) ? null : ds;
        _renderLookAheadContent();
      };
    })(dateStr);

    grid.appendChild(cell);
  }
  container.appendChild(grid);

  // Selected date detail
  if (_laSelectedDate) {
    _renderLaCalDateDetail(container);
  }
}

function _renderLaCalDateDetail(container) {
  var sessions = _laSessionMap ? _laSessionMap[_laSelectedDate] : null;
  var projection = _laProjectionMap ? _laProjectionMap[_laSelectedDate] : null;
  var parts = _laSelectedDate.split("-");
  var dateObj = new Date(+parts[0], +parts[1] - 1, +parts[2]);
  var dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var dateLabel = dayNames[dateObj.getDay()] + ", " + _MONTH_NAMES[dateObj.getMonth()] + " " + dateObj.getDate();

  // Completed sessions
  if (sessions && sessions.length) {
    sessions.forEach(function(session) {
      var card = document.createElement("div");
      card.className = "la-cal-detail-card";

      var dateEl = document.createElement("div");
      dateEl.className = "la-cal-detail-date";
      dateEl.textContent = dateLabel;
      card.appendChild(dateEl);

      var nameEl = document.createElement("div");
      nameEl.className = "la-day-name";
      nameEl.textContent = session.dayName || "Workout";
      card.appendChild(nameEl);

      var muscleCounts = {};
      (session.sets || []).forEach(function(s) {
        (s.muscles || []).forEach(function(m) {
          var g = groupMuscle(m);
          if (g && g !== null) muscleCounts[g] = (muscleCounts[g] || 0) + 1;
        });
      });
      var topMuscles = Object.entries(muscleCounts).sort(function(a,b) { return b[1]-a[1]; }).slice(0,3);
      if (topMuscles.length) {
        var muscleRow = document.createElement("div");
        muscleRow.className = "la-day-muscles";
        topMuscles.forEach(function(e) {
          var chip = document.createElement("span");
          chip.className = "la-muscle-chip";
          chip.textContent = e[0];
          var c = GROUP_COLORS[e[0]];
          if (c) { chip.style.background = c + "22"; chip.style.color = c; }
          muscleRow.appendChild(chip);
        });
        card.appendChild(muscleRow);
      }

      var meta = document.createElement("div");
      meta.className = "la-day-meta";
      var statParts = [];
      if (session.duration) statParts.push(Math.round(session.duration / 60000) + " min");
      if (session.sets) statParts.push(session.sets.length + " sets");
      if (session.volume) statParts.push(Math.round(session.volume).toLocaleString() + " " + (state.unit || "lbs"));
      meta.textContent = statParts.join(" \u00B7 ");
      if (session.prCount > 0) {
        var prBadge = document.createElement("span");
        prBadge.className = "la-status today";
        prBadge.textContent = "\u2605 " + session.prCount + " PR" + (session.prCount > 1 ? "s" : "");
        meta.appendChild(prBadge);
      }
      card.appendChild(meta);

      var spark = _buildLaSessionSparkBar(session);
      if (spark) card.appendChild(spark);

      container.appendChild(card);
    });
    _appendCalAddWorkoutBtn(container, dateObj);
    return;
  }

  // Projected (planned) workout
  if (projection) {
    var u = userData();
    var days = _laResolveDays(u, projection.weekNum);
    var day = days && days[projection.dayIdx] ? days[projection.dayIdx] : null;

    if (day) {
      var card = document.createElement("div");
      card.className = "la-cal-detail-card";

      var dateEl = document.createElement("div");
      dateEl.className = "la-cal-detail-date";
      dateEl.textContent = dateLabel;
      card.appendChild(dateEl);

      var plannedTag = document.createElement("div");
      plannedTag.className = "la-cal-detail-planned";
      plannedTag.textContent = "Planned \u00B7 Week " + projection.weekNum;
      card.appendChild(plannedTag);

      var nameEl = document.createElement("div");
      nameEl.className = "la-day-name";
      nameEl.textContent = day.name || ("Day " + day.id);
      card.appendChild(nameEl);

      if (day.sub) {
        var subEl = document.createElement("div");
        subEl.className = "la-day-sub";
        subEl.textContent = day.sub;
        card.appendChild(subEl);
      }

      var muscles = _getDayMuscles(day);
      if (muscles.length) {
        var muscleRow = document.createElement("div");
        muscleRow.className = "la-day-muscles";
        muscles.forEach(function(m) {
          var chip = document.createElement("span");
          chip.className = "la-muscle-chip";
          chip.textContent = m.name;
          if (m.color) { chip.style.background = m.color + "22"; chip.style.color = m.color; }
          muscleRow.appendChild(chip);
        });
        card.appendChild(muscleRow);
      }

      var meta = document.createElement("div");
      meta.className = "la-day-meta";
      var breakdown = getSessionBreakdown(day);
      if (breakdown && breakdown.totalMin) meta.textContent = "~" + breakdown.totalMin + " min";
      card.appendChild(meta);

      var spark = _buildLaSparkBar(day);
      if (spark) card.appendChild(spark);

      container.appendChild(card);
      _appendCalAddWorkoutBtn(container, dateObj);
      return;
    }
  }

  // Rest day
  var empty = document.createElement("div");
  empty.className = "la-cal-detail-empty";
  empty.innerHTML = '<span class="la-cal-detail-date">' + dateLabel + '</span><br>Rest day';
  container.appendChild(empty);

  // Add workout button for any selected date
  _appendCalAddWorkoutBtn(container, dateObj);
}

// ============================================================
// DAY DETAIL VIEW
// ============================================================
function _renderLaDayDetail(container) {
  var day = _laDetailDay;
  if (!day) return;

  var back = document.createElement("button");
  back.className = "la-back-btn";
  back.innerHTML = "\u2190 Back";
  back.onclick = function() {
    _laView = "week";
    _laDetailDay = null;
    _renderLookAheadContent();
  };
  container.appendChild(back);

  var hdr = document.createElement("div");
  hdr.className = "la-detail-header";

  var badge = document.createElement("div");
  badge.className = "la-day-badge";
  badge.textContent = day.id;
  hdr.appendChild(badge);

  var headerInfo = document.createElement("div");
  var nameEl = document.createElement("div");
  nameEl.className = "la-day-name";
  nameEl.textContent = day.name || ("Day " + day.id);
  headerInfo.appendChild(nameEl);

  if (day.sub) {
    var subEl = document.createElement("div");
    subEl.className = "la-day-sub";
    subEl.textContent = day.sub;
    headerInfo.appendChild(subEl);
  }

  var detailMeta = document.createElement("div");
  detailMeta.className = "la-detail-duration";
  var parts = [];
  if (_laPhase && _laPhase.name) parts.push(_laPhase.name);
  var breakdown = getSessionBreakdown(day);
  if (breakdown && breakdown.totalMin) parts.push("~" + breakdown.totalMin + " min");
  detailMeta.textContent = parts.join(" \u00B7 ");
  headerInfo.appendChild(detailMeta);
  hdr.appendChild(headerInfo);
  container.appendChild(hdr);

  if (day.blocks && day.blocks.length) {
    day.blocks.forEach(function(block, bi) {
      container.appendChild(renderBlockPreview(day, block, bi, true));
    });
  }

  var cooldown = renderCooldownPreviewForDay(day.id);
  if (cooldown) container.appendChild(cooldown);
}

// ============================================================
// HELPERS
// ============================================================

function _getDayStatus(day, weekNum, u, completedIds) {
  if (!completedIds) completedIds = _laGetCompletedDayIds(u, weekNum);
  var currentWeek = u.currentWeek || 1;
  if (weekNum < currentWeek) return completedIds.has(day.id) ? "done" : "upcoming";
  if (weekNum > currentWeek) return "upcoming";
  if (completedIds.has(day.id)) return "done";
  if (u.draft && u.draft.dayId === day.id) return "in-progress";
  if (day.id === determineDefaultDay()) return "today";
  return "upcoming";
}

function _laGetCompletedDayIds(u, weekNum) {
  var ids = new Set();
  (u.sessions || []).forEach(function(s) {
    if (s.programWeek === weekNum) ids.add(s.dayId);
  });
  return ids;
}

function _getDayMuscles(day) {
  var counts = {};
  (day.blocks || []).forEach(function(block) {
    if (block.type === "warmup") return;
    (block.exercises || []).forEach(function(ex) {
      if (ex.isWarmup) return;
      (ex.muscles || []).forEach(function(m) {
        var g = groupMuscle(m);
        if (g && g !== "null" && g !== null) counts[g] = (counts[g] || 0) + 1;
      });
    });
  });
  return Object.entries(counts)
    .sort(function(a, b) { return b[1] - a[1]; })
    .slice(0, 3)
    .map(function(e) { return { name: e[0], color: GROUP_COLORS[e[0]] || null }; });
}

// Spark bar from day program data
function _buildLaSparkBar(day) {
  var counts = {};
  var total = 0;
  (day.blocks || []).forEach(function(block) {
    if (block.type === "warmup") return;
    (block.exercises || []).forEach(function(ex) {
      if (ex.isWarmup) return;
      var sets = ex.sets || 3;
      (ex.muscles || []).forEach(function(m) {
        var g = groupMuscle(m);
        if (g && g !== "null" && g !== null) { counts[g] = (counts[g] || 0) + sets; total += sets; }
      });
    });
  });
  if (total === 0) return null;
  var bar = document.createElement("div");
  bar.className = "la-spark-bar";
  Object.entries(counts).sort(function(a,b) { return b[1]-a[1]; }).forEach(function(e) {
    var seg = document.createElement("div");
    seg.className = "la-spark-seg";
    seg.style.width = Math.round((e[1] / total) * 100) + "%";
    seg.style.background = GROUP_COLORS[e[0]] || "var(--text-faint)";
    bar.appendChild(seg);
  });
  return bar;
}

// Spark bar from session sets
function _buildLaSessionSparkBar(session) {
  var counts = {};
  var total = 0;
  (session.sets || []).forEach(function(s) {
    (s.muscles || []).forEach(function(m) {
      var g = groupMuscle(m);
      if (g && g !== null) { counts[g] = (counts[g] || 0) + 1; total++; }
    });
  });
  if (total === 0) return null;
  var bar = document.createElement("div");
  bar.className = "la-spark-bar";
  Object.entries(counts).sort(function(a,b) { return b[1]-a[1]; }).forEach(function(e) {
    var seg = document.createElement("div");
    seg.className = "la-spark-seg";
    seg.style.width = Math.round((e[1] / total) * 100) + "%";
    seg.style.background = GROUP_COLORS[e[0]] || "var(--text-faint)";
    bar.appendChild(seg);
  });
  return bar;
}

// Add workout button for calendar date detail
function _appendCalAddWorkoutBtn(container, dateObj) {
  var todayStart = new Date(); todayStart.setHours(0,0,0,0);
  var dateMs = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
  var isFuture = dateMs > todayStart.getTime();

  var btn = document.createElement("button");
  btn.className = "action-btn";
  btn.style.cssText = "width:100%;margin-top:10px;padding:12px;font-weight:600;";
  btn.textContent = "+ Add Workout";
  btn.onclick = function() {
    closeSheet();
    setTimeout(function() {
      if (isFuture) {
        openPlanWorkout(dateMs);
      } else {
        openAddWorkout(dateMs);
      }
    }, 200);
  };
  container.appendChild(btn);
}

// Calendar helpers
function _laDateStr(year, month, day) {
  return year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
}

function _buildLaSessionMap(u) {
  var map = {};
  (u.sessions || []).forEach(function(s) {
    if (!s.finishedAt) return;
    var d = new Date(s.finishedAt);
    var key = _laDateStr(d.getFullYear(), d.getMonth(), d.getDate());
    if (!map[key]) map[key] = [];
    map[key].push(s);
  });
  return map;
}

function _getSessionDotColor(session) {
  var counts = {};
  (session.sets || []).forEach(function(s) {
    (s.muscles || []).forEach(function(m) {
      var g = groupMuscle(m);
      if (g && g !== null) counts[g] = (counts[g] || 0) + 1;
    });
  });
  var top = Object.entries(counts).sort(function(a,b) { return b[1]-a[1]; })[0];
  return top ? (GROUP_COLORS[top[0]] || "var(--accent)") : "var(--accent)";
}

// Week navigation (read-only, no state mutation)
function _laGoToWeek(weekNum) {
  var u = userData();
  var totalWeeks = u.totalWeeks || 1;
  weekNum = Math.max(1, Math.min(weekNum, totalWeeks));
  if (weekNum === _laWeek) return;
  _laWeek = weekNum;
  _laDays = _laResolveDays(u, weekNum);
  _laPhase = _laPhaseForWeek(u, weekNum);
  _laView = "week";
  _laDetailDay = null;
  _renderLookAheadContent();
}

function _laResolveDays(u, weekNum) {
  if (weekNum === (u.currentWeek || 1)) return u.program;
  if (u.templateId === "custom") return u.program;
  var result = resolveWeekProgram(u.templateId, weekNum, u.totalWeeks, u.daysPerWeek);
  return result || u.program;
}

function _laPhaseForWeek(u, weekNum) {
  if (!u.templateId || u.templateId === "custom") return null;
  var phases = getPhasesForTemplate(u.templateId, u.totalWeeks);
  if (!phases) return null;
  return phaseForWeek(phases, weekNum);
}

function _laGetAllPhases(u) {
  if (!u.templateId || u.templateId === "custom") return null;
  return getPhasesForTemplate(u.templateId, u.totalWeeks);
}

// ============================================================
// PROJECTION MAP — project program days onto calendar dates
// ============================================================

function _laTrainingPattern(daysPerWeek) {
  // Returns day-of-week indices (0=Sun..6=Sat) for training days
  var patterns = {
    1: [1],                      // Mon
    2: [1, 4],                   // Mon, Thu
    3: [1, 3, 5],                // Mon, Wed, Fri
    4: [1, 2, 4, 5],             // Mon, Tue, Thu, Fri
    5: [1, 2, 3, 4, 5],          // Mon–Fri
    6: [1, 2, 3, 4, 5, 6],       // Mon–Sat
    7: [0, 1, 2, 3, 4, 5, 6]     // Every day
  };
  return patterns[daysPerWeek] || patterns[3];
}

function _laProgramStartSunday(u) {
  var start;
  if (u.programStartDate) {
    start = new Date(u.programStartDate);
  } else {
    // Infer: current week is W, so week 1 started (W-1)*7 days ago
    var weeksBack = (u.currentWeek || 1) - 1;
    start = new Date();
    start.setDate(start.getDate() - weeksBack * 7);
  }
  // Align to the Sunday of that week
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function _buildLaProjectionMap(u) {
  var map = {};
  if (!u.totalWeeks || !u.daysPerWeek) return map;

  var startSunday = _laProgramStartSunday(u);
  var pattern = _laTrainingPattern(u.daysPerWeek);

  for (var w = 1; w <= u.totalWeeks; w++) {
    var weekStart = new Date(startSunday);
    weekStart.setDate(weekStart.getDate() + (w - 1) * 7);

    for (var i = 0; i < pattern.length && i < u.daysPerWeek; i++) {
      var date = new Date(weekStart);
      date.setDate(date.getDate() + pattern[i]);
      var key = _laDateStr(date.getFullYear(), date.getMonth(), date.getDate());
      map[key] = { weekNum: w, dayIdx: i };
    }
  }
  return map;
}
