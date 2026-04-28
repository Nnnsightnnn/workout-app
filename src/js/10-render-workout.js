// ============================================================
// RENDER: Workout
// ============================================================

// Cooldown stretch pool — curated combos rotated by dayId + weekNum
const CD_STRETCHES = [
  // 0-4: Original stretches
  { exId: "hipflexorstretch", name: "Hip Flexor Stretch", muscles: ["hip flexors"], isTime: true, perSide: true, reps: 45 },
  { exId: "hamstringstretch", name: "Hamstring Stretch", muscles: ["hamstrings"], isTime: true, reps: 45 },
  { exId: "thoracicrot", name: "Thoracic Rotation", muscles: ["thoracic", "upper back"], perSide: true, reps: 8 },
  { exId: "pigeonpose", name: "Pigeon Pose", muscles: ["hips", "glutes"], isTime: true, perSide: true, reps: 60 },
  { exId: "childpose", name: "Child's Pose", muscles: ["shoulders", "hips", "thoracic"], isTime: true, reps: 60 },
  // 5-9: Lower body focus
  { exId: "quadstretch", name: "Standing Quad Stretch", muscles: ["quads", "hip flexors"], isTime: true, perSide: true, reps: 45 },
  { exId: "seatedforward", name: "Seated Forward Fold", muscles: ["hamstrings", "lower back"], isTime: true, reps: 60 },
  { exId: "butterflystretch", name: "Butterfly Stretch", muscles: ["hips", "adductors"], isTime: true, reps: 60 },
  { exId: "figurefour", name: "Figure-4 Stretch", muscles: ["hips", "glutes"], isTime: true, perSide: true, reps: 45 },
  { exId: "frogstretch", name: "Frog Stretch", muscles: ["adductors", "hips"], isTime: true, reps: 60 },
  // 10-14: Spinal / thoracic
  { exId: "catcow", name: "Cat-Cow", muscles: ["thoracic", "lower back"], reps: 10 },
  { exId: "lyingtwist", name: "Lying Spinal Twist", muscles: ["thoracic", "hips"], isTime: true, perSide: true, reps: 45 },
  { exId: "supinespinal", name: "Supine Spinal Twist", muscles: ["thoracic", "hips", "lower back"], isTime: true, perSide: true, reps: 45 },
  { exId: "seatedtwist", name: "Seated Spinal Twist", muscles: ["thoracic", "hips"], isTime: true, perSide: true, reps: 30 },
  { exId: "cobrapose", name: "Cobra Pose", muscles: ["lower back", "hip flexors"], isTime: true, reps: 45 },
  // 15-19: Upper body / shoulders
  { exId: "crossbodyshoulder", name: "Crossbody Shoulder Stretch", muscles: ["shoulders"], isTime: true, perSide: true, reps: 30 },
  { exId: "latstretch", name: "Lat Stretch", muscles: ["lats", "shoulders"], isTime: true, perSide: true, reps: 30 },
  { exId: "cheststretch", name: "Doorway Chest Stretch", muscles: ["chest", "shoulders"], isTime: true, perSide: true, reps: 30 },
  { exId: "eaglearms", name: "Eagle Arms Stretch", muscles: ["shoulders", "upper back"], isTime: true, perSide: true, reps: 30 },
  { exId: "threadneedle", name: "Thread the Needle", muscles: ["thoracic", "shoulders"], isTime: true, perSide: true, reps: 30 },
  // 20-24: Full body / misc
  { exId: "downdog", name: "Downward Dog", muscles: ["hamstrings", "calves", "shoulders"], isTime: true, reps: 45 },
  { exId: "happybaby", name: "Happy Baby Pose", muscles: ["hips", "hamstrings"], isTime: true, reps: 45 },
  { exId: "standingcalfstretch", name: "Standing Calf Stretch", muscles: ["calves"], isTime: true, perSide: true, reps: 30 },
  { exId: "kneelingquadstretch", name: "Kneeling Quad Stretch", muscles: ["quads", "hip flexors"], isTime: true, perSide: true, reps: 45 },
  { exId: "wallhamstring", name: "Wall Hamstring Stretch", muscles: ["hamstrings"], isTime: true, perSide: true, reps: 45 },
  // 25-29: Recovery / gentle
  { exId: "scorpionstretch", name: "Scorpion Stretch", muscles: ["hip flexors", "thoracic"], perSide: true, reps: 5 },
  { exId: "proneshoulder", name: "Prone Shoulder Stretch", muscles: ["shoulders", "chest"], isTime: true, reps: 45 },
  { exId: "standingside", name: "Standing Side Bend", muscles: ["obliques", "lats"], isTime: true, perSide: true, reps: 30 },
  { exId: "neckstretch", name: "Neck Side Stretch", muscles: ["traps"], isTime: true, perSide: true, reps: 20 },
  { exId: "wriststretch", name: "Wrist Flexor Stretch", muscles: ["grip"], isTime: true, reps: 30 },
];
// 24 curated combos — each picks 3 stretches with body-part balance (lower + upper/spine + recovery)
const CD_COMBOS = [
  [0, 2, 4],    // hip flexor, thoracic rot, child's pose
  [5, 11, 16],  // quad stretch, lying twist, lat stretch
  [1, 3, 15],   // hamstring, pigeon, crossbody shoulder
  [8, 10, 17],  // figure-4, cat-cow, chest stretch
  [6, 12, 18],  // seated forward, supine spinal, eagle arms
  [7, 14, 19],  // butterfly, cobra, thread the needle
  [9, 13, 20],  // frog stretch, seated twist, downward dog
  [0, 11, 27],  // hip flexor, lying twist, standing side
  [23, 25, 16], // kneeling quad, scorpion, lat stretch
  [24, 10, 15], // wall hamstring, cat-cow, crossbody shoulder
  [5, 12, 26],  // quad stretch, supine spinal, prone shoulder
  [1, 14, 18],  // hamstring, cobra, eagle arms
  [3, 13, 17],  // pigeon, seated twist, chest stretch
  [8, 2, 20],   // figure-4, thoracic rot, downward dog
  [21, 11, 28], // happy baby, lying twist, neck stretch
  [6, 25, 19],  // seated forward, scorpion, thread the needle
  [9, 26, 22],  // frog, prone shoulder, calf stretch
  [7, 10, 29],  // butterfly, cat-cow, wrist stretch
  [0, 3, 27],   // hip flexor, pigeon, standing side
  [23, 12, 15], // kneeling quad, supine spinal, crossbody shoulder
  [24, 14, 4],  // wall hamstring, cobra, child's pose
  [5, 13, 16],  // quad stretch, seated twist, lat stretch
  [1, 11, 17],  // hamstring, lying twist, chest stretch
  [8, 20, 28],  // figure-4, downward dog, neck stretch
];
function getCooldownExercises(dayId) {
  var u = (typeof userData === "function") ? userData() : null;
  var day = (u && u.program) ? u.program.find(function(d) { return d.id === dayId; }) : null;
  var overrides = (day && day.cooldownOverrides) || {};
  var idx = ((dayId || 1) - 1) % CD_COMBOS.length;
  return CD_COMBOS[idx].map(function(i, ci) {
    return overrides[ci] || CD_STRETCHES[i];
  });
}
// Backward-compat alias for time estimation
const COOLDOWN_EXERCISES = CD_STRETCHES;

function openCooldownSwapSheet(ci) {
  const current = getCooldownExercises(state.currentDayId)[ci];
  const wrap = document.createElement("div");

  const hdr = document.createElement("div");
  hdr.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;";
  hdr.innerHTML = '<h3 style="margin:0;">Swap Stretch</h3>';
  const closeBtn = document.createElement("button");
  closeBtn.className = "icon-btn";
  closeBtn.textContent = "\u2715";
  closeBtn.onclick = () => closeSheet();
  hdr.appendChild(closeBtn);
  wrap.appendChild(hdr);

  if (current) {
    const infoEl = document.createElement("div");
    infoEl.className = "eq-swap-current";
    infoEl.innerHTML = '<div class="eq-swap-name">' + current.name + '</div>'
      + '<div class="eq-swap-missing">Pick a replacement stretch</div>';
    wrap.appendChild(infoEl);
  }

  const list = document.createElement("div");
  list.className = "eq-swap-list";
  CD_STRETCHES.forEach(s => {
    if (current && s.exId === current.exId) return;
    const row = document.createElement("button");
    row.className = "eq-swap-row";

    const left = document.createElement("div");
    left.className = "eq-swap-row-info";
    const nm = document.createElement("div");
    nm.className = "eq-swap-row-name";
    nm.textContent = s.name;
    left.appendChild(nm);

    const meta = document.createElement("div");
    meta.className = "eq-swap-row-meta";
    const muscles = (s.muscles || []).slice(0, 2).join(", ");
    const dur = s.isTime
      ? (s.reps || 30) + "s" + (s.perSide ? "/side" : "")
      : (s.reps || 8) + " reps" + (s.perSide ? "/side" : "");
    meta.textContent = muscles + " \u00b7 " + dur;
    left.appendChild(meta);
    row.appendChild(left);

    const swapTag = document.createElement("span");
    swapTag.className = "eq-swap-row-action";
    swapTag.textContent = "Swap";
    row.appendChild(swapTag);

    row.onclick = () => {
      mutateDay(d => {
        if (!d.cooldownOverrides) d.cooldownOverrides = {};
        d.cooldownOverrides[ci] = deepClone(s);
      });
      saveInput(inputKey("__cooldown", ci, 0, "status"), null);
      closeSheet();
      showToast("Swapped to " + s.name, "success");
      renderWorkoutScreen();
    };
    list.appendChild(row);
  });
  wrap.appendChild(list);

  openSheet(wrap);
}

function renderWorkoutScreen() {
  state._rpPromptShownThisRender = false; // reset per-render prompt gate (§6)
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

  // Ad-hoc mode: delegate to its own renderer
  if (state.adhocActive) {
    renderAdhocScreen();
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
  // Show week/phase in sub
  var weekLabel = "";
  if (u.totalWeeks && u.currentWeek) {
    var phases = getPhasesForTemplate(u.templateId, u.totalWeeks);
    var phase = phases ? phaseForWeek(phases, u.currentWeek) : null;
    weekLabel = "Wk " + u.currentWeek + "/" + u.totalWeeks;
    if (phase) weekLabel += " · " + phase.name;
    weekLabel += " · ";
  }
  document.getElementById("daySub").textContent = weekLabel + (day.sub || "");


  renderTimelineStrip();

  container.innerHTML = "";

  // Phase 6: full-day preview (shown between Start tap and actual session start)
  if (state.workoutView === "preview") {
    renderDayPreview(container, day);
    updateFinishButton();
    updateProgress();
    return;
  }

  // View dispatcher: focus view or chapters (scrollable overview)
  if (state.workoutView === "focus" && state.focusBlockIdx != null) {
    renderFocusView(container, day);
    if (state.workoutStartedAt) renderStatsBar(container, day);
  } else {
    // Chapters view — all blocks scrollable (works both pre-start and active)
    renderChaptersView(container, day);
    if (state.workoutStartedAt) renderStatsBar(container, day);
  }

  updateFinishButton();
  updateProgress();
  updatePaceChip();
}

function renderDayPicker() {
  const container = document.getElementById("blocksContainer");
  const u = userData();
  if (!u) return;

  const tpl = PROGRAM_TEMPLATES.find(t => t.id === u.templateId) || PROGRAM_TEMPLATES[0];
  document.getElementById("dayBadge").textContent = "⊞";
  document.getElementById("dayName").textContent = "Today's Workout";
  document.getElementById("daySub").textContent = tpl.name + (u.totalWeeks ? " · Week " + (u.currentWeek || 1) + " of " + u.totalWeeks : "");

  // Hide start/finish buttons
  document.getElementById("headerStartBtn").classList.remove("active");
  document.getElementById("headerFinishBtn").classList.remove("active");

  container.innerHTML = "";

  const next = determineDefaultDay();
  const nextDay = u.program.find(d => d.id === next) || u.program[0];
  const picker = document.createElement("div");
  picker.className = "day-picker";

  // Build a day card helper
  function buildDayCard(d, isHero) {
    const card = document.createElement("div");
    card.className = "day-picker-card" + (isHero ? " recommended" : "");

    const breakdown = getSessionBreakdown(d);
    const wuMin = Math.round(breakdown.warmupSec / 60);
    const wkMin = Math.round(breakdown.workingSec / 60);
    const cdMin = Math.round(breakdown.cooldownSec / 60);

    let html = "";
    if (isHero) {
      html += `<div class="picker-today-tag">Today \u00b7 Day ${String(d.id).padStart(2, '0')}</div>`;
    }
    html += `<div class="picker-label">${d.name}</div>`;
    html += `<div class="picker-sub">${d.sub || ""}</div>`;
    html += `<div class="picker-blocks">`;
    d.blocks.forEach(b => {
      html += `<span class="picker-block-tag">${b.letter} ${b.name}</span>`;
    });
    html += `</div>`;
    if (isHero) {
      const totalSets = d.blocks.reduce((n, b) => n + b.exercises.reduce((s, ex) => s + (ex.sets || 0), 0), 0);
      const blockLetters = d.blocks.map(b => b.letter).join(' ');
      html += `<div class="picker-metrics">`;
      html += `<div class="picker-metric"><div class="picker-metric-label">Sets</div><div class="picker-metric-val">${String(totalSets).padStart(2, '0')}</div><div class="picker-metric-sub">${d.blocks.length} blocks</div></div>`;
      html += `<div class="picker-metric"><div class="picker-metric-label">Blocks</div><div class="picker-metric-val">${String(d.blocks.length).padStart(2, '0')}</div><div class="picker-metric-sub">${blockLetters}</div></div>`;
      html += `<div class="picker-metric"><div class="picker-metric-label">Est.</div><div class="picker-metric-val">${breakdown.totalMin}</div><div class="picker-metric-sub">min</div></div>`;
      html += `</div>`;
    }
    html += `<div class="picker-duration">\u23F1 ~${breakdown.totalMin} min</div>`;
    html += `<div class="picker-breakdown">WU ${wuMin}m \u00b7 Work ${wkMin}m \u00b7 CD ${cdMin}m</div>`;
    html += `<div class="dpc-expand-hint"><span class="dpc-chevron">\u25BE</span> Adjust time</div>`;

    html += `<div class="dpc-controls-outer"><div class="dpc-controls-inner">`;
    const defaultTarget = Math.round(breakdown.totalMin / 5) * 5;
    html += `<div class="tb-target-row" data-day-id="${d.id}">`;
    html += `<span class="tb-target-label">Target</span>`;
    html += `<button class="tb-step tb-down" data-dir="-1">\u2212</button>`;
    html += `<span class="tb-target-val">${defaultTarget}</span>`;
    html += `<span class="tb-target-unit">min</span>`;
    html += `<button class="tb-step tb-up" data-dir="1">+</button>`;
    html += `</div>`;
    html += `<div class="tb-adj-preview" data-day-id="${d.id}"></div>`;
    html += `<div class="tb-start-row" data-day-id="${d.id}">`;
    html += `<button class="tb-start-btn primary" data-day-id="${d.id}">Start</button>`;
    html += `</div>`;
    html += `</div></div>`;

    card.innerHTML = html;

    // Tapping the card opens the workout
    card.addEventListener("click", (e) => {
      if (e.target.closest(".dpc-controls-inner") || e.target.closest(".dpc-expand-hint")) return;
      state.currentDayId = d.id;
      state.dayChosen = true;
      openWorkout();
    });

    // "Adjust time" link toggles the config panel
    card.querySelector(".dpc-expand-hint").addEventListener("click", (e) => {
      e.stopPropagation();
      card.classList.toggle("expanded");
    });

    _wireTimeBudgetCard(card, d, breakdown);
    return card;
  }

  // Show only the next-in-rotation card
  picker.appendChild(buildDayCard(nextDay, true));

  // "Other workouts" toggle for remaining days
  const others = u.program.filter(d => d.id !== nextDay.id);
  if (others.length) {
    const toggle = document.createElement("button");
    toggle.className = "day-picker-toggle";
    toggle.textContent = "Other workouts (" + others.length + ")";
    const otherWrap = document.createElement("div");
    otherWrap.className = "day-picker-others";
    otherWrap.style.display = "none";
    others.forEach(d => otherWrap.appendChild(buildDayCard(d, false)));
    toggle.onclick = () => {
      const showing = otherWrap.style.display !== "none";
      otherWrap.style.display = showing ? "none" : "";
      toggle.textContent = (showing ? "Other workouts" : "Hide other workouts") + " (" + others.length + ")";
    };
    picker.appendChild(toggle);
    picker.appendChild(otherWrap);
  }

  container.appendChild(picker);
}

function _wireTimeBudgetCard(card, day, breakdown) {
  const targetRow = card.querySelector(".tb-target-row");
  const valEl = card.querySelector(".tb-target-val");
  const adjPreview = card.querySelector(".tb-adj-preview");
  const startRow = card.querySelector(".tb-start-row");
  const durationEl = card.querySelector(".picker-duration");
  const breakdownEl = card.querySelector(".picker-breakdown");
  let currentTarget = parseInt(valEl.textContent, 10);
  let lastBudget = null;

  function updateAdjustments() {
    if (currentTarget >= breakdown.totalMin) {
      adjPreview.innerHTML = "";
      startRow.innerHTML = `<button class="tb-start-btn primary" data-action="start">Start ~${currentTarget} min</button>`;
      durationEl.textContent = `⏱ ~${breakdown.totalMin} min`;
      const wuMin = Math.round(breakdown.warmupSec / 60);
      const wkMin = Math.round(breakdown.workingSec / 60);
      const cdMin = Math.round(breakdown.cooldownSec / 60);
      breakdownEl.textContent = `WU ${wuMin}m · Work ${wkMin}m · CD ${cdMin}m`;
    } else {
      lastBudget = computeTimeBudget(day, currentTarget);
      let adjHtml = "";
      if (lastBudget.adjustments.length) {
        const savedMin = Math.round(lastBudget.adjustments.reduce((s, a) => s + a.savedSec, 0) / 60);
        adjHtml += `<div class="tb-adj-header">Adjustments to save ~${savedMin} min</div>`;
        lastBudget.adjustments.forEach(a => {
          adjHtml += `<div class="tb-adj-item">${a.description}</div>`;
        });
      }
      if (!lastBudget.achievable) {
        adjHtml += `<div class="tb-adj-warn">Can't reach ${currentTarget} min — minimum ~${lastBudget.adjustedMin} min</div>`;
      }
      adjPreview.innerHTML = adjHtml;
      const adjMin = lastBudget.adjustedMin;
      startRow.innerHTML = `<button class="tb-start-btn primary" data-action="adjusted">Start adjusted ~${adjMin} min</button>`
        + `<button class="tb-start-btn secondary" data-action="start">Start as-is ~${breakdown.totalMin} min</button>`;
      const adjBreakdown = getSessionBreakdown(lastBudget.adjustedDay);
      durationEl.textContent = `⏱ ~${adjBreakdown.totalMin} min`;
      const wuMin = Math.round(adjBreakdown.warmupSec / 60);
      const wkMin = Math.round(adjBreakdown.workingSec / 60);
      const cdMin = Math.round(adjBreakdown.cooldownSec / 60);
      breakdownEl.textContent = `WU ${wuMin}m · Work ${wkMin}m · CD ${cdMin}m`;
    }
    wireStartButtons();
  }

  function wireStartButtons() {
    startRow.querySelectorAll(".tb-start-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        if (btn.dataset.action === "adjusted" && lastBudget) {
          // Apply adjustments to the real program
          const u = userData();
          const dayIdx = u.program.findIndex(dd => dd.id === day.id);
          if (dayIdx >= 0) {
            updateUser(usr => { usr.program[dayIdx] = lastBudget.adjustedDay; });
          }
        }
        state.currentDayId = day.id;
        state.dayChosen = true;
        openWorkout();
      });
    });
  }

  // Stepper buttons
  card.querySelectorAll(".tb-step").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const dir = parseInt(btn.dataset.dir, 10);
      currentTarget = Math.max(10, Math.min(180, currentTarget + dir * 5));
      valEl.textContent = currentTarget;
      updateAdjustments();
    });
  });

  // Initial wiring
  updateAdjustments();
}

function renderDayPreview(container, day) {
  const screen = document.createElement("div");
  screen.className = "preview-screen";

  // Header: day name + summary stats
  const totalSec = estimateSessionSeconds(day);
  const totalMin = Math.max(1, Math.round(totalSec / 60));
  const totalEx = day.blocks.reduce((s, b) => s + b.exercises.filter(e => !e.isWarmup).length, 0);
  const totalSets = day.blocks.reduce((n, b) => n + b.exercises.reduce((s, ex) => s + (ex.isWarmup ? 0 : (ex.sets || 0)), 0), 0);
  const header = document.createElement("div");
  header.className = "preview-header";
  header.innerHTML = `
    <div class="preview-title">${day.name}</div>
    <div class="preview-meta">${day.blocks.length} block${day.blocks.length === 1 ? '' : 's'} · ${totalEx} exercises · ${totalSets} sets</div>
    <div class="preview-duration-chip">${totalMin} min</div>
  `;
  screen.appendChild(header);

  // Equipment filter bar
  screen.appendChild(renderEqFilterBar(day));

  // All blocks — full overview, always expanded
  day.blocks.forEach((block, bi) => {
    screen.appendChild(renderBlockOverviewCard(day, block, bi));
  });

  // Cooldown summary
  screen.appendChild(renderCooldownPreview());

  container.appendChild(screen);

  // Fixed bottom CTA bar: Back + Start Workout
  const bar = document.createElement("div");
  bar.className = "preview-cta-bar";

  const back = document.createElement("button");
  back.className = "preview-back-btn";
  back.textContent = "← Back";
  back.addEventListener("click", () => {
    state.dayChosen = false;
    state.workoutView = "chapters";
    renderWorkoutScreen();
  });

  const start = document.createElement("button");
  start.className = "preview-start-btn";
  start.textContent = "Start Workout";
  start.addEventListener("click", () => {
    _beginWorkoutFocus();
  });

  bar.appendChild(back);
  bar.appendChild(start);
  container.appendChild(bar);
}

function renderBlockPreview(day, block, bi, readOnly) {
  const wrap = document.createElement("div");
  const isSuperset = block.exercises.length > 1;

  // Block header (same as renderBlock)
  const hdr = document.createElement("div");
  hdr.className = "block-header";
  const blockMin = Math.round(estimateBlockSec(block) / 60);
  hdr.innerHTML = `
    <div class="block-letter ${isSuperset ? 'superset' : ''}">${block.letter}</div>
    <div class="block-title">${block.name}${isSuperset ? ' <span style="color:var(--superset);">· Superset</span>' : ''}</div>
    <span class="block-time-badge">~${blockMin}m</span>
  `;
  if (!readOnly) {
    const menu = document.createElement("button");
    menu.className = "block-menu";
    menu.textContent = "⋯";
    menu.onclick = () => openBlockMenu(block, bi);
    hdr.appendChild(menu);
  }
  wrap.appendChild(hdr);

  // Bento grid of exercise tiles
  const grid = document.createElement("div");
  grid.className = "block-preview-grid";
  block.exercises.forEach((ex, exIdx) => {
    const tile = document.createElement("div");
    tile.className = "block-preview-tile" + (!readOnly ? " tappable" : "") + (ex.isWarmup ? " warmup" : "");
    if (!readOnly) tile.onclick = () => openExercisePreviewSheet(block.exercises, exIdx, false, block, bi);
    const mColor = primaryMuscleColor(ex.muscles);
    if (mColor) tile.style.borderLeftColor = mColor;

    const name = document.createElement("div");
    name.className = "tile-name";
    name.textContent = ex.name;
    tile.appendChild(name);

    if (ex.muscles && ex.muscles.length) {
      const muscle = document.createElement("span");
      muscle.className = "tile-muscle";
      muscle.textContent = ex.muscles[0];
      const mc = GROUP_COLORS[groupMuscle(ex.muscles[0])];
      if (mc) { muscle.style.background = mc + '22'; muscle.style.color = mc; }
      tile.appendChild(muscle);
    }

    const sets = document.createElement("div");
    sets.className = "tile-sets";
    const numSets = ex.sets || 3;
    if (ex.isWarmup) {
      sets.textContent = "warmup";
    } else if (ex.isTime) {
      sets.textContent = numSets + "×" + (ex.reps || 30) + "s";
    } else if (ex.isDistance) {
      sets.textContent = numSets + "×" + (ex.reps || 100) + "m";
    } else {
      sets.textContent = numSets + "×" + (ex.reps || 8);
    }
    tile.appendChild(sets);

    // Equipment warning badge + one-tap swap
    if (!ex.isWarmup && isExAffectedByEqFilter(ex)) {
      tile.classList.add("eq-affected");
      const eqBadge = document.createElement("div");
      eqBadge.className = "tile-eq-warn";
      const missing = getExMissingEquipment(ex);
      eqBadge.textContent = "\u26A0 " + missing[0].replace(/_/g, " ");
      tile.appendChild(eqBadge);

      // One-tap swap: override tile click to open swap sheet
      if (!readOnly) {
        tile.onclick = (e) => {
          e.stopPropagation();
          openEqSwapSheet(ex, bi, exIdx);
        };
      }
    }

    grid.appendChild(tile);
  });
  wrap.appendChild(grid);
  return wrap;
}

// ============================================================
// BLOCK OVERVIEW CARD — compact single-column list for day preview
// ============================================================
function renderBlockOverviewCard(day, block, bi) {
  const card = document.createElement("div");
  card.className = "overview-block-card";
  const isSuperset = block.exercises.filter(e => !e.isWarmup).length > 1;

  // Muscle color stripe for the block
  const blockColors = [];
  block.exercises.forEach(e => {
    if (e.isWarmup) return;
    const c = primaryMuscleColor(e.muscles);
    if (c && !blockColors.includes(c)) blockColors.push(c);
  });
  if (blockColors.length >= 1) {
    card.style.borderLeftColor = blockColors[0];
  }

  // Block header
  const hdr = document.createElement("div");
  hdr.className = "overview-block-hdr";
  const blockMin = Math.round(estimateBlockSec(block) / 60);
  const badgeStyle = blockColors.length >= 2
    ? `background:linear-gradient(135deg,${blockColors.slice(0,3).join(",")});color:#fff`
    : blockColors.length === 1 ? `background:${blockColors[0]};color:#fff` : "";
  hdr.innerHTML = `<div class="overview-block-letter" style="${badgeStyle}">${block.letter}</div>`
    + `<div class="overview-block-info"><span class="overview-block-name">${block.name}${isSuperset ? ' <span style="color:var(--superset);">· Superset</span>' : ''}</span></div>`
    + `<span class="overview-block-time">~${blockMin}m</span>`;
  card.appendChild(hdr);

  // Exercise rows — compact list
  const list = document.createElement("div");
  list.className = "overview-ex-list";
  block.exercises.forEach((ex, exIdx) => {
    const row = document.createElement("div");
    row.className = "overview-ex-row" + (ex.isWarmup ? " warmup" : "");
    row.addEventListener("click", () => openExercisePreviewSheet(block.exercises, exIdx, false, block, bi));

    const dot = document.createElement("div");
    dot.className = "overview-ex-dot";
    const mColor = primaryMuscleColor(ex.muscles);
    if (mColor) dot.style.background = mColor;
    row.appendChild(dot);

    const name = document.createElement("div");
    name.className = "overview-ex-name";
    name.textContent = ex.name;
    row.appendChild(name);

    const meta = document.createElement("div");
    meta.className = "overview-ex-meta";
    const numSets = ex.sets || 3;
    if (ex.isWarmup) {
      meta.textContent = "warmup";
    } else {
      let setsLabel;
      if (ex.isTime) {
        setsLabel = numSets + " \u00d7 " + (ex.reps || 30) + "s";
      } else if (ex.isDistance) {
        setsLabel = numSets + " \u00d7 " + (ex.reps || 100) + "m";
      } else {
        setsLabel = numSets + " \u00d7 " + (ex.reps || 8);
      }

      const exId = ex.exId || ex.name;
      const last = getLastSetsFor(exId);
      const lastW = last.length ? last[0].weight : null;
      const targetW = lastW != null ? lastW : (ex.defaultWeight || 0);

      if (targetW > 0 && !ex.bodyweight) {
        meta.innerHTML = `<span class="overview-sets-label">${setsLabel}</span><span class="overview-weight-label">${targetW} ${state.unit}</span>`;
      } else if (ex.bodyweight) {
        meta.innerHTML = `<span class="overview-sets-label">${setsLabel}</span><span class="overview-weight-label">BW</span>`;
      } else {
        meta.textContent = setsLabel;
      }
    }
    row.appendChild(meta);

    const swap = document.createElement("button");
    swap.className = "overview-swap-btn";
    swap.textContent = "\u21c4";
    swap.title = "Swap exercise";
    swap.onclick = (e) => {
      e.stopPropagation();
      const libEx = LIB_BY_ID[ex.exId];
      const cat = libEx ? libEx.cat : (block.type === "warmup" ? "Warmup" : null);
      openSidebar(cat, bi, exIdx);
    };
    row.appendChild(swap);

    list.appendChild(row);
  });
  card.appendChild(list);

  return card;
}

function renderCooldownPreview() {
  const wrap = document.createElement("div");

  const hdr = document.createElement("div");
  hdr.className = "block-header";
  hdr.innerHTML = `
    <div class="block-letter cooldown-letter">CD</div>
    <div class="block-title">Cool Down</div>
    <span class="block-time-badge">~5m</span>
  `;
  wrap.appendChild(hdr);

  const grid = document.createElement("div");
  grid.className = "block-preview-grid";
  const cdExercises = getCooldownExercises(state.currentDayId);
  cdExercises.forEach((ex, exIdx) => {
    const tile = document.createElement("div");
    tile.className = "block-preview-tile tappable";
    tile.onclick = () => openExercisePreviewSheet(cdExercises, exIdx, true);

    const name = document.createElement("div");
    name.className = "tile-name";
    name.textContent = ex.name;
    tile.appendChild(name);

    if (ex.muscles && ex.muscles.length) {
      const muscle = document.createElement("span");
      muscle.className = "tile-muscle";
      muscle.textContent = ex.muscles[0];
      const mc = GROUP_COLORS[groupMuscle(ex.muscles[0])];
      if (mc) { muscle.style.background = mc + '22'; muscle.style.color = mc; }
      tile.appendChild(muscle);
    }

    const info = document.createElement("div");
    info.className = "tile-sets";
    info.textContent = ex.isTime
      ? (ex.reps || 30) + "s" + (ex.perSide ? "/side" : "")
      : (ex.reps || 8) + " reps" + (ex.perSide ? "/side" : "");
    tile.appendChild(info);

    grid.appendChild(tile);
  });
  wrap.appendChild(grid);
  return wrap;
}

function renderCooldownPreviewForDay(dayId) {
  const wrap = document.createElement("div");

  const hdr = document.createElement("div");
  hdr.className = "block-header";
  hdr.innerHTML = `
    <div class="block-letter cooldown-letter">CD</div>
    <div class="block-title">Cool Down</div>
    <span class="block-time-badge">~5m</span>
  `;
  wrap.appendChild(hdr);

  const grid = document.createElement("div");
  grid.className = "block-preview-grid";
  getCooldownExercises(dayId).forEach(ex => {
    const tile = document.createElement("div");
    tile.className = "block-preview-tile";

    const name = document.createElement("div");
    name.className = "tile-name";
    name.textContent = ex.name;
    tile.appendChild(name);

    if (ex.muscles && ex.muscles.length) {
      const muscle = document.createElement("span");
      muscle.className = "tile-muscle";
      muscle.textContent = ex.muscles[0];
      const mc = GROUP_COLORS[groupMuscle(ex.muscles[0])];
      if (mc) { muscle.style.background = mc + '22'; muscle.style.color = mc; }
      tile.appendChild(muscle);
    }

    const info = document.createElement("div");
    info.className = "tile-sets";
    info.textContent = ex.isTime
      ? (ex.reps || 30) + "s" + (ex.perSide ? "/side" : "")
      : (ex.reps || 8) + " reps" + (ex.perSide ? "/side" : "");
    tile.appendChild(info);

    grid.appendChild(tile);
  });
  wrap.appendChild(grid);
  return wrap;
}

function _buildRpBlockMeta(block) {
  if (block.blockType !== "rp-hypertrophy") return null;
  // Pull meso context for the current user
  const u = (typeof userData === "function") ? userData() : null;
  if (!u || !u.rp) return null;
  const meso = (typeof getActiveMesocycle === "function") ? getActiveMesocycle(u) : null;
  if (!meso) return null;

  const week = meso.currentWeek;
  const total = meso.lengthWeeks;
  const rir = meso.rirSchedule ? meso.rirSchedule[week - 1] : null;
  const rirStr = rir === "deload" ? "Deload" : (rir != null ? "RIR " + rir : null);

  const meta = document.createElement("div");
  meta.className = "rp-block-meta";
  meta.style.cssText = "display:flex;gap:6px;margin-bottom:4px;flex-wrap:wrap;";

  if (rirStr) {
    const rirBadge = document.createElement("span");
    rirBadge.className = "rp-rir-badge";
    rirBadge.style.cssText = "font-size:10px;padding:2px 7px;border-radius:8px;background:var(--accent);color:#fff;font-weight:700;";
    rirBadge.textContent = rirStr;
    meta.appendChild(rirBadge);
  }

  const weekBadge = document.createElement("span");
  weekBadge.className = "rp-week-badge";
  weekBadge.style.cssText = "font-size:10px;padding:2px 7px;border-radius:8px;border:1.5px solid var(--border);color:var(--text-dim);";
  weekBadge.textContent = "Week " + week + " of " + total;
  meta.appendChild(weekBadge);

  // Volume indicator: this week's planned sets vs MEV/MRV for this block's primary muscle
  const primaryMuscle = block.name ? block.name.toLowerCase() : null;
  if (primaryMuscle && meso.perMuscleVolume[primaryMuscle]) {
    const entry = meso.perMuscleVolume[primaryMuscle].find(v => v.week === week);
    const lm = (typeof rpLandmarks === "function") ? rpLandmarks(u, primaryMuscle) : null;
    if (entry && entry.plannedSets != null && lm) {
      const bar = document.createElement("div");
      bar.className = "rp-vol-bar";
      bar.title = "Planned: " + entry.plannedSets + " sets | MEV:" + lm.mev + " MRV:" + lm.mrv;
      bar.style.cssText = "flex:1;min-width:60px;height:4px;border-radius:4px;background:var(--border);overflow:hidden;align-self:center;";
      const fill = document.createElement("div");
      const pct = lm.mrv > 0 ? Math.min(100, (entry.plannedSets / lm.mrv) * 100) : 0;
      fill.style.cssText = "height:100%;width:" + pct + "%;background:var(--accent);border-radius:4px;";
      bar.appendChild(fill);
      meta.appendChild(bar);
    }
  }

  return meta;
}

function renderBlock(day, block, bi) {
  const wrap = document.createElement("div");
  const isSuperset = block.exercises.length > 1;

  const hdr = document.createElement("div");
  hdr.className = "block-header";
  const blockMin = Math.round(estimateBlockSec(block) / 60);
  hdr.innerHTML = `
    <div class="block-letter ${isSuperset ? 'superset' : ''}">${block.letter}</div>
    <div class="block-title">${block.name}${isSuperset ? ' <span style="color:var(--superset);">· Superset</span>' : ''}</div>
    <span class="block-time-badge">~${blockMin}m</span>
  `;
  const menu = document.createElement("button");
  menu.className = "block-menu";
  menu.textContent = "⋯";
  menu.onclick = () => openBlockMenu(block, bi);
  hdr.appendChild(menu);
  wrap.appendChild(hdr);

  // RP meta row (RIR badge + week indicator + volume bar) for rp-hypertrophy blocks
  const rpMeta = _buildRpBlockMeta(block);
  if (rpMeta) wrap.appendChild(rpMeta);

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

  const addEx = document.createElement("button");
  addEx.className = "add-ex-row";
  addEx.textContent = "+ Add exercise";
  addEx.onclick = () => openLibrary(block.id);
  wrap.appendChild(addEx);

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
    getCooldownExercises(state.currentDayId).forEach(ex => {
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
      const _libRef2 = LIB_BY_ID[ex.exId];
      if (_libRef2 && _libRef2.demoUrl) {
        const dt = document.createElement("span");
        dt.className = "tag demo-tag";
        dt.textContent = "▶ demo";
        dt.onclick = (e) => { e.stopPropagation(); window.open(_libRef2.demoUrl, "_blank"); };
        meta.appendChild(dt);
      }
      info.appendChild(meta);
      head.appendChild(info);

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
  // Equipment warning: flag if exercise needs unavailable equipment
  if (!ex.isWarmup && isExAffectedByEqFilter(ex)) {
    const eqMissing = getExMissingEquipment(ex);
    const eqTag = document.createElement("span");
    eqTag.className = "tag eq-warn";
    eqTag.title = "Needs: " + eqMissing.join(", ");
    eqTag.textContent = "\u26A0 " + eqMissing[0].replace(/_/g, " ");
    eqTag.onclick = (e) => {
      e.stopPropagation();
      openEqSwapSheet(ex, bi, ei);
    };
    meta.appendChild(eqTag);
    card.classList.add("eq-affected-card");
  }
  // Demo video tag in meta row
  const _libRef = LIB_BY_ID[ex.exId];
  const _demoUrl = _libRef && _libRef.demoUrl;
  if (_demoUrl) {
    const dt = document.createElement("span");
    dt.className = "tag demo-tag";
    dt.textContent = "▶ demo";
    dt.onclick = (e) => {
      e.stopPropagation();
      window.open(_demoUrl, "_blank");
    };
    meta.appendChild(dt);
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

  // Demo video link — rendered as tag in meta row below

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
  const lib = LIB_BY_ID[ex.exId] || ex;
  const bw = lib.bodyweight;
  const wrap = document.createElement("div");
  wrap.className = "sets-wrap";

  // Tempo coaching cue — shown prominently above the sets when a tempo is prescribed
  if (ex.tempo) {
    const parts = ex.tempo.split("-");
    const labels = ["Down", "Pause", "Up", "Top"];
    const cue = document.createElement("div");
    cue.className = "tempo-cue";
    const lbl = document.createElement("span");
    lbl.className = "tempo-cue-label";
    lbl.textContent = "Tempo";
    cue.appendChild(lbl);
    const phases = document.createElement("div");
    phases.className = "tempo-cue-phases";
    parts.forEach((t, i) => {
      if (i > 0) {
        const sep = document.createElement("div");
        sep.className = "tempo-divider";
        sep.textContent = "—";
        phases.appendChild(sep);
      }
      const ph = document.createElement("div");
      ph.className = "tempo-phase";
      ph.innerHTML = `<div class="tempo-count">${t}</div><div class="tempo-phase-name">${labels[i] || ""}</div>`;
      phases.appendChild(ph);
    });
    cue.appendChild(phases);
    wrap.appendChild(cue);
  }

  // Previous session (same day) — what was lifted last time this exact workout day was done
  const prevSets = getPrevDaySetsFor(state.currentDayId, ex.exId || ex.name);
  if (prevSets.length) {
    const prev = document.createElement("div");
    prev.className = "prev-session";
    const lbl = document.createElement("span");
    lbl.className = "prev-label";
    lbl.textContent = "Last";
    prev.appendChild(lbl);
    prevSets.forEach((s, idx) => {
      if (idx > 0) {
        const sep = document.createElement("span");
        sep.className = "prev-sep";
        sep.textContent = "·";
        prev.appendChild(sep);
      }
      const chip = document.createElement("span");
      chip.className = "prev-set";
      chip.textContent = (s.bodyweight || s.weight === 0) ? `${s.reps}r` : `${s.weight}×${s.reps}`;
      prev.appendChild(chip);
    });
    wrap.appendChild(prev);
  }

  // RP suggestion chip / inline prompt (Workstream B §3.6)
  if (typeof injectRpHint === "function") {
    injectRpHint(wrap, ex, userData());
  }

  const last = getLastSetsFor(ex.exId || ex.name);
  const numSets = ex.sets || 3;
  const repsLabel = ex.isTime ? "s" : ex.isDistance ? "m" : "reps";

  for (let i = 0; i < numSets; i++) {
    const lastSet = last[i] || last[last.length - 1];

    const wkey = inputKey(block.id, ei, i, "w");
    const rkey = inputKey(block.id, ei, i, "r");
    const pkey = inputKey(block.id, ei, i, "p");

    const curW = getInput(wkey, lastSet?.weight ?? ex.defaultWeight ?? 0);
    const curR = getInput(rkey, lastSet?.reps ?? ex.reps);
    const curP = getInput(pkey, 7);

    const chip = document.createElement("div");
    chip.className = "set-chip";

    const weightPart = bw ? "" :
      `<span class="set-chip-weight" data-field="w" data-unit="${state.unit}">${curW}</span><span class="set-chip-x">×</span>`;

    const rpePart = lib.noRpe ? "" :
      `<span class="set-chip-rpe">RPE <span class="rpe-num">${curP}</span></span>`;
    const chipNum = state.workoutView === "focus" ? String(i + 1).padStart(2, "0") : String(i + 1);
    chip.innerHTML = `
      <div class="set-chip-num">${chipNum}</div>
      <div class="set-chip-body">
        ${weightPart}
        <span class="set-chip-reps" data-field="r">${curR} ${repsLabel}</span>
        ${rpePart}
      </div>
      <span class="set-chip-chevron">›</span>
    `;
    wireChip(chip, block, ex, bi, ei, i, bw);
    wrap.appendChild(chip);
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

function wireChip(chip, block, ex, bi, ei, i, bw) {
  // Swipe gestures: right = done, left = skipped
  const statusKey = inputKey(block.id, ei, i, "status");
  const curStatus = getInput(statusKey, null);
  if (curStatus === "done") chip.classList.add("set-done");
  if (curStatus === "skipped") chip.classList.add("set-skipped");

  // Badge tap-to-complete
  const numBadge = chip.querySelector(".set-chip-num");
  let badgeTapped = false;
  function toggleDone() {
    const wasDone = chip.classList.contains("set-done");
    chip.classList.remove("set-done", "set-skipped", "set-active", "set-pending");
    if (!wasDone) {
      chip.classList.add("set-done");
      if (state.workoutStartedAt) showHeaderRest(90);
    }
    saveInput(statusKey, wasDone ? null : "done");
    if (navigator.vibrate) navigator.vibrate(10);
    renderWorkoutScreen();
  }
  numBadge.addEventListener("touchend", (e) => {
    e.stopPropagation();
    badgeTapped = true;
    toggleDone();
  }, { passive: true });
  numBadge.addEventListener("click", (e) => {
    e.stopPropagation();
    if (badgeTapped) { badgeTapped = false; return; }
    toggleDone();
  });

  // Focus mode: mark active / pending sets for ledger styling
  if (state.workoutView === "focus" && curStatus !== "done" && curStatus !== "skipped") {
    const numSets = ex.sets || 3;
    let firstPending = -1;
    for (let s = 0; s < numSets; s++) {
      if (getInput(inputKey(block.id, ei, s, "status"), null) !== "done" &&
          getInput(inputKey(block.id, ei, s, "status"), null) !== "skipped") {
        firstPending = s; break;
      }
    }
    if (i === firstPending) chip.classList.add("set-active");
    else chip.classList.add("set-pending");
  }

  let swStartX = 0, swStartY = 0, isSwiping = false;
  chip.addEventListener("touchstart", (e) => {
    if (!state.workoutStartedAt) return;
    swStartX = e.touches[0].clientX;
    swStartY = e.touches[0].clientY;
    isSwiping = false;
  }, { passive: true });
  chip.addEventListener("touchmove", (e) => {
    if (!state.workoutStartedAt) return;
    const dx = e.touches[0].clientX - swStartX;
    const dy = e.touches[0].clientY - swStartY;
    if (!isSwiping && Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 1.5) isSwiping = true;
    if (isSwiping) {
      e.preventDefault();
      chip.style.transition = "none";
      chip.style.transform = `translateX(${Math.max(-80, Math.min(80, dx))}px)`;
    }
  }, { passive: false });
  chip.addEventListener("touchend", (e) => {
    if (isSwiping) {
      const dx = e.changedTouches[0].clientX - swStartX;
      chip.style.transition = "transform 0.15s ease-out";
      chip.style.transform = "";
      if (dx > 60) {
        const was = chip.classList.contains("set-done");
        chip.classList.remove("set-done", "set-skipped");
        if (!was) {
          chip.classList.add("set-done");
          const card = chip.closest(".exercise-card");
          if (state.workoutStartedAt) showHeaderRest(90);
        }
        saveInput(statusKey, was ? null : "done");
        if (navigator.vibrate) navigator.vibrate(10);
      } else if (dx < -60) {
        const was = chip.classList.contains("set-skipped");
        chip.classList.remove("set-done", "set-skipped");
        if (!was) chip.classList.add("set-skipped");
        saveInput(statusKey, was ? null : "skipped");
        if (navigator.vibrate) navigator.vibrate(10);
      }
      setTimeout(() => { chip.style.transition = ""; }, 160);
      return;
    }
    // Tap — open set editor (skip if tapping a quick-edit field)
    if (e.target.closest("[data-field]")) return;
    openSetEditor(block, ex, bi, ei, i, bw);
  }, { passive: true });

  // Desktop click fallback (no touch)
  chip.addEventListener("click", (e) => {
    if (isSwiping) return;
    if (e.target.closest("[data-field]")) return;
    openSetEditor(block, ex, bi, ei, i, bw);
  });

  // Inline quick-edit: tap weight or reps span directly
  const weightSpan = chip.querySelector(".set-chip-weight");
  const repsSpan = chip.querySelector(".set-chip-reps");

  function attachInlineEdit(span, field) {
    if (!span) return;
    let handled = false;
    span.addEventListener("touchend", (e) => {
      if (isSwiping) return;
      e.stopPropagation();
      handled = true;
      openInlineEditor(span, field, block, ex, bi, ei, i, bw);
    });
    span.addEventListener("click", (e) => {
      e.stopPropagation();
      if (handled) { handled = false; return; }
      openInlineEditor(span, field, block, ex, bi, ei, i, bw);
    });
  }
  attachInlineEdit(weightSpan, "w");
  attachInlineEdit(repsSpan, "r");
}

function openSetEditor(block, ex, bi, ei, setIdx, bw) {
  const lib = LIB_BY_ID[ex.exId] || ex;
  bw = lib.bodyweight || bw;
  const numSets = ex.sets || 3;
  const last = getLastSetsFor(ex.exId || ex.name);

  function buildEditor(si) {
    const lastSet = last[si] || last[last.length - 1];
    const wkey = inputKey(block.id, ei, si, "w");
    const rkey = inputKey(block.id, ei, si, "r");
    const pkey = inputKey(block.id, ei, si, "p");

    // Compute suggested weight (RP A+ engine) as the default when user hasn't entered one
    let weightDefault = lastSet?.weight ?? ex.defaultWeight ?? 0;
    let rpSuggestion  = null;
    if (typeof suggestedWeight === "function") {
      const u = userData();
      if (u && u.rp && u.rp.enabled && !bw) {
        const draft = getDraft();
        const targetRIR = (draft && draft.targetRIR != null) ? draft.targetRIR : 2;
        rpSuggestion = suggestedWeight(ex.exId, ex.reps, targetRIR);
        if (rpSuggestion.reason === "history" && rpSuggestion.weight > 0) {
          weightDefault = rpSuggestion.weight;
        }
      }
    }

    let curW = getInput(wkey, weightDefault);
    let curR = getInput(rkey, lastSet?.reps ?? ex.reps);
    let curP = getInput(pkey, 7);

    const step = state.unit === "lbs" ? 5 : 2.5;

    const wrap = document.createElement("div");
    wrap.className = "set-editor";

    // Header with nav
    const header = document.createElement("div");
    header.className = "set-editor-header";

    const prevBtn = document.createElement("button");
    prevBtn.className = "set-editor-nav-btn";
    prevBtn.textContent = "‹";
    prevBtn.disabled = si === 0;
    prevBtn.onclick = () => { buildEditor(si - 1); };

    const title = document.createElement("div");
    title.className = "set-editor-title";
    title.innerHTML = `<strong>${ex.name}</strong>Set ${si + 1} of ${numSets}`;

    const nextBtn = document.createElement("button");
    nextBtn.className = "set-editor-nav-btn";
    nextBtn.textContent = "›";
    nextBtn.disabled = si === numSets - 1;
    nextBtn.onclick = () => { buildEditor(si + 1); };

    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);
    wrap.appendChild(header);

    // RP suggestion badge inside set editor
    if (rpSuggestion && rpSuggestion.reason === "history" && rpSuggestion.weight > 0) {
      const badge = document.createElement("div");
      badge.className = "rp-editor-suggestion";
      badge.innerHTML =
        `<span class="rp-editor-suggestion-val">${rpSuggestion.weight} ${state.unit}</span>` +
        `<span class="rp-editor-suggestion-why">Based on history · ${rpSuggestion.confidence} confidence</span>`;
      wrap.appendChild(badge);
    }

    // Weight zone (skip for bodyweight)
    if (!bw) {
      const wZone = document.createElement("div");
      wZone.className = "set-editor-zone";
      wZone.innerHTML = `<div class="set-editor-label">Weight (${state.unit})</div>`;

      const wRow = document.createElement("div");
      wRow.className = "set-editor-stepper-row";
      const wMinus = document.createElement("button");
      wMinus.className = "set-editor-stepper";
      wMinus.textContent = "−";
      const wVal = document.createElement("div");
      wVal.className = "set-editor-value";
      wVal.innerHTML = `${curW}<small>${state.unit}</small>`;
      const wPlus = document.createElement("button");
      wPlus.className = "set-editor-stepper";
      wPlus.textContent = "+";

      wMinus.onclick = () => {
        curW = Math.max(0, curW - step);
        wVal.innerHTML = `${curW}<small>${state.unit}</small>`;
        saveInput(wkey, curW);
        updateQuickPills(wPills, curW);
        if (navigator.vibrate) navigator.vibrate(10);
      };
      wPlus.onclick = () => {
        curW = curW + step;
        wVal.innerHTML = `${curW}<small>${state.unit}</small>`;
        saveInput(wkey, curW);
        updateQuickPills(wPills, curW);
        if (navigator.vibrate) navigator.vibrate(10);
      };

      wRow.appendChild(wMinus);
      wRow.appendChild(wVal);
      wRow.appendChild(wPlus);
      wZone.appendChild(wRow);

      // Quick-value pills for weight
      const commonWeights = state.unit === "lbs"
        ? [45, 95, 135, 185, 225, 275, 315]
        : [20, 40, 60, 80, 100, 120, 140];
      const wPills = document.createElement("div");
      wPills.className = "set-editor-quick-pills";
      commonWeights.forEach(w => {
        const pill = document.createElement("button");
        pill.className = "set-editor-quick-pill" + (w === curW ? " active" : "");
        pill.textContent = w;
        pill.onclick = () => {
          curW = w;
          wVal.innerHTML = `${curW}<small>${state.unit}</small>`;
          saveInput(wkey, curW);
          updateQuickPills(wPills, curW);
          if (navigator.vibrate) navigator.vibrate(10);
        };
        wPills.appendChild(pill);
      });
      wZone.appendChild(wPills);
      wrap.appendChild(wZone);
    }

    // Reps / Time / Distance zone
    const rZone = document.createElement("div");
    rZone.className = "set-editor-zone";
    const rLabel = ex.isTime ? "Time (seconds)" : ex.isDistance ? "Distance (m)" : "Reps";
    const rUnit = ex.isTime ? "sec" : ex.isDistance ? "m" : "reps";
    rZone.innerHTML = `<div class="set-editor-label">${rLabel}</div>`;

    const rRow = document.createElement("div");
    rRow.className = "set-editor-stepper-row";
    const rMinus = document.createElement("button");
    rMinus.className = "set-editor-stepper";
    rMinus.textContent = "−";
    const rVal = document.createElement("div");
    rVal.className = "set-editor-value";
    rVal.innerHTML = `${curR}<small>${rUnit}</small>`;
    const rPlus = document.createElement("button");
    rPlus.className = "set-editor-stepper";
    rPlus.textContent = "+";

    const rStep = ex.isTime ? 5 : ex.isDistance ? 10 : 1;
    rMinus.onclick = () => {
      curR = Math.max(0, curR - rStep);
      rVal.innerHTML = `${curR}<small>${rUnit}</small>`;
      saveInput(rkey, curR);
      updateQuickPills(rPills, curR);
      if (navigator.vibrate) navigator.vibrate(10);
    };
    rPlus.onclick = () => {
      curR = curR + rStep;
      rVal.innerHTML = `${curR}<small>${rUnit}</small>`;
      saveInput(rkey, curR);
      updateQuickPills(rPills, curR);
      if (navigator.vibrate) navigator.vibrate(10);
    };

    rRow.appendChild(rMinus);
    rRow.appendChild(rVal);
    rRow.appendChild(rPlus);
    rZone.appendChild(rRow);

    // Quick-value pills for reps
    const commonReps = ex.isTime ? [15, 30, 45, 60, 90, 120]
      : ex.isDistance ? [50, 100, 200, 400, 800, 1000]
      : [1, 3, 5, 8, 10, 12, 15, 20];
    const rPills = document.createElement("div");
    rPills.className = "set-editor-quick-pills";
    commonReps.forEach(r => {
      const pill = document.createElement("button");
      pill.className = "set-editor-quick-pill" + (r === curR ? " active" : "");
      pill.textContent = r;
      pill.onclick = () => {
        curR = r;
        rVal.innerHTML = `${curR}<small>${rUnit}</small>`;
        saveInput(rkey, curR);
        updateQuickPills(rPills, curR);
        if (navigator.vibrate) navigator.vibrate(10);
      };
      rPills.appendChild(pill);
    });
    rZone.appendChild(rPills);
    wrap.appendChild(rZone);

    // RPE zone (skip for exercises that don't use RPE)
    if (!lib.noRpe) {
      const pZone = document.createElement("div");
      pZone.className = "set-editor-zone";
      pZone.innerHTML = `<div class="set-editor-label">RPE — Rate of Perceived Exertion</div>`;
      const pGrid = document.createElement("div");
      pGrid.className = "rpe-grid";
      const rpeValues = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
      rpeValues.forEach(v => {
        const bubble = document.createElement("button");
        bubble.className = "rpe-bubble" + (v === curP ? " selected" : "") + (v >= 9 ? " rpe-high" : "");
        bubble.textContent = v % 1 === 0 ? v : v.toFixed(1);
        bubble.onclick = () => {
          curP = v;
          saveInput(pkey, curP);
          pGrid.querySelectorAll(".rpe-bubble").forEach(b => b.classList.remove("selected"));
          bubble.classList.add("selected");
          if (navigator.vibrate) navigator.vibrate(10);
        };
        pGrid.appendChild(bubble);
      });
      pZone.appendChild(pGrid);
      wrap.appendChild(pZone);
    }

    // Done button
    const doneBtn = document.createElement("button");
    doneBtn.className = "set-editor-done-btn";
    doneBtn.textContent = "Done";
    doneBtn.onclick = () => {
      closeSheet();
      renderWorkoutScreen();
    };
    wrap.appendChild(doneBtn);

    // Replace sheet content
    const sheetContent = document.getElementById("sheetContent");
    sheetContent.innerHTML = "";
    sheetContent.appendChild(wrap);
  }

  buildEditor(setIdx);
  document.getElementById("sheetBg").classList.add("active");
}

function updateQuickPills(container, activeVal) {
  container.querySelectorAll(".set-editor-quick-pill").forEach(pill => {
    pill.classList.toggle("active", parseFloat(pill.textContent) === activeVal);
  });
}

// ============================================================
// INLINE QUICK-EDIT POPOVER
// ============================================================
function dismissInlineEditor() {
  document.querySelectorAll(".inline-edit-backdrop, .inline-edit-popover").forEach(el => el.remove());
}

function openInlineEditor(anchorEl, field, block, ex, bi, ei, setIdx, bw) {
  dismissInlineEditor();

  const lib = LIB_BY_ID[ex.exId] || ex;
  const last = getLastSetsFor(ex.exId || ex.name);
  const lastSet = last[setIdx] || last[last.length - 1];
  const key = inputKey(block.id, ei, setIdx, field);

  let curVal, step, label, unitLabel, commonVals;
  if (field === "w") {
    curVal = getInput(key, lastSet?.weight ?? ex.defaultWeight ?? 0);
    step = state.unit === "lbs" ? 5 : 2.5;
    label = `Weight (${state.unit})`;
    unitLabel = state.unit;
    commonVals = state.unit === "lbs" ? [45, 95, 135, 185, 225, 275, 315] : [20, 40, 60, 80, 100, 120, 140];
  } else {
    curVal = getInput(key, lastSet?.reps ?? ex.reps);
    step = ex.isTime ? 5 : ex.isDistance ? 10 : 1;
    label = ex.isTime ? "Time (sec)" : ex.isDistance ? "Distance (m)" : "Reps";
    unitLabel = ex.isTime ? "s" : ex.isDistance ? "m" : "reps";
    commonVals = ex.isTime ? [15, 30, 45, 60, 90, 120] : ex.isDistance ? [50, 100, 200, 400, 800, 1000] : [1, 3, 5, 8, 10, 12, 15, 20];
  }

  // Backdrop
  const backdrop = document.createElement("div");
  backdrop.className = "inline-edit-backdrop";
  backdrop.addEventListener("click", dismissInlineEditor);
  backdrop.addEventListener("touchend", (e) => { e.preventDefault(); dismissInlineEditor(); });

  // Popover
  const pop = document.createElement("div");
  pop.className = "inline-edit-popover";

  // Label
  const lbl = document.createElement("div");
  lbl.className = "inline-edit-label";
  lbl.textContent = label;

  // Stepper row
  const row = document.createElement("div");
  row.className = "inline-edit-stepper-row";

  const minus = document.createElement("button");
  minus.className = "inline-edit-stepper";
  minus.textContent = "\u2212";

  const valDisplay = document.createElement("div");
  valDisplay.className = "inline-edit-value";
  valDisplay.innerHTML = `${curVal}<small>${unitLabel}</small>`;

  const plus = document.createElement("button");
  plus.className = "inline-edit-stepper";
  plus.textContent = "+";

  // Quick pills
  const pills = document.createElement("div");
  pills.className = "inline-edit-pills";

  function updateVal(newVal) {
    curVal = newVal;
    valDisplay.innerHTML = `${curVal}<small>${unitLabel}</small>`;
    saveInput(key, curVal);
    // Update chip text in-place
    if (field === "w") {
      anchorEl.textContent = curVal;
    } else {
      const rl = ex.isTime ? "s" : ex.isDistance ? "m" : "reps";
      anchorEl.textContent = curVal + " " + rl;
    }
    pills.querySelectorAll(".inline-edit-pill").forEach(p =>
      p.classList.toggle("active", parseFloat(p.textContent) === curVal)
    );
    if (navigator.vibrate) navigator.vibrate(10);
  }

  minus.onclick = () => updateVal(Math.max(0, curVal - step));
  plus.onclick = () => updateVal(curVal + step);

  commonVals.forEach(v => {
    const pill = document.createElement("button");
    pill.className = "inline-edit-pill" + (v === curVal ? " active" : "");
    pill.textContent = v;
    pill.onclick = () => updateVal(v);
    pills.appendChild(pill);
  });

  row.appendChild(minus);
  row.appendChild(valDisplay);
  row.appendChild(plus);
  pop.appendChild(lbl);
  pop.appendChild(row);
  pop.appendChild(pills);

  document.body.appendChild(backdrop);
  document.body.appendChild(pop);

  // Position popover near the anchor
  const rect = anchorEl.getBoundingClientRect();
  const popW = pop.offsetWidth;
  const popH = pop.offsetHeight;
  let left = rect.left + rect.width / 2 - popW / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - popW - 8));
  let top = rect.top - popH - 8;
  if (top < 8) top = rect.bottom + 8;
  pop.style.left = left + "px";
  pop.style.top = top + "px";

  requestAnimationFrame(() => pop.classList.add("active"));
}

// ============================================================
// CHAPTERS VIEW (Command Center)
// ============================================================
function renderChaptersView(container, day) {
  const wrap = document.createElement("div");
  wrap.className = "chapters-view chapters-enter";

  // Hero title
  const heroTitle = document.createElement("div");
  heroTitle.className = "chapters-hero-title";
  heroTitle.textContent = "Overview";
  wrap.appendChild(heroTitle);

  // Subtitle with counts
  const totalEx = day.blocks.reduce((s, b) => s + b.exercises.filter(e => !e.isWarmup).length, 0);
  const totalBlocks = day.blocks.length;
  const heroSub = document.createElement("div");
  heroSub.className = "chapters-hero-sub";
  heroSub.innerHTML = `<span class="mf-tag accent">${totalEx} movements</span><span class="mf-sep">·</span><span class="mf-tag">${totalBlocks} blocks</span>`;
  wrap.appendChild(heroSub);

  // Equipment filter bar
  wrap.appendChild(renderEqFilterBar(day));

  // Progress strip
  const allStats = calcLiveStats(day);
  const progWrap = document.createElement("div");
  progWrap.className = "chapters-progress";
  let segsHtml = '';
  for (let i = 0; i < allStats.setsTotal; i++) {
    const cls = i < allStats.setsDone ? (i === allStats.setsDone - 1 ? 'active' : 'done') : '';
    segsHtml += `<div class="chapters-progress-seg ${cls}"></div>`;
  }
  progWrap.innerHTML = `<div class="chapters-progress-header"><span class="mf-tag">Progress</span><span class="mf-val">${String(allStats.setsDone).padStart(2,'0')} / ${String(allStats.setsTotal).padStart(2,'0')}</span></div><div class="chapters-progress-bar">${segsHtml}</div>`;
  wrap.appendChild(progWrap);

  let tileIdx = 0;
  let exNum = 0;
  day.blocks.forEach((block, bi) => {
    const bp = calcBlockProgress(block);
    const isDone = bp.total > 0 && bp.done === bp.total;
    const isSuperset = block.exercises.filter(e => !e.isWarmup).length > 1;

    // Block header row
    const hdr = document.createElement("div");
    hdr.className = "bento-block-header" + (isDone ? " done" : "");
    const blockColors = [];
    block.exercises.forEach(e => {
      if (e.isWarmup) return;
      const c = primaryMuscleColor(e.muscles);
      if (c && !blockColors.includes(c)) blockColors.push(c);
    });
    const badgeStyle = blockColors.length >= 2
      ? `background:linear-gradient(135deg,${blockColors.slice(0,3).join(",")});color:#fff`
      : blockColors.length === 1 ? `background:${blockColors[0]};color:#fff` : "";
    hdr.innerHTML = `<div class="chapter-letter" style="${badgeStyle}">${block.letter}</div>`
      + `<span class="bento-block-name">${block.name}${isSuperset ? ' <span style="color:var(--superset);">· Superset</span>' : ''}</span>`
      + `<span class="bento-block-progress">${bp.done}/${bp.total}</span>`;
    const blockBtn = document.createElement("button");
    blockBtn.className = "bento-block-complete-btn" + (isDone ? " done" : "");
    blockBtn.textContent = "\u2713";
    blockBtn.title = isDone ? "Block complete (click to clear)" : "Mark block complete";
    blockBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (navigator.vibrate) navigator.vibrate(10);
      toggleBlockComplete(block);
    });
    hdr.appendChild(blockBtn);
    wrap.appendChild(hdr);

    // Bento grid of exercise tiles
    const grid = document.createElement("div");
    grid.className = "bento-exercise-grid";

    block.exercises.forEach((ex, ei) => {
      if (ex.isWarmup) return;
      const numSets = ex.sets || 3;
      let exDone = 0;
      for (let si = 0; si < numSets; si++) {
        if (getInput(inputKey(block.id, ei, si, "status"), null) === "done") exDone++;
      }
      const exComplete = exDone === numSets;
      const exPct = numSets > 0 ? Math.round((exDone / numSets) * 100) : 0;

      exNum++;
      const tile = document.createElement("div");
      tile.className = "bento-ex-tile" + (exComplete ? " complete" : "") + (exDone > 0 && !exComplete ? " partial" : "");
      tile.style.setProperty("--card-index", tileIdx++);

      // Number column
      const numEl = document.createElement("div");
      numEl.className = "bento-ex-num";
      numEl.textContent = String(exNum).padStart(2, '0');
      tile.appendChild(numEl);

      const name = document.createElement("div");
      name.className = "bento-ex-name";
      name.textContent = ex.name;
      tile.appendChild(name);

      const setsInfo = document.createElement("div");
      setsInfo.className = "bento-ex-sets";
      if (ex.isTime) {
        setsInfo.textContent = `${numSets} × ${ex.reps || 30}s`;
      } else if (ex.isDistance) {
        setsInfo.textContent = `${numSets} × ${ex.reps || 100}m`;
      } else {
        setsInfo.textContent = `${numSets} × ${ex.reps || 8}`;
      }
      tile.appendChild(setsInfo);

      // Set badges — tappable completion toggles
      const badgeRow = document.createElement("div");
      badgeRow.className = "bento-set-badges";
      for (let si = 0; si < numSets; si++) {
        const statusKey = inputKey(block.id, ei, si, "status");
        const isDone = getInput(statusKey, null) === "done";
        const badge = document.createElement("div");
        badge.className = "bento-set-badge" + (isDone ? " done" : "");
        badge.textContent = isDone ? "✓" : String(si + 1);
        badge.addEventListener("click", (e) => {
          e.stopPropagation();
          const wasDone = getInput(statusKey, null) === "done";
          saveInput(statusKey, wasDone ? null : "done");
          if (!wasDone && state.workoutStartedAt) showHeaderRest(90);
          if (navigator.vibrate) navigator.vibrate(10);
          renderWorkoutScreen();
        });
        badgeRow.appendChild(badge);
      }
      tile.appendChild(badgeRow);

      const swap = document.createElement("button");
      swap.className = "bento-swap-btn";
      swap.textContent = "\u21c4";
      swap.title = "Swap exercise";
      swap.onclick = (e) => {
        e.stopPropagation();
        const libEx = LIB_BY_ID[ex.exId];
        const cat = libEx ? libEx.cat : (block.type === "warmup" ? "Warmup" : null);
        openSidebar(cat, bi, ei);
      };
      tile.appendChild(swap);

      if (ex.muscles && ex.muscles.length) {
        const muscle = document.createElement("span");
        muscle.className = "bento-ex-muscle";
        muscle.textContent = ex.muscles[0];
        const mc = GROUP_COLORS[groupMuscle(ex.muscles[0])];
        if (mc) { muscle.style.background = mc + '22'; muscle.style.color = mc; }
        tile.appendChild(muscle);
      }

      // Equipment warning badge in chapters view
      if (isExAffectedByEqFilter(ex)) {
        tile.classList.add("eq-affected");
        const eqBadge = document.createElement("div");
        eqBadge.className = "bento-eq-warn";
        const missing = getExMissingEquipment(ex);
        eqBadge.textContent = "\u26A0 " + missing[0].replace(/_/g, " ");
        tile.appendChild(eqBadge);
      }

      tile.addEventListener("click", () => {
        // If affected by equipment filter, open swap sheet instead
        if (isExAffectedByEqFilter(ex)) {
          openEqSwapSheet(ex, bi, ei);
          return;
        }
        state.workoutView = "focus";
        state.focusBlockIdx = bi;
        state.focusExIdx = ei;
        renderWorkoutScreen();
      });

      grid.appendChild(tile);
    });

    wrap.appendChild(grid);
  });

  // Cooldown tile
  const cdSkipped = getInput("__cooldown|skipped", false);
  const cdExercises = getCooldownExercises(state.currentDayId);
  let cdDone = 0;
  cdExercises.forEach((_, ci) => {
    if (getInput(inputKey("__cooldown", ci, 0, "status"), null) === "done") cdDone++;
  });
  const cdAllDone = cdExercises.length > 0 && cdDone === cdExercises.length;
  const cdHdr = document.createElement("div");
  cdHdr.className = "bento-block-header" + ((cdSkipped || cdAllDone) ? " done" : "");
  cdHdr.innerHTML = `<div class="chapter-letter" style="background:var(--success);color:#fff">CD</div>`
    + `<span class="bento-block-name">Cool Down</span>`
    + `<span class="bento-block-progress">${cdDone}/${cdExercises.length}</span>`;
  const cdBtn = document.createElement("button");
  cdBtn.className = "bento-block-complete-btn" + (cdAllDone ? " done" : "");
  cdBtn.textContent = "\u2713";
  cdBtn.title = cdAllDone ? "Cooldown complete (click to clear)" : "Mark cooldown complete";
  cdBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(10);
    cdExercises.forEach((_, ci) => {
      const k = inputKey("__cooldown", ci, 0, "status");
      saveInput(k, cdAllDone ? null : "done");
    });
    renderWorkoutScreen();
  });
  cdHdr.appendChild(cdBtn);
  wrap.appendChild(cdHdr);

  const cdGrid = document.createElement("div");
  cdGrid.className = "bento-exercise-grid";
  cdExercises.forEach((ex, ci) => {
    const statusKey = inputKey("__cooldown", ci, 0, "status");
    const isDone = getInput(statusKey, null) === "done";
    exNum++;
    const tile = document.createElement("div");
    tile.className = "bento-ex-tile cd-tile" + (isDone ? " complete" : "");
    tile.style.setProperty("--card-index", tileIdx++);

    const numEl = document.createElement("div");
    numEl.className = "bento-ex-num";
    numEl.textContent = String(exNum).padStart(2, '0');
    tile.appendChild(numEl);

    const name = document.createElement("div");
    name.className = "bento-ex-name";
    name.textContent = ex.name;
    tile.appendChild(name);

    if (ex.muscles && ex.muscles.length) {
      const muscle = document.createElement("span");
      muscle.className = "bento-ex-muscle";
      muscle.textContent = ex.muscles[0];
      const mc = GROUP_COLORS[groupMuscle(ex.muscles[0])];
      if (mc) { muscle.style.background = mc + '22'; muscle.style.color = mc; }
      tile.appendChild(muscle);
    }

    const info = document.createElement("div");
    info.className = "bento-ex-sets";
    info.textContent = ex.isTime
      ? (ex.reps || 30) + "s" + (ex.perSide ? "/side" : "")
      : (ex.reps || 8) + " reps" + (ex.perSide ? "/side" : "");
    tile.appendChild(info);

    const badgeRow = document.createElement("div");
    badgeRow.className = "bento-set-badges";
    const badge = document.createElement("div");
    badge.className = "bento-set-badge" + (isDone ? " done" : "");
    badge.textContent = isDone ? "✓" : "1";
    badge.addEventListener("click", (e) => {
      e.stopPropagation();
      saveInput(statusKey, isDone ? null : "done");
      if (navigator.vibrate) navigator.vibrate(10);
      renderWorkoutScreen();
    });
    badgeRow.appendChild(badge);
    tile.appendChild(badgeRow);

    const swap = document.createElement("button");
    swap.className = "bento-swap-btn";
    swap.textContent = "\u21c4";
    swap.title = "Swap stretch";
    swap.onclick = (e) => {
      e.stopPropagation();
      openCooldownSwapSheet(ci);
    };
    tile.appendChild(swap);

    tile.addEventListener("click", () => {
      state.workoutView = "focus";
      state.focusBlockIdx = -1;
      state.focusExIdx = ci;
      renderWorkoutScreen();
    });

    cdGrid.appendChild(tile);
  });
  wrap.appendChild(cdGrid);

  container.appendChild(wrap);
}

// ============================================================
// FOCUS VIEW (Zen Drill-Down)
// ============================================================
function renderFocusView(container, day) {
  const wrap = document.createElement("div");
  wrap.className = "focus-view focus-enter";

  const isCooldown = state.focusBlockIdx === -1;
  const block = isCooldown ? null : day.blocks[state.focusBlockIdx];

  if (!block && !isCooldown) {
    state.workoutView = "chapters";
    renderWorkoutScreen();
    return;
  }

  // Back button
  const backBtn = document.createElement("button");
  backBtn.className = "focus-back-btn";
  backBtn.innerHTML = "← Overview";
  backBtn.addEventListener("click", () => {
    state.workoutView = "chapters";
    state.focusBlockIdx = null;
    state.focusExIdx = 0;
    renderWorkoutScreen();
  });
  wrap.appendChild(backBtn);

  if (isCooldown) {
    // Cooldown focus
    const hdr = document.createElement("div");
    hdr.className = "focus-block-header";
    hdr.innerHTML = `<div class="chapter-letter" style="background:var(--success);color:#fff">CD</div><div class="chapter-name">Cool Down</div>`;
    wrap.appendChild(hdr);

    // Dot nav for cooldown
    const cdExercises = getCooldownExercises(state.currentDayId);
    const exCount = cdExercises.length;
    state.focusExIdx = Math.max(0, Math.min(state.focusExIdx, exCount - 1));
    wrap.appendChild(buildDotNav(exCount, state.focusExIdx, (idx) => {
      state.focusExIdx = idx;
      renderWorkoutScreen();
    }));

    // Render single cooldown exercise
    const cdEx = cdExercises[state.focusExIdx];
    const card = buildCooldownFocusCard(cdEx);
    const cardWrap = document.createElement("div");
    cardWrap.className = "focus-card-wrap";
    cardWrap.appendChild(card);
    wireFocusSwipe(cardWrap, exCount);
    wrap.appendChild(cardWrap);
  } else {
    // Block focus
    const exercises = block.exercises;
    const exCount = exercises.length;
    state.focusExIdx = Math.max(0, Math.min(state.focusExIdx, exCount - 1));

    // Block header
    const blockColors = [];
    block.exercises.forEach(e => {
      if (e.isWarmup) return;
      const c = primaryMuscleColor(e.muscles);
      if (c && !blockColors.includes(c)) blockColors.push(c);
    });
    const badgeStyle = blockColors.length >= 2
      ? `background:linear-gradient(135deg,${blockColors.slice(0,3).join(",")});color:#fff`
      : blockColors.length === 1 ? `background:${blockColors[0]};color:#fff` : "";

    const hdr = document.createElement("div");
    hdr.className = "focus-block-header";
    hdr.innerHTML = `<div class="chapter-letter" style="${badgeStyle}">${block.letter}</div><div class="chapter-name">${block.name}</div>`;
    const blockBp = calcBlockProgress(block);
    const blockDone = blockBp.total > 0 && blockBp.done === blockBp.total;
    const blockBtn = document.createElement("button");
    blockBtn.className = "focus-block-complete-btn" + (blockDone ? " done" : "");
    blockBtn.textContent = "\u2713";
    blockBtn.title = blockDone ? "Block complete — go to next" : "Complete block";
    blockBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (navigator.vibrate) navigator.vibrate(10);
      handleFinishButton();
    });
    hdr.appendChild(blockBtn);
    wrap.appendChild(hdr);

    // Block-level note input
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

    // Dot nav with completion status
    const dotStates = exercises.map((ex, ei) => {
      if (ex.isWarmup) return "warmup";
      const numSets = ex.sets || 3;
      let done = 0;
      for (let si = 0; si < numSets; si++) {
        if (getInput(inputKey(block.id, ei, si, "status"), null) === "done") done++;
      }
      return done === numSets ? "done" : done > 0 ? "partial" : "pending";
    });
    wrap.appendChild(buildDotNav(exCount, state.focusExIdx, (idx) => {
      state.focusExIdx = idx;
      renderWorkoutScreen();
    }, dotStates));

    // Render single exercise card
    const ex = exercises[state.focusExIdx];
    const bi = state.focusBlockIdx;
    const ei = state.focusExIdx;
    const isSuperset = exercises.length > 1;

    // Big serif exercise name (Midnight Forge style)
    const focusTitle = document.createElement("div");
    focusTitle.className = "focus-hero-title";
    focusTitle.textContent = ex.name;
    wrap.appendChild(focusTitle);

    // Muscle tags
    if (ex.muscles && ex.muscles.length) {
      const muscleLine = document.createElement("div");
      muscleLine.className = "focus-hero-muscles";
      muscleLine.innerHTML = ex.muscles.map(m =>
        `<span class="mf-tag">${m}</span>`
      ).join('<span class="mf-sep">·</span>');
      wrap.appendChild(muscleLine);
    }

    // Ledger header
    const ledgerHdr = document.createElement("div");
    ledgerHdr.className = "focus-ledger-header";
    const numSets = ex.sets || 3;
    let setsDone = 0, ledgerVol = 0;
    for (let s = 0; s < numSets; s++) {
      if (getInput(inputKey(block.id, ei, s, "status"), null) === "done") {
        setsDone++;
        const w = getInput(inputKey(block.id, ei, s, "w"), 0);
        const r = getInput(inputKey(block.id, ei, s, "r"), 0);
        ledgerVol += (Number(w) || 0) * (Number(r) || 0);
      }
    }
    ledgerHdr.innerHTML = '<span class="section-title" style="margin:0;">Ledger</span>' +
      '<span class="section-title" style="margin:0;color:var(--text-faint);">Vol ' + (ledgerVol > 0 ? ledgerVol.toLocaleString() : "0") + ' ' + state.unit + '</span>';
    wrap.appendChild(ledgerHdr);

    const card = renderExercise(day, block, ex, bi, ei, isSuperset);
    card.style.setProperty("--card-index", 0);

    const cardWrap = document.createElement("div");
    cardWrap.className = "focus-card-wrap";
    cardWrap.appendChild(card);
    wireFocusSwipe(cardWrap, exCount);
    wrap.appendChild(cardWrap);

    // Check block completion
    const bp = calcBlockProgress(block);
    if (bp.total > 0 && bp.done === bp.total) {
      const doneWrap = document.createElement("div");
      doneWrap.className = "focus-block-done";

      const checkHeader = document.createElement("div");
      checkHeader.className = "focus-done-check";
      checkHeader.textContent = "✓ Block Complete";
      doneWrap.appendChild(checkHeader);

      // Find next incomplete block
      let nextBlockIdx = null;
      for (let i = state.focusBlockIdx + 1; i < day.blocks.length; i++) {
        const nbp = calcBlockProgress(day.blocks[i]);
        if (nbp.done < nbp.total) { nextBlockIdx = i; break; }
      }

      if (nextBlockIdx !== null) {
        const nextBtn = document.createElement("button");
        nextBtn.className = "chapter-start-btn";
        nextBtn.textContent = "Start Block " + day.blocks[nextBlockIdx].letter;
        nextBtn.addEventListener("click", () => {
          state.focusBlockIdx = nextBlockIdx;
          state.focusExIdx = 0;
          renderWorkoutScreen();
        });
        doneWrap.appendChild(nextBtn);

        const overviewLink = document.createElement("button");
        overviewLink.className = "focus-overview-link";
        overviewLink.textContent = "Back to Overview";
        overviewLink.addEventListener("click", () => {
          state.workoutView = "chapters";
          state.focusBlockIdx = null;
          state.focusExIdx = 0;
          renderWorkoutScreen();
        });
        doneWrap.appendChild(overviewLink);
      } else {
        const cdSkipped = getInput("__cooldown|skipped", false);
        if (!cdSkipped) {
          const cdBtn = document.createElement("button");
          cdBtn.className = "chapter-start-btn";
          cdBtn.textContent = "Start Cool Down";
          cdBtn.addEventListener("click", () => {
            state.focusBlockIdx = -1;
            state.focusExIdx = 0;
            renderWorkoutScreen();
          });
          doneWrap.appendChild(cdBtn);
        }
        const overviewBtn = document.createElement("button");
        overviewBtn.className = "chapter-start-btn chapter-start-secondary";
        overviewBtn.textContent = "← Back to Overview";
        overviewBtn.addEventListener("click", () => {
          state.workoutView = "chapters";
          state.focusBlockIdx = null;
          state.focusExIdx = 0;
          renderWorkoutScreen();
        });
        doneWrap.appendChild(overviewBtn);
      }

      wrap.appendChild(doneWrap);
    }
  }

  container.appendChild(wrap);
}

function buildDotNav(count, activeIdx, onTap, dotStates) {
  const nav = document.createElement("div");
  nav.className = "focus-dot-nav";
  for (let i = 0; i < count; i++) {
    const dot = document.createElement("button");
    const st = dotStates ? dotStates[i] : "pending";
    dot.className = "focus-dot" + (i === activeIdx ? " active" : "") + (st === "done" ? " done" : "") + (st === "partial" ? " partial" : "");
    dot.addEventListener("click", () => onTap(i));
    nav.appendChild(dot);
  }
  return nav;
}

function buildCooldownFocusCard(ex) {
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
  const _libRef3 = LIB_BY_ID[ex.exId];
  if (_libRef3 && _libRef3.demoUrl) {
    const dt = document.createElement("span");
    dt.className = "tag demo-tag";
    dt.textContent = "▶ demo";
    dt.onclick = (e) => { e.stopPropagation(); window.open(_libRef3.demoUrl, "_blank"); };
    meta.appendChild(dt);
  }
  info.appendChild(meta);
  head.appendChild(info);
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

  return card;
}

function wireFocusSwipe(cardWrap, exCount) {
  let swStartX = 0, swStartY = 0, isSwiping = false;
  cardWrap.addEventListener("touchstart", (e) => {
    // Don't intercept swipes on set chips (they have their own swipe)
    if (e.target.closest(".set-chip")) return;
    swStartX = e.touches[0].clientX;
    swStartY = e.touches[0].clientY;
    isSwiping = false;
  }, { passive: true });
  cardWrap.addEventListener("touchmove", (e) => {
    if (e.target.closest(".set-chip")) return;
    const dx = e.touches[0].clientX - swStartX;
    const dy = e.touches[0].clientY - swStartY;
    if (!isSwiping && Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * 2) isSwiping = true;
    if (isSwiping) e.preventDefault();
  }, { passive: false });
  cardWrap.addEventListener("touchend", (e) => {
    if (!isSwiping) return;
    const dx = e.changedTouches[0].clientX - swStartX;
    if (dx < -60 && state.focusExIdx < exCount - 1) {
      state.focusExIdx++;
      renderWorkoutScreen();
    } else if (dx > 60 && state.focusExIdx > 0) {
      state.focusExIdx--;
      renderWorkoutScreen();
    }
  }, { passive: true });
}

// ============================================================
// STATS BAR (Floating Live Stats)
// ============================================================
function renderStatsBar(container, day) {
  const stats = calcLiveStats(day);
  const elapsed = state.workoutStartedAt ? Math.floor((Date.now() - state.workoutStartedAt) / 1000) : 0;

  const bar = document.createElement("div");
  bar.className = "stats-bar";

  const volStr = stats.volume >= 10000
    ? (stats.volume / 1000).toFixed(1) + "k"
    : stats.volume.toLocaleString();

  bar.innerHTML = `
    <div class="stat-item">
      <div class="stat-label">Vol</div>
      <div class="stat-value">${volStr}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Sets</div>
      <div class="stat-value">${stats.setsDone} / ${stats.setsTotal}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">PRs</div>
      <div class="stat-value${stats.prs > 0 ? " stat-pr" : ""}">${stats.prs > 0 ? String(stats.prs).padStart(2,'0') : "–"}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Elapsed</div>
      <div class="stat-value">${formatDuration(elapsed)}</div>
    </div>
  `;

  container.appendChild(bar);
}