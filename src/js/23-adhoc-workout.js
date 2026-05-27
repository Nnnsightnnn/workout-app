// ============================================================
// AD-HOC QUICK WORKOUT
// ============================================================
// One-off sessions outside the structured program.
// Saves to u.sessions[] with isAdhoc:true. Does NOT advance
// program day rotation or modify u.program.

function openAdhocWorkout() {
  // If already in an ad-hoc session, go back to it
  if (state.adhocActive) {
    showScreen("workout");
    return;
  }

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">Quick Workout</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close" style="width:36px;height:36px;border-radius:10px;">✕</button>
    </div>
    <p style="color:var(--text-dim);font-size:12px;margin-bottom:14px;">
      Log a one-off session. Won't affect your program rotation.
    </p>
  `;

  // Custom activity input
  const customRow = document.createElement("div");
  customRow.className = "adhoc-custom-row";
  customRow.innerHTML = `
    <div class="section-title" style="margin-top:0;">Custom Activity</div>
    <div class="adhoc-custom-input-row">
      <input type="text" id="adhocCustomName" class="name-input" placeholder="e.g. Bike, Basketball, Yoga…" autocomplete="off" style="flex:1;">
      <button class="action-btn primary" id="adhocCustomStart" style="white-space:nowrap;">Start</button>
    </div>
  `;
  wrap.appendChild(customRow);

  // Library picker
  const libSection = document.createElement("div");
  libSection.innerHTML = `<div class="section-title">Or pick from the library</div>`;

  const search = document.createElement("input");
  search.className = "lib-search";
  search.placeholder = "Search exercises\u2026";
  libSection.appendChild(search);

  const catRow = document.createElement("div");
  catRow.className = "lib-cat";
  const allCats = ["All", ...CATEGORIES];
  let activeCat = "All";
  allCats.forEach(cat => {
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

  // Selected exercises list
  const selectedExercises = [];
  const selectedWrap = document.createElement("div");
  selectedWrap.id = "adhocSelectedList";
  selectedWrap.style.display = "none";
  selectedWrap.innerHTML = `<div class="section-title">Selected exercises</div>`;
  const selectedList = document.createElement("div");
  selectedList.className = "adhoc-selected-exercises";
  selectedWrap.appendChild(selectedList);

  const startSelectedBtn = document.createElement("button");
  startSelectedBtn.className = "action-btn primary";
  startSelectedBtn.style.cssText = "width:100%;margin-top:10px;padding:14px;font-weight:700;";
  startSelectedBtn.textContent = "Start Workout";
  startSelectedBtn.onclick = () => {
    closeSheet();
    _beginAdhocSession(null, selectedExercises);
  };
  selectedWrap.appendChild(startSelectedBtn);

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
      };
      selectedList.appendChild(row);
    });
    startSelectedBtn.textContent = "Start Workout (" + selectedExercises.length + " exercise" + (selectedExercises.length === 1 ? "" : "s") + ")";
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

  // Wire custom activity start
  setTimeout(() => {
    const customInput = document.getElementById("adhocCustomName");
    const customBtn = document.getElementById("adhocCustomStart");
    if (customInput && customBtn) {
      customBtn.onclick = () => {
        const name = customInput.value.trim();
        if (!name) { customInput.focus(); return; }
        closeSheet();
        _beginAdhocSession(name, []);
      };
      customInput.addEventListener("keydown", e => {
        if (e.key === "Enter") customBtn.click();
      });
    }
  }, 10);

  openSheet(wrap);
}

function _beginAdhocSession(customName, exercises) {
  // Build a synthetic day structure for the ad-hoc workout
  const blocks = [];

  if (exercises && exercises.length) {
    // Group selected exercises into a single block
    const blockExercises = exercises.map(e => mkSets(e));
    blocks.push({
      id: "adhoc-block-1",
      letter: "A",
      name: customName || "Quick Workout",
      exercises: blockExercises
    });
  }

  // Store the ad-hoc day in state (not in u.program)
  state.adhocActive = true;
  state.adhocDay = {
    id: "adhoc",
    name: customName || "Quick Workout",
    sub: "Ad-hoc session",
    blocks: blocks
  };
  state.adhocCustomName = customName || null;
  state.adhocExercises = exercises ? exercises.slice() : [];
  state.adhocStartedAt = Date.now();
  state.adhocInputs = {};

  // Set up the workout screen for ad-hoc mode
  state.dayChosen = true;
  state.workoutView = "chapters";

  renderAdhocScreen();
}

function _getAdhocDay() {
  return state.adhocDay || null;
}

function renderAdhocScreen() {
  if (!state.adhocActive) return;

  const container = document.getElementById("blocksContainer");
  const badge = document.getElementById("dayBadge");
  if (badge) badge.textContent = "+";
  const dayName = document.getElementById("dayName");
  if (dayName) dayName.textContent = state.adhocDay.name;
  const daySub = document.getElementById("daySub");
  if (daySub) daySub.textContent = "Ad-hoc \u00b7 won't affect program";

  // Hide program-only chrome from the workout screen \u2014 these refer to the
  // user's scheduled program (week strip, weekly progress, sticky stats bar)
  // and bleed visually into an imported / ad-hoc session.
  const tStrip = document.getElementById("timelineStrip");
  if (tStrip) tStrip.style.display = "none";
  const sCard = document.getElementById("stampCard");
  if (sCard) sCard.style.display = "none";
  const sEst = document.getElementById("sessionEstRow");
  if (sEst) sEst.style.display = "none";

  // Hide normal start/finish
  const startBtn = document.getElementById("headerStartBtn");
  if (startBtn) startBtn.classList.remove("active");

  // Start the session timer
  if (!state.workoutStartedAt) {
    state.workoutStartedAt = state.adhocStartedAt;
    startSessionTimer();
  }

  container.innerHTML = "";

  const paperOn = (typeof isPaperSkin === "function" && isPaperSkin());

  const wrap = document.createElement("div");
  wrap.className = paperOn ? "adhoc-paper-wrap" : "adhoc-workout-wrap";

  // If we have exercises, render them
  if (state.adhocDay.blocks.length > 0) {
    state.adhocDay.blocks.forEach((block, bi) => {
      if (paperOn) {
        wrap.appendChild(_renderAdhocPaperBlock(block, bi));
      } else {
        // Legacy chunky path \u2014 kept as fallback; paper skin is unconditional today.
        const hdr = document.createElement("div");
        hdr.className = "block-header";
        hdr.innerHTML = `
          <div class="block-letter">${block.letter}</div>
          <div class="block-title">${block.name}</div>
        `;
        wrap.appendChild(hdr);
        block.exercises.forEach((ex, ei) => {
          wrap.appendChild(_renderAdhocExercise(block, ex, bi, ei));
        });
      }
    });
  }

  // Custom activity time logger (for cardio/activities without structured sets)
  if (state.adhocCustomName && state.adhocDay.blocks.length === 0) {
    const actCard = document.createElement("div");
    actCard.className = "adhoc-activity-card";

    const actTitle = document.createElement("div");
    actTitle.className = "adhoc-activity-title";
    actTitle.textContent = state.adhocCustomName;
    actCard.appendChild(actTitle);

    const actSub = document.createElement("div");
    actSub.className = "adhoc-activity-sub";
    actSub.textContent = "Log time, distance, or notes for this activity";
    actCard.appendChild(actSub);

    // Duration input
    const durRow = document.createElement("div");
    durRow.className = "adhoc-field-row";
    durRow.innerHTML = `
      <div class="field">
        <label>Duration (min)</label>
        <div class="num-input-wrap" style="height:38px;">
          <button class="step" data-f="adhocDur" data-s="-5">\u2212</button>
          <input type="number" id="adhocDuration" value="${state.adhocInputs.duration || 30}" min="0">
          <button class="step" data-f="adhocDur" data-s="5">+</button>
        </div>
      </div>
      <div class="field">
        <label>Distance</label>
        <input type="text" id="adhocDistance" value="${state.adhocInputs.distance || ''}" placeholder="e.g. 5 km">
      </div>
    `;
    actCard.appendChild(durRow);

    // Notes
    const noteRow = document.createElement("div");
    noteRow.className = "field";
    noteRow.style.marginTop = "8px";
    noteRow.innerHTML = `<label>Notes</label><input type="text" id="adhocNotes" value="${(state.adhocInputs.notes || '').replace(/"/g, '&quot;')}" placeholder="How did it go?">`;
    actCard.appendChild(noteRow);

    wrap.appendChild(actCard);

    // Wire steppers
    setTimeout(() => {
      wrap.querySelectorAll(".num-input-wrap .step").forEach(btn => {
        btn.onclick = () => {
          const step = parseFloat(btn.dataset.s);
          const input = btn.parentElement.querySelector("input");
          input.value = Math.max(0, parseFloat(input.value || 0) + step);
        };
      });
    }, 10);
  }

  // Add exercise button
  const addExBtn = document.createElement("button");
  addExBtn.className = paperOn ? "paper-add-ex" : "adhoc-add-exercise-btn";
  addExBtn.innerHTML = paperOn ? "+ add exercise" : "+ Add Exercise";
  addExBtn.onclick = () => _openAdhocAddExercise();
  wrap.appendChild(addExBtn);

  // Finish button
  const finBtn = document.createElement("button");
  if (paperOn) {
    finBtn.className = "paper-stamp-btn adhoc-paper-finish";
    finBtn.innerHTML = `<span>\u2713 finish quick workout</span>`;
  } else {
    finBtn.className = "action-btn success adhoc-finish-btn";
    finBtn.textContent = "\u2713 Finish Quick Workout";
  }
  finBtn.onclick = finishAdhocWorkout;
  wrap.appendChild(finBtn);

  container.appendChild(wrap);

  // Show the header finish button too
  const hfBtn = document.getElementById("headerFinishBtn");
  hfBtn.classList.add("active");
  hfBtn.textContent = "\u2713 Finish";
  hfBtn.onclick = finishAdhocWorkout;
}

function _renderAdhocExercise(block, ex, bi, ei) {
  const card = document.createElement("div");
  card.className = "exercise-card";

  const mColor = primaryMuscleColor(ex.muscles);
  if (mColor) card.style.borderLeft = '3px solid ' + mColor;

  // Head
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
    const mc = GROUP_COLORS[groupMuscle(m)];
    if (mc) { t.style.background = mc + '22'; t.style.color = mc; }
    meta.appendChild(t);
  });
  info.appendChild(meta);
  head.appendChild(info);

  // Remove exercise button
  const removeBtn = document.createElement("button");
  removeBtn.className = "ex-menu-btn";
  removeBtn.textContent = "\u00d7";
  removeBtn.title = "Remove exercise";
  removeBtn.onclick = (e) => {
    e.stopPropagation();
    block.exercises.splice(ei, 1);
    if (block.exercises.length === 0) {
      state.adhocDay.blocks = state.adhocDay.blocks.filter(b => b.id !== block.id);
    }
    renderAdhocScreen();
  };
  head.appendChild(removeBtn);
  card.appendChild(head);

  // Sets table
  const setsWrap = document.createElement("div");
  setsWrap.className = "sets-wrap";

  const numSets = ex.sets || 3;
  const bw = ex.bodyweight;
  const last = getLastSetsFor(ex.exId || ex.name);

  for (let si = 0; si < numSets; si++) {
    const sKey = `adhoc|${bi}|${ei}|${si}`;
    const existing = state.adhocInputs[sKey] || {};
    const lastSet = last[si] || last[last.length - 1];

    const row = document.createElement("div");
    row.className = "adhoc-set-row" + (bw ? " bw-row" : "");

    const setLabel = document.createElement("div");
    setLabel.className = "adhoc-set-idx";
    setLabel.textContent = si + 1;
    row.appendChild(setLabel);

    if (!bw) {
      const wInput = document.createElement("input");
      wInput.type = "number";
      wInput.className = "adhoc-set-input weight-input";
      wInput.placeholder = "wt";
      wInput.value = existing.w != null ? existing.w : (lastSet ? lastSet.weight : (ex.defaultWeight || ""));
      wInput.onchange = () => {
        if (!state.adhocInputs[sKey]) state.adhocInputs[sKey] = {};
        state.adhocInputs[sKey].w = parseFloat(wInput.value) || 0;
      };
      row.appendChild(wInput);
    }

    const rInput = document.createElement("input");
    rInput.type = "number";
    rInput.className = "adhoc-set-input reps-input";
    rInput.placeholder = "reps";
    rInput.value = existing.r != null ? existing.r : (lastSet ? lastSet.reps : (ex.reps || ""));
    rInput.onchange = () => {
      if (!state.adhocInputs[sKey]) state.adhocInputs[sKey] = {};
      state.adhocInputs[sKey].r = parseInt(rInput.value) || 0;
    };
    row.appendChild(rInput);

    // Done/skip toggle
    const doneBtn = document.createElement("button");
    const isDone = existing.status === "done";
    doneBtn.className = "adhoc-set-done-btn" + (isDone ? " done" : "");
    doneBtn.textContent = isDone ? "\u2713" : "\u00b7";
    doneBtn.onclick = () => {
      if (!state.adhocInputs[sKey]) state.adhocInputs[sKey] = {};
      const cur = state.adhocInputs[sKey].status;
      state.adhocInputs[sKey].status = cur === "done" ? null : "done";
      // Capture current input values when marking done
      if (state.adhocInputs[sKey].status === "done") {
        const wEl = row.querySelector(".weight-input");
        const rEl = row.querySelector(".reps-input");
        if (wEl) state.adhocInputs[sKey].w = parseFloat(wEl.value) || 0;
        if (rEl) state.adhocInputs[sKey].r = parseInt(rEl.value) || 0;
      }
      doneBtn.className = "adhoc-set-done-btn" + (state.adhocInputs[sKey].status === "done" ? " done" : "");
      doneBtn.textContent = state.adhocInputs[sKey].status === "done" ? "\u2713" : "\u00b7";
      if (navigator.vibrate) navigator.vibrate(10);
    };
    row.appendChild(doneBtn);

    setsWrap.appendChild(row);
  }

  // Add/remove set controls
  const setControls = document.createElement("div");
  setControls.className = "adhoc-set-controls";
  const addSetBtn = document.createElement("button");
  addSetBtn.className = "adhoc-set-ctrl-btn";
  addSetBtn.textContent = "+ Set";
  addSetBtn.onclick = () => {
    ex.sets = (ex.sets || 3) + 1;
    renderAdhocScreen();
  };
  setControls.appendChild(addSetBtn);
  if (numSets > 1) {
    const rmSetBtn = document.createElement("button");
    rmSetBtn.className = "adhoc-set-ctrl-btn";
    rmSetBtn.textContent = "\u2212 Set";
    rmSetBtn.onclick = () => {
      ex.sets = Math.max(1, (ex.sets || 3) - 1);
      renderAdhocScreen();
    };
    setControls.appendChild(rmSetBtn);
  }
  setsWrap.appendChild(setControls);

  card.appendChild(setsWrap);
  return card;
}

// ─────────────────────────────────────────────────────────────
// PAPER-SKIN AD-HOC RENDERERS
// ─────────────────────────────────────────────────────────────
// Mirror the flat-notepad DOM from 24-paper-render.js (paperRenderBlock /
// paperRenderExercise / paperRenderSetsTable) so imported & quick workouts
// match the rest of the app. Reads/writes state.adhocInputs (not the regular
// draft) because ad-hoc sessions are not bound to state.currentDayId.

function _renderAdhocPaperBlock(block, bi) {
  const wrap = document.createElement("div");
  wrap.className = "paper-block";
  wrap.dataset.bi = bi;

  const label = document.createElement("div");
  label.className = "paper-superset-label";
  label.innerHTML = `
    <span class="paper-superset-id">${_escA(block.letter)} &middot; ${_escA(block.name || "")}</span>
    <span class="paper-superset-rest"></span>
  `;
  wrap.appendChild(label);

  block.exercises.forEach((ex, ei) => {
    wrap.appendChild(_renderAdhocPaperExercise(block, ex, bi, ei));
  });

  return wrap;
}

function _renderAdhocPaperExercise(block, ex, bi, ei) {
  const wrap = document.createElement("div");
  wrap.className = "paper-exercise";
  wrap.dataset.bi = bi;
  wrap.dataset.ei = ei;

  const head = document.createElement("div");
  head.className = "paper-exercise-head";
  const isSuperset = block.exercises.length > 1;
  const numLabel = `${block.letter}${isSuperset ? (ei + 1) : ""})`;
  const numSets = ex.sets || 3;
  const targetSpec = `${numSets} &times; ${ex.reps || "?"}`;

  head.innerHTML = `
    <div class="paper-ex-left">
      <span class="paper-ex-no">${numLabel}</span>
      <span class="paper-ex-name">${_escA(ex.name || "")}</span>
    </div>
    <div class="paper-ex-target">${targetSpec}</div>
    <button class="paper-ex-menu adhoc-paper-remove" aria-label="Remove exercise" title="Remove exercise">&times;</button>
  `;
  head.querySelector(".adhoc-paper-remove").onclick = (e) => {
    e.stopPropagation();
    block.exercises.splice(ei, 1);
    if (block.exercises.length === 0) {
      state.adhocDay.blocks = state.adhocDay.blocks.filter(b => b.id !== block.id);
    }
    renderAdhocScreen();
  };
  wrap.appendChild(head);

  wrap.appendChild(_renderAdhocPaperSetsTable(block, ex, bi, ei));
  return wrap;
}

function _renderAdhocPaperSetsTable(block, ex, bi, ei) {
  const list = document.createElement("div");
  list.className = "paper-set-list";

  const numSets = ex.sets || 3;
  const bw = !!ex.bodyweight;
  const last = (typeof getLastSetsFor === "function") ? getLastSetsFor(ex.exId || ex.name) : [];
  const repsLabel = ex.isTime ? "s" : ex.isDistance ? "m" : "reps";
  const ink = (typeof paperInkColor === "function") ? paperInkColor() : "#1e3a72";

  for (let si = 0; si < numSets; si++) {
    const sKey = `adhoc|${bi}|${ei}|${si}`;
    const existing = state.adhocInputs[sKey] || {};
    const lastSet = last[si] || last[last.length - 1];
    const done = existing.status === "done";
    const skipped = existing.status === "skipped";

    const wVal = existing.w != null ? existing.w
      : (lastSet ? lastSet.weight : (ex.defaultWeight || 0));
    const rVal = existing.r != null ? existing.r
      : (lastSet ? lastSet.reps : (ex.reps || 0));

    const row = document.createElement("div");
    row.className = "paper-set-row adhoc-paper-set-row";
    if (done) row.classList.add("set-done");
    if (skipped) row.classList.add("set-skipped");
    row.dataset.setIdx = si;

    const cbHtml = (typeof paperCheckboxSvg === "function")
      ? paperCheckboxSvg(done, ink, 18)
      : `<span>${done ? "☒" : "☐"}</span>`;

    row.innerHTML = `
      <span class="paper-set-idx">${si + 1}.</span>
      <span class="paper-set-box" role="checkbox" aria-checked="${done}">${cbHtml}</span>
      ${bw ? "" : `<input class="paper-set-weight adhoc-paper-input" type="number" inputmode="decimal" data-field="w" value="${wVal}" placeholder="wt"><span class="paper-set-x">&times;</span>`}
      <input class="paper-set-reps adhoc-paper-input" type="number" inputmode="numeric" data-field="r" value="${rVal}" placeholder="reps">
      <span class="paper-set-rpe-lbl">${_escA(repsLabel)}</span>
    `;

    _wireAdhocPaperSetRow(row, ex, bi, ei, si, bw);
    list.appendChild(row);
  }

  // Add-set / remove-set as flat handwritten links
  const ctrls = document.createElement("div");
  ctrls.className = "adhoc-paper-set-ctrls";
  const addBtn = document.createElement("button");
  addBtn.className = "paper-add-set";
  addBtn.textContent = "+ add set";
  addBtn.onclick = () => {
    ex.sets = (ex.sets || 3) + 1;
    renderAdhocScreen();
  };
  ctrls.appendChild(addBtn);

  if (numSets > 1) {
    const rmBtn = document.createElement("button");
    rmBtn.className = "paper-add-set";
    rmBtn.textContent = "− remove set";
    rmBtn.onclick = () => {
      delete state.adhocInputs[`adhoc|${bi}|${ei}|${numSets - 1}`];
      ex.sets = Math.max(1, (ex.sets || 3) - 1);
      renderAdhocScreen();
    };
    ctrls.appendChild(rmBtn);
  }
  list.appendChild(ctrls);

  return list;
}

function _wireAdhocPaperSetRow(row, ex, bi, ei, si, bw) {
  const sKey = `adhoc|${bi}|${ei}|${si}`;

  function ensure() {
    if (!state.adhocInputs[sKey]) state.adhocInputs[sKey] = {};
    return state.adhocInputs[sKey];
  }

  const toggleDone = () => {
    const cur = ensure();
    const wasDone = cur.status === "done";
    cur.status = wasDone ? null : "done";
    if (cur.status === "done") {
      // Capture current displayed values so they persist on finish
      const wEl = row.querySelector('input[data-field="w"]');
      const rEl = row.querySelector('input[data-field="r"]');
      if (wEl) cur.w = parseFloat(wEl.value) || 0;
      if (rEl) cur.r = parseInt(rEl.value) || 0;
    }
    if (navigator.vibrate) navigator.vibrate(10);
    renderAdhocScreen();
  };

  const box = row.querySelector(".paper-set-box");
  if (box) {
    box.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDone();
    });
  }

  row.querySelectorAll("input.adhoc-paper-input").forEach(inp => {
    const field = inp.dataset.field;
    inp.addEventListener("change", () => {
      const cur = ensure();
      cur[field] = field === "w" ? (parseFloat(inp.value) || 0) : (parseInt(inp.value) || 0);
    });
    // Prevent row-level taps from toggling done while user is editing
    inp.addEventListener("click", e => e.stopPropagation());
  });
}

// Local html escaper — keeps this file independent of 24-paper-render.js
function _escA(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function _openAdhocAddExercise() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">Add Exercise</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close" style="width:36px;height:36px;border-radius:10px;">\u2715</button>
    </div>
  `;

  const search = document.createElement("input");
  search.className = "lib-search";
  search.placeholder = "Search exercises\u2026";
  wrap.appendChild(search);

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
  wrap.appendChild(catRow);

  const list = document.createElement("div");
  list.className = "lib-items-grid";
  wrap.appendChild(list);

  function renderList() {
    const q = search.value.toLowerCase().trim();
    list.innerHTML = "";
    LIBRARY
      .filter(e => activeCat === "All" || e.cat === activeCat)
      .filter(e => !q || e.name.toLowerCase().includes(q) || (e.muscles || []).some(m => m.includes(q)))
      .forEach(e => {
        const b = document.createElement("button");
        b.className = "lib-item";
        b.innerHTML = `<div><div>${e.name}</div><div class="muscles">${(e.muscles || []).join(" \u00b7 ")}</div></div><span style="color:var(--accent);">+</span>`;
        b.onclick = () => {
          // Add to current ad-hoc session
          if (!state.adhocDay.blocks.length) {
            state.adhocDay.blocks.push({
              id: "adhoc-block-1",
              letter: "A",
              name: state.adhocDay.name,
              exercises: []
            });
          }
          state.adhocDay.blocks[0].exercises.push(mkSets(e));
          closeSheet();
          renderAdhocScreen();
          showToast("Added " + e.name, "success");
        };
        list.appendChild(b);
      });
  }

  search.oninput = renderList;
  renderList();
  openSheet(wrap);
}

function finishAdhocWorkout() {
  if (!state.adhocActive) return;

  const sets = [];
  const inputs = state.adhocInputs;

  // Gather sets from structured exercises
  if (state.adhocDay.blocks.length > 0) {
    state.adhocDay.blocks.forEach((block, bi) => {
      block.exercises.forEach((ex, ei) => {
        const numSets = ex.sets || 3;
        const bw = ex.bodyweight;
        const last = getLastSetsFor(ex.exId || ex.name);
        for (let si = 0; si < numSets; si++) {
          const sKey = `adhoc|${bi}|${ei}|${si}`;
          const data = inputs[sKey] || {};
          const lastSet = last[si] || last[last.length - 1];

          const w = data.w != null ? data.w : (lastSet ? lastSet.weight : (ex.defaultWeight || 0));
          const r = data.r != null ? data.r : (lastSet ? lastSet.reps : (ex.reps || 0));

          if (r == null || r === 0) continue;
          if (data.status === "skipped") continue;

          sets.push({
            exId: ex.exId || ex.name,
            exName: ex.name,
            muscles: ex.muscles || [],
            setIdx: si + 1,
            weight: bw ? 0 : (w || 0),
            reps: r,
            rpe: data.p || 7,
            bodyweight: !!bw,
            isPR: false
          });
        }
      });
    });
  }

  // PR detection
  const u = userData();
  const priorBest = {};
  u.sessions.forEach(s => {
    s.sets.forEach(set => {
      const key = set.exId;
      if (!priorBest[key] || set.weight * (1 + set.reps / 30) > priorBest[key].score) {
        priorBest[key] = { score: set.weight * (1 + set.reps / 30), w: set.weight, r: set.reps };
      }
    });
  });
  sets.forEach(s => {
    const best = priorBest[s.exId];
    const score = s.weight * (1 + s.reps / 30);
    if (s.weight > 0 && (!best || score > best.score)) s.isPR = true;
  });

  const duration = Math.floor((Date.now() - state.adhocStartedAt) / 1000);

  // For custom activity sessions, use manual duration if provided
  let effectiveDuration = duration;
  if (state.adhocCustomName && state.adhocDay.blocks.length === 0) {
    const durEl = document.getElementById("adhocDuration");
    if (durEl) effectiveDuration = (parseInt(durEl.value) || 0) * 60;
  }

  const volume = sets.reduce((a, s) => a + s.weight * s.reps, 0);
  const prCount = sets.filter(s => s.isPR).length;

  // Gather custom activity metadata
  let adhocMeta = null;
  if (state.adhocCustomName && state.adhocDay.blocks.length === 0) {
    const distEl = document.getElementById("adhocDistance");
    const noteEl = document.getElementById("adhocNotes");
    adhocMeta = {
      activityName: state.adhocCustomName,
      duration: effectiveDuration,
      distance: distEl ? distEl.value.trim() : "",
      notes: noteEl ? noteEl.value.trim() : ""
    };
  }

  const session = {
    id: "s-" + Date.now(),
    dayId: "adhoc",
    dayName: state.adhocDay.name,
    startedAt: state.adhocStartedAt,
    finishedAt: Date.now(),
    duration: effectiveDuration,
    sets: sets,
    volume: volume,
    prCount: prCount,
    blockNotes: {},
    programWeek: null,
    feedback: {},
    mesocycleId: null,
    mesoWeek: null,
    isAdhoc: true,
    adhocMeta: adhocMeta
  };

  // Save session — does NOT touch lastDoneDayId or program rotation
  updateUser(u => {
    u.sessions.push(session);
    // Explicitly do NOT update u.lastDoneDayId or advance the program
  });

  // Clean up ad-hoc state
  _cleanupAdhocState();

  const msg = prCount > 0
    ? "\uD83C\uDFC6 Quick Workout done! " + sets.length + " sets, " + prCount + " PR" + (prCount > 1 ? "s" : "") + "!"
    : "\u2713 Quick Workout done!" + (sets.length > 0 ? " " + sets.length + " sets in " + formatDuration(effectiveDuration) : " " + formatDuration(effectiveDuration));
  showToast(msg, prCount > 0 ? "pr" : "success");

  renderWorkoutScreen();
}

function _cleanupAdhocState() {
  state.adhocActive = false;
  state.adhocDay = null;
  state.adhocCustomName = null;
  state.adhocExercises = null;
  state.adhocStartedAt = null;
  state.adhocInputs = null;
  state.workoutStartedAt = null;
  stopSessionTimer();
  hideHeaderRest();

  // Restore normal header finish handler
  const hfBtn = document.getElementById("headerFinishBtn");
  hfBtn.onclick = handleFinishButton;
  hfBtn.classList.remove("active");
}

function cancelAdhocWorkout() {
  if (!state.adhocActive) return;
  _cleanupAdhocState();
  state.dayChosen = false;
  renderWorkoutScreen();
  showToast("Quick workout cancelled");
}
