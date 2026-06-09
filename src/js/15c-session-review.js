// ============================================================
// SESSION REVIEW — same-day "Completed today" strip + read-only review sheet.
// Surfaces finishWorkout() / exitWorkout() output on the day-picker so the user
// can look back at a just-completed session without scrolling into history.
// Tap a card → openSessionReview() (read-only). Edit → openSessionEditor() (15b).
// ============================================================

function _isSameLocalDay(ms, refMs) {
  const a = new Date(ms);
  const b = new Date(refMs);
  return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
}

function getTodaysSessions(u) {
  if (!u || !Array.isArray(u.sessions)) return [];
  const now = Date.now();
  return u.sessions
    .filter(s => s && typeof s.finishedAt === "number" && _isSameLocalDay(s.finishedAt, now))
    .slice()
    .sort((a, b) => a.finishedAt - b.finishedAt);
}

function _formatClockTime(ms) {
  const d = new Date(ms);
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return h + ":" + String(m).padStart(2, "0") + " " + ap;
}

// Build a single card for the strip. Returns a DOM element.
function _buildCompletedTodayCard(session) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "ct-card";
  card.dataset.sessionId = session.id;

  const sets = Array.isArray(session.sets) ? session.sets : [];
  const setsCount = sets.length;
  const vol = typeof session.volume === "number" ? session.volume : 0;
  const dur = typeof session.duration === "number" ? session.duration : 0;
  const volStr = vol > 0
    ? (typeof formatVolume === "function" ? formatVolume(vol) : String(vol)) + " " + (state && state.unit ? state.unit : "lbs")
    : "bw";
  const durStr = typeof formatDuration === "function" ? formatDuration(dur) : (Math.round(dur/60) + "m");
  const clockStr = _formatClockTime(session.finishedAt);
  const name = session.dayName || ("Day " + (session.dayId || ""));
  const prTag = session.prCount > 0
    ? '<span class="ct-card-pr">' + session.prCount + ' PR' + (session.prCount > 1 ? 's' : '') + '</span>'
    : '';

  card.innerHTML =
      '<div class="ct-card-kicker">'
    +   '<span class="ct-card-kicker-time">' + escapeHtml(clockStr) + '</span>'
    +   '<span class="ct-card-kicker-tag">done</span>'
    + '</div>'
    + '<div class="ct-card-name">' + escapeHtml(name) + '</div>'
    + '<div class="ct-card-stats">'
    +   '<span class="ct-card-stat">' + setsCount + ' sets</span>'
    +   '<span class="ct-card-sep">·</span>'
    +   '<span class="ct-card-stat">' + escapeHtml(volStr) + '</span>'
    +   '<span class="ct-card-sep">·</span>'
    +   '<span class="ct-card-stat">' + escapeHtml(durStr) + '</span>'
    +   prTag
    + '</div>';

  card.addEventListener("click", () => {
    openSessionReview(session.id);
  });
  return card;
}

// Build the full "Completed today" strip element. Returns null when no
// sessions today (so the caller can skip appending it entirely).
function buildCompletedTodayStrip() {
  const u = (typeof userData === "function") ? userData() : null;
  if (!u) return null;
  const todays = getTodaysSessions(u);
  if (!todays.length) return null;

  const wrap = document.createElement("div");
  wrap.className = "completed-today-strip";
  wrap.dataset.count = String(todays.length);

  const hdr = document.createElement("div");
  hdr.className = "ct-strip-header";
  hdr.innerHTML =
      '<span class="ct-strip-title">Completed today</span>'
    + '<span class="ct-strip-count">' + todays.length + '</span>';
  wrap.appendChild(hdr);

  const row = document.createElement("div");
  row.className = "ct-strip-row";
  todays.forEach(s => row.appendChild(_buildCompletedTodayCard(s)));
  wrap.appendChild(row);

  return wrap;
}

// ---- Read-only review sheet ----------------------------------

function openSessionReview(sessionId) {
  const u = (typeof userData === "function") ? userData() : null;
  if (!u) return;
  const session = (u.sessions || []).find(s => s && s.id === sessionId);
  if (!session) {
    if (typeof showToast === "function") showToast("Session not found");
    return;
  }
  if (typeof openSheet !== "function") return;
  openSheet(_buildSessionReviewContent(session));
}

// Group session.sets into [{ exId, exName, sets:[…] }] preserving order.
function _groupSessionSets(sets) {
  const order = [];
  const map = {};
  (sets || []).forEach(s => {
    const key = s.exId || s.exName || "?";
    if (!map[key]) {
      map[key] = { exId: s.exId, exName: s.exName || s.exId || "—", sets: [] };
      order.push(key);
    }
    map[key].sets.push(s);
  });
  return order.map(k => map[k]);
}

function _buildSessionReviewContent(session) {
  const wrap = document.createElement("div");
  wrap.className = "session-review";

  const sets = Array.isArray(session.sets) ? session.sets : [];
  const vol = typeof session.volume === "number" ? session.volume : 0;
  const dur = typeof session.duration === "number" ? session.duration : 0;
  const dateStr = new Date(session.finishedAt).toLocaleDateString(undefined,
    { weekday: "long", month: "short", day: "numeric" });
  const clockStr = _formatClockTime(session.finishedAt);
  const unit = (state && state.unit) ? state.unit : "lbs";
  const volStr = vol > 0
    ? (typeof formatVolume === "function" ? formatVolume(vol) : String(vol)) + " " + unit
    : "bodyweight";
  const durStr = typeof formatDuration === "function" ? formatDuration(dur) : (Math.round(dur / 60) + "m");

  // Header
  const hdr = document.createElement("div");
  hdr.className = "sr-header";
  hdr.innerHTML =
      '<div class="sr-header-row">'
    +   '<h3 class="sr-title">' + escapeHtml(session.dayName || ("Day " + (session.dayId || ""))) + '</h3>'
    +   '<button class="icon-btn sr-close-btn" type="button" title="Close" aria-label="Close">✕</button>'
    + '</div>'
    + '<div class="sr-meta">'
    +   '<span class="sr-meta-item">' + escapeHtml(dateStr) + ' · ' + escapeHtml(clockStr) + '</span>'
    + '</div>'
    + '<div class="sr-stats">'
    +   '<div class="sr-stat"><div class="sr-stat-val">' + sets.length + '</div><div class="sr-stat-label">sets</div></div>'
    +   '<div class="sr-stat"><div class="sr-stat-val">' + escapeHtml(volStr) + '</div><div class="sr-stat-label">volume</div></div>'
    +   '<div class="sr-stat"><div class="sr-stat-val">' + escapeHtml(durStr) + '</div><div class="sr-stat-label">duration</div></div>'
    + (session.prCount > 0
        ? '<div class="sr-stat sr-stat-pr"><div class="sr-stat-val">' + session.prCount + '</div><div class="sr-stat-label">PR' + (session.prCount > 1 ? 's' : '') + '</div></div>'
        : '')
    + '</div>';
  wrap.appendChild(hdr);
  const closeBtn = hdr.querySelector(".sr-close-btn");
  if (closeBtn) closeBtn.addEventListener("click", () => { if (typeof closeSheet === "function") closeSheet(); });

  // Sets grouped by exercise
  const groups = _groupSessionSets(sets);
  if (groups.length === 0) {
    const empty = document.createElement("div");
    empty.className = "sr-empty paper-empty-with-enso";
    const ensoHtml = (typeof paperEnso === "function") ? paperEnso(72, "var(--paper-ink, #2B4A7A)") : "";
    empty.innerHTML = '<div class="paper-empty-enso" aria-hidden="true">' + ensoHtml + '</div>'
      + '<div class="paper-empty-msg">No sets logged.</div>';
    wrap.appendChild(empty);
  } else {
    const list = document.createElement("div");
    list.className = "sr-ex-list";
    groups.forEach(g => {
      const ex = document.createElement("div");
      ex.className = "sr-ex";
      let html = '<div class="sr-ex-name">' + escapeHtml(g.exName) + '</div>';
      html += '<div class="sr-ex-sets">';
      g.sets.forEach((s, i) => {
        const wLabel = s.bodyweight ? "BW" : String(s.weight || 0);
        const r = String(s.reps || 0);
        const rpe = (s.rpe != null) ? ' <span class="sr-set-rpe">@' + escapeHtml(String(s.rpe)) + '</span>' : '';
        const pr = s.isPR ? ' <span class="sr-set-pr">PR</span>' : '';
        html += '<div class="sr-set-row">'
          + '<span class="sr-set-idx">' + (i + 1) + '.</span>'
          + '<span class="sr-set-val">' + escapeHtml(wLabel) + ' × ' + escapeHtml(r) + '</span>'
          + rpe
          + pr
          + '</div>';
      });
      html += '</div>';
      ex.innerHTML = html;
      list.appendChild(ex);
    });
    wrap.appendChild(list);
  }

  // Block notes if any
  if (session.blockNotes && typeof session.blockNotes === "object") {
    const keys = Object.keys(session.blockNotes);
    if (keys.length) {
      const notesWrap = document.createElement("div");
      notesWrap.className = "sr-notes";
      let nHtml = '<div class="sr-notes-label">Notes</div>';
      keys.forEach(k => {
        const n = session.blockNotes[k];
        if (n && n.note) {
          nHtml += '<div class="sr-note"><span class="sr-note-block">' + escapeHtml(n.name || k) + '</span> '
            + escapeHtml(n.note) + '</div>';
        }
      });
      notesWrap.innerHTML = nHtml;
      wrap.appendChild(notesWrap);
    }
  }

  // Footer
  const footer = document.createElement("div");
  footer.className = "sheet-actions sr-footer";

  const doneBtn = document.createElement("button");
  doneBtn.type = "button";
  doneBtn.textContent = "Done";
  doneBtn.onclick = () => { if (typeof closeSheet === "function") closeSheet(); };
  footer.appendChild(doneBtn);

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "primary";
  editBtn.textContent = "Edit this session";
  editBtn.onclick = () => {
    if (typeof openSessionEditor === "function") {
      openSessionEditor(session);
    }
  };
  footer.appendChild(editBtn);

  wrap.appendChild(footer);
  return wrap;
}
