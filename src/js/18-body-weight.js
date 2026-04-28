// ============================================================
// BODY MEASUREMENTS SCREEN (dedicated tracking screen)
// ============================================================
// Length unit derives from the active weight unit (lbs => in, kg => cm).
const _lenUnit = () => state.unit === "lbs" ? "in" : "cm";

const BODY_METRICS = [
  { key: "weight",  label: "Weight",   unitFn: () => state.unit, step: "0.1", icon: "scale" },
  { key: "bodyFat", label: "Body Fat", unitFn: () => "%",        step: "0.1", icon: "percent" },
  { key: "arms",    label: "Arms",     unitFn: _lenUnit,         step: "0.1", icon: "tape" },
  { key: "chest",   label: "Chest",    unitFn: _lenUnit,         step: "0.1", icon: "tape" },
  { key: "waist",   label: "Waist",    unitFn: _lenUnit,         step: "0.1", icon: "tape" },
  { key: "neck",    label: "Neck",     unitFn: _lenUnit,         step: "0.1", icon: "tape" },
  { key: "thighs",  label: "Thighs",   unitFn: _lenUnit,         step: "0.1", icon: "tape" },
  { key: "hips",    label: "Hips",     unitFn: _lenUnit,         step: "0.1", icon: "tape" }
];

// State for inline-edit metric
let _bodyEditingMetric = null;
let _bodyShowLogForm = false;

function _escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}

// ── Delta calculations ──────────────────────────────────────

function _calcDelta(measurements, metricKey) {
  const entries = measurements.filter(e => e[metricKey] != null);
  if (entries.length < 2) return null;
  const latest = entries[entries.length - 1];
  const prev = entries[entries.length - 2];
  const diff = latest[metricKey] - prev[metricKey];
  return { diff, from: prev, to: latest };
}

function _calcMonthDelta(measurements, metricKey) {
  const entries = measurements.filter(e => e[metricKey] != null);
  if (entries.length < 2) return null;
  const latest = entries[entries.length - 1];
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  // Find earliest entry within last 30 days or the most recent one before that
  let monthEntry = null;
  for (let i = entries.length - 2; i >= 0; i--) {
    const ts = typeof entries[i].date === "number" ? entries[i].date : new Date(entries[i].date).getTime();
    if (ts <= thirtyDaysAgo) { monthEntry = entries[i]; break; }
  }
  if (!monthEntry) {
    // Use the earliest entry if all are within 30 days
    monthEntry = entries[0];
    if (monthEntry === latest) return null;
  }
  const diff = latest[metricKey] - monthEntry[metricKey];
  return { diff, from: monthEntry, to: latest };
}

function _daysSince(dateVal) {
  const ts = typeof dateVal === "number" ? dateVal : new Date(dateVal).getTime();
  return Math.floor((Date.now() - ts) / 86400000);
}

function _formatDelta(diff, unit, metricKey) {
  const sign = diff > 0 ? "+" : "";
  const precision = Math.abs(diff) < 10 ? 1 : 0;
  const val = diff.toFixed(precision);
  if (metricKey === "bodyFat") return `${sign}${val}%`;
  return `${sign}${val} ${_escapeHtml(unit)}`;
}

// ── Render Body Screen ──────────────────────────────────────

function renderBodyScreen() {
  const el = document.getElementById("bodyScreenContent");
  if (!el) return;
  const u = userData();
  if (!u) {
    el.innerHTML = '<div style="color:var(--text-dim);font-size:13px;text-align:center;padding:40px 0;">Set up a user first.</div>';
    return;
  }
  const m = u.measurements;
  const unit = state.unit;
  const latest = m.length ? m[m.length - 1] : null;

  let html = '';

  // ── Header ──
  html += `
    <div class="body-screen-header">
      <div style="flex:1;">
        <h2>Body</h2>
        <p class="body-screen-subtitle">Track your measurements over time.</p>
      </div>
      <button class="icon-btn" id="bodyCloseBtn" title="Back to workout" style="width:36px;height:36px;border-radius:10px;">&#10005;</button>
    </div>`;

  // ── Quick Log Button ──
  html += `
    <button class="body-quick-log-btn${_bodyShowLogForm ? ' is-open' : ''}" onclick="_toggleLogForm()">
      <span class="body-quick-log-icon">+</span>
      <span>Log Measurements</span>
    </button>`;

  // ── Log Form (expandable) ──
  if (_bodyShowLogForm) {
    html += `<div class="body-log-form">`;
    // Weight is always shown
    html += `
      <div class="body-log-field body-log-field--primary">
        <label for="bodyInput-weight">Weight <span class="unit-suffix">(${_escapeHtml(unit)})</span></label>
        <input type="number" id="bodyInput-weight" placeholder="0" min="0" step="0.1" inputmode="decimal">
      </div>`;
    // Other metrics in a grid
    html += `<div class="body-log-grid">`;
    BODY_METRICS.forEach(metric => {
      if (metric.key === "weight") return;
      const u = metric.unitFn();
      html += `
        <div class="body-log-field">
          <label for="bodyInput-${metric.key}">${_escapeHtml(metric.label)} <span class="unit-suffix">(${_escapeHtml(u)})</span></label>
          <input type="number" id="bodyInput-${metric.key}" placeholder="0" min="0" step="${metric.step}" inputmode="decimal">
        </div>`;
    });
    html += `</div>`;
    html += `
      <button class="body-save-btn" onclick="logMeasurement()">Save Entry</button>
      <p class="body-log-hint">Weight is required. Other fields are optional.</p>
    </div>`;
  }

  // ── Nudges / Last Measured ──
  if (latest) {
    const daysAgo = _daysSince(latest.date);
    if (daysAgo >= 7) {
      const nudgeText = daysAgo === 1 ? "1 day" : `${daysAgo} days`;
      html += `
        <div class="body-nudge" onclick="_toggleLogForm()">
          <span class="body-nudge-icon">&#128276;</span>
          <span>Last measured <strong>${nudgeText} ago</strong> &mdash; tap to log</span>
        </div>`;
    }
  } else {
    html += `
      <div class="body-nudge" onclick="_toggleLogForm()">
        <span class="body-nudge-icon">&#128203;</span>
        <span>No measurements yet &mdash; <strong>tap to log your first</strong></span>
      </div>`;
  }

  // ── Metric Cards Grid ──
  html += `<div class="body-cards-grid">`;
  BODY_METRICS.forEach(metric => {
    const entries = m.filter(e => e[metric.key] != null);
    const lastEntry = entries.length ? entries[entries.length - 1] : null;
    const unitLabel = metric.unitFn();
    const isEditing = _bodyEditingMetric === metric.key;

    // Value display
    let valueText = "--";
    if (lastEntry) {
      valueText = metric.key === "bodyFat"
        ? `${lastEntry[metric.key]}%`
        : `${lastEntry[metric.key]} ${_escapeHtml(unitLabel)}`;
    }

    // Delta since last
    const delta = _calcDelta(m, metric.key);
    let deltaHtml = '';
    if (delta) {
      const cls = delta.diff > 0 ? "delta-up" : delta.diff < 0 ? "delta-down" : "delta-flat";
      const arrow = delta.diff > 0 ? "&#9650;" : delta.diff < 0 ? "&#9660;" : "&#9654;";
      deltaHtml = `<span class="body-delta ${cls}">${arrow} ${_formatDelta(delta.diff, unitLabel, metric.key)}</span>`;
    }

    // Month delta
    const monthDelta = _calcMonthDelta(m, metric.key);
    let monthHtml = '';
    if (monthDelta && Math.abs(monthDelta.diff) > 0.01) {
      monthHtml = `<span class="body-month-delta">${_formatDelta(monthDelta.diff, unitLabel, metric.key)} this month</span>`;
    }

    // Last measured nudge per metric
    let metricNudge = '';
    if (lastEntry) {
      const days = _daysSince(lastEntry.date);
      if (days > 0) {
        metricNudge = `<span class="body-metric-ago">${days}d ago</span>`;
      } else {
        metricNudge = `<span class="body-metric-ago">today</span>`;
      }
    }

    // Body fat shows % suffix; everything else shows unit
    const editUnit = metric.key === "bodyFat" ? "%" : unitLabel;
    const editStep = metric.step;
    const prefillVal = lastEntry ? lastEntry[metric.key] : "";

    // Build the value/edit area — when editing, replace value+deltas with stepper input
    let valueArea;
    if (isEditing) {
      valueArea = `
        <div class="body-mcard-edit" onclick="event.stopPropagation()">
          <button class="body-step-btn" type="button"
                  onmousedown="event.preventDefault()"
                  ontouchstart="event.preventDefault()"
                  onclick="_stepEditMetric('${metric.key}', -1); event.stopPropagation();">&minus;</button>
          <input type="number" id="bodyEditInput-${metric.key}"
                 class="body-edit-input"
                 inputmode="decimal" step="${editStep}" min="0"
                 value="${prefillVal}"
                 placeholder="0"
                 onkeydown="_handleEditKey(event, '${metric.key}')"
                 onblur="_commitEditOnBlur('${metric.key}')"
                 onclick="event.stopPropagation()">
          <span class="body-edit-unit">${_escapeHtml(editUnit)}</span>
          <button class="body-step-btn" type="button"
                  onmousedown="event.preventDefault()"
                  ontouchstart="event.preventDefault()"
                  onclick="_stepEditMetric('${metric.key}', 1); event.stopPropagation();">+</button>
        </div>
        <div class="body-edit-hint">Enter to save · Esc to cancel</div>`;
    } else {
      valueArea = `
        <div class="body-mcard-value">${valueText}</div>
        ${deltaHtml}
        ${monthHtml}`;
    }

    html += `
      <div class="body-mcard${isEditing ? ' is-editing' : ''}${entries.length >= 2 ? ' has-chart' : ''}" onclick="_startEditMetric('${metric.key}')">
        <div class="body-mcard-top">
          <div class="body-mcard-label">${_escapeHtml(metric.label)}</div>
          ${metricNudge}
        </div>
        ${valueArea}
        ${entries.length >= 2 ? `<canvas class="body-chart" id="bodyChart-${metric.key}"></canvas>` : ''}
        ${!lastEntry && !isEditing ? `<div class="body-mcard-empty">No data &mdash; tap to log</div>` : ''}
      </div>`;
  });
  html += `</div>`;

  // ── Full History ──
  if (m.length > 0) {
    html += `<div class="section-title" style="margin-top:24px;">History</div>`;
    html += `<div class="body-full-history">`;
    const recent = m.slice().reverse().slice(0, 20);
    recent.forEach(entry => {
      const d = new Date(typeof entry.date === "number" ? entry.date : entry.date).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
      const parts = [];
      BODY_METRICS.forEach(metric => {
        const v = entry[metric.key];
        if (v == null) return;
        const u = metric.unitFn();
        parts.push(`<span class="body-hist-tag">${_escapeHtml(metric.label)}: ${metric.key === "bodyFat" ? `${v}%` : `${v} ${_escapeHtml(u)}`}</span>`);
      });
      html += `
        <div class="body-hist-row">
          <div class="body-hist-date">${d}</div>
          <div class="body-hist-values">${parts.join('')}</div>
        </div>`;
    });
    html += `</div>`;
  }

  // ── Bottom padding for nav ──
  html += `<div style="height:80px;"></div>`;

  el.innerHTML = html;

  // Bind close button
  const closeBtn = document.getElementById("bodyCloseBtn");
  if (closeBtn) closeBtn.onclick = () => showScreen('workout');

  // Draw charts
  BODY_METRICS.forEach(metric => {
    const entries = m.filter(e => e[metric.key] != null);
    if (entries.length >= 2) {
      // Hero card (Weight) gets denser labels via taller canvas height set in CSS
      _drawBodyChart(metric.key, metric.key === "weight");
    }
  });

  // Autofocus editing input if any
  if (_bodyEditingMetric) {
    const inp = document.getElementById("bodyEditInput-" + _bodyEditingMetric);
    if (inp) {
      inp.focus();
      // Position cursor at end so + steppers feel natural
      const len = inp.value.length;
      try { inp.setSelectionRange(len, len); } catch (e) {}
    }
  }
}

function _toggleLogForm() {
  _bodyShowLogForm = !_bodyShowLogForm;
  renderBodyScreen();
  if (_bodyShowLogForm) {
    setTimeout(() => {
      const inp = document.getElementById("bodyInput-weight");
      if (inp) inp.focus();
    }, 50);
  }
}

// ── Inline-edit helpers ────────────────────────────────────

function _startEditMetric(key) {
  if (_bodyEditingMetric === key) return;
  _bodyEditingMetric = key;
  _bodyShowLogForm = false;
  renderBodyScreen();
}

function _cancelEditMetric() {
  _bodyEditingMetric = null;
  renderBodyScreen();
}

function _commitEditOnBlur(key) {
  // Only commit if state still says we're editing this key (clicking a sibling card
  // re-renders before blur fires in some browsers — guard against double-save)
  if (_bodyEditingMetric !== key) return;
  const inp = document.getElementById("bodyEditInput-" + key);
  if (!inp) return;
  const raw = inp.value.trim();
  if (raw === "") { _cancelEditMetric(); return; }
  const v = parseFloat(raw);
  if (!Number.isFinite(v) || v <= 0) { _cancelEditMetric(); return; }
  _saveSingleMetric(key, v);
  _bodyEditingMetric = null;
  renderBodyScreen();
  const meta = BODY_METRICS.find(m => m.key === key);
  if (meta) {
    const u = meta.unitFn();
    const display = key === "bodyFat" ? `${v}%` : `${v} ${u}`;
    showToast(`${meta.label}: ${display}`, "success");
  }
}

function _handleEditKey(ev, key) {
  if (ev.key === "Enter") {
    ev.preventDefault();
    const inp = document.getElementById("bodyEditInput-" + key);
    if (inp) inp.blur(); // triggers _commitEditOnBlur
  } else if (ev.key === "Escape") {
    ev.preventDefault();
    _cancelEditMetric();
  }
}

function _stepEditMetric(key, dir) {
  const inp = document.getElementById("bodyEditInput-" + key);
  if (!inp) return;
  const meta = BODY_METRICS.find(m => m.key === key);
  // Stepper increment: 0.5 for body measurements (weight/circumference), 0.1 for body fat %
  const stepSize = (meta && meta.key === "bodyFat") ? 0.1 : 0.5;
  const cur = parseFloat(inp.value) || 0;
  let next = cur + dir * stepSize;
  if (next < 0) next = 0;
  // Round to 1 decimal to avoid float noise
  next = Math.round(next * 10) / 10;
  inp.value = next.toString();
  inp.focus();
}

function _saveSingleMetric(key, value) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();
  updateUser(u => {
    // Find any entry from today (most recent first)
    let todayEntry = null;
    for (let i = u.measurements.length - 1; i >= 0; i--) {
      const e = u.measurements[i];
      const ts = typeof e.date === "number" ? e.date : new Date(e.date).getTime();
      if (ts >= todayMs) { todayEntry = e; break; }
      if (ts < todayMs) break;
    }
    if (todayEntry) {
      todayEntry[key] = value;
    } else {
      u.measurements.push({ date: Date.now(), [key]: value });
      if (u.measurements.length > 365) u.measurements = u.measurements.slice(-365);
    }
  });
}

function logMeasurement() {
  const weightInput = document.getElementById("bodyInput-weight");
  const w = parseFloat(weightInput ? weightInput.value : "");
  if (!w || w <= 0) { if (weightInput) weightInput.focus(); return; }

  const entry = { date: Date.now(), weight: w };
  BODY_METRICS.forEach(m => {
    if (m.key === "weight") return;
    const inp = document.getElementById("bodyInput-" + m.key);
    if (!inp) return;
    const v = parseFloat(inp.value);
    if (Number.isFinite(v) && v > 0) entry[m.key] = v;
  });

  updateUser(u => {
    u.measurements.push(entry);
    if (u.measurements.length > 365) u.measurements = u.measurements.slice(-365);
  });

  _bodyShowLogForm = false;
  renderBodyScreen();
  showToast(`Logged ${w} ${state.unit}`, "success");
}

// ── Chart Drawing ───────────────────────────────────────────

function _drawBodyChart(metricKey, isExpanded) {
  const canvas = document.getElementById("bodyChart-" + metricKey);
  if (!canvas) return;
  const u = userData();
  if (!u) return;
  const data = u.measurements
    .filter(e => e[metricKey] != null)
    .slice(-30);
  if (data.length < 2) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;
  const pad = isExpanded
    ? { top: 16, bottom: 24, left: 8, right: 8 }
    : { top: 8, bottom: 16, left: 4, right: 4 };

  const values = data.map(d => d[metricKey]);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const range = max - min || 1;

  ctx.clearRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
  grad.addColorStop(0, "rgba(255,107,31,0.25)");
  grad.addColorStop(1, "rgba(255,107,31,0)");

  const points = data.map((d, idx) => ({
    x: pad.left + (idx / (data.length - 1)) * (W - pad.left - pad.right),
    y: pad.top + (1 - (d[metricKey] - min) / range) * (H - pad.top - pad.bottom),
    val: d[metricKey],
    date: d.date
  }));

  // Area fill
  ctx.beginPath();
  ctx.moveTo(points[0].x, H - pad.bottom);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, H - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  points.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = "#ff6b1f";
  ctx.lineWidth = isExpanded ? 2.5 : 2;
  ctx.lineJoin = "round";
  ctx.stroke();

  // Data points (show more when expanded)
  if (isExpanded) {
    points.forEach((p, idx) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = idx === points.length - 1 ? "#ff6b1f" : "rgba(255,107,31,0.5)";
      ctx.fill();
      ctx.strokeStyle = "#171c28";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  } else {
    // Just the last point
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ff6b1f";
    ctx.fill();
  }

  // Range labels
  ctx.fillStyle = "rgba(142,142,147,0.7)";
  ctx.font = isExpanded ? "600 10px system-ui" : "600 9px system-ui";
  ctx.textAlign = "right";
  ctx.fillText(max.toFixed(1), W - pad.right, pad.top - 1);
  ctx.fillText(min.toFixed(1), W - pad.right, H - pad.bottom + (isExpanded ? 14 : 10));

  // Date labels when expanded
  if (isExpanded && data.length >= 2) {
    ctx.fillStyle = "rgba(142,142,147,0.5)";
    ctx.font = "500 9px system-ui";
    ctx.textAlign = "left";
    const firstDate = new Date(typeof data[0].date === "number" ? data[0].date : data[0].date);
    ctx.fillText(firstDate.toLocaleDateString(undefined, { month:'short', day:'numeric' }), pad.left, H - 2);
    ctx.textAlign = "right";
    const lastDate = new Date(typeof data[data.length - 1].date === "number" ? data[data.length - 1].date : data[data.length - 1].date);
    ctx.fillText(lastDate.toLocaleDateString(undefined, { month:'short', day:'numeric' }), W - pad.right, H - 2);
  }
}

// Keep old renderBodySection as a no-op for backwards compat (settings screen used to call it)
function renderBodySection() {}
function drawSparkline() {}
