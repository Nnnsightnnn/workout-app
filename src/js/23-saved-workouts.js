// ============================================================
// SAVED WORKOUTS
// ============================================================
// Lightweight, repeatable workout templates. Distinct from u.programs[]
// (heavy multi-day periodized plans) and u.sessions[] (immutable logs).
// Stored at u.savedWorkouts[]. Created by saving any past session as a
// template; repeated by routing through the ad-hoc workout flow.
//
//   { id, name, createdAt, lastUsedAt, useCount,
//     sourceSessionId, blocks: [{ id, letter, name, blockType, exercises }] }

// ─────────────────────────────────────────────────────────────
// Build a prescribed block/exercise structure from a logged
// session. Groups flat session.sets by exId (preserving order of
// first appearance), counts sets, and pulls library defaults for
// reps/rest/bodyweight. Wraps everything in a single block.
// ─────────────────────────────────────────────────────────────
function derivePrescribedBlocksFromSession(session) {
  const sets = (session && session.sets) || [];
  if (!sets.length) {
    return [{ id: "sw-block-1", letter: "A", name: "Workout", blockType: "strength", exercises: [] }];
  }

  const order = [];
  const byId = {};
  sets.forEach(s => {
    const id = s.exId;
    if (!id) return;
    if (!byId[id]) {
      byId[id] = { exId: id, name: s.exName || id, muscles: s.muscles || [], bodyweight: !!s.bodyweight, count: 0, sumReps: 0, sumWeight: 0 };
      order.push(id);
    }
    byId[id].count++;
    if (typeof s.reps === "number") byId[id].sumReps += s.reps;
    if (typeof s.weight === "number" && s.weight > 0) byId[id].sumWeight += s.weight;
  });

  const exercises = order.map(id => {
    const g = byId[id];
    const lib = (typeof LIB_BY_ID !== "undefined") ? LIB_BY_ID[id] : null;
    const avgReps = g.count > 0 ? Math.round(g.sumReps / g.count) : (lib ? lib.defaultReps : 8);
    return {
      exId: id,
      name: g.name,
      muscles: g.muscles.slice(),
      cat: lib ? lib.cat : null,
      sets: g.count,
      reps: avgReps || (lib ? lib.defaultReps : 8),
      rest: lib ? lib.defaultRest : 90,
      defaultWeight: lib ? (lib.defaultWeight ?? 0) : 0,
      bodyweight: g.bodyweight,
      perSide: lib ? !!lib.perSide : false,
      isTime: lib ? !!lib.isTime : false,
      isDistance: lib ? !!lib.isDistance : false,
      noRpe: lib ? !!lib.noRpe : false,
      tempo: "",
      notes: ""
    };
  });

  return [{
    id: "sw-block-1",
    letter: "A",
    name: session.dayName || "Workout",
    blockType: "strength",
    exercises
  }];
}

function _genSavedWorkoutId() {
  return "sw_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

// ─────────────────────────────────────────────────────────────
// SAVE — bottom sheet that takes a name and writes to
// u.savedWorkouts[]. Reachable from the paper session view footer.
// ─────────────────────────────────────────────────────────────
function openSaveWorkoutSheet(session) {
  if (!session) return;
  const blocks = derivePrescribedBlocksFromSession(session);
  const exCount = blocks.reduce((n, b) => n + (b.exercises || []).length, 0);
  if (exCount === 0) {
    if (typeof showToast === "function") showToast("Nothing to save — this session has no exercises.");
    return;
  }
  const defaultName = (session.dayName || "Saved workout").trim();

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">Save to repeat</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">&times;</button>
    </div>
    <p style="color:var(--text-dim);font-size:12px;margin-bottom:14px;">
      Save this workout's structure so you can repeat it from the Quick Workout menu.
    </p>
  `;

  const nameLabel = document.createElement("div");
  nameLabel.className = "section-title";
  nameLabel.style.marginTop = "0";
  nameLabel.textContent = "Name";
  wrap.appendChild(nameLabel);

  const nameIn = document.createElement("input");
  nameIn.type = "text";
  nameIn.className = "name-input";
  nameIn.value = defaultName;
  nameIn.maxLength = 60;
  nameIn.style.cssText = "width:100%;margin-bottom:14px;box-sizing:border-box;";
  wrap.appendChild(nameIn);

  // Preview list
  const previewLabel = document.createElement("div");
  previewLabel.className = "section-title";
  previewLabel.textContent = exCount + " exercise" + (exCount === 1 ? "" : "s");
  wrap.appendChild(previewLabel);

  const preview = document.createElement("div");
  preview.style.cssText = "max-height:38vh;overflow-y:auto;margin-bottom:14px;border-top:1px dotted var(--paper-ink-mist,#aaa);border-bottom:1px dotted var(--paper-ink-mist,#aaa);padding:6px 0;";
  blocks.forEach(b => {
    (b.exercises || []).forEach(ex => {
      const row = document.createElement("div");
      row.className = "saved-preview-row";
      row.style.cssText = "display:flex;justify-content:space-between;align-items:baseline;padding:4px 0;font-family:var(--paper-hand,inherit);font-size:15px;color:var(--paper-ink,inherit);";
      const left = document.createElement("span");
      left.textContent = ex.name;
      const right = document.createElement("span");
      right.style.cssText = "font-family:var(--paper-form,monospace);font-size:11px;letter-spacing:0.12em;color:var(--paper-ink-faint,#888);text-transform:lowercase;";
      right.textContent = ex.sets + " × " + (ex.reps || "?");
      row.appendChild(left);
      row.appendChild(right);
      preview.appendChild(row);
    });
  });
  wrap.appendChild(preview);

  const actions = document.createElement("div");
  actions.className = "sheet-actions";
  const cancel = document.createElement("button");
  cancel.textContent = "Cancel";
  cancel.onclick = () => closeSheet();
  const save = document.createElement("button");
  save.className = "primary paper-stamp-btn";
  save.textContent = "Save";
  save.onclick = () => {
    const name = (nameIn.value || "").trim() || defaultName || "Saved workout";
    const entry = {
      id: _genSavedWorkoutId(),
      name: name,
      createdAt: Date.now(),
      lastUsedAt: null,
      useCount: 0,
      sourceSessionId: session.id || null,
      blocks: blocks
    };
    updateUser(u => {
      if (!Array.isArray(u.savedWorkouts)) u.savedWorkouts = [];
      u.savedWorkouts.push(entry);
    });
    closeSheet();
    if (typeof showToast === "function") showToast("Saved “" + name + "” — find it under the + button.", "success");
  };
  actions.appendChild(cancel);
  actions.appendChild(save);
  wrap.appendChild(actions);

  openSheet(wrap);
  setTimeout(() => { try { nameIn.select(); } catch (_) {} }, 30);
}

// ─────────────────────────────────────────────────────────────
// ACCESS — picker sheet listing the user's saved workouts.
// Opened from the Quick Workout (+) sheet.
// ─────────────────────────────────────────────────────────────
function openSavedWorkoutsPicker() {
  const u = userData();
  const saved = (u && u.savedWorkouts) || [];
  const wrap = document.createElement("div");
  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">Saved workouts</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">&times;</button>
    </div>
    <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">Tap one to run it as today's session.</p>
  `;

  if (!saved.length) {
    html += '<p style="color:var(--text-dim);font-size:13px;padding:8px 0;">No saved workouts yet — finish a workout, open it from History, and tap “↻ save to repeat.”</p>';
    wrap.innerHTML = html;
    openSheet(wrap);
    return;
  }

  // Most-recently-used first; never-used at the end (by createdAt desc).
  const sorted = saved.slice().sort((a, b) => {
    const ax = a.lastUsedAt || 0;
    const bx = b.lastUsedAt || 0;
    if (ax !== bx) return bx - ax;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  sorted.forEach(sw => {
    const exCount = (sw.blocks || []).reduce((n, b) => n + (b.exercises || []).length, 0);
    const meta = _savedWorkoutMetaLine(sw, exCount);
    html += `
      <div class="tpl-option" data-sw-id="${sw.id}">
        <div class="tpl-head"><div class="tpl-name">${_escSw(sw.name || "Workout")}</div></div>
        <div class="tpl-desc">${meta}</div>
      </div>
    `;
  });
  wrap.innerHTML = html;
  wrap.querySelectorAll(".tpl-option").forEach(row => {
    row.onclick = () => {
      const id = row.dataset.swId;
      closeSheet();
      setTimeout(() => _beginSavedWorkout(id), 80);
    };
  });
  openSheet(wrap);
}

function _savedWorkoutMetaLine(sw, exCount) {
  const parts = [];
  parts.push(exCount + " exercise" + (exCount === 1 ? "" : "s"));
  if (sw.lastUsedAt) {
    const d = new Date(sw.lastUsedAt);
    parts.push("last used " + d.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
  } else {
    parts.push("never used");
  }
  if (sw.useCount > 0) parts.push("used " + sw.useCount + "×");
  return parts.join(" · ");
}

// ─────────────────────────────────────────────────────────────
// REPEAT — clones a saved workout into the ad-hoc flow, then
// renders the workout screen. Mirrors _beginAdhocFromTemplateDay.
// ─────────────────────────────────────────────────────────────
function _beginSavedWorkout(id) {
  const u = userData();
  const sw = (u && u.savedWorkouts || []).find(x => x.id === id);
  if (!sw) {
    if (typeof showToast === "function") showToast("Couldn't find that saved workout.");
    return;
  }

  const cloned = (sw.blocks || []).map((b, bi) => ({
    id: "adhoc-sw-" + (b.id || b.letter || bi),
    letter: b.letter || String.fromCharCode(65 + bi),
    name: b.name || "",
    type: b.type || null,
    blockType: b.blockType || "strength",
    exercises: (b.exercises || []).map(e => {
      const lib = (typeof LIB_BY_ID !== "undefined") ? LIB_BY_ID[e.exId] : null;
      if (lib && typeof mkSets === "function") {
        // mkSets gives us a clean instance with library defaults; then layer
        // the saved overrides (sets count, prescribed reps, rest) on top.
        return mkSets(lib, {
          sets: e.sets,
          reps: e.reps,
          rest: e.rest,
          bodyweight: e.bodyweight,
          tempo: e.tempo || "",
          notes: e.notes || ""
        });
      }
      // Library entry gone — keep the saved exercise as-is.
      return Object.assign({}, e);
    })
  }));

  state.adhocActive = true;
  state.adhocDay = {
    id: "adhoc",
    name: sw.name || "Saved workout",
    sub: "saved · won't affect program",
    blocks: cloned
  };
  state.adhocCustomName = null;
  state.adhocExercises = null;
  state.adhocStartedAt = Date.now();
  state.adhocInputs = {};
  state.adhocSavedWorkoutId = sw.id;
  state.dayChosen = true;
  state.workoutView = "chapters";

  if (typeof renderAdhocScreen === "function") renderAdhocScreen();
  if (typeof showToast === "function") showToast("Loaded “" + (sw.name || "saved workout") + "”", "success");
}

// ─────────────────────────────────────────────────────────────
// MANAGE — Settings → Programs library appends a "Saved
// workouts" block rendered by this function. Uses the same
// .paper-library-row markup as the Programs list.
// ─────────────────────────────────────────────────────────────
function renderSavedWorkoutsSection() {
  const u = userData();
  if (!u) return "";
  const saved = u.savedWorkouts || [];

  let html = '<div class="paper-settings-block paper-library paper-saved-library">';
  html += '<div class="paper-settings-title">Saved workouts</div>';
  html += '<div class="paper-settings-sub">Workouts you saved from past sessions — repeat them from the + menu.</div>';

  if (!saved.length) {
    html += '<p style="color:var(--paper-ink-faint,#999);font-family:var(--paper-form,monospace);font-size:11px;letter-spacing:0.12em;text-transform:lowercase;padding:8px 0 0;">';
    html += 'none yet — save one from a past session in history.';
    html += '</p>';
    html += '</div>';
    return html;
  }

  // Same sort as picker — most-recently-used first.
  const sorted = saved.slice().sort((a, b) => {
    const ax = a.lastUsedAt || 0;
    const bx = b.lastUsedAt || 0;
    if (ax !== bx) return bx - ax;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  html += '<div class="paper-library-list">';
  sorted.forEach(sw => {
    const exCount = (sw.blocks || []).reduce((n, b) => n + (b.exercises || []).length, 0);
    const meta = _savedWorkoutMetaLine(sw, exCount);
    html += '<div class="paper-library-row" data-sw-id="' + sw.id + '">';
    html += '  <div class="paper-library-bullet" aria-hidden="true">·</div>';
    html += '  <div class="paper-library-body">';
    html += '    <div class="paper-library-name">' + _escSw(sw.name || "Workout") + '</div>';
    html += '    <div class="paper-library-meta">' + meta + '</div>';
    html += '    <div class="paper-library-actions">';
    html += '      <button class="paper-link-btn" data-sw-act="rename">Rename</button>';
    html += '      <button class="paper-link-btn paper-link-btn-danger" data-sw-act="delete">Delete</button>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';
  });
  html += '</div>';
  html += '</div>';
  return html;
}

function wireSavedWorkoutsActions(root) {
  if (!root) return;
  root.querySelectorAll('.paper-library-row[data-sw-id]').forEach(row => {
    const id = row.dataset.swId;
    row.querySelectorAll('[data-sw-act]').forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const act = btn.dataset.swAct;
        if (act === "rename") renameSavedWorkout(id);
        else if (act === "delete") deleteSavedWorkout(id);
      });
    });
  });
}

function renameSavedWorkout(id) {
  const u = userData();
  const sw = (u && u.savedWorkouts || []).find(x => x.id === id);
  if (!sw) return;
  const next = prompt("Rename saved workout:", sw.name || "");
  if (next == null) return;
  const trimmed = String(next).trim();
  if (!trimmed || trimmed === sw.name) return;
  updateUser(usr => {
    const target = (usr.savedWorkouts || []).find(x => x.id === id);
    if (target) target.name = trimmed.slice(0, 60);
  });
  if (typeof renderProgramPicker === "function") renderProgramPicker();
  if (typeof showToast === "function") showToast("Renamed", "success");
}

function deleteSavedWorkout(id) {
  const u = userData();
  const sw = (u && u.savedWorkouts || []).find(x => x.id === id);
  if (!sw) return;
  if (!confirm("Delete \"" + (sw.name || "saved workout") + "\"? This cannot be undone.")) return;
  updateUser(usr => {
    if (!Array.isArray(usr.savedWorkouts)) return;
    const idx = usr.savedWorkouts.findIndex(x => x.id === id);
    if (idx >= 0) usr.savedWorkouts.splice(idx, 1);
  });
  if (typeof renderProgramPicker === "function") renderProgramPicker();
  if (typeof showToast === "function") showToast("Deleted", "success");
}

// Local html escaper — kept independent of other render files.
function _escSw(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

if (typeof window !== "undefined") {
  window.derivePrescribedBlocksFromSession = derivePrescribedBlocksFromSession;
  window.openSaveWorkoutSheet = openSaveWorkoutSheet;
  window.openSavedWorkoutsPicker = openSavedWorkoutsPicker;
  window.renderSavedWorkoutsSection = renderSavedWorkoutsSection;
  window.wireSavedWorkoutsActions = wireSavedWorkoutsActions;
  window.renameSavedWorkout = renameSavedWorkout;
  window.deleteSavedWorkout = deleteSavedWorkout;
  window._beginSavedWorkout = _beginSavedWorkout;
}
