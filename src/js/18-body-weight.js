// ============================================================
// BODY WEIGHT TRACKING
// ============================================================
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
    html += `<canvas class="body-sparkline" id="bodySparkline"></canvas>`;
  }
  html += `<div class="body-input-row">
    <input type="number" id="bodyWeightInput" placeholder="Weight" min="0" step="0.1" inputmode="decimal">
    <button class="body-log-btn" onclick="logMeasurement()">Log</button>
  </div>`;
  if (m.length > 0) {
    html += `<div class="body-history">`;
    const recent = m.slice(-5).reverse();
    recent.forEach(entry => {
      const d = new Date(entry.date).toLocaleDateString(undefined, { month:'short', day:'numeric' });
      html += `<div class="body-history-row"><span>${d}</span><span>${entry.weight} ${unit}</span></div>`;
    });
    html += `</div>`;
  }
  if (!latest) {
    html += `<div style="color:var(--text-dim);font-size:13px;text-align:center;padding:14px 0;">Log your first weigh-in above.</div>`;
  }
  el.innerHTML = html;
  if (m.length >= 2) drawSparkline();
}

function logMeasurement() {
  const input = document.getElementById("bodyWeightInput");
  const w = parseFloat(input.value);
  if (!w || w <= 0) { input.focus(); return; }
  updateUser(u => {
    u.measurements.push({ date: Date.now(), weight: w });
    if (u.measurements.length > 365) u.measurements = u.measurements.slice(-365);
  });
  renderBodySection();
  showToast(`Logged ${w} ${state.unit}`, "success");
}

function drawSparkline() {
  const canvas = document.getElementById("bodySparkline");
  if (!canvas) return;
  const u = userData();
  const data = u.measurements.slice(-30);
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

  const weights = data.map(d => d.weight);
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const range = max - min || 1;

  ctx.clearRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
  grad.addColorStop(0, "rgba(255,107,53,0.25)");
  grad.addColorStop(1, "rgba(255,107,53,0)");

  const points = data.map((d, idx) => ({
    x: pad.left + (idx / (data.length - 1)) * (W - pad.left - pad.right),
    y: pad.top + (1 - (d.weight - min) / range) * (H - pad.top - pad.bottom)
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