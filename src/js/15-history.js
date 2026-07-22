// ============================================================
// HISTORY — The Log (Midnight Forge)
// ============================================================
let _openLogEntryId = null;
let _logOutsideClickHandler = null;

function _closeOpenLogEntry() {
  const root = document.getElementById("historyContent");
  if (root && _openLogEntryId) {
    const open = root.querySelector('.log-entry[data-session-id="' + _openLogEntryId + '"]');
    if (open) {
      open.style.transform = "";
      open.classList.remove("log-entry-swiped");
    }
  }
  _openLogEntryId = null;
  if (_logOutsideClickHandler) {
    document.removeEventListener("click", _logOutsideClickHandler, true);
    _logOutsideClickHandler = null;
  }
}

function renderHistory() {
  const root = document.getElementById("historyContent");
  if (!root) return;
  const u = userData();
  if (!u) { root.innerHTML = '<div class="empty">No user yet.</div>'; return; }

  // Update subtitle
  const sub = document.getElementById("logSubtitle");
  if (sub) sub.textContent = "\u00a7 Archive \u00b7 " + String(u.sessions.length).padStart(3, "0") + " entries";

  const sessions = u.sessions || [];
  const now = Date.now();
  const thirtyAgo = now - 30 * 86400000;
  const recent30d = sessions.filter(s => s.finishedAt > thirtyAgo);
  const allNewestFirst = sessions.slice().sort((a, b) => b.finishedAt - a.finishedAt);

  let html = "";

  // ── Stats trio ──
  const _apHist = (typeof activeProgram === "function") ? activeProgram() : null;
  const { count: streak } = getTrainingStreak(sessions, _apHist ? _apHist.daysPerWeek : null);
  const prCount = _countRecentPRs(sessions, thirtyAgo);
  html += '<div class="log-stats">';
  html += `<div class="log-stat-card"><div class="log-label">Sessions</div><div class="log-val">${sessions.length}</div><div class="log-sub">${recent30d.length} / 30d</div></div>`;
  html += `<div class="log-stat-card streak" style="position:relative;"><div style="position:relative;z-index:1;"><div class="log-label accent">Streak</div><div class="log-val">${streak}</div><div class="log-sub">days</div></div></div>`;
  html += `<div class="log-stat-card"><div class="log-label">PRs</div><div class="log-val">${String(prCount).padStart(2, "0")}</div><div class="log-sub">30 days</div></div>`;
  html += '</div>';

  // ── Volume chart ──
  html += _buildVolumeChart(sessions);

  // ── PR table ──
  html += _buildPRTable(sessions);

  // ── All entries, newest first, with month dividers ──
  html += _buildRecentEntries(allNewestFirst);

  root.innerHTML = html;

  _openLogEntryId = null;
  if (_logOutsideClickHandler) {
    document.removeEventListener("click", _logOutsideClickHandler, true);
    _logOutsideClickHandler = null;
  }

  // Wire log-entry rows: tap = open editor; swipe-left = reveal delete stamp.
  // Skip planned-future entries (no data-session-id).
  root.querySelectorAll(".log-entry[data-session-id]").forEach(el => {
    const id = el.dataset.sessionId;

    el.addEventListener("click", (e) => {
      if (e.target.closest(".log-entry-delete")) return;
      if (_openLogEntryId) {
        _closeOpenLogEntry();
        return;
      }
      const s = (userData()?.sessions || []).find(x => x.id === id);
      if (s && typeof openSessionEditor === "function") openSessionEditor(s);
    });

    const delBtn = el.querySelector(".log-entry-delete");
    if (delBtn) {
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const s = (userData()?.sessions || []).find(x => x.id === id);
        if (!s) return;
        if (typeof _undoPending !== "undefined" && _undoPending) {
          if (typeof clearUndoToast === "function") clearUndoToast();
        }
        const deletedSession = deepClone(s);
        const deletedUserId = state.userId;
        _closeOpenLogEntry();
        deleteSession(id);
        if (typeof renderTimelineStrip === "function") renderTimelineStrip();
        renderHistory();
        if (typeof _undoPending !== "undefined") {
          _undoPending = { session: deletedSession, userId: deletedUserId, timerId: null, onExpire: null };
        }
        if (typeof showUndoToast === "function") {
          showUndoToast("Session deleted", () => { if (typeof _undoPending !== "undefined") _undoPending = null; });
        }
      });
    }

    let startX = 0, startY = 0, isSwiping = false, hasMoved = false;
    el.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwiping = false;
      hasMoved = false;
    }, { passive: true });
    el.addEventListener("touchmove", (e) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      hasMoved = true;
      if (!isSwiping && dx < -10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (_openLogEntryId && _openLogEntryId !== id) _closeOpenLogEntry();
        isSwiping = true;
      }
      if (isSwiping) {
        e.preventDefault();
        el.style.transition = "none";
        const tx = Math.max(-90, Math.min(0, dx));
        el.style.transform = "translateX(" + tx + "px)";
      }
    }, { passive: false });
    el.addEventListener("touchend", (e) => {
      if (!isSwiping) return;
      const dx = e.changedTouches[0].clientX - startX;
      el.style.transition = "";
      if (dx < -50) {
        el.style.transform = "translateX(-90px)";
        el.classList.add("log-entry-swiped");
        _openLogEntryId = id;
        if (_logOutsideClickHandler) {
          document.removeEventListener("click", _logOutsideClickHandler, true);
        }
        _logOutsideClickHandler = (ev) => {
          if (ev.target.closest('.log-entry[data-session-id="' + id + '"]')) return;
          _closeOpenLogEntry();
        };
        setTimeout(() => {
          document.addEventListener("click", _logOutsideClickHandler, true);
        }, 0);
      } else {
        el.style.transform = "";
        el.classList.remove("log-entry-swiped");
        if (_openLogEntryId === id) _openLogEntryId = null;
      }
      isSwiping = false;
    }, { passive: true });
  });
}

function _countRecentPRs(sessions, sinceMs) {
  let count = 0;
  sessions.forEach(s => {
    if (s.finishedAt > sinceMs && s.prCount) count += s.prCount;
  });
  return count;
}

function _buildVolumeChart(sessions) {
  // Group sessions by ISO week
  const weekMap = {};
  sessions.forEach(s => {
    const d = new Date(s.finishedAt);
    const wk = _isoWeekKey(d);
    weekMap[wk] = (weekMap[wk] || 0) + (s.volume || 0);
  });
  const keys = Object.keys(weekMap).sort();
  const last12 = keys.slice(-12);
  if (!last12.length) return "";
  const vals = last12.map(k => weekMap[k]);
  const maxV = Math.max(...vals, 1);
  const peakStr = formatVolume(maxV);

  let html = '<div class="log-panel">';
  html += '<div class="log-vol-header">';
  html += '<span class="section-title" style="margin:0;">Volume \u00b7 ' + state.unit + ' / wk</span>';
  html += '<span class="section-title" style="margin:0;color:var(--text-dim);">Peak ' + peakStr + '</span>';
  html += '</div>';
  html += '<div class="log-vol-bars">';
  vals.forEach((v, i) => {
    const isLast = i === vals.length - 1;
    const pct = Math.max(2, (v / maxV) * 100);
    const lbl = isLast ? '<div class="log-vol-bar-label">' + formatVolume(v) + '</div>' : "";
    html += '<div class="log-vol-bar' + (isLast ? " current" : "") + '" style="height:' + pct + '%;">' + lbl + '</div>';
  });
  html += '</div>';
  html += '<div class="log-vol-weeks">';
  if (last12.length >= 4) {
    var step = Math.floor(last12.length / 3);
    html += '<span>W' + last12[0].split('-W')[1] + '</span>';
    html += '<span>W' + last12[step].split('-W')[1] + '</span>';
    html += '<span>W' + last12[step * 2].split('-W')[1] + '</span>';
    html += '<span>W' + last12[last12.length - 1].split('-W')[1] + '</span>';
  }
  html += '</div></div>';
  return html;
}

function _isoWeekKey(d) {
  var tmp = new Date(d.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - (tmp.getDay() + 6) % 7);
  var week1 = new Date(tmp.getFullYear(), 0, 4);
  var wk = 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return tmp.getFullYear() + "-W" + String(wk).padStart(2, "0");
}

function _buildPRTable(sessions) {
  if (!sessions.length) return "";
  // Build PR map
  const prMap = {};
  sessions.forEach(s => {
    s.sets.forEach(set => {
      if (!set.weight || set.weight <= 0) return;
      const key = set.exId;
      if (!prMap[key]) prMap[key] = { exName: set.exName, bestScore: 0, bestWeight: 0, bestReps: 0, date: 0 };
      const score = set.weight * (1 + set.reps / 30);
      if (score > prMap[key].bestScore) {
        prMap[key].bestScore = score;
        prMap[key].bestWeight = set.weight;
        prMap[key].bestReps = set.reps;
        prMap[key].date = s.finishedAt;
      }
    });
  });
  // Sort by e1RM descending, take top 6
  const top = Object.values(prMap).sort((a, b) => b.bestScore - a.bestScore).slice(0, 6);
  if (!top.length) return "";

  let html = '<div class="section-title" style="display:flex;justify-content:space-between;align-items:baseline;">';
  html += '<span>\u00a7 Personal records</span><span style="color:var(--text-faint);">N=' + String(top.length).padStart(2, "0") + '</span></div>';
  html += '<div class="log-panel" style="padding:2px 0;">';
  top.forEach((r, i) => {
    const e1rm = Math.round(r.bestScore);
    const dateStr = new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    html += '<div class="log-pr-row">';
    html += '<div class="log-pr-name">' + r.exName + '</div>';
    html += '<div class="log-pr-set">' + r.bestWeight + ' \u00d7 ' + r.bestReps + '</div>';
    html += '<div class="log-pr-e1rm' + (i === 0 ? " top" : "") + '">' + e1rm + '</div>';
    html += '<div class="log-pr-delta"><div class="date">' + dateStr + '</div></div>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function _buildRecentEntries(entries) {
  if (!entries.length) {
    const ensoHtml = (typeof paperEnso === "function") ? paperEnso(96, "var(--paper-ink, #2B4A7A)") : "";
    return '<div class="empty paper-empty-with-enso">'
      + '<div class="paper-empty-enso" aria-hidden="true">' + ensoHtml + '</div>'
      + '<div class="paper-empty-msg">No workouts yet. Finish one to see it here.</div>'
      + '</div>';
  }
  let html = '<div class="section-title" style="display:flex;justify-content:space-between;align-items:baseline;">';
  html += '<span>All entries</span><span style="color:var(--text-faint);">N=' + String(entries.length).padStart(3, "0") + '</span></div>';

  const monthFmt = (d) => d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
  let lastMonthKey = "";
  const nowMs = Date.now();

  entries.forEach(s => {
    const date = new Date(s.finishedAt);
    const monthKey = date.getFullYear() + "-" + date.getMonth();
    if (monthKey !== lastMonthKey) {
      lastMonthKey = monthKey;
      html += '<div class="log-month-divider">\u00a7 ' + monthFmt(date) + '</div>';
    }
    const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const color = _sessionPrimaryColor(s);
    const prNote = s.prCount ? "PR \u00b7 " + s.prCount + " record" + (s.prCount > 1 ? "s" : "") : "\u2014";
    const isPr = s.prCount > 0;
    const isPlanned = s.finishedAt > nowMs;
    const tappable = !isPlanned;
    const editedMark = s.editedAt ? '<span class="log-entry-edited" title="Edited">\u270e</span>' : '';
    html += '<div class="log-entry' + (tappable ? ' log-entry-tappable' : '') + '"'
         + (tappable ? ' data-session-id="' + s.id + '" role="button" tabindex="0"' : '') + '>';
    html += '<div class="log-entry-date">' + dateStr + '</div>';
    html += '<div class="log-entry-bar" style="background:' + (color || "var(--text-faint)") + ';"></div>';
    const adhocTag = s.isAdhoc ? '<span class="log-entry-adhoc-tag">ad-hoc</span>' : '';
    const rptTag = (s.sets || []).some(set => set.scheme === "rpt")
      ? '<span class="log-entry-adhoc-tag log-entry-rpt-tag">rpt</span>' : '';
    const plannedTag = isPlanned ? '<span class="log-entry-adhoc-tag" style="background:var(--accent-dim,#2a2a3a);color:var(--accent);">planned</span>' : '';
    html += '<div class="log-entry-info"><div class="name">' + (s.dayName || "Day " + s.dayId) + ' ' + adhocTag + rptTag + plannedTag + editedMark + '</div>';
    html += '<div class="note' + (isPr ? " pr" : "") + '">' + prNote + (tappable ? ' <span class="log-entry-cue">tap to edit \u2192</span>' : '') + '</div></div>';
    html += '<div class="log-entry-vol">' + (s.volume > 0 ? s.volume.toLocaleString() : "\u2014") + '</div>';
    if (tappable) {
      html += '<button class="log-entry-delete" type="button" aria-label="Delete workout">delete</button>';
    }
    html += '</div>';
  });
  return html;
}

function _sessionPrimaryColor(session) {
  if (!session || !session.sets || !session.sets.length) return null;
  const counts = {};
  session.sets.forEach(s => {
    (s.muscles || []).forEach(m => {
      const g = groupMuscle(m);
      if (g && GROUP_COLORS[g]) counts[g] = (counts[g] || 0) + 1;
    });
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? GROUP_COLORS[top[0]] : null;
}

// Keep these for other parts of the app that reference them
function renderPRBoard() { renderHistory(); }
function renderSessionList() {}

function setContributionFor(exId) {
  const lib = (typeof LIB_BY_ID !== "undefined") ? LIB_BY_ID[exId] : null;
  return (lib && lib.setContribution) ? lib.setContribution : null;
}

function effectiveSetsByMuscle(sessions, sinceMs) {
  const counts = {};
  sessions.filter(s => s.finishedAt > sinceMs).forEach(s => {
    s.sets.forEach(set => {
      const contrib = setContributionFor(set.exId);
      if (contrib && Object.keys(contrib).length > 0) {
        Object.entries(contrib).forEach(([muscle, weight]) => {
          counts[muscle] = (counts[muscle] || 0) + weight;
        });
      } else {
        (set.muscles || []).forEach(m => {
          counts[m] = (counts[m] || 0) + 1;
        });
      }
    });
  });
  return counts;
}

function renderBalanceTab() {}

function groupMuscle(m) {
  const map = {
    "chest":"Chest","upper chest":"Chest",
    "front delts":"Shoulders","side delts":"Shoulders","rear delts":"Shoulders",
    "lats":"Back","upper back":"Back","lower back":"Back","traps":"Back",
    "biceps":"Arms","triceps":"Arms","forearms":"Arms",
    "quads":"Legs","hamstrings":"Legs","glutes":"Legs","adductors":"Legs","calves":"Legs",
    "core":"Core","obliques":"Core"
  };
  return map[m] || null;
}

const GROUP_COLORS = {
  "Chest":"#e2443a","Back":"#2f6bd3","Legs":"#e5b13a",
  "Shoulders":"#3fb27a","Arms":"#ff8a3d","Core":"#d4d9e2",
  "Full Body":"#bf5af2"
};

function primaryMuscleColor(muscles) {
  if (!muscles || !muscles.length) return null;
  const g = groupMuscle(muscles[0]);
  return g ? GROUP_COLORS[g] || null : null;
}
