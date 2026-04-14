// ============================================================
// TOOLS
// ============================================================
function adjustPlate(step) {
  const el = document.getElementById("plateTarget");
  el.value = Math.max(0, parseFloat(el.value || 0) + step);
  renderPlates();
}
function adjustOrm(which, step) {
  const el = document.getElementById(which === "weight" ? "ormWeight" : "ormReps");
  const min = which === "reps" ? 1 : 0;
  el.value = Math.max(min, parseFloat(el.value || 0) + step);
  renderOrm();
}
function renderPlates() {
  const target = parseFloat(document.getElementById("plateTarget").value || 0);
  const bar = parseFloat(document.getElementById("barWeight").value || 45);
  const remaining = target - bar;
  const viz = document.getElementById("plateViz");
  const result = document.getElementById("plateResult");
  if (remaining < 0) { viz.innerHTML = `<div style="color:var(--text-dim);font-size:13px;">Target &lt; bar weight</div>`; result.textContent = ""; return; }
  if (remaining === 0) { viz.innerHTML = `<div class="bar-visual"><div class="bar-rod"></div></div>`; result.innerHTML = `<strong>Just the bar</strong> (${bar} ${state.unit})`; return; }
  const perSide = remaining / 2;
  const plateSpecs = state.unit === "lbs"
    ? [{v:45,c:"#d73737",w:22,h:70},{v:35,c:"#3a6bd7",w:20,h:62},{v:25,c:"#2fa83a",w:18,h:56},{v:10,c:"#e0e0e0",w:14,h:46},{v:5,c:"#404040",w:12,h:40},{v:2.5,c:"#808080",w:10,h:34}]
    : [{v:20,c:"#d73737",w:22,h:70},{v:15,c:"#ffd60a",w:20,h:62},{v:10,c:"#3a6bd7",w:18,h:56},{v:5,c:"#e0e0e0",w:14,h:46},{v:2.5,c:"#404040",w:12,h:40},{v:1.25,c:"#808080",w:10,h:34}];
  let rem = perSide; const plates = [];
  plateSpecs.forEach(p => { while (rem >= p.v - 0.001) { plates.push(p); rem -= p.v; } });
  if (rem > 0.001) { viz.innerHTML = `<div style="color:var(--warn);font-size:13px;">Can't match — ${rem.toFixed(1)} ${state.unit} short/side</div>`; result.textContent = ""; return; }
  viz.innerHTML = `<div class="bar-visual">
    ${plates.slice().reverse().map(p => `<div class="bar-plate" style="background:${p.c};width:${p.w}px;height:${p.h}px;">${p.v}</div>`).join("")}
    <div class="bar-rod"></div>
    ${plates.map(p => `<div class="bar-plate" style="background:${p.c};width:${p.w}px;height:${p.h}px;">${p.v}</div>`).join("")}
  </div>`;
  const counts = {}; plates.forEach(p => counts[p.v] = (counts[p.v]||0)+1);
  const sideList = Object.entries(counts).map(([v,c]) => `${c}×${v}`).join(" + ");
  result.innerHTML = `<strong>Per side:</strong> ${sideList} <span style="color:var(--text-faint);">· ${perSide} ${state.unit}/side</span>`;
}
function renderOrm() {
  const w = parseFloat(document.getElementById("ormWeight").value || 0);
  const r = Math.max(1, Math.min(12, parseInt(document.getElementById("ormReps").value || 1)));
  const orm = r === 1 ? w : w * (36 / (37 - r));
  document.getElementById("ormResult").textContent = orm > 0 ? Math.round(orm) : "—";
}