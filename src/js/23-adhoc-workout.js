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

  // v22: top-row entry to repeat a previously-saved workout. Only shows
  // when the user actually has saved workouts so an empty list doesn't
  // add noise for new users.
  const _u22 = userData();
  const _savedCount = (_u22 && Array.isArray(_u22.savedWorkouts)) ? _u22.savedWorkouts.length : 0;
  if (_savedCount > 0) {
    const savedRow = document.createElement("button");
    savedRow.type = "button";
    savedRow.className = "adhoc-from-program-row";
    savedRow.innerHTML = `
      <div class="adhoc-from-program-body">
        <div class="adhoc-from-program-title">Repeat a saved workout</div>
        <div class="adhoc-from-program-sub">${_savedCount} saved · pick one to run as today's session.</div>
      </div>
      <span class="adhoc-from-program-arrow" aria-hidden="true">→</span>
    `;
    savedRow.onclick = () => {
      closeSheet();
      setTimeout(() => {
        if (typeof openSavedWorkoutsPicker === "function") openSavedWorkoutsPicker();
      }, 80);
    };
    wrap.appendChild(savedRow);
  }

  // v21: top-row entry into "add from program" — single day (one-off) or
  // whole program (library install). Routes through the existing template
  // picker + duration picker; single-day re-uses the ad-hoc flow below.
  const fromProgramRow = document.createElement("button");
  fromProgramRow.type = "button";
  fromProgramRow.className = "adhoc-from-program-row";
  fromProgramRow.innerHTML = `
    <div class="adhoc-from-program-body">
      <div class="adhoc-from-program-title">Add from a program</div>
      <div class="adhoc-from-program-sub">Pull one day as today's session — or add the whole program to your library.</div>
    </div>
    <span class="adhoc-from-program-arrow" aria-hidden="true">→</span>
  `;
  fromProgramRow.onclick = () => {
    closeSheet();
    setTimeout(openAddFromProgramSheet, 80);
  };
  wrap.appendChild(fromProgramRow);

  // Custom activity input
  const customRow = document.createElement("div");
  customRow.className = "adhoc-custom-row";
  customRow.innerHTML = `
    <div class="section-title" style="margin-top:0;">Custom Activity</div>
    <div class="adhoc-custom-input-row">
      <input type="text" id="adhocCustomName" class="name-input" placeholder="e.g. Bike, Basketball, Yoga…" autocomplete="off" style="flex:1;">
      <button class="action-btn" id="adhocCustomAdd" style="white-space:nowrap;">Add</button>
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

  // Wire custom activity add — pushes the typed name into the selected list
  // as a synthetic exercise so users can build a multi-exercise quick workout
  // mixing custom names with library picks.
  setTimeout(() => {
    const customInput = document.getElementById("adhocCustomName");
    const customBtn = document.getElementById("adhocCustomAdd");
    if (customInput && customBtn) {
      customBtn.onclick = () => {
        const name = customInput.value.trim();
        if (!name) { customInput.focus(); return; }
        const synthetic = {
          id: "custom-" + Date.now(),
          name: name,
          cat: "Custom",
          muscles: [],
          sets: 3,
          reps: 10
        };
        selectedExercises.push(synthetic);
        updateSelectedUI();
        renderList();
        customInput.value = "";
        customInput.focus();
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

// ─────────────────────────────────────────────────────────────
// PAPER ACTION BAR (ad-hoc variant)
// ─────────────────────────────────────────────────────────────
// Mirrors paperBuildActionBar in 24-paper-render.js, but reads/writes
// state.adhocInputs (keyed `adhoc|bi|ei|si`) instead of the program
// draft, and finishes via finishAdhocWorkout(). Used so the same Rest
// / Weight / Swap / Log set / Save & exit chrome shows whenever a
// workout is loaded in the Overview area — single program day, saved
// workout, or quick custom session.

function _paperFindAdhocActiveSet(day) {
  if (!day || !day.blocks) return { bi: 0, exIdx: 0, setIdx: 0, allDone: true };
  for (let bi = 0; bi < day.blocks.length; bi++) {
    const block = day.blocks[bi];
    if (!block || !block.exercises) continue;
    for (let ei = 0; ei < block.exercises.length; ei++) {
      const ex = block.exercises[ei];
      if (ex.isWarmup) continue;
      const nSets = ex.sets || 3;
      for (let si = 0; si < nSets; si++) {
        const sKey = `adhoc|${bi}|${ei}|${si}`;
        const inp = state.adhocInputs[sKey] || {};
        if (inp.status !== "done") return { bi, exIdx: ei, setIdx: si, allDone: false };
      }
    }
  }
  return { bi: 0, exIdx: 0, setIdx: 0, allDone: true };
}

function _paperBuildAdhocActionBar(day, block, activeExIdx, activeSetIdx, allDone, bi) {
  const bar = document.createElement("div");
  bar.className = "paper-action-bar";

  const ex = block.exercises[activeExIdx] || block.exercises[0];
  const lib = (typeof LIB_BY_ID !== "undefined") ? (LIB_BY_ID[ex.exId] || ex) : ex;
  const bw = lib.bodyweight;
  const isKg = (typeof state !== "undefined" && state.unit === "kg");
  const unit = isKg ? "kg" : "lb";
  const step = isKg ? 2.5 : 5;

  // Day-wide completion counts for the all-done label.
  let _daySetsTotal = 0, _daySetsDone = 0;
  if (day && day.blocks) {
    for (let _bi = 0; _bi < day.blocks.length; _bi++) {
      const b = day.blocks[_bi];
      if (!b.exercises) continue;
      for (let _ei = 0; _ei < b.exercises.length; _ei++) {
        const _e = b.exercises[_ei];
        if (_e.isWarmup) continue;
        const _n = _e.sets || 3;
        for (let _si = 0; _si < _n; _si++) {
          _daySetsTotal++;
          const _k = `adhoc|${_bi}|${_ei}|${_si}`;
          if ((state.adhocInputs[_k] || {}).status === "done") _daySetsDone++;
        }
      }
    }
  }

  const lbl = document.createElement("div");
  lbl.className = "paper-action-edit-label";
  if (allDone) {
    lbl.innerHTML = `<span class="pa-label-target">workout complete &middot; ${_daySetsDone}/${_daySetsTotal}</span>`;
  } else {
    const totalSets = (ex.sets || 3);
    lbl.innerHTML = `<span class="pa-label-target">set ${activeSetIdx + 1} of ${totalSets}</span>`;
  }
  bar.appendChild(lbl);

  const row = document.createElement("div");
  row.className = "paper-action-row";

  // REST
  const restBtn = document.createElement("button");
  restBtn.className = "paper-action-rest";
  const restSec = (ex.rest != null ? ex.rest
                    : (block.exercises[0] && block.exercises[0].rest != null
                       ? block.exercises[0].rest : 90));
  const restStr = (typeof formatRest === "function") ? formatRest(restSec) : (restSec + "s");
  restBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
         style="filter:url(#paper-roughen);">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2 2"/>
      <line x1="9" y1="2" x2="15" y2="2"/>
      <line x1="12" y1="2" x2="12" y2="4"/>
    </svg>
    <span class="pa-rest-lbl">Rest</span>
    <span class="pa-rest-val">${restStr}</span>
  `;
  restBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (typeof showHeaderRest === "function") showHeaderRest(restSec);
    if (typeof openRestSheet === "function") openRestSheet();
    if (navigator.vibrate) navigator.vibrate(10);
  });
  if (typeof paperWirePress === "function") paperWirePress(restBtn);
  row.appendChild(restBtn);

  // WEIGHT stepper (skip for bodyweight)
  const wWrap = document.createElement("div");
  wWrap.className = "paper-action-weight";
  const sKeyActive = `adhoc|${bi}|${activeExIdx}|${activeSetIdx}`;
  if (bw) {
    wWrap.classList.add("paper-action-weight-bw");
    wWrap.innerHTML = `<div class="pa-weight-label">Weight</div><div class="pa-weight-bw">BW</div>`;
  } else {
    const last = (typeof getLastSetsFor === "function") ? getLastSetsFor(ex.exId || ex.name) : [];
    const lastSet = last[activeSetIdx] || last[last.length - 1];
    const existing = state.adhocInputs[sKeyActive] || {};
    const cur = existing.w != null ? existing.w
      : (lastSet ? lastSet.weight : (ex.defaultWeight || 0));
    wWrap.innerHTML = `
      <div class="pa-weight-label">Weight</div>
      <div class="pa-weight-row">
        <button class="pa-weight-step pa-weight-minus" aria-label="Decrease weight">&minus;</button>
        <div class="pa-weight-val"><span class="pa-weight-num">${cur}</span><span class="pa-weight-unit">${unit}</span></div>
        <button class="pa-weight-step pa-weight-plus" aria-label="Increase weight">+</button>
      </div>
    `;
    const minus = wWrap.querySelector(".pa-weight-minus");
    const plus = wWrap.querySelector(".pa-weight-plus");
    const apply = (delta) => {
      const v = Math.max(0, Number(cur) + delta);
      if (!state.adhocInputs[sKeyActive]) state.adhocInputs[sKeyActive] = {};
      state.adhocInputs[sKeyActive].w = v;
      if (navigator.vibrate) navigator.vibrate(5);
      renderAdhocScreen();
    };
    minus.addEventListener("click", (e) => { e.stopPropagation(); apply(-step); });
    plus.addEventListener("click", (e) => { e.stopPropagation(); apply(+step); });
    if (typeof paperWirePress === "function") {
      paperWirePress(minus);
      paperWirePress(plus);
    }
  }
  row.appendChild(wWrap);

  // SWAP
  const swapBtn = document.createElement("button");
  swapBtn.className = "paper-action-swap";
  swapBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
         style="filter:url(#paper-roughen);">
      <path d="M3 7 L17 7 L13 3"/>
      <path d="M21 17 L7 17 L11 21"/>
    </svg>
    <span>Swap</span>
  `;
  swapBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (typeof openSidebar === "function") {
      const libEx = (typeof LIB_BY_ID !== "undefined") ? LIB_BY_ID[ex.exId] : null;
      const cat = libEx ? libEx.cat : null;
      openSidebar(cat, bi, activeExIdx);
    }
  });
  if (typeof paperWirePress === "function") paperWirePress(swapBtn);
  row.appendChild(swapBtn);

  // LOG SET / FINISH
  const logBtn = document.createElement("button");
  logBtn.className = "paper-action-log" + (allDone ? " paper-action-finish" : "");
  logBtn.innerHTML = allDone ? `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 12 l4 4 L14 8"/>
      <path d="M10 12 l4 4 L20 6"/>
    </svg>
    <span>Finish</span>
  ` : `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12 l5 5 L20 6"/>
    </svg>
    <span>Log set</span>
  `;
  logBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (allDone) {
      state.dayChosen = false;
      if (typeof finishAdhocWorkout === "function") finishAdhocWorkout();
      if (navigator.vibrate) navigator.vibrate([15, 40, 15]);
      return;
    }
    if (logBtn.disabled) return;

    const activeRow = document.querySelector(".paper-focus-active-set");
    if (activeRow && typeof paperInkBloom === "function") {
      paperInkBloom(activeRow);
    }

    // Capture displayed weight / reps from the active row's inputs so they
    // persist on finish — mirrors _wireAdhocPaperSetRow.toggleDone.
    if (!state.adhocInputs[sKeyActive]) state.adhocInputs[sKeyActive] = {};
    const cur = state.adhocInputs[sKeyActive];
    cur.status = "done";
    if (activeRow) {
      const wEl = activeRow.querySelector('input[data-field="w"]');
      const rEl = activeRow.querySelector('input[data-field="r"]');
      if (wEl) cur.w = parseFloat(wEl.value) || 0;
      if (rEl) cur.r = parseInt(rEl.value) || 0;
    }
    if (typeof showHeaderRest === "function") showHeaderRest(restSec);

    setTimeout(() => { if (navigator.vibrate) navigator.vibrate(15); }, 50);

    logBtn.disabled = true;
    setTimeout(() => { renderAdhocScreen(); }, 320);
  });
  if (typeof paperWirePress === "function") paperWirePress(logBtn);
  row.appendChild(logBtn);

  bar.appendChild(row);

  // Save & exit — quiet secondary, only mid-workout. Adhoc uses its own
  // confirm sheet because the global exitWorkout() discards adhoc drafts
  // (cancelAdhocWorkout) instead of saving them.
  if (!allDone) {
    const exitRow = document.createElement("div");
    exitRow.className = "paper-action-exit-row";
    const exitBtn = document.createElement("button");
    exitBtn.type = "button";
    exitBtn.className = "paper-action-exit";
    exitBtn.textContent = "Save & exit";
    exitBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      _openAdhocExitSheet();
      if (navigator.vibrate) navigator.vibrate(8);
    });
    if (typeof paperWirePress === "function") paperWirePress(exitBtn);
    exitRow.appendChild(exitBtn);
    bar.appendChild(exitRow);
  }

  return bar;
}

// Confirm sheet for the Save & exit chip. Saves via finishAdhocWorkout so
// the user's logged sets persist — distinct from cancelAdhocWorkout.
function _openAdhocExitSheet() {
  const html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">End quick workout?</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">&times;</button>
    </div>
    <p style="color:var(--text-dim);font-size:13px;line-height:1.5;margin-bottom:10px;">
      We'll save what you logged so far.
    </p>
    <div class="sheet-actions">
      <button class="primary" id="adhocExitConfirm">Save and end</button>
      <button class="secondary" id="adhocExitCancel">Keep going</button>
    </div>
  `;
  if (typeof openSheet === "function") openSheet(html);
  const cancelEl = document.getElementById("adhocExitCancel");
  const confirmEl = document.getElementById("adhocExitConfirm");
  if (cancelEl) cancelEl.onclick = () => { if (typeof closeSheet === "function") closeSheet(); };
  if (confirmEl) confirmEl.onclick = () => {
    if (typeof closeSheet === "function") closeSheet();
    if (typeof finishAdhocWorkout === "function") finishAdhocWorkout();
  };
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

  // Compute total exercise count up-front so downstream logic can gate the
  // paper action bar (only shows when there's at least one real exercise).
  let _adhocExCount = 0;
  state.adhocDay.blocks.forEach(b => { _adhocExCount += (b.exercises || []).length; });

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

  // Paper action bar \u2014 Rest / Weight / Swap / Log set / Save & exit, plus the
  // red Finish stamp once all sets are done. Only shows in paper skin and only
  // when there's at least one real exercise (custom-activity mode skips it).
  const _showAdhocBar = paperOn && _adhocExCount > 0;
  let _adhocBarActive = null;
  if (_showAdhocBar) {
    _adhocBarActive = _paperFindAdhocActiveSet(state.adhocDay);
    const activeBlock = state.adhocDay.blocks[_adhocBarActive.bi] || state.adhocDay.blocks[0];
    wrap.appendChild(_paperBuildAdhocActionBar(
      state.adhocDay, activeBlock,
      _adhocBarActive.exIdx, _adhocBarActive.setIdx, _adhocBarActive.allDone, _adhocBarActive.bi
    ));
  }

  // Add exercise button
  const addExBtn = document.createElement("button");
  addExBtn.className = paperOn ? "paper-add-ex" : "adhoc-add-exercise-btn";
  addExBtn.innerHTML = paperOn ? "+ add exercise" : "+ Add Exercise";
  addExBtn.onclick = () => _openAdhocAddExercise();
  wrap.appendChild(addExBtn);

  // Finish button \u2014 when the paper action bar is shown, its all-done state
  // already provides the Finish stamp, so we hide this redundant one.
  if (!_showAdhocBar) {
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
  }

  container.appendChild(wrap);

  // Highlight the active set row after the DOM is in place \u2014 mirrors the
  // program-flow logic in renderChaptersView (10-render-workout.js:1905-1912).
  if (_showAdhocBar && _adhocBarActive && !_adhocBarActive.allDone) {
    requestAnimationFrame(() => {
      const row = wrap.querySelector(
        `.paper-block[data-bi="${_adhocBarActive.bi}"] ` +
        `.paper-exercise[data-ei="${_adhocBarActive.exIdx}"] ` +
        `.paper-set-row[data-set-idx="${_adhocBarActive.setIdx}"]`
      );
      if (row) row.classList.add("paper-focus-active-set");
    });
  }

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
    adhocMeta: adhocMeta,
    savedWorkoutId: state.adhocSavedWorkoutId || null
  };

  // Save session — does NOT touch lastDoneDayId or program rotation
  updateUser(u => {
    u.sessions.push(session);
    // Explicitly do NOT update u.lastDoneDayId or advance the program

    // Bump use-count + lastUsedAt on the source saved workout, if any.
    if (state.adhocSavedWorkoutId && Array.isArray(u.savedWorkouts)) {
      const sw = u.savedWorkouts.find(x => x.id === state.adhocSavedWorkoutId);
      if (sw) {
        sw.useCount = (sw.useCount || 0) + 1;
        sw.lastUsedAt = Date.now();
      }
    }
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
  state.adhocSavedWorkoutId = null;
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

// ============================================================
// ADD FROM PROGRAM (v21) — one day or whole program from a template
// ============================================================
// Entered from the "+" workout sheet (openAdhocWorkout, top row).
// Step 1: pick a template (PROGRAM_TEMPLATES, minus "custom").
// Step 2: pick mode — "Run one day" (ad-hoc, one-off) or "Add whole program"
//         (routes to openDurationPicker → addProgramEntry).
// Step 3a (one day): pick which day from a sample week → load as ad-hoc.

function openAddFromProgramSheet() {
  const wrap = document.createElement("div");
  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">Add from a program</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>
    </div>
    <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">Pick a template. Next step asks whether you want just one day or the whole program.</p>
  `;
  (typeof PROGRAM_TEMPLATES !== "undefined" ? PROGRAM_TEMPLATES : []).forEach(tpl => {
    if (tpl.id === "custom") return;
    html += `
      <div class="tpl-option" data-tpl-id="${tpl.id}">
        <div class="tpl-head"><div class="tpl-name">${tpl.name}</div></div>
        <div class="tpl-desc">${tpl.description || ""}</div>
      </div>
    `;
  });
  wrap.innerHTML = html;
  wrap.querySelectorAll(".tpl-option").forEach(row => {
    row.onclick = () => {
      closeSheet();
      setTimeout(() => openTemplateActionSheet(row.dataset.tplId), 80);
    };
  });
  openSheet(wrap);
}

function openTemplateActionSheet(templateId) {
  const tpl = (typeof PROGRAM_TEMPLATES !== "undefined")
    ? PROGRAM_TEMPLATES.find(t => t.id === templateId) : null;
  if (!tpl) return;

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">${tpl.name}</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>
    </div>
    <p style="color:var(--text-dim);font-size:12px;margin-bottom:14px;">${tpl.description || ""}</p>
  `;

  const oneDay = document.createElement("button");
  oneDay.className = "sheet-item";
  oneDay.innerHTML = `<span class="icon">1</span><span><strong>Run one day</strong><div style="color:var(--text-dim);font-size:11px;font-weight:500;">One-off — won't change your library. Logs as today's quick workout.</div></span>`;
  oneDay.onclick = () => {
    closeSheet();
    setTimeout(() => openTemplateDayPicker(templateId), 80);
  };
  wrap.appendChild(oneDay);

  const wholeProg = document.createElement("button");
  wholeProg.className = "sheet-item";
  wholeProg.style.marginTop = "8px";
  wholeProg.innerHTML = `<span class="icon">▦</span><span><strong>Add the whole program</strong><div style="color:var(--text-dim);font-size:11px;font-weight:500;">Pick days/wk and weeks. Adds to your library and switches to it.</div></span>`;
  wholeProg.onclick = () => {
    closeSheet();
    // openDurationPicker drives the existing applyProgramSwitch flow.
    setTimeout(() => openDurationPicker(templateId), 80);
  };
  wrap.appendChild(wholeProg);

  openSheet(wrap);
}

function openTemplateDayPicker(templateId) {
  const tpl = (typeof PROGRAM_TEMPLATES !== "undefined")
    ? PROGRAM_TEMPLATES.find(t => t.id === templateId) : null;
  if (!tpl) return;
  const dpw = tpl.daysPerWeek || 4;
  const tw = tpl.totalWeeks || tpl.minWeeks || 10;
  const days = (typeof resolveWeekProgram === "function")
    ? resolveWeekProgram(templateId, 1, tw, dpw) : null;
  if (!Array.isArray(days) || !days.length) {
    showToast("Couldn't preview that program — try the whole-program flow.");
    return;
  }

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">${tpl.name}</h3>
      <button class="icon-btn" id="atdpBack" title="Back">←</button>
    </div>
    <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">Which day do you want to run today? It logs as a one-off — your active program isn't touched.</p>
  `;
  days.forEach(day => {
    const btn = document.createElement("button");
    btn.className = "sheet-item";
    const breakdown = (typeof getSessionBreakdown === "function") ? getSessionBreakdown(day) : null;
    const meta = breakdown ? ` · ~${breakdown.totalMin} min` : "";
    btn.innerHTML = `<span class="icon">${day.id}</span><span>${day.name}<div style="color:var(--text-dim);font-size:11px;font-weight:500;">${(day.sub || "")}${meta}</div></span>`;
    btn.onclick = () => {
      closeSheet();
      _beginAdhocFromTemplateDay(day, tpl.name);
    };
    wrap.appendChild(btn);
  });
  openSheet(wrap);
  const backBtn = wrap.querySelector("#atdpBack");
  if (backBtn) backBtn.onclick = () => { closeSheet(); setTimeout(() => openTemplateActionSheet(templateId), 80); };
}

// Load a single template day as today's ad-hoc workout. Preserves block
// structure (warm-up, main, supersets) — unlike _beginAdhocSession which
// flattens to one block — by stuffing the resolved day directly into
// state.adhocDay. Saves as a normal ad-hoc session on finish; no PR
// inflation against the active program's history because session.programId
// stays null for ad-hoc records.
function _beginAdhocFromTemplateDay(day, tplName) {
  const clonedBlocks = (day.blocks || []).map(b => ({
    id: "adhoc-tpl-" + (b.id || b.letter || Math.random().toString(36).slice(2, 6)),
    letter: b.letter || "A",
    name: b.name || "",
    type: b.type || null,
    blockType: b.blockType || "strength",
    exercises: (b.exercises || []).map(e => (typeof mkSets === "function") ? mkSets(e) : Object.assign({}, e))
  }));

  state.adhocActive = true;
  state.adhocDay = {
    id: "adhoc",
    name: day.name || (tplName + " day"),
    sub: tplName + " · one-off",
    blocks: clonedBlocks
  };
  state.adhocCustomName = null;
  state.adhocExercises = null;
  state.adhocStartedAt = Date.now();
  state.adhocInputs = {};
  state.dayChosen = true;
  state.workoutView = "chapters";

  if (typeof renderAdhocScreen === "function") renderAdhocScreen();
  if (typeof showToast === "function") showToast("Loaded " + (day.name || "day") + " from " + tplName, "success");
}
