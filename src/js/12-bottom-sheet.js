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
  wrap.innerHTML = `<h3>Pick a Workout</h3><p style="color:var(--text-dim);font-size:12px;margin-bottom:10px;">Your next in rotation is highlighted.</p>`;
  const next = (u.lastDoneDayId == null) ? 1 : (u.lastDoneDayId % u.program.length) + 1;
  u.program.forEach(d => {
    const btn = document.createElement("button");
    btn.className = "sheet-item" + (d.id === state.currentDayId ? " current" : "");
    const nextTag = d.id === next ? '<span class="meta" style="color:var(--accent);">next</span>' : "";
    btn.innerHTML = `<span class="icon">${d.id}</span><span>${d.name}<div style="color:var(--text-dim);font-size:12px;font-weight:500;">${d.sub || ''}</div></span>${nextTag}`;
    btn.onclick = () => { switchDay(d.id); closeSheet(); };
    wrap.appendChild(btn);
  });
  openSheet(wrap);
}

function switchDay(dayId) {
  state.currentDayId = dayId;
  state.dayChosen = true;
  // Reset session timer state
  stopSessionTimer();
  state.workoutStartedAt = null;
  renderWorkoutScreen();
  // If there's a draft for this day, re-start timer
  const draft = getDraft();
  if (draft) {
    state.workoutStartedAt = draft.startedAt;
    startSessionTimer();
  }
  updateFinishButton();
}

function openLibrary(blockId) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<h3>Add Exercise</h3>`;
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
  wrap.innerHTML = `<h3>${ex.name}</h3>`;

  // Watch Demo link
  const libRef = LIB_BY_ID[ex.exId];
  if (libRef && libRef.demoUrl) {
    const demo = document.createElement("button");
    demo.className = "sheet-item";
    demo.innerHTML = `<span class="icon">▶</span> Watch Demo`;
    demo.onclick = () => window.open(libRef.demoUrl, "_blank");
    wrap.appendChild(demo);
  }

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

function openBlockMenu(block) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<h3>Block ${block.letter} — ${block.name}</h3>`;
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