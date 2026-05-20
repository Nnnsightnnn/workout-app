// ============================================================
// PAPER SESSION VIEW — full-page edit of a past session
// ============================================================
// Mirrors the day-editor ergonomic (paperRenderSetsTable +
// paperWireSetRow) but operates on a session record from
// userData().sessions. Live save: every value change writes
// through to _editState.editing and triggers a debounced
// saveSessionEdits (which captures the _original audit trail).

// 400ms trailing-edge debounce so spamming + on a weight stepper
// coalesces into one recomputeAllIsPR pass.
let _sessionSaveTimer = null;
function debouncedSaveSessionEdits() {
  if (_sessionSaveTimer) clearTimeout(_sessionSaveTimer);
  _sessionSaveTimer = setTimeout(() => {
    _sessionSaveTimer = null;
    if (_editState && _editState.editing) {
      saveSessionEdits(_editState.editing);
    }
  }, 400);
}

// Flush any pending debounce immediately. Called on close so the
// user never leaves the page with unsaved-but-pending edits.
function flushSessionSaveNow() {
  if (_sessionSaveTimer) {
    clearTimeout(_sessionSaveTimer);
    _sessionSaveTimer = null;
    if (_editState && _editState.editing) {
      saveSessionEdits(_editState.editing);
    }
  }
}

// Group a session's flat set array by exId, preserving order of
// first appearance. Returns [{ exId, exName, bodyweight, muscles, setIndices: [globalIdx,...] }, ...].
function _paperGroupSessionEditSets(editing) {
  const groups = [];
  const byId = {};
  (editing.sets || []).forEach((s, i) => {
    const id = s.exId;
    if (!byId[id]) {
      byId[id] = {
        exId: id,
        exName: s.exName || (typeof LIB_BY_ID !== "undefined" && LIB_BY_ID[id] ? LIB_BY_ID[id].name : id),
        bodyweight: !!s.bodyweight,
        muscles: s.muscles || [],
        setIndices: []
      };
      groups.push(byId[id]);
    }
    byId[id].setIndices.push(i);
  });
  return groups;
}

function paperOpenSessionEditor(session) {
  // Build the full-page paper view and mount via openSheet.
  const container = document.createElement("div");
  container.className = "paper-session-view";
  paperRenderSessionView(container, _editState.editing);
  openSheet(container);
  // Mark the sheet container so CSS can promote it to full-page.
  const sheetEl = document.querySelector(".sheet");
  if (sheetEl) sheetEl.classList.add("sheet--paper-page");
  // Hook close so we flush pending edits before tearing down.
  const bgEl = document.getElementById("sheetBg");
  if (bgEl && !bgEl.dataset.sessionEditHooked) {
    bgEl.dataset.sessionEditHooked = "1";
    bgEl.addEventListener("click", (e) => {
      if (e.target === bgEl) _closePaperSession();
    });
  }
}

function _closePaperSession() {
  flushSessionSaveNow();
  _editState = null;
  closeSheet();
  const sheetEl = document.querySelector(".sheet");
  if (sheetEl) sheetEl.classList.remove("sheet--paper-page");
  if (typeof renderHistory === "function") renderHistory();
  if (typeof renderTimelineStrip === "function") renderTimelineStrip();
}

function paperRenderSessionView(container, editing) {
  container.innerHTML = "";

  const date = new Date(editing.finishedAt);
  const dateStr = date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  const timeStr = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const totalSets = (editing.sets || []).length;
  const dur = (typeof formatDuration === "function") ? formatDuration(editing.duration || 0) : (editing.duration + "s");
  const volStr = editing.volume > 0
    ? ((typeof formatVolume === "function") ? formatVolume(editing.volume) : String(editing.volume)) + " " + (typeof state !== "undefined" ? state.unit : "lb")
    : "bodyweight";
  const editedBadge = (editing.editedAt && (editing.sets || []).some(s => s._original))
    ? `<span class="paper-session-edited">edited &middot; ${date.toLocaleDateString(undefined, {month:"short", day:"numeric"})}</span>`
    : "";

  // Top bar — back chevron + breadcrumb
  const top = document.createElement("div");
  top.className = "paper-session-topbar";
  top.innerHTML = `
    <button class="paper-session-back" aria-label="Back to log">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
           style="filter:url(#paper-roughen);">
        <path d="M15 6 L8 12 L15 18"/>
      </svg>
    </button>
    <div class="paper-session-breadcrumb">§ Archive</div>
    <button class="paper-session-close" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round"
           style="filter:url(#paper-roughen);">
        <path d="M6 6 L18 18 M18 6 L6 18"/>
      </svg>
    </button>
  `;
  top.querySelector(".paper-session-back").addEventListener("click", _closePaperSession);
  top.querySelector(".paper-session-close").addEventListener("click", _closePaperSession);
  container.appendChild(top);

  // Headline — handwritten date + meta sub
  const head = document.createElement("div");
  head.className = "paper-session-headline";
  head.innerHTML = `
    <div class="paper-session-date">${escapeHtml(dateStr)}</div>
    <div class="paper-session-meta">
      <span>Day ${editing.dayId} &middot; ${escapeHtml(editing.dayName || "")}</span>
      <span>${totalSets} sets &middot; ${dur} &middot; ${volStr}</span>
      <button class="paper-session-time-edit" aria-label="Change date">${escapeHtml(timeStr)}</button>
    </div>
    ${editedBadge}
  `;
  head.querySelector(".paper-session-time-edit").addEventListener("click", () => _openDatePicker(container, editing));
  container.appendChild(head);

  // Body — groups of sets per exercise
  const body = document.createElement("div");
  body.className = "paper-session-body";
  const groups = _paperGroupSessionEditSets(editing);
  groups.forEach((g, gi) => {
    const groupEl = document.createElement("div");
    groupEl.className = "paper-session-ex-group";

    const letter = String.fromCharCode(65 + gi); // A, B, C…
    const firstSet = editing.sets[g.setIndices[0]];
    const repsLabel = (firstSet && typeof firstSet.reps === "number") ? firstSet.reps : "?";
    const targetSpec = `${g.setIndices.length} &times; ${repsLabel}`;

    const headRow = document.createElement("div");
    headRow.className = "paper-session-ex-head";
    headRow.innerHTML = `
      <div class="paper-session-ex-left">
        <span class="paper-session-ex-no">${letter})</span>
        <span class="paper-session-ex-name">${escapeHtml(g.exName)}</span>
      </div>
      <div class="paper-session-ex-target">${targetSpec}</div>
      <button class="paper-session-ex-addset" aria-label="Add set">+ set</button>
    `;
    headRow.querySelector(".paper-session-ex-addset").addEventListener("click", () => {
      _addSetToGroup(container, editing, g);
    });
    groupEl.appendChild(headRow);

    const list = document.createElement("div");
    list.className = "paper-set-list paper-session-set-list";
    g.setIndices.forEach((globalIdx, localIdx) => {
      const set = editing.sets[globalIdx];
      const row = _buildSessionSetRow(set, globalIdx, localIdx, g.bodyweight);
      list.appendChild(row);
    });
    groupEl.appendChild(list);

    body.appendChild(groupEl);
  });
  container.appendChild(body);

  // Footer — Revert + Delete + Done
  const footer = document.createElement("div");
  footer.className = "paper-session-footer";

  const hasOriginals = (editing.sets || []).some(s => s._original) || editing.originalFinishedAt;
  if (hasOriginals) {
    const revertBtn = document.createElement("button");
    revertBtn.className = "paper-link-btn paper-session-revert";
    revertBtn.textContent = "↺ revert all changes";
    revertBtn.addEventListener("click", () => {
      if (!confirm("Restore this session to its pre-edit values?")) return;
      flushSessionSaveNow();
      revertSession(_editState.originalSession.id);
      // Re-pull a fresh copy from storage so the view shows reverted values.
      const u = userData();
      const fresh = u.sessions.find(s => s.id === _editState.originalSession.id);
      if (fresh) {
        _editState.editing = deepClone(fresh);
        _editState.originalSession = fresh;
        paperRenderSessionView(container, _editState.editing);
      }
      showToast("Session reverted", "success");
    });
    footer.appendChild(revertBtn);
  }

  const delBtn = document.createElement("button");
  delBtn.className = "paper-stamp-btn paper-session-delete";
  delBtn.textContent = "delete session";
  delBtn.addEventListener("click", () => {
    if (typeof _undoPending !== "undefined" && _undoPending) {
      if (typeof clearUndoToast === "function") clearUndoToast();
    }
    const orig = _editState.originalSession;
    const deletedSession = deepClone(orig);
    const deletedUserId = state.userId;
    deleteSession(orig.id);
    _editState = null;
    closeSheet();
    const sheetEl = document.querySelector(".sheet");
    if (sheetEl) sheetEl.classList.remove("sheet--paper-page");
    if (typeof renderTimelineStrip === "function") renderTimelineStrip();
    if (typeof renderHistory === "function") renderHistory();
    if (typeof _undoPending !== "undefined") {
      _undoPending = { session: deletedSession, userId: deletedUserId, timerId: null, onExpire: null };
    }
    if (typeof showUndoToast === "function") {
      showUndoToast("Session deleted", () => { if (typeof _undoPending !== "undefined") _undoPending = null; });
    }
  });
  footer.appendChild(delBtn);

  const doneBtn = document.createElement("button");
  doneBtn.className = "paper-start-stamp paper-session-done";
  doneBtn.textContent = "Done";
  doneBtn.addEventListener("click", _closePaperSession);
  footer.appendChild(doneBtn);

  container.appendChild(footer);
}

function _buildSessionSetRow(set, globalIdx, localIdx, bw) {
  const ink = paperInkColor();
  const isKg = (typeof state !== "undefined" && state.unit === "kg");
  const unit = isKg ? "kg" : "lb";
  const weightDisp = (set.bodyweight || bw) ? "" : `${set.weight ?? 0} ${unit}`;
  const repsDisp = `${set.reps ?? 0} reps`;
  const rpeDisp = (set.rpe != null) ? String(set.rpe) : "—";

  const row = document.createElement("div");
  row.className = "paper-set-row paper-session-set-row set-done";
  row.dataset.setIdx = globalIdx;

  const weightHtml = (set.bodyweight || bw) ? "" : `
    <span class="paper-set-weight" data-field="w">${weightDisp}</span>
    <span class="paper-set-x">&times;</span>
  `;
  const repsHtml = `<span class="paper-set-reps" data-field="r">${repsDisp}</span>`;
  const rpeHtml = `
    <span class="paper-set-rpe-lbl">RPE</span>
    <span class="paper-set-rpe-val" data-field="p">${rpeDisp}</span>
  `;
  const editedMark = set._original ? `<span class="paper-session-edited-mark" title="Edited">✎</span>` : "";

  row.innerHTML = `
    <span class="paper-set-idx">${localIdx + 1}.</span>
    <span class="paper-set-box" aria-hidden="true">
      ${paperCheckboxSvg(true, ink, 18)}
    </span>
    ${weightHtml}
    ${repsHtml}
    ${rpeHtml}
    ${editedMark}
    <button class="paper-session-set-delete" aria-label="Delete set">×</button>
  `;

  paperWireSessionSetRow(row, _editState.editing, globalIdx, set.bodyweight || bw);
  return row;
}

function paperWireSessionSetRow(row, editing, globalIdx, bw) {
  // Inline-edit popovers on weight / reps / rpe spans
  ["w", "r", "p"].forEach(field => {
    const span = row.querySelector(`[data-field="${field}"]`);
    if (!span) return;
    let handled = false;
    span.addEventListener("touchend", (e) => {
      e.stopPropagation();
      handled = true;
      openSessionInlineEditor(span, field, editing, globalIdx, bw);
    });
    span.addEventListener("click", (e) => {
      e.stopPropagation();
      if (handled) { handled = false; return; }
      openSessionInlineEditor(span, field, editing, globalIdx, bw);
    });
  });

  // Delete-set button — confirm then re-render the page so indices update.
  const del = row.querySelector(".paper-session-set-delete");
  if (del) {
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      const set = editing.sets[globalIdx];
      const lbl = set ? `${set.exName} · set ${(set.setIdx || globalIdx + 1)}` : "this set";
      if (!confirm(`Remove ${lbl}?`)) return;
      editing.sets.splice(globalIdx, 1);
      flushSessionSaveNow();
      const container = document.querySelector(".paper-session-view");
      if (container) paperRenderSessionView(container, editing);
    });
  }

  // Swipe-left to delete (touch only)
  let swStartX = 0, swStartY = 0, isSwiping = false;
  row.addEventListener("touchstart", (e) => {
    swStartX = e.touches[0].clientX;
    swStartY = e.touches[0].clientY;
    isSwiping = false;
  }, { passive: true });
  row.addEventListener("touchmove", (e) => {
    const dx = e.touches[0].clientX - swStartX;
    const dy = e.touches[0].clientY - swStartY;
    if (!isSwiping && Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 1.5) isSwiping = true;
    if (isSwiping && dx < 0) {
      e.preventDefault();
      row.style.transition = "none";
      row.style.transform = `translateX(${Math.max(-80, dx)}px)`;
    }
  }, { passive: false });
  row.addEventListener("touchend", (e) => {
    if (!isSwiping) return;
    const dx = e.changedTouches[0].clientX - swStartX;
    row.style.transition = "transform 0.15s ease-out";
    row.style.transform = "";
    if (dx < -60 && del) {
      setTimeout(() => del.click(), 80);
    }
    setTimeout(() => { row.style.transition = ""; }, 160);
  }, { passive: true });
}

// Session-aware inline editor. Same popover as the day editor, but
// writes through to _editState.editing.sets[setIdx] and debounces
// the save.
function openSessionInlineEditor(anchorEl, field, editing, setIdx, bw) {
  const set = editing.sets[setIdx];
  if (!set) return;
  const lib = (typeof LIB_BY_ID !== "undefined") ? (LIB_BY_ID[set.exId] || {}) : {};
  const isKg = (typeof state !== "undefined" && state.unit === "kg");
  const unit = isKg ? "kg" : "lb";

  let curVal, step, label, unitLabel, commonVals, fieldName;
  if (field === "w") {
    curVal = set.weight || 0;
    step = isKg ? 2.5 : 5;
    label = `Weight (${unit})`;
    unitLabel = unit;
    commonVals = isKg ? [20, 40, 60, 80, 100, 120, 140] : [45, 95, 135, 185, 225, 275, 315];
    fieldName = "weight";
  } else if (field === "r") {
    curVal = set.reps || 0;
    step = lib.isTime ? 5 : lib.isDistance ? 10 : 1;
    label = lib.isTime ? "Time (sec)" : lib.isDistance ? "Distance (m)" : "Reps";
    unitLabel = lib.isTime ? "s" : lib.isDistance ? "m" : "reps";
    commonVals = lib.isTime ? [15, 30, 45, 60, 90, 120] : lib.isDistance ? [50, 100, 200, 400, 800, 1000] : [1, 3, 5, 8, 10, 12, 15, 20];
    fieldName = "reps";
  } else { // "p" — RPE
    curVal = set.rpe != null ? set.rpe : 7;
    step = 1;
    label = "RPE";
    unitLabel = "";
    commonVals = [6, 7, 8, 9, 10];
    fieldName = "rpe";
  }

  openValuePopover(anchorEl, {
    curVal, step, label, unitLabel, commonVals,
    onChange(v) {
      _editState.editing.sets[setIdx][fieldName] = v;
      if (field === "w") {
        anchorEl.textContent = `${v} ${unit}`;
      } else if (field === "r") {
        const rl = lib.isTime ? "s" : lib.isDistance ? "m" : "reps";
        anchorEl.textContent = `${v} ${rl}`;
      } else {
        anchorEl.textContent = String(v);
      }
      debouncedSaveSessionEdits();
    }
  });
}

function _addSetToGroup(container, editing, group) {
  // Clone the last set of this group as the new default — same weight/reps/rpe.
  const lastIdx = group.setIndices[group.setIndices.length - 1];
  const last = editing.sets[lastIdx] || {};
  const newSet = {
    exId: group.exId,
    exName: group.exName,
    muscles: group.muscles || last.muscles || [],
    setIdx: (group.setIndices.length) + 1,
    weight: last.weight ?? 0,
    reps: last.reps ?? 8,
    rpe: last.rpe ?? null,
    bodyweight: !!group.bodyweight,
    isPR: false
  };
  // Insert immediately after the group's last existing set so visual order matches.
  editing.sets.splice(lastIdx + 1, 0, newSet);
  flushSessionSaveNow();
  paperRenderSessionView(container, editing);
}

function _openDatePicker(container, editing) {
  const input = document.createElement("input");
  input.type = "datetime-local";
  const cur = new Date(editing.finishedAt);
  // datetime-local needs YYYY-MM-DDTHH:MM in local time
  const pad = (n) => String(n).padStart(2, "0");
  input.value = `${cur.getFullYear()}-${pad(cur.getMonth()+1)}-${pad(cur.getDate())}T${pad(cur.getHours())}:${pad(cur.getMinutes())}`;
  input.className = "paper-session-datepicker";
  input.addEventListener("change", () => {
    const d = new Date(input.value);
    if (isNaN(d.getTime())) return;
    editing.finishedAt = d.getTime();
    editing.startedAt = d.getTime() - (editing.duration || 3600) * 1000;
    debouncedSaveSessionEdits();
    paperRenderSessionView(container, editing);
  });
  // Mount inline in place of the time button — replace by re-rendering after pick.
  const btn = container.querySelector(".paper-session-time-edit");
  if (btn) {
    btn.parentElement.replaceChild(input, btn);
    input.focus();
    if (typeof input.showPicker === "function") {
      try { input.showPicker(); } catch (_) {}
    }
  }
}

if (typeof window !== "undefined") {
  window.paperOpenSessionEditor = paperOpenSessionEditor;
  window.paperRenderSessionView = paperRenderSessionView;
  window.paperWireSessionSetRow = paperWireSessionSetRow;
  window.openSessionInlineEditor = openSessionInlineEditor;
  window.debouncedSaveSessionEdits = debouncedSaveSessionEdits;
  window.flushSessionSaveNow = flushSessionSaveNow;
}
