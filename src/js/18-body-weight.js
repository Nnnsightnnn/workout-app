// ============================================================
// BODY WEIGHT TRACKING (multi-metric)
// ============================================================
// Length unit derives from the active weight unit (lbs => in, kg => cm).
const _lenUnit = () => state.unit === "lbs" ? "in" : "cm";

const BODY_METRICS = [
  { key: "weight",  label: "Weight",   unitFn: () => state.unit, step: "0.1" },
  { key: "bodyFat", label: "Body Fat", unitFn: () => "%",        step: "0.1" },
  { key: "arms",    label: "Arms",     unitFn: _lenUnit,         step: "0.1" },
  { key: "chest",   label: "Chest",    unitFn: _lenUnit,         step: "0.1" },
  { key: "waist",   label: "Waist",    unitFn: _lenUnit,         step: "0.1" },
  { key: "neck",    label: "Neck",     unitFn: _lenUnit,         step: "0.1" },
  { key: "thighs",  label: "Thighs",   unitFn: _lenUnit,         step: "0.1" },
  { key: "hips",    label: "Hips",     unitFn: _lenUnit,         step: "0.1" }
];

let _bodyShowMore = false;
function toggleBodyMore() { _bodyShowMore = !_bodyShowMore; renderBodySection(); }

function _escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}

function renderBodySection() {
  const el = document.getElementById("bodyContent");
  if (!el) return;
  const u = userData();
  if (!u) { el.innerHTML = '<div style="color:var(--text-dim);font-size:13px;text-align:center;padding:14px 0;">Set up a user first.</div>'; return; }
  const m = u.measurements;
  const latest = m.length ? m[m.length - 1] : null;
  const unit = state.unit;

  let html = '';
  if (latest) {
    html += `<div><span class="body-current">${latest.weight}</span><span class="body-current-unit">${unit}</span></div>`;
    html += `<div style="color:var(--text-dim);font-size:11px;margin-top:2px;">${new Date(latest.date).toLocaleDateString()}</div>`;
  }
  if (m.length >= 2) {
    html += `<canvas class="body-sparkline" id="bodySparkline-weight"></canvas>`;
  }
  html += `<div class="body-input-row">
    <input type="number" id="bodyInput-weight" placeholder="Weight" min="0" step="0.1" inputmode="decimal">
    <button class="body-log-btn" onclick="logMeasurement()">Log</button>
  </div>`;

  const moreOpen = _bodyShowMore;
  html += `<button class="body-more-toggle${moreOpen ? ' is-open' : ''}" onclick="toggleBodyMore()">${moreOpen ? '− Hide measurements' : '+ More measurements'}</button>`;
  if (moreOpen) {
    html += `<div class="body-more-grid">`;
    BODY_METRICS.forEach(metric => {
      if (metric.key === "weight") return;
      const u = metric.unitFn();
      html += `<div class="body-more-field">
        <label for="bodyInput-${metric.key}">${_escapeHtml(metric.label)} <span class="unit-suffix">(${_escapeHtml(u)})</span></label>
        <input type="number" id="bodyInput-${metric.key}" placeholder="0" min="0" step="${metric.step}" inputmode="decimal">
      </div>`;
    });
    html += `</div>`;
  }

  if (m.length > 0) {
    html += `<div class="body-history">`;
    const recent = m.slice(-5).reverse();
    recent.forEach(entry => {
      const d = new Date(entry.date).toLocaleDateString(undefined, { month:'short', day:'numeric' });
      const parts = [];
      BODY_METRICS.forEach(metric => {
        const v = entry[metric.key];
        if (v == null) return;
        const u = metric.unitFn();
        parts.push(metric.key === "bodyFat" ? `${v}%` : `${v} ${u}`);
      });
      html += `<div class="body-history-row"><span>${d}</span><span>${parts.join(' · ')}</span></div>`;
    });
    html += `</div>`;
  }
  if (!latest) {
    html += `<div style="color:var(--text-dim);font-size:13px;text-align:center;padding:14px 0;">Log your first weigh-in above.</div>`;
  }

  // Per-metric mini-sparklines (skip weight — it has its own big sparkline above).
  const extraMetrics = BODY_METRICS.filter(metric => {
    if (metric.key === "weight") return false;
    return m.filter(e => e[metric.key] != null).length >= 2;
  });
  if (extraMetrics.length) {
    html += `<div class="body-metrics-grid">`;
    extraMetrics.forEach(metric => {
      const entriesWith = m.filter(e => e[metric.key] != null);
      const last = entriesWith[entriesWith.length - 1];
      const unitLabel = metric.unitFn();
      const valueText = metric.key === "bodyFat" ? `${last[metric.key]}%` : `${last[metric.key]} ${_escapeHtml(unitLabel)}`;
      html += `<div class="body-metric-card">
        <div class="metric-head">
          <span class="metric-label">${_escapeHtml(metric.label)}</span>
          <span class="metric-value">${valueText}</span>
        </div>
        <canvas id="bodySparkline-${metric.key}"></canvas>
      </div>`;
    });
    html += `</div>`;
  }

  el.innerHTML = html;

  if (m.length >= 2) drawSparkline("weight");
  extraMetrics.forEach(metric => drawSparkline(metric.key));
}

function logMeasurement() {
  const weightInput = document.getElementById("bodyInput-weight");
  const w = parseFloat(weightInput.value);
  if (!w || w <= 0) { weightInput.focus(); return; }

  const entry = { date: Date.now(), weight: w };
  BODY_METRICS.forEach(m => {
    if (m.key === "weight") return;
    const inp = document.getElementById("bodyInput-" + m.key);
    if (!inp) return; // panel collapsed — input not in DOM
    const v = parseFloat(inp.value);
    if (Number.isFinite(v) && v > 0) entry[m.key] = v;
  });

  updateUser(u => {
    u.measurements.push(entry);
    if (u.measurements.length > 365) u.measurements = u.measurements.slice(-365);
  });

  _bodyShowMore = false;
  renderBodySection();
  showToast(`Logged ${w} ${state.unit}`, "success");
}

function drawSparkline(metricKey) {
  if (metricKey == null) metricKey = "weight";
  const canvas = document.getElementById("bodySparkline-" + metricKey);
  if (!canvas) return;
  const u = userData();
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
  const pad = { top: 8, bottom: 16, left: 4, right: 4 };

  const values = data.map(d => d[metricKey]);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const range = max - min || 1;

  ctx.clearRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
  grad.addColorStop(0, "rgba(255,107,53,0.25)");
  grad.addColorStop(1, "rgba(255,107,53,0)");

  const points = data.map((d, idx) => ({
    x: pad.left + (idx / (data.length - 1)) * (W - pad.left - pad.right),
    y: pad.top + (1 - (d[metricKey] - min) / range) * (H - pad.top - pad.bottom)
  }));

  ctx.beginPath();
  ctx.moveTo(points[0].x, H - pad.bottom);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, H - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  points.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = "#ff6b35";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.stroke();

  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#ff6b35";
  ctx.fill();

  ctx.fillStyle = "rgba(142,142,147,0.7)";
  ctx.font = "600 9px system-ui";
  ctx.textAlign = "right";
  ctx.fillText(max.toFixed(1), W - pad.right, pad.top - 1);
  ctx.fillText(min.toFixed(1), W - pad.right, H - pad.bottom + 10);
}
