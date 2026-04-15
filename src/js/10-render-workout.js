// ============================================================
// RENDER: Workout
// ============================================================

// Default cooldown exercises rendered as a virtual block
const COOLDOWN_EXERCISES = [
  { exId: "hipflexorstretch", name: "Hip Flexor Stretch", muscles: ["hip flexors"], isTime: true, perSide: true, reps: 45 },
  { exId: "hamstringstretch", name: "Hamstring Stretch", muscles: ["hamstrings"], isTime: true, reps: 45 },
  { exId: "thoracicrot", name: "Thoracic Rotation", muscles: ["thoracic", "upper back"], perSide: true, reps: 8 },
  { exId: "pigeonpose", name: "Pigeon Pose", muscles: ["hips", "glutes"], isTime: true, perSide: true, reps: 60 },
  { exId: "childpose", name: "Child's Pose", muscles: ["shoulders", "hips", "thoracic"], isTime: true, reps: 60 },
];

function renderWorkoutScreen() {
  const container = document.getElementById("blocksContainer");
  const u = userData();

  if (!u) {
    document.getElementById("dayBadge").textContent = "–";
    document.getElementById("dayName").textContent = "No user yet";
    document.getElementById("daySub").textContent = "Tap the user chip to create one";
    container.innerHTML = "";
    updateFinishButton();
    return;
  }

  // Show day picker if user hasn't chosen a workout yet (and no draft in progress)
  if (!state.dayChosen && !getDraft()) {
    renderTimelineStrip();
    renderDayPicker();
    return;
  }

  const day = getCurrentDay();
  if (!day) { container.innerHTML = ""; updateFinishButton(); return; }

  const badge = document.getElementById("dayBadge");
  badge.textContent = day.id;
  document.getElementById("dayName").textContent = day.name;
  document.getElementById("daySub").textContent = day.sub || "";

  // Color Zones: day-bar badge gradient from muscle groups
  const dayColors = [];
  day.blocks.forEach(b => b.exercises.forEach(e => {
    if (e.isWarmup) return;
    const g = groupMuscle((e.muscles || [])[0]);
    const c = g && GROUP_COLORS[g];
    if (c && !dayColors.includes(c)) dayColors.push(c);
  }));
  if (dayColors.length >= 2) {
    badge.style.background = `linear-gradient(135deg, ${dayColors.slice(0,3).join(', ')})`;
    badge.style.color = '#fff';
  } else if (dayColors.length === 1) {
    badge.style.background = dayColors[0]; badge.style.color = '#fff';
  } else {
    badge.style.background = ''; badge.style.color = '';
  }

  renderTimelineStrip();

  container.innerHTML = "";
  day.blocks.forEach((block, bi) => {
    container.appendChild(renderBlock(day, block, bi));
  });

  // Always show cooldown block at end of workout
  container.appendChild(renderCooldownBlock());

  // Staggered card entrance
  container.querySelectorAll(".exercise-card").forEach((card, i) => {
    card.style.setProperty("--card-index", i);
  });

  updateFinishButton();
  updateProgress();
  updatePaceChip();
}

function renderDayPicker() {
  const container = document.getElementById("blocksContainer");
  const u = userData();
  if (!u) return;

  document.getElementById("dayBadge").textContent = "⊞";
  document.getElementById("dayName").textContent = "Choose Your Workout";
  document.getElementById("daySub").textContent = "Pick a workout type to get started";

  // Hide start/finish buttons
  document.getElementById("startBtn").style.display = "none";
  document.getElementById("finishBtn").style.display = "none";
  document.getElementById("headerStartBtn").classList.remove("active");
  document.getElementById("headerFinishBtn").classList.remove("active");

  container.innerHTML = "";

  // Program template tabs
  const tabs = document.createElement("div");
  tabs.className = "program-tabs";
  PROGRAM_TEMPLATES.forEach(tpl => {
    const tab = document.createElement("div");
    tab.className = "program-tab" + (tpl.id === u.templateId ? " active" : "");
    tab.innerHTML = `<div class="ptab-badge">${tpl.days.length}d</div><div class="ptab-name">${tpl.name}</div>`;
    tab.onclick = () => {
      if (tpl.id === u.templateId) return;
      if (!confirm(`Switch to ${tpl.name}? Your current program edits will be replaced.`)) return;
      // Structured programs get the schedule picker flow
      if (tpl.totalWeeks) {
        openSchedulePicker(tpl);
        return;
      }
      updateUser(usr => {
        usr.templateId = tpl.id;
        usr.program = deepClone(tpl.days);
        usr.draft = null;
        usr.lastDoneDayId = null;
        usr.programStartDate = null;
        usr.weeklySchedule = null;
      });
      stopSessionTimer();
      state.workoutStartedAt = null;
      state.currentDayId = 1;
      renderDayPicker();
      showToast(`Switched to ${tpl.name}`, "success");
    };
    tabs.appendChild(tab);
  });
  container.appendChild(tabs);

  // Day cards
  const next = determineDefaultDay();
  const picker = document.createElement("div");
  picker.className = "day-picker";

  u.program.forEach(d => {
    const card = document.createElement("div");
    card.className = "day-picker-card" + (d.id === next ? " recommended" : "");

    let html = "";
    if (d.id === next) html += `<div class="picker-rec">Recommended — next in rotation</div>`;
    html += `<div class="picker-label">${d.name}</div>`;
    html += `<div class="picker-sub">${d.sub || ""}</div>`;
    html += `<div class="picker-blocks">`;
    d.blocks.forEach(b => {
      html += `<span class="picker-block-tag">${b.letter} ${b.name}</span>`;
    });
    html += `</div>`;
    html += `<div class="picker-duration">⏱ ~${estimateSessionMinutes(d)} min</div>`;
    card.innerHTML = html;

    card.onclick = () => {
      state.currentDayId = d.id;
      state.dayChosen = true;
      renderWorkoutScreen();
    };
    picker.appendChild(card);
  });

  container.appendChild(picker);
}

function renderBlock(day, block, bi) {
  const wrap = document.createElement("div");
  const isSuperset = block.exercises.length > 1;

  const hdr = document.createElement("div");
  hdr.className = "block-header";
  hdr.innerHTML = `
    <div class="block-letter ${isSuperset ? 'superset' : ''}">${block.letter}</div>
    <div class="block-title">${block.name}${isSuperset ? ' <span style="color:var(--superset);">· Superset</span>' : ''}</div>
  `;
  if (state.editMode) {
    const menu = document.createElement("button");
    menu.className = "block-menu";
    menu.textContent = "⋯";
    menu.onclick = () => openBlockMenu(block);
    hdr.appendChild(menu);
  }
  wrap.appendChild(hdr);

  // Block-level note input (per-session, stored in draft)
  const noteKey = `${block.id}|__note`;
  const noteVal = getInput(noteKey, "");
  const noteInput = document.createElement("input");
  noteInput.type = "text";
  noteInput.className = "block-note-input";
  noteInput.placeholder = "Add a note…";
  noteInput.value = noteVal;
  noteInput.addEventListener("click", e => e.stopPropagation());
  noteInput.addEventListener("change", () => saveInput(noteKey, noteInput.value));
  wrap.appendChild(noteInput);

  block.exercises.forEach((ex, ei) => {
    wrap.appendChild(renderExercise(day, block, ex, bi, ei, isSuperset));
  });

  if (state.editMode) {
    const addEx = document.createElement("button");
    addEx.className = "add-ex-row";
    addEx.textContent = "+ Add exercise to this block";
    addEx.onclick = () => openLibrary(block.id);
    wrap.appendChild(addEx);
  }

  return wrap;
}

function renderCooldownBlock() {
  const BLOCK_ID = "__cooldown";
  const skipKey = `${BLOCK_ID}|skipped`;
  const noteKey = `${BLOCK_ID}|__note`;
  const isSkipped = getInput(skipKey, false);

  const wrap = document.createElement("div");
  wrap.className = "cooldown-block";

  // Header
  const hdr = document.createElement("div");
  hdr.className = "block-header";

  const letter = document.createElement("div");
  letter.className = "block-letter cooldown-letter";
  letter.textContent = "CD";
  hdr.appendChild(letter);

  const title = document.createElement("div");
  title.className = "block-title";
  title.textContent = "Cool Down";
  hdr.appendChild(title);

  const skipBtn = document.createElement("button");
  skipBtn.className = "block-skip-btn" + (isSkipped ? " active" : "");
  skipBtn.textContent = isSkipped ? "Skipped" : "Skip";
  skipBtn.onclick = (e) => {
    e.stopPropagation();
    saveInput(skipKey, isSkipped ? null : true);
    renderWorkoutScreen();
  };
  hdr.appendChild(skipBtn);
  wrap.appendChild(hdr);

  // Block note input
  const noteVal = getInput(noteKey, "");
  const noteInput = document.createElement("input");
  noteInput.type = "text";
  noteInput.className = "block-note-input";
  noteInput.placeholder = "Add a note…";
  noteInput.value = noteVal;
  noteInput.addEventListener("click", e => e.stopPropagation());
  noteInput.addEventListener("change", () => saveInput(noteKey, noteInput.value));
  wrap.appendChild(noteInput);

  if (isSkipped) {
    const msg = document.createElement("div");
    msg.className = "cooldown-skipped-msg";
    msg.textContent = "Cool-down skipped";
    wrap.appendChild(msg);
  } else {
    COOLDOWN_EXERCISES.forEach(ex => {
      const card = document.createElement("div");
      card.className = "exercise-card";

      const head = document.createElement("div");
      head.className = "ex-head";

      const info = document.createElement("div");
      info.className = "ex-info";

      const name = document.createElement("div");
      name.className = "ex-name";
      name.textContent = ex.name;
      info.appendChild(name);

      const meta = document.createElement("div");
      meta.className = "ex-meta";
      (ex.muscles || []).forEach(m => {
        const t = document.createElement("span");
        t.className = "tag muscle";
        t.textContent = m;
        meta.appendChild(t);
      });
      if (ex.reps) {
        const t = document.createElement("span");
        t.className = "tag rest";
        t.textContent = ex.isTime ? `${ex.reps}s${ex.perSide ? "/side" : ""}` : `${ex.reps} reps${ex.perSide ? "/side" : ""}`;
        meta.appendChild(t);
      }
      info.appendChild(meta);
      head.appendChild(info);

      const libRef = LIB_BY_ID[ex.exId];
      if (libRef && libRef.demoUrl) {
        const demoBtn = document.createElement("button");
        demoBtn.className = "ex-demo-btn";
        demoBtn.textContent = "▶";
        demoBtn.title = "Watch demo";
        demoBtn.onclick = (e) => { e.stopPropagation(); window.open(libRef.demoUrl, "_blank"); };
        head.appendChild(demoBtn);
      }

      card.appendChild(head);

      const actions = document.createElement("div");
      actions.className = "sets-wrap";
      const doneBtn = document.createElement("button");
      doneBtn.className = "action-btn";
      doneBtn.style.cssText = "width:100%; padding:10px;";
      doneBtn.textContent = "Mark done";
      doneBtn.onclick = () => {
        doneBtn.classList.toggle("success");
        doneBtn.textContent = doneBtn.classList.contains("success") ? "✓ Done" : "Mark done";
        if (navigator.vibrate) navigator.vibrate(10);
      };
      actions.appendChild(doneBtn);
      card.appendChild(actions);

      wrap.appendChild(card);
    });
  }

  return wrap;
}

function renderExercise(day, block, ex, bi, ei, isSuperset) {
  const card = document.createElement("div");
  card.className = "exercise-card" + (isSuperset ? " in-superset" : "");
  card.dataset.bi = bi;
  card.dataset.ei = ei;
  card.dataset.warmup = String(!!ex.isWarmup);
  // Color Zones: muscle-group left border
  if (!isSuperset) {
    const mColor = primaryMuscleColor(ex.muscles);
    if (mColor) card.style.borderLeft = '3px solid ' + mColor;
  }
  if (state.sidebarOpen && state.sidebarSelectedEx) {
    card.classList.add("swap-target");
  }
  card.addEventListener("click", (e) => {
    if (e.target.closest("button, input, [contenteditable]")) return;
    if (onWorkoutCardTapForSwap(bi, ei)) e.stopPropagation();
  });

  // Head
  const head = document.createElement("div");
  head.className = "ex-head";

  const info = document.createElement("div");
  info.className = "ex-info";
  const name = document.createElement("div");
  name.className = "ex-name";
  name.textContent = ex.name;
  if (state.editMode) {
    name.contentEditable = "true";
    name.onblur = () => {
      mutateDay(d => { d.blocks[bi].exercises[ei].name = name.textContent.trim() || ex.name; });
    };
  }
  info.appendChild(name);

  const meta = document.createElement("div");
  meta.className = "ex-meta";
  (ex.muscles || []).forEach(m => {
    const t = document.createElement("span");
    t.className = "tag muscle";
    t.textContent = m;
    const mc = GROUP_COLORS[groupMuscle(m)];
    if (mc) { t.style.background = mc + '22'; t.style.color = mc; }
    meta.appendChild(t);
  });
  if (ex.tempo) {
    const t = document.createElement("span");
    t.className = "tag tempo";
    t.textContent = ex.tempo;
    meta.appendChild(t);
  }
  if (ex.rest) {
    const t = document.createElement("span");
    t.className = "tag rest";
    t.textContent = `rest ${formatRest(ex.rest)}`;
    meta.appendChild(t);
  }
  // Injury flag: warn if exercise conflicts with user's reported injury history
  const _warnedExIds = getInjuryWarnings();
  if (ex.exId && _warnedExIds.has(ex.exId)) {
    const t = document.createElement("span");
    t.className = "tag injury-warn";
    t.title = "May need modification — injury flag active";
    t.textContent = "⚠ modify";
    meta.appendChild(t);
  }
  info.appendChild(meta);
  head.appendChild(info);

  const swapBtn = document.createElement("button");
  swapBtn.className = "ex-swap-btn";
  swapBtn.textContent = "⇄";
  swapBtn.title = "Swap exercise";
  swapBtn.onclick = (e) => {
    e.stopPropagation();
    const libEx = LIB_BY_ID[ex.exId];
    const cat = libEx ? libEx.cat : (block.type === "warmup" ? "Warmup" : null);
    openSidebar(cat, bi, ei);
  };
  head.appendChild(swapBtn);

  // Demo video link
  const libRef = LIB_BY_ID[ex.exId];
  const demoUrl = libRef && libRef.demoUrl;
  if (demoUrl) {
    const demoBtn = document.createElement("button");
    demoBtn.className = "ex-demo-btn";
    demoBtn.textContent = "▶";
    demoBtn.title = "Watch demo";
    demoBtn.onclick = (e) => {
      e.stopPropagation();
      window.open(demoUrl, "_blank");
    };
    head.appendChild(demoBtn);
  }

  const menuBtn = document.createElement("button");
  menuBtn.className = "ex-menu-btn";
  menuBtn.textContent = "⋯";
  menuBtn.onclick = () => openExerciseMenu(block, ex, bi, ei);
  head.appendChild(menuBtn);
  card.appendChild(head);

  if (ex.notes) {
    const n = document.createElement("div");
    n.className = "ex-notes";
    n.textContent = ex.notes;
    card.appendChild(n);
  }

  // Sets
  if (!ex.isWarmup) {
    card.appendChild(renderSetsTable(block, ex, bi, ei));
    // Per-exercise mini progress bar
    const miniProg = document.createElement("div");
    miniProg.className = "ex-progress-bar";
    const numSets = ex.sets || 3;
    let exDone = 0;
    for (let i = 0; i < numSets; i++) {
      if (getInput(inputKey(block.id, ei, i, "status"), null) === "done") exDone++;
    }
    const exPct = numSets > 0 ? (exDone / numSets) * 100 : 0;
    miniProg.style.setProperty("--ex-pct", exPct + "%");
    if (exPct === 100 && exDone > 0) miniProg.classList.add("complete");
    card.appendChild(miniProg);
  } else {
    // Warmup: just a checkbox-style marker
    const n = document.createElement("div");
    n.className = "sets-wrap";
    n.innerHTML = `<button class="action-btn" style="width:100%; padding:10px;" onclick="this.classList.toggle('success'); this.textContent = this.classList.contains('success') ? '✓ Warm-up done' : 'Mark warm-up done';">Mark warm-up done</button>`;
    card.appendChild(n);
  }

  return card;
}

function renderSetsTable(block, ex, bi, ei) {
  const bw = ex.bodyweight;
  const wrap = document.createElement("div");
  wrap.className = "sets-wrap";

  const header = document.createElement("div");
  header.className = "sets-header" + (bw ? " bw" : "");
  const repsLabel = ex.isTime ? "Time (s)" : ex.isDistance ? "Dist (m)" : "Reps";
  header.innerHTML = bw
    ? `<div>#</div><div>${repsLabel}</div><div>RPE</div><div></div>`
    : `<div>#</div><div>Wt (${state.unit})</div><div>${repsLabel}</div><div>RPE</div><div></div>`;
  wrap.appendChild(header);

  const last = getLastSetsFor(ex.exId || ex.name);
  const numSets = ex.sets || 3;

  for (let i = 0; i < numSets; i++) {
    const lastSet = last[i] || last[last.length - 1];
    const row = document.createElement("div");
    row.className = "set-row" + (bw ? " bw" : "");

    const wkey = inputKey(block.id, ei, i, "w");
    const rkey = inputKey(block.id, ei, i, "r");
    const pkey = inputKey(block.id, ei, i, "p");

    const curW = getInput(wkey, lastSet?.weight ?? ex.defaultWeight ?? 0);
    const curR = getInput(rkey, lastSet?.reps ?? ex.reps);
    const curP = getInput(pkey, 7);

    const step = state.unit === "lbs" ? 5 : 2.5;

    row.innerHTML = `
      <div class="set-num">${i+1}</div>
      ${bw ? "" : `<div class="num-input-wrap">
        <button class="step" data-step="${-step}">−</button>
        <input type="number" class="weight-in" value="${curW}" min="0" step="${step}" data-key="${wkey}">
        <button class="step" data-step="${step}">+</button>
      </div>`}
      <div class="num-input-wrap">
        <button class="step" data-step="-1">−</button>
        <input type="number" class="reps-in" value="${curR}" min="0" data-key="${rkey}">
        <button class="step" data-step="1">+</button>
      </div>
      <div class="rpe-cell">
        <input type="range" class="rpe-in" min="1" max="10" step="0.5" value="${curP}" data-key="${pkey}">
        <div class="rpe-val">${curP}</div>
      </div>
      <button class="rm-set-btn" title="Remove set">×</button>
    `;
    wireRow(row, block, ex, bi, ei, i, bw);
    wrap.appendChild(row);
  }

  // Add set button
  const addWrap = document.createElement("div");
  addWrap.className = "add-set-row";
  const addBtn = document.createElement("button");
  addBtn.className = "add-set-btn";
  addBtn.textContent = "+ Add set";
  addBtn.onclick = () => {
    mutateDay(d => { d.blocks[bi].exercises[ei].sets++; });
    renderWorkoutScreen();
  };
  addWrap.appendChild(addBtn);
  wrap.appendChild(addWrap);

  return wrap;
}

function wireRow(row, block, ex, bi, ei, i, bw) {
  row.querySelectorAll(".step").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const step = parseFloat(btn.dataset.step);
      const input = btn.parentElement.querySelector("input");
      const newVal = Math.max(0, parseFloat(input.value || 0) + step);
      input.value = newVal;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
  });
  row.querySelectorAll("input[data-key]").forEach(inp => {
    inp.oninput = () => {
      saveInput(inp.dataset.key, parseFloat(inp.value) || 0);
      if (inp.classList.contains("rpe-in")) {
        row.querySelector(".rpe-val").textContent = inp.value;
      }
    };
  });
  row.querySelector(".rm-set-btn").onclick = () => {
    if (ex.sets <= 1) {
      showToast("Can't remove last set");
      return;
    }
    mutateDay(d => { d.blocks[bi].exercises[ei].sets--; });
    renderWorkoutScreen();
  };

  // Swipe gestures: right = done, left = skipped
  const statusKey = inputKey(block.id, ei, i, "status");
  const curStatus = getInput(statusKey, null);
  if (curStatus === "done") row.classList.add("set-done");
  if (curStatus === "skipped") row.classList.add("set-skipped");

  let swStartX = 0, swStartY = 0, isSwiping = false;
  row.addEventListener("touchstart", (e) => {
    if (!state.workoutStartedAt) return;
    swStartX = e.touches[0].clientX;
    swStartY = e.touches[0].clientY;
    isSwiping = false;
  }, { passive: true });
  row.addEventListener("touchmove", (e) => {
    if (!state.workoutStartedAt) return;
    const dx = e.touches[0].clientX - swStartX;
    const dy = e.touches[0].clientY - swStartY;
    if (!isSwiping && Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 1.5) isSwiping = true;
    if (isSwiping) {
      e.preventDefault();
      row.style.transition = "none";
      row.style.transform = `translateX(${Math.max(-80, Math.min(80, dx))}px)`;
    }
  }, { passive: false });
  row.addEventListener("touchend", (e) => {
    if (!isSwiping) return;
    const dx = e.changedTouches[0].clientX - swStartX;
    row.style.transition = "transform 0.15s ease-out";
    row.style.transform = "";
    if (dx > 60) {
      const was = row.classList.contains("set-done");
      row.classList.remove("set-done", "set-skipped");
      if (!was) row.classList.add("set-done");
      saveInput(statusKey, was ? null : "done");
      if (navigator.vibrate) navigator.vibrate(10);
    } else if (dx < -60) {
      const was = row.classList.contains("set-skipped");
      row.classList.remove("set-done", "set-skipped");
      if (!was) row.classList.add("set-skipped");
      saveInput(statusKey, was ? null : "skipped");
      if (navigator.vibrate) navigator.vibrate(10);
    }
    setTimeout(() => { row.style.transition = ""; }, 160);
  }, { passive: true });
}