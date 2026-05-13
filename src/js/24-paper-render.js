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
    <span class="paper-superset-id">${block.letter} &middot; ${block.name}${isSuperset ? " (superset)" : ""}</span>
    <span class="paper-superset-rest">${restStr}</span>
    <button class="paper-block-menu" aria-label="Block menu">&middot;&middot;&middot;</button>
  `;
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
    <button class="paper-ex-swap" aria-label="Swap exercise">&hArr;</button>
    <button class="paper-ex-menu" aria-label="Exercise menu">&middot;&middot;&middot;</button>
  `;
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
// row tap → openSetEditor, weight/reps/rpe tap → openInlineEditor.
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
      return;
    }
    // Tap on row (not on inline-edit field) → open full set editor
    if (e.target.closest("[data-field]") || e.target.closest(".paper-set-box")) return;
    if (typeof openSetEditor === "function") {
      openSetEditor(block, ex, bi, ei, setIdx, bw);
    }
  }, { passive: true });

  // Desktop click fallback
  row.addEventListener("click", (e) => {
    if (isSwiping) return;
    if (e.target.closest("[data-field]") || e.target.closest(".paper-set-box")) return;
    if (typeof openSetEditor === "function") {
      openSetEditor(block, ex, bi, ei, setIdx, bw);
    }
  });

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
    { id: "timer",   label: "Timer",   screen: null,      onClick: "openStandaloneTimer()" },
    { id: "workout", label: "Lift",    screen: "workout" },
    { id: "history", label: "Log",     screen: "history" },
    { id: "prs",     label: "PRs",     screen: "prs" },
    { id: "body",    label: "Body",    screen: "body" },
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

if (typeof window !== "undefined") {
  window.paperRenderBlock = paperRenderBlock;
  window.paperRenderExercise = paperRenderExercise;
  window.paperRenderSetsTable = paperRenderSetsTable;
  window.paperWireSetRow = paperWireSetRow;
  window.paperRebuildBottomNav = paperRebuildBottomNav;
  window.paperUpdateActiveNavTab = paperUpdateActiveNavTab;
}
