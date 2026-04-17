// ============================================================
// EXERCISE PREVIEW SHEET (tap-to-preview from bento tiles)
// ============================================================
function openExercisePreviewSheet(exercises, idx, isCooldown, block, bi) {
  const wrap = document.createElement("div");
  wrap.className = "ex-preview";
  const canEdit = !isCooldown && block != null && bi != null;

  function renderForIndex(i) {
    wrap.innerHTML = "";
    const ex = exercises[i];
    const lib = ex.exId ? (LIB_BY_ID[ex.exId] || null) : null;

    // Header: name + close
    const hdr = document.createElement("div");
    hdr.className = "ex-preview-header";
    const nameEl = document.createElement("div");
    nameEl.className = "ex-preview-name";
    nameEl.textContent = ex.name;
    hdr.appendChild(nameEl);
    const closeBtn = document.createElement("button");
    closeBtn.className = "icon-btn";
    closeBtn.textContent = "✕";
    closeBtn.onclick = () => { closeSheet(); renderWorkoutScreen(); };
    hdr.appendChild(closeBtn);
    wrap.appendChild(hdr);

    // Muscle tags
    if (ex.muscles && ex.muscles.length) {
      const row = document.createElement("div");
      row.className = "ex-preview-muscles";
      ex.muscles.forEach(m => {
        const tag = document.createElement("span");
        tag.className = "ex-preview-tag";
        tag.textContent = m;
        const mc = GROUP_COLORS[groupMuscle(m)];
        if (mc) { tag.style.background = mc + "22"; tag.style.color = mc; }
        row.appendChild(tag);
      });
      wrap.appendChild(row);
    }

    // Equipment tags
    const equip = lib ? lib.equipment : null;
    if (equip && equip.length) {
      const row = document.createElement("div");
      row.className = "ex-preview-equip";
      equip.forEach(e => {
        const tag = document.createElement("span");
        tag.className = "ex-preview-equip-tag";
        tag.textContent = e;
        row.appendChild(tag);
      });
      wrap.appendChild(row);
    }

    // Demo button
    const demoUrl = lib ? lib.demoUrl : null;
    if (demoUrl) {
      const btn = document.createElement("button");
      btn.className = "ex-preview-demo-btn";
      btn.textContent = "▶  Watch Demo";
      btn.onclick = () => window.open(demoUrl, "_blank");
      wrap.appendChild(btn);
    }

    // Prescription — editable steppers when canEdit, read-only card otherwise
    if (canEdit && !ex.isWarmup) {
      const fields = document.createElement("div");
      fields.className = "ex-preview-fields";
      fields.innerHTML = `
        <div class="field-row">
          <div class="field"><label>Sets</label>
            <div class="num-input-wrap"><button class="step" data-f="sets" data-s="-1">−</button>
            <input type="number" data-f="sets" value="${ex.sets}" min="1"><button class="step" data-f="sets" data-s="1">+</button></div>
          </div>
          <div class="field"><label>${ex.isTime ? "Seconds" : ex.isDistance ? "Meters" : "Reps"}</label>
            <div class="num-input-wrap"><button class="step" data-f="reps" data-s="-1">−</button>
            <input type="number" data-f="reps" value="${ex.reps}" min="1"><button class="step" data-f="reps" data-s="1">+</button></div>
          </div>
        </div>
        <div class="field-row">
          <div class="field"><label>Rest (sec)</label>
            <div class="num-input-wrap"><button class="step" data-f="rest" data-s="-15">−</button>
            <input type="number" data-f="rest" value="${ex.rest}" min="0" step="15"><button class="step" data-f="rest" data-s="15">+</button></div>
          </div>
          <div class="field"><label>Tempo</label>
            <input data-f="tempo" type="text" placeholder="3-1-1-0" value="${ex.tempo || ''}">
          </div>
        </div>
      `;
      wrap.appendChild(fields);

      // Auto-save helper
      function saveField(field, value) {
        mutateDay(d => {
          const e = d.blocks[bi].exercises[i];
          if (field === "tempo") { e.tempo = value; }
          else { e[field] = parseInt(value) || e[field]; }
        });
      }

      // Wire steppers
      fields.querySelectorAll(".step").forEach(btn => {
        btn.onclick = () => {
          const f = btn.dataset.f;
          const step = parseFloat(btn.dataset.s);
          const input = btn.parentElement.querySelector("input");
          const next = Math.max(0, parseFloat(input.value || 0) + step);
          input.value = next;
          saveField(f, next);
        };
      });

      // Wire direct input changes
      fields.querySelectorAll("input").forEach(input => {
        input.addEventListener("change", () => saveField(input.dataset.f, input.value));
      });
    } else {
      // Read-only prescription card (cooldown / warmup)
      const rx = document.createElement("div");
      rx.className = "ex-preview-rx";
      const numSets = ex.sets || 3;
      let repsLabel;
      if (ex.isWarmup) {
        repsLabel = "warmup";
      } else if (ex.isTime) {
        repsLabel = (ex.reps || 30) + "s" + (ex.perSide ? " /side" : "");
      } else if (ex.isDistance) {
        repsLabel = (ex.reps || 100) + "m";
      } else {
        repsLabel = (ex.reps || 8) + " reps" + (ex.perSide ? " /side" : "");
      }
      let rxHtml = `<div class="ex-preview-rx-row"><span class="ex-preview-rx-label">Sets</span><span class="ex-preview-rx-value">${numSets}</span></div>`;
      rxHtml += `<div class="ex-preview-rx-row"><span class="ex-preview-rx-label">Reps</span><span class="ex-preview-rx-value">${repsLabel}</span></div>`;
      if (ex.rest) rxHtml += `<div class="ex-preview-rx-row"><span class="ex-preview-rx-label">Rest</span><span class="ex-preview-rx-value">${formatRest(ex.rest)}</span></div>`;
      if (ex.tempo) rxHtml += `<div class="ex-preview-rx-row"><span class="ex-preview-rx-label">Tempo</span><span class="ex-preview-rx-value">${ex.tempo}</span></div>`;
      rx.innerHTML = rxHtml;
      wrap.appendChild(rx);
    }

    // Last session history
    if (!isCooldown && ex.exId) {
      const lastSets = getLastSetsFor(ex.exId);
      if (lastSets.length) {
        const hist = document.createElement("div");
        hist.className = "ex-preview-history";
        const label = document.createElement("div");
        label.className = "ex-preview-history-label";
        label.textContent = "LAST SESSION";
        hist.appendChild(label);
        const chips = document.createElement("div");
        chips.className = "ex-preview-history-chips";
        lastSets.forEach(s => {
          const chip = document.createElement("span");
          chip.className = "prev-set";
          const isBodyweight = lib && lib.bodyweight;
          if (isBodyweight) {
            chip.textContent = s.reps + (ex.isTime ? "s" : "");
          } else {
            chip.textContent = (s.weight || 0) + "×" + s.reps;
          }
          chips.appendChild(chip);
        });
        hist.appendChild(chips);
        wrap.appendChild(hist);
      }
    }

    // Prev / Next nav
    if (exercises.length > 1) {
      const nav = document.createElement("div");
      nav.className = "ex-preview-nav";
      const prevBtn = document.createElement("button");
      prevBtn.className = "ex-preview-nav-btn";
      prevBtn.textContent = "‹";
      prevBtn.disabled = i === 0;
      prevBtn.onclick = () => renderForIndex(i - 1);
      const counter = document.createElement("span");
      counter.className = "ex-preview-counter";
      counter.textContent = (i + 1) + " / " + exercises.length;
      const nextBtn = document.createElement("button");
      nextBtn.className = "ex-preview-nav-btn";
      nextBtn.textContent = "›";
      nextBtn.disabled = i === exercises.length - 1;
      nextBtn.onclick = () => renderForIndex(i + 1);
      nav.appendChild(prevBtn);
      nav.appendChild(counter);
      nav.appendChild(nextBtn);
      wrap.appendChild(nav);
    }
  }

  renderForIndex(idx);
  openSheet(wrap);
}
