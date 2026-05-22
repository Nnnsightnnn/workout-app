// ============================================================
// PAPER LOG SETS — retroactive "log a past day" modal
// ============================================================
// Mirrors the chunky openLogSets() in 09a but emits paper-* DOM
// so the modal matches the notepad aesthetic when paper skin is
// active. Same session-save semantics: noon-on-target-date,
// manual:true, recomputeAllIsPR, refresh timeline + history.

function paperOpenLogSets(dateMs, day) {
  const d = new Date(dateMs);
  const dateStr = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  const wrap = document.createElement("div");
  wrap.className = "paper-log-modal";

  // Top bar
  const top = document.createElement("div");
  top.className = "paper-session-topbar";
  top.innerHTML = `
    <div class="paper-session-breadcrumb">§ Log workout</div>
    <button class="paper-session-close" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round"
           style="filter:url(#paper-roughen);">
        <path d="M6 6 L18 18 M18 6 L6 18"/>
      </svg>
    </button>
  `;
  top.querySelector(".paper-session-close").addEventListener("click", () => closeSheet());
  wrap.appendChild(top);

  // Headline
  const head = document.createElement("div");
  head.className = "paper-session-headline";
  head.innerHTML = `
    <div class="paper-session-date">${escapeHtml(day.name || "Workout")}</div>
    <div class="paper-session-meta">
      <span>${escapeHtml(dateStr)}</span>
      <span>${escapeHtml(day.sub || "")}</span>
    </div>
  `;
  wrap.appendChild(head);

  // Body — one row per non-warmup exercise
  const body = document.createElement("div");
  body.className = "paper-log-body";

  const exRows = []; // [{ ex, row, exEntry: { rpe } }]
  let letterIdx = 0;

  (day.blocks || []).forEach(block => {
    (block.exercises || []).forEach(ex => {
      if (ex.isWarmup) return;
      const lastSets = (typeof getLastSetsFor === "function") ? getLastSetsFor(ex.exId || ex.name) : [];
      const lastSet = lastSets[0];
      const defW = lastSet ? lastSet.weight : (ex.defaultWeight || 0);
      const defR = lastSet ? lastSet.reps   : (ex.reps || 8);
      const letter = String.fromCharCode(65 + letterIdx);
      letterIdx++;

      const exEntry = { ex, sets: ex.sets, rpe: null };

      const exEl = document.createElement("div");
      exEl.className = "paper-log-ex";

      const targetSpec = `${ex.sets} &times; ${ex.reps != null ? ex.reps : "?"}`;
      const weightFieldHtml = ex.bodyweight
        ? ""
        : `<input type="number" class="paper-log-input" data-field="w" value="${defW}" min="0" inputmode="decimal">
           <span class="paper-log-x">&times;</span>`;

      exEl.innerHTML = `
        <div class="paper-log-ex-head">
          <div class="paper-log-ex-left">
            <span class="paper-log-ex-no">${letter})</span>
            <span class="paper-log-ex-name">${escapeHtml(ex.name)}</span>
          </div>
          <div class="paper-log-ex-target">${targetSpec}</div>
        </div>
        <div class="paper-log-ex-fields">
          <span class="paper-log-label">${ex.sets} sets</span>
          ${weightFieldHtml}
          <input type="number" class="paper-log-input" data-field="r" value="${defR}" min="0" inputmode="numeric">
          <span class="paper-log-rpe-lbl">RPE</span>
          <div class="paper-log-rpe-pills"></div>
        </div>
      `;

      const pillsEl = exEl.querySelector(".paper-log-rpe-pills");
      [null, 6, 7, 8, 9, 10].forEach(val => {
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = "paper-log-rpe-pill";
        pill.textContent = val === null ? "—" : String(val);
        pill.dataset.rpe = val === null ? "" : String(val);
        pill.title = val === null ? "Skip RPE" : "RPE " + val;
        pill.addEventListener("click", () => {
          exEntry.rpe = val;
          pillsEl.querySelectorAll(".paper-log-rpe-pill").forEach(p => p.classList.remove("selected"));
          pill.classList.add("selected");
        });
        pillsEl.appendChild(pill);
      });

      body.appendChild(exEl);
      exRows.push({ ex, row: exEl, exEntry });
    });
  });

  wrap.appendChild(body);

  // Footer actions
  const actions = document.createElement("div");
  actions.className = "sheet-actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () => closeSheet());
  actions.appendChild(cancelBtn);

  const saveBtn = document.createElement("button");
  saveBtn.className = "primary";
  saveBtn.textContent = "Save workout";
  saveBtn.addEventListener("click", () => {
    const sets = [];
    exRows.forEach(({ ex, row, exEntry }) => {
      const wInput = row.querySelector('[data-field="w"]');
      const rInput = row.querySelector('[data-field="r"]');
      const w = wInput ? (parseFloat(wInput.value) || 0) : 0;
      const r = rInput ? (parseFloat(rInput.value) || 0) : 0;
      if (r === 0) return;
      for (let i = 0; i < ex.sets; i++) {
        sets.push({
          exId: ex.exId || ex.name,
          exName: ex.name,
          muscles: ex.muscles || [],
          setIdx: i + 1,
          weight: ex.bodyweight ? 0 : w,
          reps: r,
          rpe: exEntry.rpe,
          bodyweight: !!ex.bodyweight,
          isPR: false
        });
      }
    });

    if (sets.length === 0) {
      if (!confirm("No sets with reps logged. Save an empty session?")) return;
    }

    const volume = sets.reduce((a, s) => a + (s.bodyweight ? 0 : s.weight * s.reps), 0);
    const noon = new Date(dateMs);
    noon.setHours(12, 0, 0, 0);
    const finishedAt = noon.getTime();
    const isAdhoc = day.id === "adhoc";

    const session = {
      id: "s-" + Date.now(),
      dayId: day.id,
      dayName: day.name,
      startedAt: finishedAt - 3600000,
      finishedAt,
      duration: 3600,
      sets, volume,
      prCount: 0,
      manual: true,
      isAdhoc: isAdhoc || undefined
    };

    updateUser(u => {
      u.sessions.push(session);
      u.sessions.sort((a, b) => a.finishedAt - b.finishedAt);
      if (u.sessions.length > 365) u.sessions = u.sessions.slice(-365);
    });

    if (typeof recomputeAllIsPR === "function") recomputeAllIsPR();
    closeSheet();
    if (typeof renderTimelineStrip === "function") renderTimelineStrip();
    if (typeof renderHistory === "function") renderHistory();
    showToast("Workout logged", "success");
  });
  actions.appendChild(saveBtn);

  wrap.appendChild(actions);

  openSheet(wrap);
}

if (typeof window !== "undefined") {
  window.paperOpenLogSets = paperOpenLogSets;
}
