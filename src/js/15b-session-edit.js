// ============================================================
// SESSION EDIT — per-set editing, global PR recompute, audit trail
// Workstream D (rp-redesign-plan.md §5)
// ============================================================

// Global authoritative recompute of set.isPR and session.prCount.
// Walk all sessions chronologically; track best e1RM per exercise.
// O(N*M) where N=sessions, M=sets/session. ~11k ops on 365-session cap.
function recomputeAllIsPR() {
  updateUser(u => {
    const sessions = [...(u.sessions || [])].sort((a, b) => a.finishedAt - b.finishedAt);
    const priorBest = {}; // exId → best e1RM seen chronologically
    sessions.forEach(s => {
      s.prCount = 0;
      (s.sets || []).forEach(set => {
        const score = calcE1RM(set.weight || 0, set.reps || 0);
        const prev = priorBest[set.exId] || 0;
        if (score > 0 && score > prev) {
          set.isPR = true;
          priorBest[set.exId] = score;
          s.prCount++;
        } else {
          set.isPR = false;
        }
      });
    });
    u.sessions = sessions;
  });
}

// Capture _original on first edit only — subsequent edits don't overwrite
// so the user can always revert to the pre-edit state.
function _captureOriginalIfNeeded(editedSet, oldSet, nowMs) {
  if (!editedSet._original) {
    editedSet._original = {
      weight: oldSet.weight,
      reps: oldSet.reps,
      rpe: oldSet.rpe,
      bodyweight: oldSet.bodyweight,
      isPR: oldSet.isPR,
      editedAt: nowMs
    };
  }
}

// Persist edits to an in-memory edited session object.
// editedSession must be a deep-cloned copy with user changes applied.
function saveSessionEdits(editedSession) {
  const nowMs = Date.now();
  updateUser(u => {
    const idx = u.sessions.findIndex(s => s.id === editedSession.id);
    if (idx < 0) return;
    const orig = u.sessions[idx];

    // Audit trail: stamp _original on first change per set
    editedSession.sets.forEach((editedSet, i) => {
      const oldSet = orig.sets[i];
      if (!oldSet) return; // new set added — no prior state to capture
      const changed =
        editedSet.weight !== oldSet.weight ||
        editedSet.reps   !== oldSet.reps   ||
        editedSet.rpe    !== oldSet.rpe;
      if (changed) _captureOriginalIfNeeded(editedSet, oldSet, nowMs);
    });

    // Preserve original timestamp if it changed (first move only)
    if (editedSession.finishedAt !== orig.finishedAt && !editedSession.originalFinishedAt) {
      editedSession.originalFinishedAt = orig.finishedAt;
    }

    editedSession.editedAt = nowMs;

    // Recompute volume
    editedSession.volume = editedSession.sets.reduce(
      (sum, s) => sum + (s.bodyweight ? 0 : (s.weight || 0) * (s.reps || 0)),
      0
    );

    u.sessions[idx] = editedSession;

    if (editedSession.finishedAt !== orig.finishedAt) {
      u.sessions.sort((a, b) => a.finishedAt - b.finishedAt);
    }
  });

  recomputeAllIsPR();
  // Recompute mesocycle accounting if the edited session belongs to a meso (Workstream C integration)
  const editedU = (typeof userData === "function") ? userData() : null;
  const editedS = editedU && (editedU.sessions || []).find(s => s.id === editedSession.id);
  if (editedS && editedS.mesocycleId && typeof recomputeMesocycleState === "function") {
    recomputeMesocycleState(editedS.mesocycleId);
  }
}

// Restore a session to its pre-edit values using the _original audit trail.
function revertSession(sessionId) {
  // Capture mesocycleId before mutating (it won't change, but read it first)
  let mesoId = null;
  try {
    const u0 = (typeof userData === "function") ? userData() : null;
    const s0 = u0 && (u0.sessions || []).find(s => s.id === sessionId);
    mesoId = s0 ? s0.mesocycleId : null;
  } catch (_) {}

  updateUser(u => {
    const s = u.sessions.find(x => x.id === sessionId);
    if (!s) return;

    (s.sets || []).forEach(set => {
      if (!set._original) return;
      set.weight    = set._original.weight;
      set.reps      = set._original.reps;
      set.rpe       = set._original.rpe;
      set.bodyweight = set._original.bodyweight;
      delete set._original;
    });

    if (s.originalFinishedAt) {
      s.finishedAt = s.originalFinishedAt;
      delete s.originalFinishedAt;
    }

    s.volume = (s.sets || []).reduce(
      (sum, set) => sum + (set.bodyweight ? 0 : (set.weight || 0) * (set.reps || 0)),
      0
    );
    s.editedAt = null;

    u.sessions.sort((a, b) => a.finishedAt - b.finishedAt);
  });

  recomputeAllIsPR();
  // Recompute mesocycle accounting (Workstream C integration — §4.10 §5.2)
  if (mesoId && typeof recomputeMesocycleState === "function") {
    recomputeMesocycleState(mesoId);
  }
}

// ---- Session editor UI ----------------------------------------

// Module-level editing state so the add-set picker can navigate back.
let _editState = null; // { editing, originalSession }

function openSessionEditor(session) {
  _editState = { editing: deepClone(session), originalSession: session };
  _showSessionEditorSheet();
}

function _showSessionEditorSheet() {
  openSheet(_buildSessionEditorContent());
}

function _buildSessionEditorContent() {
  const { editing, originalSession } = _editState;
  const date = new Date(editing.finishedAt);
  const dateStr = date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  const hasOriginals = editing.sets.some(s => s._original) || editing.originalFinishedAt;

  const wrap = document.createElement("div");
  wrap.className = "session-editor";

  // Header row
  const hdr = document.createElement("div");
  hdr.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;";
  hdr.innerHTML = `<h3 style="margin:0;">Edit Workout</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>`;
  wrap.appendChild(hdr);

  // Date + change date
  const dateRow = document.createElement("div");
  dateRow.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:10px;";
  const dateLabel = document.createElement("span");
  dateLabel.style.cssText = "color:var(--text-dim);font-size:13px;";
  dateLabel.textContent = dateStr;
  dateRow.appendChild(dateLabel);

  const changeDateBtn = document.createElement("button");
  changeDateBtn.style.cssText = "font-size:11px;padding:3px 8px;border-radius:8px;";
  changeDateBtn.textContent = "Change date";
  changeDateBtn.onclick = () => {
    const input = document.createElement("input");
    input.type = "date";
    input.value = new Date(editing.finishedAt).toISOString().slice(0, 10);
    input.style.cssText = "font-size:13px;padding:4px 8px;border-radius:8px;border:2px solid var(--border);";
    input.onchange = () => {
      const d = new Date(input.value);
      if (!isNaN(d.getTime())) {
        const old = new Date(editing.finishedAt);
        d.setHours(old.getHours(), old.getMinutes(), 0, 0);
        _editState.editing.finishedAt = d.getTime();
        _editState.editing.startedAt  = d.getTime() - (editing.duration || 3600) * 1000;
        _showSessionEditorSheet();
      }
    };
    dateRow.innerHTML = "";
    dateRow.appendChild(input);
  };
  dateRow.appendChild(changeDateBtn);
  wrap.appendChild(dateRow);

  // Set rows
  const setsContainer = document.createElement("div");
  editing.sets.forEach((set, i) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:6px;padding:7px 0;border-bottom:1px solid var(--border);flex-wrap:wrap;";

    // Exercise name
    const name = document.createElement("span");
    name.style.cssText = "flex:1;font-size:13px;font-weight:600;min-width:70px;";
    name.textContent = set.exName || set.exId;
    row.appendChild(name);

    // Weight input (not for bodyweight exercises)
    if (!set.bodyweight) {
      const wInput = document.createElement("input");
      wInput.type = "number";
      wInput.className = "tl-log-input";
      wInput.value = set.weight || 0;
      wInput.min = 0;
      wInput.style.width = "54px";
      wInput.title = "Weight";
      wInput.oninput = () => { _editState.editing.sets[i].weight = parseFloat(wInput.value) || 0; };
      row.appendChild(wInput);
      const x = document.createElement("span");
      x.textContent = "×";
      x.style.cssText = "font-size:12px;color:var(--text-dim);";
      row.appendChild(x);
    }

    // Reps input
    const rInput = document.createElement("input");
    rInput.type = "number";
    rInput.className = "tl-log-input";
    rInput.value = set.reps || 0;
    rInput.min = 0;
    rInput.style.width = "44px";
    rInput.title = "Reps";
    rInput.oninput = () => { _editState.editing.sets[i].reps = parseFloat(rInput.value) || 0; };
    row.appendChild(rInput);

    // RPE pill selector
    const rpePills = document.createElement("div");
    rpePills.style.cssText = "display:flex;gap:2px;";
    [null, 6, 7, 8, 9, 10].forEach(val => {
      const pill = document.createElement("button");
      const active = set.rpe === val;
      pill.style.cssText = "font-size:10px;padding:2px 5px;border-radius:5px;min-width:22px;" +
        (active ? "background:var(--accent);color:#fff;border-color:var(--accent);" : "");
      pill.textContent = val === null ? "—" : val;
      pill.title = val === null ? "No RPE" : "RPE " + val;
      pill.onclick = () => {
        _editState.editing.sets[i].rpe = val;
        _showSessionEditorSheet();
      };
      rpePills.appendChild(pill);
    });
    row.appendChild(rpePills);

    // _original indicator (tooltip shows prior value)
    if (set._original) {
      const badge = document.createElement("span");
      const o = set._original;
      badge.title = "Original: " + (o.bodyweight ? "" : o.weight + "×") + o.reps + (o.rpe != null ? " @" + o.rpe : "");
      badge.style.cssText = "font-size:10px;color:var(--accent);cursor:help;";
      badge.textContent = "✎";
      row.appendChild(badge);
    }

    // Delete set
    const delBtn = document.createElement("button");
    delBtn.style.cssText = "color:var(--danger);font-size:14px;padding:2px 7px;border-radius:6px;min-width:28px;";
    delBtn.title = "Remove this set";
    delBtn.textContent = "×";
    delBtn.onclick = () => {
      _editState.editing.sets.splice(i, 1);
      _showSessionEditorSheet();
    };
    row.appendChild(delBtn);

    setsContainer.appendChild(row);
  });
  wrap.appendChild(setsContainer);

  // Add set button
  const addBtn = document.createElement("button");
  addBtn.style.cssText = "margin-top:10px;width:100%;font-size:13px;padding:8px;border-radius:10px;border:2px dashed var(--border);";
  addBtn.textContent = "+ Add set";
  addBtn.onclick = _showAddSetPicker;
  wrap.appendChild(addBtn);

  // Divider
  const hr = document.createElement("hr");
  hr.style.cssText = "margin:14px 0 10px;border-color:var(--border);";
  wrap.appendChild(hr);

  // Footer action row
  const footer = document.createElement("div");
  footer.className = "sheet-actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.onclick = () => { _editState = null; closeSheet(); };
  footer.appendChild(cancelBtn);

  if (hasOriginals) {
    const revertBtn = document.createElement("button");
    revertBtn.textContent = "Revert";
    revertBtn.title = "Restore pre-edit values";
    revertBtn.onclick = () => {
      revertSession(originalSession.id);
      _editState = null;
      closeSheet();
      renderTimelineStrip();
      if (typeof renderHistory === "function") renderHistory();
      showToast("Session reverted to original", "success");
    };
    footer.appendChild(revertBtn);
  }

  const delSessionBtn = document.createElement("button");
  delSessionBtn.className = "danger";
  delSessionBtn.textContent = "Delete";
  delSessionBtn.title = "Delete this session";
  delSessionBtn.onclick = () => {
    if (_undoPending) clearUndoToast();
    const deletedSession = deepClone(originalSession);
    const deletedUserId  = state.userId;
    deleteSession(originalSession.id);
    _editState = null;
    closeSheet();
    renderTimelineStrip();
    if (typeof renderHistory === "function") renderHistory();
    _undoPending = { session: deletedSession, userId: deletedUserId, timerId: null, onExpire: null };
    showUndoToast("Session deleted", () => { _undoPending = null; });
  };
  footer.appendChild(delSessionBtn);

  const saveBtn = document.createElement("button");
  saveBtn.className = "primary";
  saveBtn.textContent = "Save";
  saveBtn.onclick = () => {
    if (_editState.editing.sets.length === 0) {
      if (!confirm("No sets remain — delete the whole session instead?")) return;
      deleteSession(originalSession.id);
      _editState = null;
      closeSheet();
      renderTimelineStrip();
      if (typeof renderHistory === "function") renderHistory();
      return;
    }
    saveSessionEdits(_editState.editing);
    _editState = null;
    closeSheet();
    renderTimelineStrip();
    if (typeof renderHistory === "function") renderHistory();
    showToast("Workout updated", "success");
  };
  footer.appendChild(saveBtn);

  wrap.appendChild(footer);
  return wrap;
}

// Add-set picker: choose from exercises already used in this session.
function _showAddSetPicker() {
  const { editing } = _editState;
  const usedExIds = [...new Set(editing.sets.map(s => s.exId))];

  const wrap = document.createElement("div");
  const hdr = document.createElement("div");
  hdr.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;";
  hdr.innerHTML = `<h3 style="margin:0;">Add Set</h3><button class="icon-btn" title="Back">←</button>`;
  hdr.querySelector(".icon-btn").onclick = _showSessionEditorSheet;
  wrap.appendChild(hdr);

  const note = document.createElement("p");
  note.style.cssText = "font-size:12px;color:var(--text-dim);margin-bottom:8px;";
  note.textContent = "Add another set to an existing exercise in this session:";
  wrap.appendChild(note);

  if (usedExIds.length === 0) {
    const empty = document.createElement("p");
    empty.style.cssText = "font-size:13px;color:var(--text-dim);";
    empty.textContent = "No exercises in this session yet.";
    wrap.appendChild(empty);
  }

  usedExIds.forEach(exId => {
    const lib  = (typeof LIB_BY_ID !== "undefined") ? LIB_BY_ID[exId] : null;
    const exName = lib ? lib.name : exId;
    const lastSet = [...editing.sets].reverse().find(s => s.exId === exId);

    const btn = document.createElement("button");
    btn.className = "sheet-item";
    btn.innerHTML = `<span class="icon">+</span><span>${exName}</span>`;
    btn.onclick = () => {
      _editState.editing.sets.push({
        exId,
        exName,
        muscles:    (lib && lib.muscles) || [],
        setIdx:     editing.sets.filter(s => s.exId === exId).length + 1,
        weight:     lastSet ? lastSet.weight : 0,
        reps:       lastSet ? lastSet.reps   : 8,
        rpe:        null,
        bodyweight: lastSet ? lastSet.bodyweight : false,
        isPR:       false
      });
      _showSessionEditorSheet();
    };
    wrap.appendChild(btn);
  });

  openSheet(wrap);
}
