// ============================================================
// HISTORY
// ============================================================
function renderHistory() {
  const u = userData();
  const now = Date.now();
  const thirtyAgo = now - 30*24*3600*1000;
  const recent = u.sessions.filter(s => s.finishedAt > thirtyAgo).slice().reverse();

  const counts = {};
  recent.forEach(s => {
    s.sets.forEach(set => {
      (set.muscles || []).forEach(m => {
        const g = groupMuscle(m);
        if (!g) return;
        counts[g] = (counts[g] || 0) + 1;
      });
    });
  });
  renderDonut(counts);

  const list = document.getElementById("sessionList");
  if (!recent.length) {
    list.innerHTML = `<div class="empty">No workouts yet. Finish one to see it here.</div>`;
    return;
  }
  list.innerHTML = "";
  recent.forEach(s => {
    const el = document.createElement("div");
    el.className = "session-item";
    const date = new Date(s.finishedAt);
    const dateStr = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const prHtml = s.prCount ? `<span class="pr-badge">🏆 ${s.prCount} PR${s.prCount>1?"s":""}</span>` : "";
    const notesHtml = (s.blockNotes && Object.keys(s.blockNotes).length > 0)
      ? `<div class="session-block-notes">${Object.values(s.blockNotes).map(bn =>
          `<div class="session-block-note"><span class="note-block-name">${bn.name}:</span> ${bn.note}</div>`
        ).join("")}</div>`
      : "";
    el.innerHTML = `
      <div class="top">
        <div><div class="date">${dateStr}</div><div class="day-name">Day ${s.dayId} — ${s.dayName}</div></div>
      </div>
      <div class="meta">${s.sets.length} sets · ${formatDuration(s.duration)} · ${s.volume > 0 ? formatVolume(s.volume) + " " + state.unit + " volume" : "bodyweight"}</div>
      <div class="highlights">${prHtml}</div>
      ${notesHtml}
    `;
    list.appendChild(el);
  });
}

function groupMuscle(m) {
  const map = {
    "chest":"Chest","upper chest":"Chest",
    "shoulders":"Shoulders","rear delts":"Shoulders",
    "triceps":"Arms","biceps":"Arms",
    "lats":"Back","upper back":"Back","lower back":"Back","back":"Back","traps":"Back",
    "quads":"Legs","hamstrings":"Legs","glutes":"Legs","posterior chain":"Legs",
    "core":"Core","grip":"Core",
    "full body":"Full Body",
    "conditioning":null,"mobility":null
  };
  return map.hasOwnProperty(m) ? map[m] : (m.charAt(0).toUpperCase() + m.slice(1));
}

const GROUP_COLORS = {
  "Chest":"#ff6b35","Back":"#5e5ce6","Legs":"#30d158",
  "Shoulders":"#ffd60a","Arms":"#ff2d55","Core":"#64d2ff",
  "Full Body":"#bf5af2"
};

function primaryMuscleColor(muscles) {
  if (!muscles || !muscles.length) return null;
  const g = groupMuscle(muscles[0]);
  return g ? GROUP_COLORS[g] || null : null;
}

function renderDonut(counts) {
  const svg = document.getElementById("muscleDonut");
  const legend = document.getElementById("donutLegend");
  const total = Object.values(counts).reduce((a,b) => a+b, 0);
  if (total === 0) {
    svg.innerHTML = `<circle cx="50" cy="50" r="40" fill="none" stroke="#2c2c2e" stroke-width="14"/><text x="50" y="54" text-anchor="middle" fill="#8e8e93" font-size="9" font-weight="600">No data</text>`;
    legend.innerHTML = `<div style="color:var(--text-dim); font-size:12px;">Complete a workout to see your muscle-group balance.</div>`;
    return;
  }
  const entries = Object.entries(counts).sort((a,b) => b[1] - a[1]);
  let cumulative = 0;
  const r = 40, c = 2*Math.PI*r;
  let html = `<circle cx="50" cy="50" r="${r}" fill="none" stroke="#2c2c2e" stroke-width="14"/>`;
  entries.forEach(([g, count]) => {
    const frac = count / total;
    const dash = frac * c;
    const color = GROUP_COLORS[g] || "#8e8e93";
    html += `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="14"
             stroke-dasharray="${dash} ${c - dash}" stroke-dashoffset="${-cumulative * c}"
             transform="rotate(-90 50 50)"/>`;
    cumulative += frac;
  });
  html += `<text x="50" y="48" text-anchor="middle" fill="#f2f2f7" font-size="12" font-weight="800">${total}</text>`;
  html += `<text x="50" y="60" text-anchor="middle" fill="#8e8e93" font-size="6" font-weight="600">SETS</text>`;
  svg.innerHTML = html;
  legend.innerHTML = entries.map(([g, ct]) => {
    const pct = Math.round(ct/total*100);
    const color = GROUP_COLORS[g] || "#8e8e93";
    return `<div class="donut-legend-item">
      <div class="dot" style="background:${color}"></div>
      <div class="name">${g}</div>
      <div class="count">${ct} (${pct}%)</div>
    </div>`;
  }).join("");
}