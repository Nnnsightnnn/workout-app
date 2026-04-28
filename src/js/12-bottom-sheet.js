// ============================================================
// BOTTOM SHEET (day picker, library, menus)
// ============================================================
function openSheet(html) {
  document.getElementById("sheetContent").innerHTML = "";
  if (typeof html === "string") {
    document.getElementById("sheetContent").innerHTML = html;
  } else {
    document.getElementById("sheetContent").appendChild(html);
  }
  document.getElementById("sheetBg").classList.add("active");
}
function closeSheet() {
  document.getElementById("sheetBg").classList.remove("active");
}

function openDayPicker() {
  const u = userData();
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><h3 style="margin:0;">Switch Day</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div><p style="color:var(--text-dim);font-size:12px;margin-bottom:10px;">Your next in rotation is highlighted.</p>`;
  const next = (u.lastDoneDayId == null) ? 1 : (u.lastDoneDayId % u.program.length) + 1;
  u.program.forEach(d => {
    const btn = document.createElement("button");
    btn.className = "sheet-item" + (d.id === state.currentDayId ? " current" : "");
    const nextTag = d.id === next ? '<span class="meta" style="color:var(--accent);">next</span>' : "";
    const customTag = d.isCustom ? '<span class="meta" style="color:var(--text-dim);">custom</span>' : "";
    btn.innerHTML = `<span class="icon">${d.id}</span><span>${d.name}<div style="color:var(--text-dim);font-size:12px;font-weight:500;">${d.sub || ''}</div></span>${nextTag}${customTag}`;
    btn.onclick = () => { switchDay(d.id); closeSheet(); };
    wrap.appendChild(btn);
  });

  // Add Day tile
  var addDayBtn = document.createElement("button");
  addDayBtn.className = "sheet-item sheet-item-add";
  addDayBtn.innerHTML = '<span class="icon">+</span><span>Add Day</span>';
  addDayBtn.onclick = function() { closeSheet(); setTimeout(addTrainingDay, 80); };
  wrap.appendChild(addDayBtn);

  // View Full Program link
  var progBtn = document.createElement("button");
  progBtn.className = "sheet-item";
  progBtn.style.marginTop = "8px";
  progBtn.innerHTML = '<span class="icon" style="font-size:14px;">\u25A6</span> View Full Program';
  progBtn.onclick = function() { closeSheet(); setTimeout(openLookAhead, 80); };
  wrap.appendChild(progBtn);

  openSheet(wrap);
}

// ============================================================
// WEEKLY SCHEDULE EDITOR — assign program days to days of week
// ============================================================
const _DOW_LABELS_LONG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const _DOW_LABELS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Ensures u.weeklySchedule is a 7-element array, seeding from default pattern if missing.
function ensureWeeklySchedule(u) {
  if (!Array.isArray(u.weeklySchedule) || u.weeklySchedule.length !== 7) {
    u.weeklySchedule = (typeof buildDefaultWeeklySchedule === "function")
      ? buildDefaultWeeklySchedule(u)
      : [null, null, null, null, null, null, null];
  }
  return u.weeklySchedule;
}

// Find which dow currently holds a given dayId, or -1 if none.
function _dowOfDayId(schedule, dayId) {
  if (!Array.isArray(schedule)) return -1;
  for (let i = 0; i < 7; i++) if (schedule[i] === dayId) return i;
  return -1;
}

// Set program-day at given dow. If that dayId is already on a different dow,
// swap (so each program day appears at most once per week).
function _assignDayToDow(schedule, dow, dayId) {
  const existingDow = _dowOfDayId(schedule, dayId);
  const displaced = schedule[dow];
  schedule[dow] = dayId;
  if (existingDow !== -1 && existingDow !== dow) {
    schedule[existingDow] = displaced;
  }
}

function openWeeklyScheduleEditor() {
  const u = userData();
  if (!u) return;

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">Weekly Schedule</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>
    </div>
    <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">Assign each weekday to a program day or rest. Days repeat weekly.</p>
  `;

  function rerender() {
    const u2 = userData();
    const sched = ensureWeeklySchedule(u2);
    list.innerHTML = "";

    for (let dow = 0; dow < 7; dow++) {
      const row = document.createElement("button");
      row.className = "sheet-item";
      const assignedId = sched[dow];
      const day = assignedId != null ? u2.program.find(d => d.id === assignedId) : null;
      const isToday = dow === new Date().getDay();
      const todayBadge = isToday ? '<span class="meta" style="color:var(--accent);">today</span>' : '';
      const label = day
        ? `<span style="font-weight:700;">Day ${day.id} — ${day.name}</span><div style="color:var(--text-dim);font-size:11px;font-weight:500;">${day.sub || ""}</div>`
        : `<span style="color:var(--text-dim);">Rest</span>`;
      row.innerHTML = `<span class="icon">${_DOW_LABELS_SHORT[dow][0]}</span><span style="flex:1;text-align:left;">${_DOW_LABELS_LONG[dow]}<div>${label}</div></span>${todayBadge}`;
      row.onclick = () => openAssignDayPicker(dow, () => rerender());
      list.appendChild(row);
    }
  }

  const list = document.createElement("div");
  wrap.appendChild(list);
  rerender();

  openSheet(wrap);
}

function openAssignDayPicker(dow, onDone) {
  const u = userData();
  if (!u) return;

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">${_DOW_LABELS_LONG[dow]}</h3>
      <button class="icon-btn" id="assignBackBtn" title="Back">←</button>
    </div>
    <p style="color:var(--text-dim);font-size:12px;margin-bottom:10px;">Pick which workout to do on ${_DOW_LABELS_LONG[dow]}, or set as rest day.</p>
  `;

  // Rest option
  const restBtn = document.createElement("button");
  restBtn.className = "sheet-item";
  const sched = ensureWeeklySchedule(u);
  if (sched[dow] == null) restBtn.classList.add("current");
  restBtn.innerHTML = `<span class="icon">—</span><span>Rest day</span>`;
  restBtn.onclick = () => {
    updateUser(usr => {
      const s = ensureWeeklySchedule(usr);
      s[dow] = null;
    });
    state.currentDayId = determineDefaultDay();
    if (typeof renderTimelineStrip === "function") renderTimelineStrip();
    if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
    openWeeklyScheduleEditor();
  };
  wrap.appendChild(restBtn);

  u.program.forEach(d => {
    const btn = document.createElement("button");
    btn.className = "sheet-item" + (sched[dow] === d.id ? " current" : "");
    const otherDow = _dowOfDayId(sched, d.id);
    const swapNote = (otherDow !== -1 && otherDow !== dow)
      ? `<span class="meta" style="color:var(--text-dim);">on ${_DOW_LABELS_SHORT[otherDow]} — swaps</span>`
      : "";
    btn.innerHTML = `<span class="icon">${d.id}</span><span>${d.name}<div style="color:var(--text-dim);font-size:11px;font-weight:500;">${d.sub || ""}</div></span>${swapNote}`;
    btn.onclick = () => {
      updateUser(usr => {
        const s = ensureWeeklySchedule(usr);
        _assignDayToDow(s, dow, d.id);
      });
      state.currentDayId = determineDefaultDay();
      if (typeof renderTimelineStrip === "function") renderTimelineStrip();
      if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
      openWeeklyScheduleEditor();
    };
    wrap.appendChild(btn);
  });

  openSheet(wrap);
  const back = document.getElementById("assignBackBtn");
  if (back) back.onclick = () => openWeeklyScheduleEditor();
}

function switchDay(dayId) {
  state.currentDayId = dayId;
  state.dayChosen = true;
  // Reset session timer state
  stopSessionTimer();
  state.workoutStartedAt = null;
  renderWorkoutScreen();
  // If there's a draft for this day and autoTimer is on, re-start timer
  const draft = getDraft();
  if (draft && state.autoTimer) {
    state.workoutStartedAt = draft.startedAt;
    startSessionTimer();
  }
  updateFinishButton();
}

function openLibrary(blockId) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><h3 style="margin:0;">Add Exercise</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div>`;
  const search = document.createElement("input");
  search.className = "lib-search";
  search.placeholder = "Search exercises…";
  wrap.appendChild(search);

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
  wrap.appendChild(catRow);

  const list = document.createElement("div");
  list.className = "lib-items-grid";
  wrap.appendChild(list);

  function renderList() {
    const q = search.value.toLowerCase().trim();
    list.innerHTML = "";
    LIBRARY
      .filter(e => activeCat === "All" || e.cat === activeCat)
      .filter(e => !q || e.name.toLowerCase().includes(q) || (e.muscles||[]).some(m => m.includes(q)))
      .forEach(e => {
        const b = document.createElement("button");
        b.className = "lib-item";
        b.innerHTML = `<div><div>${e.name}</div><div class="muscles">${(e.muscles||[]).join(" · ")}</div></div><span style="color:var(--accent);">+</span>`;
        b.onclick = () => {
          mutateDay(d => {
            const blk = d.blocks.find(x => x.id === blockId);
            if (blk) blk.exercises.push(mkSets(e));
          });
          closeSheet();
          renderWorkoutScreen();
          showToast(`Added ${e.name}`, "success");
        };
        list.appendChild(b);
      });
  }
  search.oninput = renderList;
  renderList();
  openSheet(wrap);
}

function openExerciseMenu(block, ex, bi, ei) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><h3 style="margin:0;">${ex.name}</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div>`;

  // Watch Demo link
  const libRef = LIB_BY_ID[ex.exId];
  if (libRef && libRef.demoUrl) {
    const demo = document.createElement("button");
    demo.className = "sheet-item";
    demo.innerHTML = `<span class="icon">▶</span> Watch Demo`;
    demo.onclick = () => window.open(libRef.demoUrl, "_blank");
    wrap.appendChild(demo);
  }

  // Rename exercise
  const renameRow = document.createElement("div");
  renameRow.className = "field";
  renameRow.style.marginBottom = "10px";
  renameRow.innerHTML = `<label>Exercise name</label>`;
  const renameInput = document.createElement("input");
  renameInput.type = "text";
  renameInput.value = ex.name;
  renameRow.appendChild(renameInput);
  renameInput.addEventListener("change", () => {
    const newName = renameInput.value.trim();
    if (newName && newName !== ex.name) {
      mutateDay(d => { d.blocks[bi].exercises[ei].name = newName; });
      wrap.querySelector("h3").textContent = newName;
      showToast("Renamed", "success");
    }
  });
  wrap.appendChild(renameRow);

  // Edit sets/reps/rest/tempo
  const fields = document.createElement("div");
  fields.innerHTML = `
    <div class="field-row">
      <div class="field"><label>Sets</label>
        <div class="num-input-wrap"><button class="step" data-f="sets" data-s="-1">−</button>
        <input type="number" id="f-sets" value="${ex.sets}" min="1"><button class="step" data-f="sets" data-s="1">+</button></div>
      </div>
      <div class="field"><label>Reps</label>
        <div class="num-input-wrap"><button class="step" data-f="reps" data-s="-1">−</button>
        <input type="number" id="f-reps" value="${ex.reps}" min="1"><button class="step" data-f="reps" data-s="1">+</button></div>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>Rest (sec)</label>
        <div class="num-input-wrap"><button class="step" data-f="rest" data-s="-15">−</button>
        <input type="number" id="f-rest" value="${ex.rest}" min="0" step="15"><button class="step" data-f="rest" data-s="15">+</button></div>
      </div>
      <div class="field"><label>Tempo</label>
        <input id="f-tempo" type="text" placeholder="3-1-1-0" value="${ex.tempo || ''}">
      </div>
    </div>
    <div class="field" style="margin-bottom:12px;">
      <label>Notes</label>
      <input id="f-notes" type="text" value="${(ex.notes || '').replace(/"/g,'&quot;')}" placeholder="e.g. Focus on form">
    </div>
  `;
  wrap.appendChild(fields);

  const save = document.createElement("button");
  save.className = "sheet-item";
  save.innerHTML = `<span class="icon">✓</span> Save changes`;
  save.onclick = () => {
    mutateDay(d => {
      const e = d.blocks[bi].exercises[ei];
      e.sets = parseInt(document.getElementById("f-sets").value) || e.sets;
      e.reps = parseInt(document.getElementById("f-reps").value) || e.reps;
      e.rest = parseInt(document.getElementById("f-rest").value);
      e.tempo = document.getElementById("f-tempo").value;
      e.notes = document.getElementById("f-notes").value;
    });
    closeSheet();
    renderWorkoutScreen();
    showToast("Updated", "success");
  };
  wrap.appendChild(save);

  // Move up / down
  if (ei > 0) {
    const up = document.createElement("button");
    up.className = "sheet-item";
    up.innerHTML = `<span class="icon">↑</span> Move up in block`;
    up.onclick = () => {
      mutateDay(d => {
        const arr = d.blocks[bi].exercises;
        [arr[ei-1], arr[ei]] = [arr[ei], arr[ei-1]];
      });
      closeSheet(); renderWorkoutScreen();
    };
    wrap.appendChild(up);
  }
  // Check: if more exercises in block after this one
  const blockData = getCurrentDay().blocks[bi];
  if (ei < blockData.exercises.length - 1) {
    const dn = document.createElement("button");
    dn.className = "sheet-item";
    dn.innerHTML = `<span class="icon">↓</span> Move down in block`;
    dn.onclick = () => {
      mutateDay(d => {
        const arr = d.blocks[bi].exercises;
        [arr[ei], arr[ei+1]] = [arr[ei+1], arr[ei]];
      });
      closeSheet(); renderWorkoutScreen();
    };
    wrap.appendChild(dn);
  }

  // Move to different block
  const day = getCurrentDay();
  const otherBlocks = day.blocks.filter((_, i) => i !== bi);
  if (otherBlocks.length > 0) {
    const moveHead = document.createElement("div");
    moveHead.className = "section-title";
    moveHead.style.marginTop = "14px";
    moveHead.textContent = "Move to another block";
    wrap.appendChild(moveHead);
    day.blocks.forEach((b, i) => {
      if (i === bi) return;
      const m = document.createElement("button");
      m.className = "sheet-item";
      m.innerHTML = `<span class="icon">→</span> ${b.letter} · ${b.name} ${b.exercises.length > 0 ? '<span style="color:var(--superset);">(superset)</span>' : ''}`;
      m.onclick = () => {
        mutateDay(d => {
          const e = d.blocks[bi].exercises.splice(ei, 1)[0];
          d.blocks[i].exercises.push(e);
        });
        closeSheet(); renderWorkoutScreen();
      };
      wrap.appendChild(m);
    });
  }

  // Delete
  const del = document.createElement("button");
  del.className = "sheet-item danger";
  del.innerHTML = `<span class="icon">🗑</span> Remove exercise`;
  del.onclick = () => {
    if (!confirm(`Remove ${ex.name}?`)) return;
    mutateDay(d => {
      d.blocks[bi].exercises.splice(ei, 1);
      // If block now empty and not warmup, remove the block too
      if (d.blocks[bi].exercises.length === 0 && d.blocks[bi].type !== "warmup") {
        d.blocks.splice(bi, 1);
      }
    });
    closeSheet();
    renderWorkoutScreen();
    showToast("Removed", "success");
  };
  wrap.appendChild(del);

  // Wire step buttons for the form
  setTimeout(() => {
    wrap.querySelectorAll(".num-input-wrap .step").forEach(btn => {
      btn.onclick = (e) => {
        const step = parseFloat(btn.dataset.s);
        const input = btn.parentElement.querySelector("input");
        input.value = Math.max(0, parseFloat(input.value || 0) + step);
      };
    });
  }, 10);

  openSheet(wrap);
}

function openBlockMenu(block, bi) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><h3 style="margin:0;">Block ${block.letter} — ${block.name}</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div>`;
  const day = getCurrentDay();

  // Rename block
  const renameRow = document.createElement("div");
  renameRow.className = "field" ;
  renameRow.style.marginBottom = "12px";
  renameRow.innerHTML = `<label>Block name</label>`;
  const renameInput = document.createElement("input");
  renameInput.type = "text";
  renameInput.value = block.name;
  renameInput.placeholder = "Block name";
  renameRow.appendChild(renameInput);
  const renameSave = document.createElement("button");
  renameSave.className = "sheet-item";
  renameSave.innerHTML = `<span class="icon">✓</span> Rename`;
  renameSave.onclick = () => {
    const newName = renameInput.value.trim();
    if (newName && newName !== block.name) {
      mutateDay(d => { d.blocks[bi].name = newName; });
      closeSheet(); renderWorkoutScreen();
      showToast("Renamed", "success");
    }
  };
  wrap.appendChild(renameRow);
  wrap.appendChild(renameSave);

  // Move up
  if (bi > 0) {
    const up = document.createElement("button");
    up.className = "sheet-item";
    up.innerHTML = `<span class="icon">↑</span> Move block up`;
    up.onclick = () => {
      mutateDay(d => {
        [d.blocks[bi - 1], d.blocks[bi]] = [d.blocks[bi], d.blocks[bi - 1]];
      });
      closeSheet(); renderWorkoutScreen();
    };
    wrap.appendChild(up);
  }

  // Move down
  if (bi < day.blocks.length - 1) {
    const dn = document.createElement("button");
    dn.className = "sheet-item";
    dn.innerHTML = `<span class="icon">↓</span> Move block down`;
    dn.onclick = () => {
      mutateDay(d => {
        [d.blocks[bi], d.blocks[bi + 1]] = [d.blocks[bi + 1], d.blocks[bi]];
      });
      closeSheet(); renderWorkoutScreen();
    };
    wrap.appendChild(dn);
  }

  // Delete block
  const del = document.createElement("button");
  del.className = "sheet-item danger";
  del.innerHTML = `<span class="icon">🗑</span> Delete entire block`;
  del.onclick = () => {
    if (!confirm(`Delete block ${block.letter}?`)) return;
    mutateDay(d => {
      d.blocks = d.blocks.filter(b => b.id !== block.id);
    });
    closeSheet(); renderWorkoutScreen();
  };
  wrap.appendChild(del);
  openSheet(wrap);
}

function addBlock() {
  const day = getCurrentDay();
  const letters = "ABCDEFGH";
  let letter = "X";
  for (const c of letters) {
    if (!day.blocks.some(b => b.letter === c)) { letter = c; break; }
  }
  const newBlock = {
    id: `custom-${Date.now()}`,
    letter,
    name: "Custom Block",
    exercises: []
  };
  mutateDay(d => { d.blocks.push(newBlock); });
  renderWorkoutScreen();
  // Immediately open library for the new block
  openLibrary(newBlock.id);
}

function openCustomizeDay() {
  const day = getCurrentDay();
  if (!day) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><h3 style="margin:0;">Customize Day</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div>`;

  // Add Block
  const addBlockBtn = document.createElement("button");
  addBlockBtn.className = "sheet-item";
  addBlockBtn.innerHTML = `<span class="icon">+</span> Add block`;
  addBlockBtn.onclick = () => { closeSheet(); addBlock(); };
  wrap.appendChild(addBlockBtn);

  // Add Exercise — pick block then open library
  const addExBtn = document.createElement("button");
  addExBtn.className = "sheet-item";
  addExBtn.innerHTML = `<span class="icon">+</span> Add exercise`;
  addExBtn.onclick = () => {
    if (day.blocks.length === 0) {
      // No blocks yet — create one first, then open library
      closeSheet();
      addBlock();
    } else if (day.blocks.length === 1) {
      closeSheet();
      openLibrary(day.blocks[0].id);
    } else {
      // Show block picker
      wrap.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><h3 style="margin:0;">Add to which block?</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div>`;
      day.blocks.forEach(b => {
        const btn = document.createElement("button");
        btn.className = "sheet-item";
        btn.innerHTML = `<span class="icon">${b.letter}</span> ${b.name}`;
        btn.onclick = () => { closeSheet(); openLibrary(b.id); };
        wrap.appendChild(btn);
      });
    }
  };
  wrap.appendChild(addExBtn);

  // Reset to Default (only for template-generated days)
  if (!day.isCustom) {
    const resetBtn = document.createElement("button");
    resetBtn.className = "sheet-item";
    resetBtn.innerHTML = `<span class="icon">↺</span> Reset to default`;
    resetBtn.onclick = () => { closeSheet(); resetCurrentDay(); };
    wrap.appendChild(resetBtn);
  }

  // Rename day
  const renameRow = document.createElement("div");
  renameRow.className = "field";
  renameRow.style.marginBottom = "10px";
  renameRow.innerHTML = `<label>Day name</label>`;
  const renameInput = document.createElement("input");
  renameInput.type = "text";
  renameInput.value = day.name;
  renameInput.placeholder = "Day name";
  renameRow.appendChild(renameInput);
  renameInput.addEventListener("change", () => {
    const newName = renameInput.value.trim();
    if (newName && newName !== day.name) {
      mutateDay(d => { d.name = newName; });
      showToast("Renamed to " + newName, "success");
    }
  });
  wrap.appendChild(renameRow);

  // Remove custom day
  if (day.isCustom) {
    const removeBtn = document.createElement("button");
    removeBtn.className = "sheet-item danger";
    removeBtn.innerHTML = `<span class="icon">\uD83D\uDDD1</span> Remove this day`;
    removeBtn.onclick = () => { closeSheet(); removeTrainingDay(day.id); };
    wrap.appendChild(removeBtn);
  }

  // Block list
  if (day.blocks.length > 0) {
    const divider = document.createElement("div");
    divider.className = "section-title";
    divider.style.marginTop = "14px";
    divider.textContent = "Blocks";
    wrap.appendChild(divider);
    day.blocks.forEach((b, bi) => {
      const row = document.createElement("button");
      row.className = "sheet-item";
      row.innerHTML = `<span class="icon">${b.letter}</span> ${b.name} <span style="opacity:0.5;margin-left:auto;">${b.exercises.length} ex</span>`;
      row.onclick = () => { closeSheet(); openBlockMenu(b, bi); };
      wrap.appendChild(row);
    });
  }

  openSheet(wrap);
}