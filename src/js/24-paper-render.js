// ============================================================
// PAPER RENDER — flat-notepad DOM for the Lift screen
// ============================================================
// Replaces renderBlock / renderExercise / renderSetsTable when
// paper skin is active. Produces the design's flat layout —
// no cards, no chips, just SupersetLabel + indented set rows.
// Wires the same handlers as wireChip so editing/logging still works.

function paperRenderBlock(day, block, bi) {
  const wrap = document.createElement("div");
  wrap.className = "paper-block";
  wrap.dataset.bi = bi;
  const isSuperset = block.exercises.length > 1;
  const blockMin = (typeof estimateBlockSec === "function")
    ? Math.round(estimateBlockSec(block) / 60) : null;

  // SupersetLabel: "A · STRENGTH" left, "REST 2:00" right
  const label = document.createElement("div");
  label.className = "paper-superset-label";
  const restStr = block.exercises[0] && block.exercises[0].rest
    ? "rest " + (typeof formatRest === "function" ? formatRest(block.exercises[0].rest) : block.exercises[0].rest)
    : (blockMin ? `~${blockMin} min` : "");
  label.innerHTML = `
    <span class="paper-superset-id">${block.letter} &middot; ${block.name}${isSuperset ? " (superset)" : ""}<span class="paper-superset-cue" aria-hidden="true">tap to focus &rarr;</span></span>
    <span class="paper-superset-rest">${restStr}</span>
    <button class="paper-block-menu" aria-label="Block menu">&middot;&middot;&middot;</button>
  `;
  // Whole superset header is tappable → opens focus view.
  label.setAttribute("role", "button");
  label.setAttribute("tabindex", "0");
  label.title = "Tap to focus on this block";
  label.addEventListener("click", (e) => {
    if (e.target.closest("button, input, [contenteditable]")) return;
    state.workoutView = "focus";
    state.focusBlockIdx = bi;
    state.focusExIdx = 0;
    if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
  });
  const menuBtn = label.querySelector(".paper-block-menu");
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (typeof openBlockMenu === "function") openBlockMenu(block, bi);
  });
  wrap.appendChild(label);

  // Optional block-level note input — keep as a paper-style single line
  const noteKey = `${block.id}|__note`;
  const noteVal = (typeof getInput === "function") ? getInput(noteKey, "") : "";
  if (noteVal || true) {
    const noteRow = document.createElement("div");
    noteRow.className = "paper-block-note";
    noteRow.innerHTML = `<input type="text" placeholder="add a note…" value="${(noteVal || "").replace(/"/g, "&quot;")}">`;
    const input = noteRow.querySelector("input");
    input.addEventListener("click", e => e.stopPropagation());
    input.addEventListener("change", () => {
      if (typeof saveInput === "function") saveInput(noteKey, input.value);
    });
    wrap.appendChild(noteRow);
  }

  // Each exercise rendered as a flat ExerciseBlock
  block.exercises.forEach((ex, ei) => {
    wrap.appendChild(paperRenderExercise(day, block, ex, bi, ei, isSuperset));
  });

  // Add-exercise affordance — handwritten, no box
  const addEx = document.createElement("button");
  addEx.className = "paper-add-ex";
  addEx.textContent = "+ add exercise";
  addEx.addEventListener("click", () => {
    if (typeof openLibrary === "function") openLibrary(block.id);
  });
  wrap.appendChild(addEx);

  return wrap;
}

function paperRenderExercise(day, block, ex, bi, ei, isSuperset) {
  const wrap = document.createElement("div");
  wrap.className = "paper-exercise";
  wrap.dataset.bi = bi;
  wrap.dataset.ei = ei;
  wrap.dataset.warmup = String(!!ex.isWarmup);

  // Tap-anywhere swap mode (mirrors existing exercise-card behavior)
  wrap.addEventListener("click", (e) => {
    if (e.target.closest("button, input, [contenteditable]")) return;
    if (typeof onWorkoutCardTapForSwap === "function"
        && onWorkoutCardTapForSwap(bi, ei)) e.stopPropagation();
  });
  if (typeof state !== "undefined" && state.sidebarOpen && state.sidebarSelectedEx) {
    wrap.classList.add("swap-target");
  }

  // Heading row: "A1) Back Squat" left, target spec right
  const head = document.createElement("div");
  head.className = "paper-exercise-head";
  const numLabel = `${block.letter}${isSuperset ? (ei + 1) : ""})`;

  // Target spec: try to derive from ex (e.g. "4 × 1-5 @ RPE 8")
  const numSets = ex.sets || 3;
  let targetSpec = `${numSets} &times; ${ex.reps || "?"}`;
  if (ex.tempo) targetSpec += ` &middot; ${ex.tempo}`;

  head.innerHTML = `
    <div class="paper-ex-left">
      <span class="paper-ex-no">${numLabel}</span>
      <span class="paper-ex-name">${escapeHtml(ex.name || "")}</span>
    </div>
    <div class="paper-ex-target">${targetSpec}</div>
    <button class="paper-ex-edit" aria-label="Edit sets" title="Edit sets">&#9998;</button>
    <button class="paper-ex-swap" aria-label="Swap exercise">&hArr;</button>
    <button class="paper-ex-menu" aria-label="Exercise menu">&middot;&middot;&middot;</button>
  `;
  const openEditorAtFirstIncomplete = () => {
    if (typeof openSetEditor !== "function") return;
    const lib = (typeof LIB_BY_ID !== "undefined") ? (LIB_BY_ID[ex.exId] || ex) : ex;
    const bw = lib.bodyweight;
    // Open editor on first incomplete set (fallback to set 0).
    const nSets = ex.sets || 3;
    let target = 0;
    for (let i = 0; i < nSets; i++) {
      const st = (typeof getInput === "function")
        ? getInput(inputKey(block.id, ei, i, "status"), null) : null;
      if (st !== "done") { target = i; break; }
    }
    openSetEditor(block, ex, bi, ei, target, bw);
  };
  const editBtn = head.querySelector(".paper-ex-edit");
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openEditorAtFirstIncomplete();
  });
  const nameEl = head.querySelector(".paper-ex-name");
  if (nameEl) {
    nameEl.style.cursor = "pointer";
    nameEl.addEventListener("click", (e) => {
      // Defer to swap mode (wrap-level handler will perform the swap).
      if (typeof state !== "undefined" && state.sidebarOpen && state.sidebarSelectedEx) return;
      e.stopPropagation();
      openEditorAtFirstIncomplete();
    });
  }
  const swapBtn = head.querySelector(".paper-ex-swap");
  swapBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (typeof openSidebar === "function") {
      const libEx = (typeof LIB_BY_ID !== "undefined") ? LIB_BY_ID[ex.exId] : null;
      const cat = libEx ? libEx.cat : (block.type === "warmup" ? "Warmup" : null);
      openSidebar(cat, bi, ei);
    }
  });
  const menuBtn = head.querySelector(".paper-ex-menu");
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (typeof openExerciseMenu === "function") openExerciseMenu(block, ex, bi, ei);
  });
  wrap.appendChild(head);

  // Margin note for ex.notes — handwritten in red with scribbled arrow
  if (ex.notes) {
    const noteWrap = document.createElement("div");
    noteWrap.className = "paper-ex-note-wrap";
    noteWrap.innerHTML = paperMarginNote(escapeHtml(ex.notes), PAPER.inkRed);
    wrap.appendChild(noteWrap);
  }

  // Set list — flat indented rows. Skip for warmups (just a "mark done" line).
  if (!ex.isWarmup) {
    wrap.appendChild(paperRenderSetsTable(block, ex, bi, ei));
  } else {
    const w = document.createElement("button");
    w.className = "paper-warmup-done";
    w.textContent = "☐ mark warm-up done";
    w.addEventListener("click", function() {
      this.classList.toggle("done");
      this.textContent = this.classList.contains("done") ? "☒ warm-up done" : "☐ mark warm-up done";
      if (navigator.vibrate) navigator.vibrate(10);
    });
    wrap.appendChild(w);
  }

  return wrap;
}

function paperRenderSetsTable(block, ex, bi, ei) {
  const lib = (typeof LIB_BY_ID !== "undefined") ? (LIB_BY_ID[ex.exId] || ex) : ex;
  const bw = lib.bodyweight;
  const list = document.createElement("div");
  list.className = "paper-set-list";

  // Previous-session "last lifted" inline — handwritten kicker
  if (typeof getPrevDaySetsFor === "function") {
    const prevSets = getPrevDaySetsFor(state.currentDayId, ex.exId || ex.name);
    if (prevSets.length) {
      const prev = document.createElement("div");
      prev.className = "paper-prev-session";
      const items = prevSets.map(s =>
        (s.bodyweight || s.weight === 0) ? `${s.reps}r` : `${s.weight}&times;${s.reps}`
      ).join(" &middot; ");
      prev.innerHTML = `<span class="paper-prev-label">last:</span> ${items}`;
      list.appendChild(prev);
    }
  }

  const numSets = ex.sets || 3;
  const repsLabel = ex.isTime ? "s" : ex.isDistance ? "m" : "reps";
  const last = (typeof getLastSetsFor === "function") ? getLastSetsFor(ex.exId || ex.name) : [];

  for (let i = 0; i < numSets; i++) {
    const lastSet = last[i] || last[last.length - 1];
    const wkey = inputKey(block.id, ei, i, "w");
    const rkey = inputKey(block.id, ei, i, "r");
    const pkey = inputKey(block.id, ei, i, "p");
    const statusKey = inputKey(block.id, ei, i, "status");

    const curW = getInput(wkey, lastSet?.weight ?? ex.defaultWeight ?? 0);
    const curR = getInput(rkey, lastSet?.reps ?? ex.reps);
    const curP = getInput(pkey, 7);
    const status = getInput(statusKey, null);
    const done = status === "done";
    const skipped = status === "skipped";

    const row = document.createElement("div");
    row.className = "paper-set-row";
    if (done) row.classList.add("set-done");
    if (skipped) row.classList.add("set-skipped");
    row.dataset.setIdx = i;

    const ink = paperInkColor();
    const weightDisp = bw ? "" : `${curW} lb`;
    const repsDisp = `${curR} ${repsLabel}`;
    const rpeDisp = lib.noRpe ? "" : String(curP);

    // Strikethrough completed values; plain when not done
    const weightHtml = bw ? "" :
      `<span class="paper-set-weight" data-field="w">${
        done ? paperStrikeWrap(weightDisp, ink) : weightDisp
      }</span>
       <span class="paper-set-x">&times;</span>`;
    const repsHtml = `<span class="paper-set-reps" data-field="r">${
      done ? paperStrikeWrap(repsDisp, ink) : repsDisp
    }</span>`;
    const rpeHtml = lib.noRpe ? "" :
      `<span class="paper-set-rpe-lbl">RPE</span>
       <span class="paper-set-rpe-val" data-field="p">${rpeDisp}</span>`;

    row.innerHTML = `
      <span class="paper-set-idx">${i + 1}.</span>
      <span class="paper-set-box" role="checkbox" aria-checked="${done}">
        ${paperCheckboxSvg(done, ink, 18)}
      </span>
      ${weightHtml}
      ${repsHtml}
      ${rpeHtml}
    `;
    paperWireSetRow(row, block, ex, bi, ei, i, bw);
    list.appendChild(row);
  }

  // Add-set affordance — handwritten, no box
  const addBtn = document.createElement("button");
  addBtn.className = "paper-add-set";
  addBtn.textContent = "+ add set";
  addBtn.addEventListener("click", () => {
    if (typeof mutateDay === "function") {
      mutateDay(d => { d.blocks[bi].exercises[ei].sets++; });
      renderWorkoutScreen();
    }
  });
  list.appendChild(addBtn);

  return list;
}

// Wire interactions on a paper set row — mirrors wireChip() in 10-render-workout.js.
// Handles: checkbox tap → toggle done, swipe right → done, swipe left → skipped,
// weight/reps/rpe tap → openInlineEditor. Row-tap on empty space is inert;
// the set editor only opens from the pencil button or exercise name (handled
// in paperRenderExercise / paperRenderFocusView).
function paperWireSetRow(row, block, ex, bi, ei, setIdx, bw) {
  const statusKey = inputKey(block.id, ei, setIdx, "status");

  function toggleDone() {
    const wasDone = row.classList.contains("set-done");
    row.classList.remove("set-done", "set-skipped");
    if (!wasDone) {
      row.classList.add("set-done");
      if (state.workoutStartedAt && typeof showHeaderRest === "function") {
        showHeaderRest(90);
      }
    }
    saveInput(statusKey, wasDone ? null : "done");
    if (navigator.vibrate) navigator.vibrate(10);
    renderWorkoutScreen();
  }

  // Checkbox tap → toggle done
  const box = row.querySelector(".paper-set-box");
  let boxTapped = false;
  box.addEventListener("touchend", (e) => {
    e.stopPropagation();
    boxTapped = true;
    toggleDone();
  }, { passive: true });
  box.addEventListener("click", (e) => {
    e.stopPropagation();
    if (boxTapped) { boxTapped = false; return; }
    toggleDone();
  });

  // Swipe gestures: right → done, left → skipped
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
    if (isSwiping) {
      const dx = e.changedTouches[0].clientX - swStartX;
      row.style.transition = "transform 0.15s ease-out";
      row.style.transform = "";
      if (dx > 60) {
        const was = row.classList.contains("set-done");
        row.classList.remove("set-done", "set-skipped");
        if (!was) {
          row.classList.add("set-done");
          if (state.workoutStartedAt && typeof showHeaderRest === "function") showHeaderRest(90);
        }
        saveInput(statusKey, was ? null : "done");
        if (navigator.vibrate) navigator.vibrate(10);
        renderWorkoutScreen();
      } else if (dx < -60) {
        const was = row.classList.contains("set-skipped");
        row.classList.remove("set-done", "set-skipped");
        if (!was) row.classList.add("set-skipped");
        saveInput(statusKey, was ? null : "skipped");
        if (navigator.vibrate) navigator.vibrate(10);
        renderWorkoutScreen();
      }
      setTimeout(() => { row.style.transition = ""; }, 160);
    }
    // Row-tap on empty space is inert. User must tap the pencil/edit button
    // or the exercise name to open the set editor. Inline taps on weight /
    // reps / rpe spans still open the inline editor below.
  }, { passive: true });

  // Inline quick-edit on weight / reps / rpe spans
  ["w", "r", "p"].forEach(field => {
    const span = row.querySelector(`[data-field="${field}"]`);
    if (!span) return;
    let handled = false;
    span.addEventListener("touchend", (e) => {
      if (isSwiping) return;
      e.stopPropagation();
      handled = true;
      if (typeof openInlineEditor === "function") {
        openInlineEditor(span, field, block, ex, bi, ei, setIdx, bw);
      }
    });
    span.addEventListener("click", (e) => {
      e.stopPropagation();
      if (handled) { handled = false; return; }
      if (typeof openInlineEditor === "function") {
        openInlineEditor(span, field, block, ex, bi, ei, setIdx, bw);
      }
    });
  });
}

// Minimal HTML escape — names from user data may include &, <, >, etc.
function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Replace the bottom nav DOM with the design's PaperNav: cream-deep bar
// with torn-edge top, 5 tabs (Timer · Lift · Log · PRs · Body), squiggle
// underline on the active tab. Preserves the existing data-screen wiring.
function paperRebuildBottomNav() {
  const nav = document.querySelector("nav.bottom");
  if (!nav || nav.dataset.paperBuilt === "1") return;
  // Determine current active tab from the existing buttons (which screen has .active class on its section)
  const tabs = [
    { id: "timer",    label: "Timer",    screen: null,       onClick: "openStandaloneTimer()" },
    { id: "workout",  label: "Lift",     screen: "workout"  },
    { id: "history",  label: "Log",      screen: "history"  },
    { id: "prs",      label: "PRs",      screen: "prs"      },
    { id: "body",     label: "Body",     screen: "body"     },
    { id: "settings", label: "Settings", screen: "settings" },
  ];
  const inkColor = paperInkColor();
  nav.innerHTML = `
    ${paperTornEdge("top", PAPER.creamDeep)}
    <div class="paper-nav-tabs">
      ${tabs.map(t => `
        <button class="paper-nav-tab" ${t.screen ? `data-screen="${t.screen}"` : ""}
                ${t.onClick ? `onclick="${t.onClick}"` : ""}>
          <span class="paper-nav-label">${t.label}</span>
          <svg class="paper-nav-squiggle" width="44" height="6" viewBox="0 0 44 6" aria-hidden="true">
            <path d="M2 4 Q 12 1, 22 3 T 42 2.5" fill="none"
              stroke="${inkColor}" stroke-width="2" stroke-linecap="round"
              style="filter:url(#paper-roughen);"/>
          </svg>
        </button>
      `).join("")}
    </div>
  `;
  nav.dataset.paperBuilt = "1";
  // initNav() in 20-toast-nav.js wires data-screen buttons on subsequent calls
  if (typeof initNav === "function") initNav();
}

// Update which paper-nav tab is highlighted as active.
function paperUpdateActiveNavTab(screenId) {
  const nav = document.querySelector("nav.bottom");
  if (!nav) return;
  nav.querySelectorAll(".paper-nav-tab").forEach(btn => {
    const id = btn.dataset.screen;
    btn.classList.toggle("active", id === screenId);
  });
}

// ─────────────────────────────────────────────────────────────
// DAY PICKER — flat notepad day cards (replaces .day-picker-card)
// ─────────────────────────────────────────────────────────────
// Produces the paper version of the "choose today's workout" screen.
// Wired through the existing renderDayPicker dispatcher.
// Reuses class names .dpc-controls-outer, .tb-target-row, .tb-step,
// .tb-target-val, .tb-start-row, .tb-start-btn, .tb-adj-preview so
// the time-budget wiring (_wireTimeBudgetCard) still attaches.

function paperRenderDayPicker() {
  const container = document.getElementById("blocksContainer");
  const u = (typeof userData === "function") ? userData() : null;
  if (!container || !u) return;

  const tpl = (typeof PROGRAM_TEMPLATES !== "undefined")
    ? (PROGRAM_TEMPLATES.find(t => t.id === u.templateId) || PROGRAM_TEMPLATES[0])
    : null;

  const dayNameEl = document.getElementById("dayName");
  const daySubEl = document.getElementById("daySub");
  if (dayNameEl) dayNameEl.textContent = "Today's Workout";
  if (daySubEl) {
    daySubEl.textContent = (tpl ? tpl.name : "") + (u.totalWeeks ? " · Week " + (u.currentWeek || 1) + " of " + u.totalWeeks : "");
  }

  const startBtn = document.getElementById("headerStartBtn");
  const finishBtn = document.getElementById("headerFinishBtn");
  if (startBtn) startBtn.classList.remove("active");
  if (finishBtn) finishBtn.classList.remove("active");

  container.innerHTML = "";

  // Rest-day branch
  const todayDow = new Date().getDay();
  const sched = (Array.isArray(u.weeklySchedule) && u.weeklySchedule.length === 7) ? u.weeklySchedule : null;
  const isRestToday = sched && sched[todayDow] == null;

  if (isRestToday) {
    const dowName = (typeof _DOW_LABELS_LONG !== "undefined") ? _DOW_LABELS_LONG[todayDow] : "today";
    if (dayNameEl) dayNameEl.textContent = "Rest Day";
    if (daySubEl) daySubEl.textContent = "Recovery scheduled — every " + dowName;

    const rest = document.createElement("div");
    rest.className = "paper-rest-card";
    rest.innerHTML = `
      <div class="paper-rest-kicker">today &middot; rest day</div>
      <div class="paper-rest-title">Recover</div>
      <div class="paper-rest-sub">Every ${escapeHtml(dowName)} is set as rest. Mobility, sleep, food.</div>
    `;
    const actions = document.createElement("div");
    actions.className = "paper-rest-actions";

    const trainBtn = document.createElement("button");
    trainBtn.className = "paper-stamp-btn";
    trainBtn.innerHTML = `<span>Train anyway</span>`;
    trainBtn.onclick = () => {
      state.restOverride = true;
      if (typeof openTrainAnywayPicker === "function") openTrainAnywayPicker();
    };
    actions.appendChild(trainBtn);

    const editBtn = document.createElement("button");
    editBtn.className = "paper-link-btn";
    editBtn.textContent = "edit schedule →";
    editBtn.onclick = () => {
      if (typeof openWeeklyScheduleEditor === "function") openWeeklyScheduleEditor();
    };
    actions.appendChild(editBtn);

    rest.appendChild(actions);
    container.appendChild(rest);
    return;
  }

  // Normal branch — hero day + others
  const nextId = (typeof determineDefaultDay === "function") ? determineDefaultDay() : (u.program[0] && u.program[0].id);
  const nextDay = u.program.find(d => d.id === nextId) || u.program[0];
  const picker = document.createElement("div");
  picker.className = "paper-day-picker";

  picker.appendChild(paperBuildDayCard(nextDay, true));

  const others = u.program.filter(d => d.id !== nextDay.id);
  if (others.length) {
    const toggle = document.createElement("button");
    toggle.className = "paper-day-picker-toggle";
    toggle.textContent = `+ other workouts (${others.length})`;
    const otherWrap = document.createElement("div");
    otherWrap.className = "paper-day-picker-others";
    otherWrap.style.display = "none";
    others.forEach(d => otherWrap.appendChild(paperBuildDayCard(d, false)));
    toggle.onclick = () => {
      const showing = otherWrap.style.display !== "none";
      otherWrap.style.display = showing ? "none" : "";
      toggle.textContent = (showing ? "+ other workouts" : "− hide other workouts") + ` (${others.length})`;
    };
    picker.appendChild(toggle);
    picker.appendChild(otherWrap);
  }

  container.appendChild(picker);
}

function paperBuildDayCard(d, isHero) {
  const card = document.createElement("div");
  card.className = "paper-day-card" + (isHero ? " paper-day-card-hero" : "");
  card.dataset.dayId = d.id;

  const breakdown = (typeof getSessionBreakdown === "function") ? getSessionBreakdown(d) : { totalMin: 30, warmupSec: 300, workingSec: 1200, cooldownSec: 300 };
  const wuMin = Math.round(breakdown.warmupSec / 60);
  const wkMin = Math.round(breakdown.workingSec / 60);
  const cdMin = Math.round(breakdown.cooldownSec / 60);

  const totalSets = d.blocks.reduce((n, b) => n + b.exercises.reduce((s, ex) => s + (ex.sets || 0), 0), 0);
  const blockLetters = d.blocks.map(b => b.letter).join(" ");

  const todayKicker = isHero
    ? `<div class="paper-day-card-kicker">today &middot; day ${String(d.id).padStart(2, "0")}</div>`
    : `<div class="paper-day-card-kicker">day ${String(d.id).padStart(2, "0")}</div>`;

  const blockTagsHtml = d.blocks.map(b =>
    `<span class="paper-day-block-tag">${b.letter} &middot; ${escapeHtml(b.name)}</span>`
  ).join("");

  const metricsHtml = isHero ? `
    <div class="paper-day-metrics">
      <div class="paper-day-metric">
        <div class="paper-day-metric-label">Sets</div>
        <div class="paper-day-metric-val">${String(totalSets).padStart(2, "0")}</div>
        <div class="paper-day-metric-sub">${d.blocks.length} blocks</div>
      </div>
      <div class="paper-day-metric">
        <div class="paper-day-metric-label">Blocks</div>
        <div class="paper-day-metric-val">${String(d.blocks.length).padStart(2, "0")}</div>
        <div class="paper-day-metric-sub">${escapeHtml(blockLetters)}</div>
      </div>
      <div class="paper-day-metric">
        <div class="paper-day-metric-label">Est.</div>
        <div class="paper-day-metric-val">${breakdown.totalMin}</div>
        <div class="paper-day-metric-sub">min</div>
      </div>
    </div>
  ` : "";

  const defaultTarget = Math.round(breakdown.totalMin / 5) * 5;

  card.innerHTML = `
    ${todayKicker}
    <div class="paper-day-card-name">${escapeHtml(d.name || "")}</div>
    ${d.sub ? `<div class="paper-day-card-sub">${escapeHtml(d.sub)}</div>` : ""}
    <div class="paper-day-block-list">${blockTagsHtml}</div>
    ${metricsHtml}
    <div class="paper-day-card-time">
      <span class="paper-day-card-time-total picker-duration">⏱ ~${breakdown.totalMin} min</span>
      <span class="paper-day-card-time-split picker-breakdown">WU ${wuMin}m &middot; Work ${wkMin}m &middot; CD ${cdMin}m</span>
    </div>
    <button class="paper-day-card-expand dpc-expand-hint">
      <span class="dpc-chevron">▾</span> adjust time
    </button>
    <div class="dpc-controls-outer">
      <div class="dpc-controls-inner">
        <div class="tb-target-row paper-tb-row" data-day-id="${d.id}">
          <span class="tb-target-label">Target</span>
          <button class="tb-step tb-down paper-tb-step" data-dir="-1">−</button>
          <span class="tb-target-val paper-tb-val">${defaultTarget}</span>
          <span class="tb-target-unit">min</span>
          <button class="tb-step tb-up paper-tb-step" data-dir="1">+</button>
        </div>
        <div class="tb-adj-preview" data-day-id="${d.id}"></div>
        <div class="tb-start-row paper-tb-start-row" data-day-id="${d.id}">
          <button class="tb-start-btn paper-start-stamp" data-day-id="${d.id}">Start workout</button>
        </div>
      </div>
    </div>
  `;

  // Tapping the card opens the workout (unless the tap was on the time-budget controls or the expand hint)
  card.addEventListener("click", (e) => {
    if (e.target.closest(".dpc-controls-inner") || e.target.closest(".dpc-expand-hint")) return;
    state.currentDayId = d.id;
    state.dayChosen = true;
    if (typeof openWorkout === "function") openWorkout();
  });

  // "Adjust time" link toggles the config panel
  const expand = card.querySelector(".dpc-expand-hint");
  if (expand) {
    expand.addEventListener("click", (e) => {
      e.stopPropagation();
      card.classList.toggle("expanded");
    });
  }

  if (typeof _wireTimeBudgetCard === "function") {
    _wireTimeBudgetCard(card, d, breakdown);
  }
  return card;
}

// ============================================================
// PAPER FOCUS VIEW — single-superset page (SupersetFocusScreen)
// Mirrors /tmp/design-bundle/.../paper-other-screens.jsx:813.
// Reuses paperRenderSetsTable for set rows (same handlers).
// ============================================================

// Find the first not-done set in a block. Returns { exIdx, setIdx, allDone }.
function paperFindActiveSet(block) {
  if (!block || !block.exercises) return { exIdx: 0, setIdx: 0, allDone: true };
  for (let ei = 0; ei < block.exercises.length; ei++) {
    const ex = block.exercises[ei];
    if (ex.isWarmup) continue;
    const nSets = ex.sets || 3;
    for (let si = 0; si < nSets; si++) {
      const st = (typeof getInput === "function")
        ? getInput(inputKey(block.id, ei, si, "status"), null) : null;
      if (st !== "done") return { exIdx: ei, setIdx: si, allDone: false };
    }
  }
  return { exIdx: 0, setIdx: 0, allDone: true };
}

// Find the next non-cooldown block index after/before bi, or null at endpoints.
function paperFindNextBlockIdx(day, bi, dir) {
  if (!day || !day.blocks) return null;
  const step = dir > 0 ? 1 : -1;
  for (let i = bi + step; i >= 0 && i < day.blocks.length; i += step) {
    return i;
  }
  return null;
}

function paperBuildActionBar(day, block, activeExIdx, activeSetIdx, allDone) {
  const bar = document.createElement("div");
  bar.className = "paper-action-bar";

  const ex = block.exercises[activeExIdx] || block.exercises[0];
  const lib = (typeof LIB_BY_ID !== "undefined") ? (LIB_BY_ID[ex.exId] || ex) : ex;
  const bw = lib.bodyweight;
  const isKg = (typeof state !== "undefined" && state.unit === "kg");
  const unit = isKg ? "kg" : "lb";
  const step = isKg ? 2.5 : 5;

  // EDITING label
  const lbl = document.createElement("div");
  lbl.className = "paper-action-edit-label";
  if (allDone) {
    lbl.innerHTML = `<span class="pa-label-pre">EDITING &rarr;</span> <span class="pa-label-target">${escapeHtml(block.name || "")} &middot; ALL DONE</span>`;
  } else {
    lbl.innerHTML = `<span class="pa-label-pre">EDITING &rarr;</span> <span class="pa-label-target">${escapeHtml(ex.name || "")} &middot; Set ${activeSetIdx + 1}</span>`;
  }
  bar.appendChild(lbl);

  const row = document.createElement("div");
  row.className = "paper-action-row";

  // REST button
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
    if (navigator.vibrate) navigator.vibrate(10);
  });
  row.appendChild(restBtn);

  // WEIGHT stepper (skip for bodyweight)
  const wWrap = document.createElement("div");
  wWrap.className = "paper-action-weight";
  if (bw) {
    wWrap.classList.add("paper-action-weight-bw");
    wWrap.innerHTML = `<div class="pa-weight-label">Weight</div><div class="pa-weight-bw">BW</div>`;
  } else {
    const wkey = inputKey(block.id, activeExIdx, activeSetIdx, "w");
    const last = (typeof getLastSetsFor === "function") ? getLastSetsFor(ex.exId || ex.name) : [];
    const lastSet = last[activeSetIdx] || last[last.length - 1];
    const cur = (typeof getInput === "function")
      ? getInput(wkey, lastSet?.weight ?? ex.defaultWeight ?? 0) : 0;
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
      if (typeof saveInput === "function") saveInput(wkey, v);
      if (navigator.vibrate) navigator.vibrate(5);
      if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
    };
    minus.addEventListener("click", (e) => { e.stopPropagation(); apply(-step); });
    plus.addEventListener("click", (e) => { e.stopPropagation(); apply(+step); });
  }
  row.appendChild(wWrap);

  // SWAP button
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
      const cat = libEx ? libEx.cat : (block.type === "warmup" ? "Warmup" : null);
      openSidebar(cat, state.focusBlockIdx, activeExIdx);
    }
  });
  row.appendChild(swapBtn);

  // LOG SET — primary stamp
  const logBtn = document.createElement("button");
  logBtn.className = "paper-action-log";
  logBtn.disabled = !!allDone;
  logBtn.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12 l5 5 L20 6"/>
    </svg>
    <span>Log set</span>
  `;
  logBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (allDone) return;
    const statusKey = inputKey(block.id, activeExIdx, activeSetIdx, "status");
    if (typeof saveInput === "function") saveInput(statusKey, "done");
    if (typeof showHeaderRest === "function") showHeaderRest(restSec);
    if (navigator.vibrate) navigator.vibrate(15);
    if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
  });
  row.appendChild(logBtn);

  bar.appendChild(row);
  return bar;
}

function paperRenderFocusView(container, day) {
  if (!day || !day.blocks || !day.blocks.length) return;
  // Clamp focusBlockIdx into a real block range (no cooldown handling here).
  let bi = state.focusBlockIdx;
  if (bi == null || bi < 0 || bi >= day.blocks.length) bi = 0;
  state.focusBlockIdx = bi;
  const block = day.blocks[bi];
  const total = day.blocks.length;

  const wrap = document.createElement("div");
  wrap.className = "paper-focus-view";

  // ── TOP BAR ──
  const top = document.createElement("div");
  top.className = "paper-focus-topbar";

  const back = document.createElement("button");
  back.className = "paper-focus-back";
  back.setAttribute("aria-label", "Back to overview");
  back.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         style="filter:url(#paper-roughen);">
      <path d="M13 4 L6 10 L13 16"/>
    </svg>
  `;
  const exitFocus = () => {
    state.workoutView = "chapters";
    state.focusBlockIdx = null;
    state.focusExIdx = 0;
    if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
  };
  back.addEventListener("click", (e) => { e.stopPropagation(); exitFocus(); });
  top.appendChild(back);

  const crumb = document.createElement("div");
  crumb.className = "paper-focus-breadcrumb";
  crumb.textContent = day.name || day.label || "Workout";
  top.appendChild(crumb);

  const pageInd = document.createElement("div");
  pageInd.className = "paper-focus-pageind";
  pageInd.textContent = (bi + 1) + " / " + total;
  top.appendChild(pageInd);

  const close = document.createElement("button");
  close.className = "paper-focus-close";
  close.setAttribute("aria-label", "Close focus view");
  close.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round"
         style="filter:url(#paper-roughen);">
      <path d="M6 6 L18 18 M18 6 L6 18"/>
    </svg>
  `;
  close.addEventListener("click", (e) => { e.stopPropagation(); exitFocus(); });
  top.appendChild(close);

  wrap.appendChild(top);

  // ── TITLE ROW with prev/next chevrons ──
  const titleRow = document.createElement("div");
  titleRow.className = "paper-focus-title-row";

  const prevIdx = paperFindNextBlockIdx(day, bi, -1);
  const nextIdx = paperFindNextBlockIdx(day, bi, +1);

  const prevChev = document.createElement("button");
  prevChev.className = "paper-focus-chev paper-focus-chev-prev" + (prevIdx == null ? " disabled" : "");
  prevChev.setAttribute("aria-label", "Previous block");
  prevChev.disabled = prevIdx == null;
  prevChev.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         style="filter:url(#paper-roughen);">
      <path d="M15 5 L8 12 L15 19"/>
    </svg>
  `;
  prevChev.addEventListener("click", (e) => {
    e.stopPropagation();
    if (prevIdx == null) return;
    state.focusBlockIdx = prevIdx;
    state.focusExIdx = 0;
    if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
  });
  titleRow.appendChild(prevChev);

  const title = document.createElement("div");
  title.className = "paper-focus-title";
  const isSuperset = (block.exercises || []).length > 1;
  // NOW marker lives on the superset title — user works the whole superset,
  // not one exercise at a time.
  const blockHasIncomplete = (() => {
    for (const ex of (block.exercises || [])) {
      if (ex.isWarmup) continue;
      const n = ex.sets || 3;
      for (let i = 0; i < n; i++) {
        const st = (typeof getInput === "function")
          ? getInput(inputKey(block.id, 0, i, "status"), null) : null;
        if (st !== "done") return true;
      }
    }
    return false;
  })();
  title.innerHTML = `<span class="paper-focus-title-name">${escapeHtml((block.name || "") + (isSuperset ? " (superset)" : ""))}</span>${blockHasIncomplete ? '<span class="paper-focus-title-now">&middot; NOW</span>' : ''}`;
  titleRow.appendChild(title);

  const nextChev = document.createElement("button");
  nextChev.className = "paper-focus-chev paper-focus-chev-next" + (nextIdx == null ? " disabled" : "");
  nextChev.setAttribute("aria-label", "Next block");
  nextChev.disabled = nextIdx == null;
  nextChev.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         style="filter:url(#paper-roughen);">
      <path d="M9 5 L16 12 L9 19"/>
    </svg>
  `;
  nextChev.addEventListener("click", (e) => {
    e.stopPropagation();
    if (nextIdx == null) return;
    state.focusBlockIdx = nextIdx;
    state.focusExIdx = 0;
    if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
  });
  titleRow.appendChild(nextChev);

  wrap.appendChild(titleRow);

  // Rest hint
  const restLine = document.createElement("div");
  restLine.className = "paper-focus-restline";
  const restSec = block.exercises[0]?.rest;
  if (restSec) {
    const fmt = (typeof formatRest === "function") ? formatRest(restSec) : (restSec + "s");
    restLine.textContent = "rest " + fmt + " between rounds";
  }
  wrap.appendChild(restLine);

  // ── EXERCISE LIST ──
  const active = paperFindActiveSet(block);
  const exList = document.createElement("div");
  exList.className = "paper-focus-exlist";
  (block.exercises || []).forEach((ex, ei) => {
    // In a superset, all partner exercises are equally "active" — user is
    // working the whole superset. No per-exercise size/emphasis distinction.
    const exWrap = document.createElement("div");
    exWrap.className = "paper-focus-exercise";

    const head = document.createElement("div");
    head.className = "paper-focus-ex-head";
    const numLabel = `${block.letter}${isSuperset ? (ei + 1) : ""}`;
    const nSets = ex.sets || 3;
    let targetSpec = `${nSets} &times; ${ex.reps || "?"}`;
    if (ex.tempo) targetSpec += ` &middot; ${ex.tempo}`;
    head.innerHTML = `
      <div class="paper-focus-ex-left">
        <span class="paper-focus-ex-no">${numLabel}</span>
        <span class="paper-focus-ex-name">${escapeHtml(ex.name || "")}</span>
      </div>
      <span class="paper-focus-ex-target">${targetSpec}</span>
      <button class="paper-ex-edit" aria-label="Edit sets" title="Edit sets">&#9998;</button>
      <button class="paper-ex-swap" aria-label="Swap exercise">&hArr;</button>
      <button class="paper-ex-menu" aria-label="Exercise menu">&middot;&middot;&middot;</button>
    `;
    head.querySelector(".paper-ex-edit").addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof openSetEditor !== "function") return;
      const lib = (typeof LIB_BY_ID !== "undefined") ? (LIB_BY_ID[ex.exId] || ex) : ex;
      const bw = lib.bodyweight;
      const nSets = ex.sets || 3;
      let target = 0;
      for (let i = 0; i < nSets; i++) {
        const st = (typeof getInput === "function")
          ? getInput(inputKey(block.id, ei, i, "status"), null) : null;
        if (st !== "done") { target = i; break; }
      }
      openSetEditor(block, ex, bi, ei, target, bw);
    });
    head.querySelector(".paper-ex-swap").addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof openSidebar === "function") {
        const libEx = (typeof LIB_BY_ID !== "undefined") ? LIB_BY_ID[ex.exId] : null;
        const cat = libEx ? libEx.cat : (block.type === "warmup" ? "Warmup" : null);
        openSidebar(cat, bi, ei);
      }
    });
    head.querySelector(".paper-ex-menu").addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof openExerciseMenu === "function") openExerciseMenu(block, ex, bi, ei);
    });
    const focusNameEl = head.querySelector(".paper-focus-ex-name");
    if (focusNameEl && !ex.isWarmup) {
      focusNameEl.style.cursor = "pointer";
      focusNameEl.addEventListener("click", (e) => {
        e.stopPropagation();
        if (typeof openSetEditor !== "function") return;
        const lib = (typeof LIB_BY_ID !== "undefined") ? (LIB_BY_ID[ex.exId] || ex) : ex;
        const bw = lib.bodyweight;
        let target = 0;
        for (let i = 0; i < nSets; i++) {
          const st = (typeof getInput === "function")
            ? getInput(inputKey(block.id, ei, i, "status"), null) : null;
          if (st !== "done") { target = i; break; }
        }
        openSetEditor(block, ex, bi, ei, target, bw);
      });
    }
    exWrap.appendChild(head);

    if (ex.notes) {
      const noteWrap = document.createElement("div");
      noteWrap.className = "paper-focus-ex-note";
      noteWrap.innerHTML = (typeof paperMarginNote === "function")
        ? paperMarginNote(escapeHtml(ex.notes), (typeof PAPER !== "undefined" ? PAPER.inkRed : "#a83a2a"))
        : `<div class="paper-margin-note">${escapeHtml(ex.notes)}</div>`;
      exWrap.appendChild(noteWrap);
    }

    if (!ex.isWarmup) {
      exWrap.appendChild(paperRenderSetsTable(block, ex, bi, ei));
    } else {
      const w = document.createElement("button");
      w.className = "paper-warmup-done";
      w.textContent = "☐ mark warm-up done";
      w.addEventListener("click", function() {
        this.classList.toggle("done");
        this.textContent = this.classList.contains("done") ? "☒ warm-up done" : "☐ mark warm-up done";
        if (navigator.vibrate) navigator.vibrate(10);
      });
      exWrap.appendChild(w);
    }

    exList.appendChild(exWrap);
  });
  wrap.appendChild(exList);

  // ── PAGE DOTS ──
  const dots = document.createElement("div");
  dots.className = "paper-focus-dots";
  for (let i = 0; i < total; i++) {
    const d = document.createElement("button");
    d.className = "paper-focus-dot" + (i === bi ? " active" : "");
    d.setAttribute("aria-label", "Go to block " + (i + 1));
    d.addEventListener("click", (e) => {
      e.stopPropagation();
      state.focusBlockIdx = i;
      state.focusExIdx = 0;
      if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
    });
    dots.appendChild(d);
  }
  wrap.appendChild(dots);

  const swipeHint = document.createElement("div");
  swipeHint.className = "paper-focus-swipe-hint";
  swipeHint.textContent = "← swipe between blocks →";
  wrap.appendChild(swipeHint);

  // ── ACTION BAR ──
  wrap.appendChild(paperBuildActionBar(day, block, active.exIdx, active.setIdx, active.allDone));

  container.appendChild(wrap);
}

if (typeof window !== "undefined") {
  window.paperRenderBlock = paperRenderBlock;
  window.paperRenderExercise = paperRenderExercise;
  window.paperRenderSetsTable = paperRenderSetsTable;
  window.paperWireSetRow = paperWireSetRow;
  window.paperRebuildBottomNav = paperRebuildBottomNav;
  window.paperUpdateActiveNavTab = paperUpdateActiveNavTab;
  window.paperRenderDayPicker = paperRenderDayPicker;
  window.paperBuildDayCard = paperBuildDayCard;
  window.paperRenderFocusView = paperRenderFocusView;
  window.paperBuildActionBar = paperBuildActionBar;
  window.paperFindActiveSet = paperFindActiveSet;
}
