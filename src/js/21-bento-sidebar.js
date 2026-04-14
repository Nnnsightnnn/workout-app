// ============================================================
// BENTO SIDEBAR
// ============================================================
function openSidebar(filterCat, targetBi, targetEi) {
  state.sidebarOpen = true;
  state.sidebarFilterCat = filterCat || "All";
  state.sidebarSelectedEx = null;
  if (targetBi !== undefined && targetEi !== undefined) {
    state.sidebarSwapTarget = { bi: targetBi, ei: targetEi };
    const day = getCurrentDay();
    const exName = day.blocks[targetBi].exercises[targetEi].name;
    document.getElementById("sidebarSwapBanner").innerHTML =
      `<span>Replace: ${exName}</span><button class="cancel-swap" onclick="clearSwapTarget()">Cancel</button>`;
    document.getElementById("sidebarSwapBanner").style.display = "flex";
  } else {
    state.sidebarSwapTarget = null;
    document.getElementById("sidebarSwapBanner").style.display = "none";
  }
  buildSidebarCatRow();
  renderSidebarGrid();
  document.getElementById("sidebarBg").classList.add("active");
  document.getElementById("sidebarSearch").value = "";
}

function closeSidebar() {
  state.sidebarOpen = false;
  state.sidebarSelectedEx = null;
  state.sidebarSwapTarget = null;
  document.getElementById("sidebarBg").classList.remove("active");
  document.querySelectorAll(".exercise-card.swap-target").forEach(el => el.classList.remove("swap-target"));
}

function clearSwapTarget() {
  state.sidebarSwapTarget = null;
  document.getElementById("sidebarSwapBanner").style.display = "none";
  document.querySelectorAll(".exercise-card.swap-target").forEach(el => el.classList.remove("swap-target"));
}

function buildSidebarCatRow() {
  const catRow = document.getElementById("sidebarCatRow");
  catRow.innerHTML = "";
  const allCats = ["All", ...CATEGORIES];
  allCats.forEach(cat => {
    const b = document.createElement("button");
    b.className = "lib-cat-btn" + (cat === state.sidebarFilterCat ? " active" : "");
    b.textContent = cat;
    b.onclick = () => {
      state.sidebarFilterCat = cat;
      catRow.querySelectorAll(".lib-cat-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      renderSidebarGrid();
    };
    catRow.appendChild(b);
  });
}

function renderSidebarGrid() {
  const grid = document.getElementById("sidebarGrid");
  const q = document.getElementById("sidebarSearch").value.toLowerCase().trim();
  grid.innerHTML = "";

  const filtered = LIBRARY
    .filter(e => state.sidebarFilterCat === "All" || e.cat === state.sidebarFilterCat)
    .filter(e => !q || e.name.toLowerCase().includes(q) || (e.muscles || []).some(m => m.includes(q)));

  // Group by category
  const groups = {};
  filtered.forEach(e => {
    if (!groups[e.cat]) groups[e.cat] = [];
    groups[e.cat].push(e);
  });

  Object.entries(groups).forEach(([cat, exercises]) => {
    const hdr = document.createElement("div");
    hdr.className = "bento-cat-header";
    hdr.textContent = cat;
    grid.appendChild(hdr);

    exercises.forEach((e, i) => {
      const card = document.createElement("div");
      card.className = "bento-card" + (i === 0 ? " featured" : "");
      if (state.sidebarSelectedEx && state.sidebarSelectedEx.id === e.id) card.classList.add("selected");
      card.innerHTML = `<div class="bento-name">${e.name}${e.demoUrl ? ' <span style="color:var(--accent);font-size:10px;opacity:0.7;">▶</span>' : ''}</div><div class="bento-muscles">${(e.muscles || []).join(" · ")}</div>`;
      card.onclick = () => onSidebarCardTap(e);
      grid.appendChild(card);
    });
  });
}

function onSidebarCardTap(libEx) {
  if (state.sidebarSwapTarget) {
    // Target already selected — execute swap immediately
    executeSidebarSwap(libEx, state.sidebarSwapTarget.bi, state.sidebarSwapTarget.ei);
  } else {
    // Browse mode: select this exercise, then user taps a workout card
    state.sidebarSelectedEx = libEx;
    renderSidebarGrid(); // re-render to show selection
    // Mark workout cards as swap targets
    document.querySelectorAll(".exercise-card").forEach((el, idx) => {
      const bi = parseInt(el.dataset.bi);
      const ei = parseInt(el.dataset.ei);
      if (isNaN(bi)) return;
      el.classList.add("swap-target");
    });
  }
}

function onWorkoutCardTapForSwap(bi, ei) {
  if (!state.sidebarOpen || !state.sidebarSelectedEx) return false;
  executeSidebarSwap(state.sidebarSelectedEx, bi, ei);
  return true;
}

function executeSidebarSwap(libEx, bi, ei) {
  mutateDay(d => {
    const oldEx = d.blocks[bi].exercises[ei];
    d.blocks[bi].exercises[ei] = mkSets(libEx, {
      notes: oldEx.notes || ""
    });
  });
  renderWorkoutScreen();
  showToast(`Swapped to ${libEx.name}`, "success");
  closeSidebar();
}