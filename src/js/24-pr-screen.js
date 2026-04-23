// ============================================================
// PR SCREEN — dashboard and lift detail views
// ============================================================

// Track which detail lift is open (null = show dashboard)
let _prDetailExId = null;

function renderPRScreen() {
  const container = document.getElementById("screen-prs");
  if (!container) return;
  if (_prDetailExId) {
    _renderPRDetail(container, _prDetailExId);
  } else {
    _renderPRDashboard(container);
  }
}

// ── Dashboard ────────────────────────────────────────────────

function _renderPRDashboard(container) {
  const u = userData();
  const unit = state.unit || "lbs";
  const pinned = getPinnedLifts();

  let html = `
    <div class="pr-dashboard-header">
      <button class="icon-btn pr-back-btn" id="prHomeBtn" title="Back to workout">←</button>
      <div style="flex:1;">
        <h2>Personal Records</h2>
        <p class="pr-subtitle">Your tracked lifts and all-time bests.</p>
      </div>
      <button class="icon-btn" id="prPinBtn" title="Pin a lift">＋</button>
    </div>
  `;

  if (!pinned.length) {
    html += `<div class="empty">No tracked lifts yet. Tap ＋ to pin a lift to track.</div>`;
    container.innerHTML = html;
    _bindPRDashboardEvents(container);
    return;
  }

  html += `<div class="pr-lift-list">`;
  pinned.forEach(exId => {
    const ex = LIB_BY_ID[exId];
    const name = ex ? ex.name : exId;
    const pr = getAllTimePR(exId);
    const trend = getE1RMTrend(exId);

    if (!pr) {
      html += `
        <div class="pr-lift-card pr-lift-card--empty" data-exid="${exId}" role="button">
          <div class="pr-lift-name">${_esc(name)}</div>
          <div class="pr-lift-no-data">No data yet</div>
          <button class="pr-add-manual-btn" data-exid="${exId}" title="Add PR">+ Add PR</button>
          <button class="pr-unpin-btn" data-exid="${exId}" title="Unpin">✕</button>
        </div>`;
      return;
    }

    const e1rmDisplay = Math.round(pr.e1rm);
    const trendIcon = trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→";
    const trendClass = trend.direction === "up" ? "trend-up" : trend.direction === "down" ? "trend-down" : "trend-flat";
    const trendLabel = trend.direction === "flat"
      ? "No change"
      : `${trend.direction === "up" ? "+" : ""}${Math.round(trend.deltaPercent)}% vs 30d ago`;
    const dateStr = _fmtDate(pr.date);

    html += `
      <div class="pr-lift-card" data-exid="${exId}" role="button">
        <div class="pr-lift-card-inner">
          <div class="pr-lift-left">
            <div class="pr-lift-name">${_esc(name)}</div>
            <div class="pr-lift-date">${dateStr}</div>
          </div>
          <div class="pr-lift-right">
            <div class="pr-lift-e1rm">${e1rmDisplay} <span class="pr-lift-unit">${_esc(unit)}</span></div>
            <div class="pr-lift-set-label">${pr.weight}×${pr.reps} top set</div>
            <div class="pr-trend ${trendClass}">${trendIcon} ${_esc(trendLabel)}</div>
          </div>
        </div>
        <button class="pr-unpin-btn" data-exid="${exId}" title="Unpin">✕</button>
      </div>`;
  });
  html += `</div>`;

  container.innerHTML = html;
  _bindPRDashboardEvents(container);
}

function _bindPRDashboardEvents(container) {
  // Open lift detail on card tap
  container.querySelectorAll(".pr-lift-card[data-exid]").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.closest(".pr-unpin-btn")) return;
      _prDetailExId = card.dataset.exid;
      renderPRScreen();
    });
  });
  // Unpin
  container.querySelectorAll(".pr-unpin-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const exId = btn.dataset.exid;
      togglePinnedLift(exId);
      renderPRScreen();
    });
  });
  // Add manual PR from empty card
  container.querySelectorAll(".pr-add-manual-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      _openAddManualPRSheet(btn.dataset.exid);
    });
  });
  // Pin new lift
  const pinBtn = document.getElementById("prPinBtn");
  if (pinBtn) pinBtn.onclick = _openPinLiftPicker;
  // Back to workout screen
  const homeBtn = document.getElementById("prHomeBtn");
  if (homeBtn) homeBtn.onclick = () => showScreen("workout");
}

// ── Lift Detail ───────────────────────────────────────────────

function _renderPRDetail(container, exId) {
  const ex = LIB_BY_ID[exId];
  const name = ex ? ex.name : exId;
  const unit = state.unit || "lbs";

  const pr = getAllTimePR(exId);
  const pbs = getPBsByRepCount(exId);
  const history = getE1RMHistory(exId);
  const recent = getRecentSessions(exId, 10);

  let html = `
    <div class="pr-detail-header">
      <button class="pr-back-btn icon-btn" id="prBackBtn" title="Back">←</button>
      <div class="pr-detail-title">${_esc(name)}</div>
      <button class="pr-add-detail-btn icon-btn" id="prAddManualBtn" title="Add PR">＋</button>
      <button class="pr-unpin-detail-btn icon-btn ${getPinnedLifts().includes(exId) ? "active" : ""}"
              id="prPinToggleBtn" title="${getPinnedLifts().includes(exId) ? "Unpin" : "Pin"}">
        ${getPinnedLifts().includes(exId) ? "★" : "☆"}
      </button>
    </div>
  `;

  if (!pr) {
    html += `<div class="empty">No weighted sets logged yet.<br><button class="pr-add-manual-cta" id="prAddManualCTA">+ Add a PR manually</button></div>`;
    container.innerHTML = html;
    document.getElementById("prBackBtn").onclick = () => { _prDetailExId = null; renderPRScreen(); };
    document.getElementById("prAddManualBtn").onclick = () => _openAddManualPRSheet(exId);
    const cta = document.getElementById("prAddManualCTA");
    if (cta) cta.onclick = () => _openAddManualPRSheet(exId);
    return;
  }

  // All-time PR display
  html += `
    <div class="pr-alltime-card">
      <div class="pr-alltime-label">All-Time PR</div>
      <div class="pr-alltime-e1rm">${Math.round(pr.e1rm)}<span class="pr-alltime-unit"> ${_esc(unit)} e1RM</span></div>
      <div class="pr-alltime-set">${pr.weight} ${_esc(unit)} × ${pr.reps} rep${pr.reps !== 1 ? "s" : ""}</div>
      <div class="pr-alltime-date">${_fmtDate(pr.date)}${pr.manual ? ' <span class="pr-manual-tag">manual</span>' : ''}</div>
    </div>
  `;

  // Chart
  if (history.length >= 2) {
    html += `<div class="section-title">Progress</div>`;
    html += _buildSVGChart(history, unit);
  } else if (history.length === 1) {
    html += `<div class="pr-chart-single">One session logged — chart will appear after more data.</div>`;
  }

  // Personal bests by rep count
  const repTargets = [1, 3, 5, 10];
  const hasPBs = repTargets.some(r => pbs[r]);
  if (hasPBs) {
    html += `<div class="section-title">Bests by Rep Count</div>`;
    html += `<div class="pr-pbs-grid">`;
    repTargets.forEach(r => {
      if (!pbs[r]) return;
      html += `
        <div class="pr-pb-card">
          <div class="pr-pb-rep">${r}RM</div>
          <div class="pr-pb-weight">${pbs[r].weight}<span class="pr-pb-unit"> ${_esc(unit)}</span></div>
          <div class="pr-pb-date">${_fmtDate(pbs[r].date)}${pbs[r].manual ? ' <span class="pr-manual-tag">manual</span>' : ''}</div>
        </div>`;
    });
    html += `</div>`;
  }

  // Manual entries
  const manuals = getManualPRsForExercise(exId);
  if (manuals.length) {
    html += `<div class="section-title">Manual Entries</div>`;
    html += `<div class="pr-manual-list">`;
    manuals.forEach(m => {
      html += `
        <div class="pr-manual-entry">
          <div class="pr-manual-info">
            <span class="pr-manual-set">${m.weight} ${_esc(m.unit || unit)} × ${m.reps}</span>
            <span class="pr-manual-date">${_fmtDate(m.date)}</span>
          </div>
          <button class="pr-manual-delete" data-mprid="${m.id}" title="Delete">✕</button>
        </div>`;
    });
    html += `</div>`;
  }

  // Recent sessions table
  if (recent.length) {
    html += `<div class="section-title">Recent Sessions</div>`;
    html += `<div class="pr-sessions-table">`;
    html += `<div class="pr-sessions-row pr-sessions-head">
      <div>Date</div><div>Top Set</div><div>e1RM</div>
    </div>`;
    recent.slice().reverse().forEach(s => {
      html += `<div class="pr-sessions-row">
        <div>${_fmtDate(s.date)}</div>
        <div>${s.topSet.weight}×${s.topSet.reps}</div>
        <div>${Math.round(s.e1rm)}</div>
      </div>`;
    });
    html += `</div>`;
  }

  container.innerHTML = html;

  document.getElementById("prBackBtn").onclick = () => { _prDetailExId = null; renderPRScreen(); };
  document.getElementById("prAddManualBtn").onclick = () => _openAddManualPRSheet(exId);
  document.getElementById("prPinToggleBtn").onclick = () => {
    togglePinnedLift(exId);
    _renderPRDetail(container, exId);
  };
  container.querySelectorAll(".pr-manual-delete").forEach(btn => {
    btn.onclick = () => {
      deleteManualPR(btn.dataset.mprid);
      _renderPRDetail(container, exId);
      showToast("Manual PR deleted");
    };
  });
}

// ── SVG Chart ────────────────────────────────────────────────

function _buildSVGChart(history, unit) {
  const W = 320, H = 160, PAD = { top: 16, right: 16, bottom: 36, left: 48 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const vals = history.map(p => p.e1rm);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;

  // Scale helpers
  const scaleX = i => PAD.left + (i / (history.length - 1)) * innerW;
  const scaleY = v => PAD.top + innerH - ((v - minV) / range) * innerH;

  // Build path
  const points = history.map((p, i) => `${scaleX(i).toFixed(1)},${scaleY(p.e1rm).toFixed(1)}`);
  const pathD = "M" + points.join(" L");

  // Y axis ticks (3 values: min, mid, max)
  const yTicks = [minV, (minV + maxV) / 2, maxV];

  // X axis labels: show first and last date (and middle if ≥4 points)
  const xLabels = [];
  xLabels.push({ i: 0, label: _fmtDateShort(history[0].date) });
  if (history.length >= 4) {
    const mid = Math.floor((history.length - 1) / 2);
    xLabels.push({ i: mid, label: _fmtDateShort(history[mid].date) });
  }
  xLabels.push({ i: history.length - 1, label: _fmtDateShort(history[history.length - 1].date) });

  // Dots
  const dots = history.map((p, i) => {
    const cx = scaleX(i).toFixed(1);
    const cy = scaleY(p.e1rm).toFixed(1);
    const isPeak = p.e1rm === maxV;
    return `<circle cx="${cx}" cy="${cy}" r="${isPeak ? 5 : 3}"
      fill="${isPeak ? "var(--warn)" : "var(--accent)"}"
      stroke="var(--bg)" stroke-width="1.5"/>`;
  }).join("");

  // Area fill path (close below the line)
  const areaD = pathD
    + ` L${scaleX(history.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)}`
    + ` L${PAD.left.toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`;

  const yTicksHTML = yTicks.map(v =>
    `<text x="${PAD.left - 6}" y="${(scaleY(v) + 4).toFixed(1)}"
      text-anchor="end" font-size="9" fill="var(--text-faint)"
      font-family="'JetBrains Mono',-apple-system,BlinkMacSystemFont,sans-serif">${Math.round(v)}</text>
    <line x1="${PAD.left}" y1="${scaleY(v).toFixed(1)}" x2="${PAD.left + innerW}" y2="${scaleY(v).toFixed(1)}"
      stroke="var(--border)" stroke-width="0.5"/>`
  ).join("");

  const xLabelsHTML = xLabels.map(({ i, label }) => {
    const x = scaleX(i).toFixed(1);
    const anchor = i === 0 ? "start" : i === history.length - 1 ? "end" : "middle";
    return `<text x="${x}" y="${(H - 6).toFixed(1)}"
      text-anchor="${anchor}" font-size="9" fill="var(--text-faint)"
      font-family="'JetBrains Mono',-apple-system,BlinkMacSystemFont,sans-serif">${_esc(label)}</text>`;
  }).join("");

  return `
    <div class="pr-chart-wrap">
      <svg class="pr-chart" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
           role="img" aria-label="e1RM progress chart for ${unit}">
        <defs>
          <linearGradient id="prChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <!-- Grid lines and Y labels -->
        ${yTicksHTML}
        <!-- Area fill -->
        <path d="${areaD}" fill="url(#prChartGrad)"/>
        <!-- Line -->
        <path d="${pathD}" fill="none" stroke="var(--accent)" stroke-width="2"
              stroke-linejoin="round" stroke-linecap="round"/>
        <!-- Dots -->
        ${dots}
        <!-- X labels -->
        ${xLabelsHTML}
      </svg>
    </div>`;
}

// ── Add Manual PR Sheet ──────────────────────────────────────

function _openAddManualPRSheet(exId) {
  const ex = LIB_BY_ID[exId];
  const name = ex ? ex.name : exId;
  const unit = state.unit || "lbs";
  const today = new Date().toISOString().slice(0, 10);

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h3 style="margin:0;">Add PR</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>
    </div>
    <p style="color:var(--text-dim); font-size:13px; margin-bottom:12px;">${_esc(name)}</p>
    <div style="display:flex;gap:10px;margin-bottom:10px;">
      <div style="flex:1;">
        <label style="font-size:11px;color:var(--text-dim);display:block;margin-bottom:4px;">Weight (${_esc(unit)})</label>
        <input type="number" id="manualPRWeight" placeholder="225" min="0" step="0.5" inputmode="decimal"
          style="width:100%;font-size:16px;padding:10px;border-radius:10px;border:2px solid var(--border);background:var(--bg-card);color:var(--text);font-family:var(--font-mono);">
      </div>
      <div style="flex:1;">
        <label style="font-size:11px;color:var(--text-dim);display:block;margin-bottom:4px;">Reps</label>
        <input type="number" id="manualPRReps" placeholder="3" min="1" step="1" inputmode="numeric"
          style="width:100%;font-size:16px;padding:10px;border-radius:10px;border:2px solid var(--border);background:var(--bg-card);color:var(--text);font-family:var(--font-mono);">
      </div>
    </div>
    <div style="margin-bottom:14px;">
      <label style="font-size:11px;color:var(--text-dim);display:block;margin-bottom:4px;">Date</label>
      <input type="date" id="manualPRDate" value="${today}"
        style="width:100%;font-size:14px;padding:10px;border-radius:10px;border:2px solid var(--border);background:var(--bg-card);color:var(--text);">
    </div>
    <button class="sheet-item" id="manualPRSaveBtn" style="justify-content:center;font-weight:700;">
      Save PR
    </button>
  `;

  openSheet(html);

  document.getElementById("manualPRSaveBtn").onclick = () => {
    const weight = parseFloat(document.getElementById("manualPRWeight").value);
    const reps = parseInt(document.getElementById("manualPRReps").value);
    const dateStr = document.getElementById("manualPRDate").value;

    if (!weight || weight <= 0) { document.getElementById("manualPRWeight").focus(); return; }
    if (!reps || reps <= 0) { document.getElementById("manualPRReps").focus(); return; }

    let date = Date.now();
    if (dateStr) {
      const d = new Date(dateStr + "T12:00:00");
      if (!isNaN(d.getTime())) date = d.getTime();
    }

    addManualPR(exId, weight, reps, date);
    closeSheet();
    renderPRScreen();
    showToast(`PR saved: ${weight} ${unit} × ${reps}`);
  };

  setTimeout(() => document.getElementById("manualPRWeight").focus(), 50);
}

// ── Pin Lift Picker ───────────────────────────────────────────

function _openPinLiftPicker() {
  const pinned = new Set(getPinnedLifts());

  // Group library by category, skip bodyweight-only and time/distance exercises
  const grouped = {};
  LIBRARY.forEach(ex => {
    if (ex.bodyweight && ex.defaultWeight === 0 && !ex.perSide) return;
    if (ex.isTime || ex.isDistance) return;
    if (!grouped[ex.cat]) grouped[ex.cat] = [];
    grouped[ex.cat].push(ex);
  });

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><h3 style="margin:0;">Pin a Lift</h3><button class="icon-btn" onclick="closeSheet()" title="Close">✕</button></div>
    <p style="color:var(--text-dim); font-size:12px; margin-bottom:12px;">
      Choose an exercise to track on your PR dashboard.
    </p>
    <input class="lib-search" id="pinPickerSearch" placeholder="Search exercises…" autocomplete="off">
    <div id="pinPickerList" style="margin-top:10px; max-height:55vh; overflow-y:auto;">
  `;

  Object.keys(grouped).forEach(cat => {
    html += `<div class="pin-picker-cat">${_esc(cat)}</div>`;
    grouped[cat].forEach(ex => {
      const isPinned = pinned.has(ex.id);
      html += `
        <button class="pin-picker-item ${isPinned ? "pinned" : ""}" data-exid="${ex.id}" data-name="${_esc(ex.name)}">
          <span class="pin-picker-name">${_esc(ex.name)}</span>
          <span class="pin-picker-status">${isPinned ? "★ Pinned" : "☆ Pin"}</span>
        </button>`;
    });
  });
  html += `</div>`;

  openSheet(html);

  // Search filter
  const searchEl = document.getElementById("pinPickerSearch");
  const listEl = document.getElementById("pinPickerList");
  if (searchEl) {
    searchEl.oninput = () => {
      const q = searchEl.value.toLowerCase();
      listEl.querySelectorAll(".pin-picker-item").forEach(btn => {
        const name = btn.dataset.name.toLowerCase();
        btn.style.display = name.includes(q) ? "" : "none";
      });
      listEl.querySelectorAll(".pin-picker-cat").forEach(cat => {
        // Hide category header if all its items are hidden
        let next = cat.nextElementSibling;
        let anyVisible = false;
        while (next && next.classList.contains("pin-picker-item")) {
          if (next.style.display !== "none") anyVisible = true;
          next = next.nextElementSibling;
        }
        cat.style.display = anyVisible ? "" : "none";
      });
    };
    setTimeout(() => searchEl.focus(), 50);
  }

  listEl.querySelectorAll(".pin-picker-item").forEach(btn => {
    btn.onclick = () => {
      const exId = btn.dataset.exid;
      const nowPinned = togglePinnedLift(exId);
      btn.classList.toggle("pinned", nowPinned);
      btn.querySelector(".pin-picker-status").textContent = nowPinned ? "★ Pinned" : "☆ Pin";
      renderPRScreen();
    };
  });
}

// ── Utilities ─────────────────────────────────────────────────

function _esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function _fmtDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function _fmtDateShort(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
