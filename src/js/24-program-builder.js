// ============================================================
// CUSTOM PROGRAM BUILDER
// Multi-step wizard for building a program from scratch.
// Reuses openSheet/closeSheet (12-bottom-sheet.js) and updateUser (06-state-storage.js).
// ============================================================

let _builderState = null;
// shape: { name, daysPerWeek, totalWeeks, days: [ { id, name, blocks: [ { id, letter, name, exercises: [...] } ] } ] }
let _builderStep = 1;
let _builderEditingDayIdx = null;
let _builderEditingBlockId = null;
let _builderEqFilter = new Set();
let _builderMuscleFilter = new Set();

function openProgramBuilder() {
  const u = userData();
  if (u && u.draft) {
    if (!confirm("You have a workout in progress. Building a new program will discard it. Continue?")) return;
  }
  _builderState = { name: "My Program", daysPerWeek: 3, totalWeeks: 10, days: [] };
  _builderStep = 1;
  _builderEditingDayIdx = null;
  _builderEditingBlockId = null;
  _builderEqFilter = new Set();
  _builderMuscleFilter = new Set();
  _renderBuilderStep();
}

function _renderBuilderStep() {
  if (_builderStep === 1) return _renderBuilderStep1();
  if (_builderStep === 2) return _renderBuilderStep2();
  if (_builderStep === 3) return _renderBuilderStep3();
  if (_builderStep === 4) return _renderBuilderStep4();
}

function _initDays() {
  const n = _builderState.daysPerWeek;
  const old = _builderState.days || [];
  _builderState.days = Array.from({ length: n }, (_, i) =>
    old[i] || { id: i + 1, name: "Day " + (i + 1), blocks: [] }
  );
}

function _nextLetter(blocks) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[blocks.length] || ("B" + (blocks.length + 1));
}

// ---------- Step 1: Setup ----------
function _renderBuilderStep1() {
  const wrap = document.createElement("div");
  wrap.className = "builder-step";

  const head = document.createElement("h3");
  head.textContent = "Build Your Own";
  wrap.appendChild(head);

  const sub = document.createElement("p");
  sub.className = "step-sub";
  sub.textContent = "Step 1 of 2 — Setup";
  wrap.appendChild(sub);

  // Name input
  const nameLabel = document.createElement("p");
  nameLabel.style.cssText = "font-weight:700;font-size:14px;margin-bottom:6px;";
  nameLabel.textContent = "Program name";
  wrap.appendChild(nameLabel);

  const nameIn = document.createElement("input");
  nameIn.type = "text";
  nameIn.value = _builderState.name;
  nameIn.style.cssText = "width:100%;padding:10px 12px;border:2px solid var(--bg-card-2);border-radius:12px;background:var(--bg-card);color:var(--text);font-size:14px;font-weight:600;margin-bottom:14px;box-sizing:border-box;";
  nameIn.oninput = () => { _builderState.name = nameIn.value; };
  wrap.appendChild(nameIn);

  // Days per week
  const dLabel = document.createElement("p");
  dLabel.style.cssText = "font-weight:700;font-size:14px;margin-bottom:6px;";
  dLabel.textContent = "Days per week";
  wrap.appendChild(dLabel);

  const dGrid = document.createElement("div");
  dGrid.style.cssText = "display:flex;gap:8px;margin-bottom:14px;";
  for (let d = 2; d <= 6; d++) {
    const btn = document.createElement("button");
    btn.className = "schedule-day-btn" + (d === _builderState.daysPerWeek ? " selected" : "");
    btn.dataset.day = d;
    btn.textContent = d + "d";
    btn.style.cssText = "flex:1;padding:10px;font-size:14px;font-weight:700;";
    btn.onclick = () => {
      _builderState.daysPerWeek = d;
      dGrid.querySelectorAll("button").forEach(b => {
        b.classList.toggle("selected", parseInt(b.dataset.day) === d);
      });
    };
    dGrid.appendChild(btn);
  }
  wrap.appendChild(dGrid);

  // Total weeks
  const wLabel = document.createElement("p");
  wLabel.style.cssText = "font-weight:700;font-size:14px;margin-bottom:6px;";
  wLabel.textContent = "How many weeks?";
  wrap.appendChild(wLabel);

  const wGrid = document.createElement("div");
  wGrid.style.cssText = "display:flex;gap:8px;margin-bottom:16px;";
  [4, 8, 10, 12].forEach(wk => {
    const btn = document.createElement("button");
    btn.className = "schedule-day-btn" + (wk === _builderState.totalWeeks ? " selected" : "");
    btn.dataset.wk = wk;
    btn.textContent = wk + " wk";
    btn.style.cssText = "flex:1;padding:10px;font-size:14px;font-weight:700;";
    btn.onclick = () => {
      _builderState.totalWeeks = wk;
      wGrid.querySelectorAll("button").forEach(b => {
        b.classList.toggle("selected", parseInt(b.dataset.wk) === wk);
      });
    };
    wGrid.appendChild(btn);
  });
  wrap.appendChild(wGrid);

  // Actions
  const actions = document.createElement("div");
  actions.className = "sheet-actions";

  const cancel = document.createElement("button");
  cancel.textContent = "Cancel";
  cancel.onclick = () => { _builderState = null; closeSheet(); };

  const next = document.createElement("button");
  next.className = "primary";
  next.textContent = "Next →";
  next.onclick = () => {
    if (!_builderState.name.trim()) _builderState.name = "My Program";
    _initDays();
    _builderStep = 2;
    _renderBuilderStep();
  };

  actions.appendChild(cancel);
  actions.appendChild(next);
  wrap.appendChild(actions);

  openSheet(wrap);
}

// ---------- Step 2: Day list ----------
function _renderBuilderStep2() {
  const wrap = document.createElement("div");
  wrap.className = "builder-step";

  const head = document.createElement("h3");
  head.textContent = _builderState.name;
  wrap.appendChild(head);

  const sub = document.createElement("p");
  sub.className = "step-sub";
  sub.textContent = "Step 2 of 2 — Tap a day to add blocks and exercises";
  wrap.appendChild(sub);

  let canSave = _builderState.days.length > 0;
  _builderState.days.forEach((d, i) => {
    const totalEx = d.blocks.reduce((n, b) => n + b.exercises.length, 0);
    const dayHasContent = d.blocks.length > 0 && d.blocks.every(b => b.exercises.length > 0);
    if (!dayHasContent) canSave = false;

    const row = document.createElement("button");
    row.className = "builder-day-row";

    const left = document.createElement("div");
    left.style.cssText = "display:flex;flex-direction:column;gap:2px;";
    const nm = document.createElement("div");
    nm.style.cssText = "font-weight:700;font-size:14px;";
    nm.textContent = d.name;
    const meta = document.createElement("div");
    meta.style.cssText = "color:var(--text-dim);font-size:12px;";
    meta.textContent = d.blocks.length + " block" + (d.blocks.length === 1 ? "" : "s") + " · " + totalEx + " exercise" + (totalEx === 1 ? "" : "s");
    left.appendChild(nm);
    left.appendChild(meta);
    row.appendChild(left);

    const status = document.createElement("span");
    status.className = "builder-row-meta";
    status.textContent = dayHasContent ? "✓" : "edit →";
    if (dayHasContent) status.style.color = "var(--success)";
    row.appendChild(status);

    row.onclick = () => {
      _builderEditingDayIdx = i;
      _builderStep = 3;
      _renderBuilderStep();
    };
    wrap.appendChild(row);
  });

  // Rename helper
  const renameHint = document.createElement("p");
  renameHint.style.cssText = "color:var(--text-dim);font-size:11px;margin:4px 0 12px;";
  renameHint.innerHTML = '<a href="#" style="color:var(--accent);text-decoration:none;" id="builderRenameLink">Rename a day</a>';
  wrap.appendChild(renameHint);
  setTimeout(() => {
    const link = document.getElementById("builderRenameLink");
    if (link) link.onclick = (e) => {
      e.preventDefault();
      const idxStr = prompt("Rename which day? (1-" + _builderState.days.length + ")");
      const idx = parseInt(idxStr) - 1;
      if (isNaN(idx) || idx < 0 || idx >= _builderState.days.length) return;
      const newName = prompt("New name:", _builderState.days[idx].name);
      if (newName && newName.trim()) {
        _builderState.days[idx].name = newName.trim();
        _renderBuilderStep();
      }
    };
  }, 0);

  // Actions
  const actions = document.createElement("div");
  actions.className = "sheet-actions";

  const back = document.createElement("button");
  back.textContent = "← Back";
  back.onclick = () => { _builderStep = 1; _renderBuilderStep(); };

  const save = document.createElement("button");
  save.className = "primary";
  save.textContent = "Save Program";
  save.disabled = !canSave;
  if (!canSave) save.style.opacity = "0.5";
  save.onclick = () => { if (canSave) saveCustomProgram(); };

  actions.appendChild(back);
  actions.appendChild(save);
  wrap.appendChild(actions);

  openSheet(wrap);
}

// ---------- Step 3: Block editor for one day ----------
function _renderBuilderStep3() {
  const day = _builderState.days[_builderEditingDayIdx];
  if (!day) { _builderStep = 2; return _renderBuilderStep(); }

  const wrap = document.createElement("div");
  wrap.className = "builder-step";

  const head = document.createElement("h3");
  head.textContent = day.name;
  wrap.appendChild(head);

  const sub = document.createElement("p");
  sub.className = "step-sub";
  sub.textContent = "Add blocks and tap to fill with exercises";
  wrap.appendChild(sub);

  day.blocks.forEach((b, bi) => {
    const row = document.createElement("button");
    row.className = "builder-block-row";

    const letter = document.createElement("div");
    letter.style.cssText = "min-width:32px;height:32px;border-radius:10px;background:var(--accent);color:var(--bg-base);display:flex;align-items:center;justify-content:center;font-weight:900;";
    letter.textContent = b.letter;
    row.appendChild(letter);

    const left = document.createElement("div");
    left.style.cssText = "display:flex;flex-direction:column;gap:2px;flex:1;min-width:0;";
    const nm = document.createElement("div");
    nm.style.cssText = "font-weight:700;font-size:14px;";
    nm.textContent = b.name;
    const meta = document.createElement("div");
    meta.style.cssText = "color:var(--text-dim);font-size:12px;";
    meta.textContent = b.exercises.length + " exercise" + (b.exercises.length === 1 ? "" : "s");
    left.appendChild(nm);
    left.appendChild(meta);
    row.appendChild(left);

    const trash = document.createElement("span");
    trash.className = "builder-row-trash";
    trash.textContent = "✕";
    trash.style.cssText += ";display:flex;align-items:center;justify-content:center;";
    trash.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Remove " + b.name + "?")) {
        day.blocks.splice(bi, 1);
        _renderBuilderStep();
      }
    };
    row.appendChild(trash);

    row.onclick = () => {
      _builderEditingBlockId = b.id;
      _builderEqFilter = new Set();
      _builderMuscleFilter = new Set();
      _builderStep = 4;
      _renderBuilderStep();
    };
    wrap.appendChild(row);
  });

  // Add block
  const addBtn = document.createElement("button");
  addBtn.className = "builder-block-row";
  addBtn.style.cssText += ";justify-content:center;border-style:dashed;";
  addBtn.textContent = "+ Add Block";
  addBtn.onclick = () => {
    const letter = _nextLetter(day.blocks);
    day.blocks.push({
      id: "b" + Date.now(),
      letter,
      name: "Block " + letter,
      exercises: []
    });
    _renderBuilderStep();
  };
  wrap.appendChild(addBtn);

  // Actions
  const actions = document.createElement("div");
  actions.className = "sheet-actions";

  const done = document.createElement("button");
  done.className = "primary";
  done.textContent = "Done";
  done.onclick = () => { _builderStep = 2; _renderBuilderStep(); };

  actions.appendChild(done);
  wrap.appendChild(actions);

  openSheet(wrap);
}

// ---------- Step 4: Exercise picker ----------
function _renderBuilderStep4() {
  const day = _builderState.days[_builderEditingDayIdx];
  if (!day) { _builderStep = 2; return _renderBuilderStep(); }
  const block = day.blocks.find(b => b.id === _builderEditingBlockId);
  if (!block) { _builderStep = 3; return _renderBuilderStep(); }

  const wrap = document.createElement("div");
  wrap.className = "builder-step";

  const head = document.createElement("h3");
  head.textContent = day.name + " · " + block.name;
  wrap.appendChild(head);

  const sub = document.createElement("p");
  sub.className = "step-sub";
  sub.id = "builderBlockCount";
  sub.textContent = block.exercises.length + " exercise" + (block.exercises.length === 1 ? "" : "s") + " added";
  wrap.appendChild(sub);

  // Equipment chips
  const eqSection = document.createElement("div");
  eqSection.className = "builder-filter-section";
  const eqLabel = document.createElement("div");
  eqLabel.className = "builder-filter-label";
  eqLabel.textContent = "Equipment";
  eqSection.appendChild(eqLabel);
  const eqChips = document.createElement("div");
  eqChips.className = "builder-filter-chips";
  EQUIPMENT_TAGS.forEach(tag => {
    const chip = document.createElement("button");
    chip.className = "builder-filter-chip" + (_builderEqFilter.has(tag) ? " selected" : "");
    chip.textContent = tag;
    chip.onclick = () => {
      if (_builderEqFilter.has(tag)) _builderEqFilter.delete(tag);
      else _builderEqFilter.add(tag);
      chip.classList.toggle("selected");
      _refreshBuilderResults();
    };
    eqChips.appendChild(chip);
  });
  eqSection.appendChild(eqChips);
  wrap.appendChild(eqSection);

  // Muscle chips
  const muscleSet = Array.from(new Set(LIBRARY.flatMap(e => e.muscles))).sort();
  const mSection = document.createElement("div");
  mSection.className = "builder-filter-section";
  const mLabel = document.createElement("div");
  mLabel.className = "builder-filter-label";
  mLabel.textContent = "Muscle";
  mSection.appendChild(mLabel);
  const mChips = document.createElement("div");
  mChips.className = "builder-filter-chips";
  muscleSet.forEach(m => {
    const chip = document.createElement("button");
    chip.className = "builder-filter-chip" + (_builderMuscleFilter.has(m) ? " selected" : "");
    chip.textContent = m;
    chip.onclick = () => {
      if (_builderMuscleFilter.has(m)) _builderMuscleFilter.delete(m);
      else _builderMuscleFilter.add(m);
      chip.classList.toggle("selected");
      _refreshBuilderResults();
    };
    mChips.appendChild(chip);
  });
  mSection.appendChild(mChips);
  wrap.appendChild(mSection);

  // Results container
  const results = document.createElement("div");
  results.id = "builderResults";
  results.style.cssText = "max-height:50vh;overflow-y:auto;margin-top:8px;";
  wrap.appendChild(results);

  // Actions
  const actions = document.createElement("div");
  actions.className = "sheet-actions";

  const done = document.createElement("button");
  done.className = "primary";
  done.textContent = "Done";
  done.onclick = () => { _builderStep = 3; _renderBuilderStep(); };

  actions.appendChild(done);
  wrap.appendChild(actions);

  openSheet(wrap);
  _refreshBuilderResults();
}

function _refreshBuilderResults() {
  const container = document.getElementById("builderResults");
  if (!container) return;
  container.innerHTML = "";

  const day = _builderState.days[_builderEditingDayIdx];
  const block = day && day.blocks.find(b => b.id === _builderEditingBlockId);
  if (!block) return;

  const filtered = LIBRARY.filter(e => {
    if (_builderEqFilter.size && (!e.equipment || !e.equipment.some(t => _builderEqFilter.has(t)))) return false;
    if (_builderMuscleFilter.size && !e.muscles.some(m => _builderMuscleFilter.has(m))) return false;
    return true;
  });

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.style.cssText = "color:var(--text-dim);font-size:13px;text-align:center;padding:20px;";
    empty.textContent = "No exercises match these filters";
    container.appendChild(empty);
    return;
  }

  filtered.forEach(e => {
    const row = document.createElement("div");
    row.className = "builder-ex-row";

    const left = document.createElement("div");
    left.style.cssText = "display:flex;flex-direction:column;gap:2px;flex:1;min-width:0;";
    const nm = document.createElement("div");
    nm.className = "ex-name";
    nm.textContent = e.name;
    const meta = document.createElement("div");
    meta.className = "ex-meta";
    const muscles = e.muscles.slice(0, 2).join(", ");
    meta.textContent = muscles + " · " + e.defaultSets + "×" + e.defaultReps;
    left.appendChild(nm);
    left.appendChild(meta);
    row.appendChild(left);

    const add = document.createElement("button");
    add.className = "builder-ex-add";
    add.textContent = "+";
    add.onclick = (ev) => {
      ev.stopPropagation();
      block.exercises.push({
        exId: e.id,
        name: e.name,
        muscles: [...e.muscles],
        cat: e.cat,
        sets: e.defaultSets,
        reps: e.defaultReps,
        rest: e.defaultRest,
        defaultWeight: e.defaultWeight ?? 0,
        bodyweight: !!e.bodyweight,
        perSide: !!e.perSide,
        isTime: !!e.isTime,
        isDistance: !!e.isDistance,
        noRpe: !!e.noRpe,
        tempo: "",
        notes: ""
      });
      const cnt = document.getElementById("builderBlockCount");
      if (cnt) cnt.textContent = block.exercises.length + " exercise" + (block.exercises.length === 1 ? "" : "s") + " added";
      // Brief visual confirmation
      add.textContent = "✓";
      add.style.background = "var(--success)";
      add.style.borderColor = "var(--success)";
      setTimeout(() => {
        add.textContent = "+";
        add.style.background = "var(--accent)";
        add.style.borderColor = "var(--accent)";
      }, 400);
    };
    row.appendChild(add);
    container.appendChild(row);
  });
}

// ---------- Save ----------
function saveCustomProgram() {
  const b = _builderState;
  updateUser(u => {
    u.templateId = "custom";
    u.program = b.days.map(d => ({ id: d.id, name: d.name, sub: "", blocks: d.blocks }));
    u.daysPerWeek = b.daysPerWeek;
    u.totalWeeks = b.totalWeeks;
    u.currentWeek = 1;
    u.programStartDate = Date.now();
    u.weeklySchedule = null;
    u.draft = null;
    u.lastDoneDayId = null;
  });
  // Mirror applyProgramSwitch() side effects (19-program-picker.js)
  if (typeof stopSessionTimer === "function") stopSessionTimer();
  state.workoutStartedAt = null;
  state.currentDayId = 1;
  state.dayChosen = false;
  _builderState = null;
  _builderStep = 1;
  closeSheet();
  if (typeof renderProgramPicker === "function") renderProgramPicker();
  if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
  showToast("Custom program saved", "success");
}
