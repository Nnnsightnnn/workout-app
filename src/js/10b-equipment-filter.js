// ============================================================
// EQUIPMENT FILTER — workout overview filter/substitution
// ============================================================

// Check if an exercise requires any unavailable equipment.
// Returns array of missing equipment tags, or empty array if all available.
function getExMissingEquipment(ex) {
  if (!state.unavailableEquipment.size) return [];
  const lib = ex.exId ? (LIB_BY_ID[ex.exId] || null) : null;
  const equip = lib ? lib.equipment : (ex.equipment || []);
  if (!equip || !equip.length) return [];
  return equip.filter(t => state.unavailableEquipment.has(t));
}

// Returns true if the exercise needs equipment that is unavailable
function isExAffectedByEqFilter(ex) {
  return getExMissingEquipment(ex).length > 0;
}

// Collect all unique equipment tags used by a day's exercises
function getDayEquipmentTags(day) {
  const tags = new Set();
  day.blocks.forEach(b => {
    b.exercises.forEach(ex => {
      const lib = ex.exId ? (LIB_BY_ID[ex.exId] || null) : null;
      const equip = lib ? lib.equipment : (ex.equipment || []);
      (equip || []).forEach(t => tags.add(t));
    });
  });
  return tags;
}

// Count affected exercises for a given day
function countAffectedExercises(day) {
  if (!state.unavailableEquipment.size) return 0;
  let count = 0;
  day.blocks.forEach(b => {
    b.exercises.forEach(ex => {
      if (!ex.isWarmup && isExAffectedByEqFilter(ex)) count++;
    });
  });
  return count;
}

// Find swap candidates: same category, no unavailable equipment
function getEquipmentSwapCandidates(ex) {
  const lib = ex.exId ? (LIB_BY_ID[ex.exId] || null) : null;
  const cat = lib ? lib.cat : ex.cat;
  const muscles = ex.muscles || [];

  return LIBRARY.filter(candidate => {
    // Same category
    if (cat && candidate.cat !== cat) return false;
    // Not the same exercise
    if (candidate.id === ex.exId) return false;
    // All equipment must be available
    if (candidate.equipment && candidate.equipment.some(t => state.unavailableEquipment.has(t))) return false;
    return true;
  }).sort((a, b) => {
    // Prefer exercises with more muscle overlap
    const aOverlap = a.muscles.filter(m => muscles.includes(m)).length;
    const bOverlap = b.muscles.filter(m => muscles.includes(m)).length;
    return bOverlap - aOverlap;
  });
}

// Render the equipment filter toggle button (shown in header area)
function renderEqFilterButton() {
  const btn = document.createElement("button");
  btn.className = "eq-filter-toggle" + (state.unavailableEquipment.size ? " has-filter" : "");
  btn.innerHTML = '<span class="eq-filter-icon">&#9881;</span>';
  if (state.unavailableEquipment.size) {
    btn.innerHTML += '<span class="eq-filter-count">' + state.unavailableEquipment.size + '</span>';
  }
  btn.title = "Equipment filter";
  btn.onclick = (e) => {
    e.stopPropagation();
    state.eqFilterOpen = !state.eqFilterOpen;
    renderWorkoutScreen();
  };
  return btn;
}

// Render the collapsible equipment filter bar
function renderEqFilterBar(day) {
  const wrap = document.createElement("div");
  wrap.className = "eq-filter-bar" + (state.eqFilterOpen ? " open" : "");

  // Toggle header row
  const header = document.createElement("div");
  header.className = "eq-filter-header";

  const label = document.createElement("span");
  label.className = "eq-filter-label";
  const affected = countAffectedExercises(day);
  if (state.unavailableEquipment.size && affected > 0) {
    label.textContent = affected + " exercise" + (affected === 1 ? "" : "s") + " affected";
    label.classList.add("has-affected");
  } else if (state.unavailableEquipment.size) {
    label.textContent = "All exercises OK";
    label.classList.add("all-ok");
  } else {
    label.textContent = "Equipment Filter";
  }
  header.appendChild(label);

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "eq-filter-chevron";
  toggleBtn.textContent = state.eqFilterOpen ? "Hide" : "Filter";
  toggleBtn.onclick = () => {
    state.eqFilterOpen = !state.eqFilterOpen;
    renderWorkoutScreen();
  };
  header.appendChild(toggleBtn);

  wrap.appendChild(header);

  // Chip grid (only when open)
  if (state.eqFilterOpen) {
    const dayTags = getDayEquipmentTags(day);
    const chipWrap = document.createElement("div");
    chipWrap.className = "eq-filter-chips";

    // Show all tags used by this day first, then remaining tags
    const orderedTags = [...dayTags].sort();
    const otherTags = EQUIPMENT_TAGS.filter(t => !dayTags.has(t)).sort();

    orderedTags.concat(otherTags).forEach(tag => {
      const chip = document.createElement("button");
      const isUnavail = state.unavailableEquipment.has(tag);
      const isUsed = dayTags.has(tag);
      chip.className = "eq-chip" + (isUnavail ? " unavailable" : "") + (isUsed ? " in-use" : "");
      chip.textContent = tag.replace(/_/g, " ");
      chip.onclick = () => {
        if (state.unavailableEquipment.has(tag)) {
          state.unavailableEquipment.delete(tag);
        } else {
          state.unavailableEquipment.add(tag);
        }
        renderWorkoutScreen();
      };
      chipWrap.appendChild(chip);
    });

    wrap.appendChild(chipWrap);

    // Clear all button
    if (state.unavailableEquipment.size) {
      const clearBtn = document.createElement("button");
      clearBtn.className = "eq-filter-clear";
      clearBtn.textContent = "Clear all filters";
      clearBtn.onclick = () => {
        state.unavailableEquipment.clear();
        state.eqFilterOpen = false;
        renderWorkoutScreen();
      };
      wrap.appendChild(clearBtn);
    }
  }

  return wrap;
}

// Render the equipment warning badge for an exercise tile
function renderEqWarningBadge(ex) {
  const missing = getExMissingEquipment(ex);
  if (!missing.length) return null;

  const badge = document.createElement("span");
  badge.className = "tag eq-warn";
  badge.title = "Needs: " + missing.join(", ");
  badge.textContent = "\u26A0 " + missing[0].replace(/_/g, " ");
  return badge;
}

// Open a swap suggestion sheet for an affected exercise
function openEqSwapSheet(ex, bi, ei) {
  const candidates = getEquipmentSwapCandidates(ex);
  const wrap = document.createElement("div");

  // Header
  const hdr = document.createElement("div");
  hdr.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;";
  hdr.innerHTML = '<h3 style="margin:0;">Swap — Equipment Unavailable</h3>';
  const closeBtn = document.createElement("button");
  closeBtn.className = "icon-btn";
  closeBtn.textContent = "\u2715";
  closeBtn.onclick = () => closeSheet();
  hdr.appendChild(closeBtn);
  wrap.appendChild(hdr);

  // Current exercise info
  const missing = getExMissingEquipment(ex);
  const infoEl = document.createElement("div");
  infoEl.className = "eq-swap-current";
  infoEl.innerHTML = '<div class="eq-swap-name">' + ex.name + '</div>'
    + '<div class="eq-swap-missing">Needs: ' + missing.map(t => t.replace(/_/g, " ")).join(", ") + '</div>';
  wrap.appendChild(infoEl);

  if (!candidates.length) {
    const empty = document.createElement("p");
    empty.style.cssText = "color:var(--text-dim);font-size:13px;text-align:center;padding:20px;";
    empty.textContent = "No alternatives found with available equipment";
    wrap.appendChild(empty);
    openSheet(wrap);
    return;
  }

  // Alternatives list
  const listLabel = document.createElement("div");
  listLabel.className = "eq-swap-label";
  listLabel.textContent = "Alternatives (" + candidates.length + ")";
  wrap.appendChild(listLabel);

  const list = document.createElement("div");
  list.className = "eq-swap-list";
  candidates.slice(0, 12).forEach(c => {
    const row = document.createElement("button");
    row.className = "eq-swap-row";

    const left = document.createElement("div");
    left.className = "eq-swap-row-info";
    const nm = document.createElement("div");
    nm.className = "eq-swap-row-name";
    nm.textContent = c.name;
    left.appendChild(nm);

    const meta = document.createElement("div");
    meta.className = "eq-swap-row-meta";
    const muscles = c.muscles.slice(0, 2).join(", ");
    const equip = (c.equipment || []).map(t => t.replace(/_/g, " ")).join(", ");
    meta.textContent = muscles + (equip ? " \u00b7 " + equip : "");
    left.appendChild(meta);
    row.appendChild(left);

    const swapBtn = document.createElement("span");
    swapBtn.className = "eq-swap-row-action";
    swapBtn.textContent = "Swap";
    row.appendChild(swapBtn);

    row.onclick = () => {
      executeSidebarSwap(c, bi, ei);
      closeSheet();
    };
    list.appendChild(row);
  });
  wrap.appendChild(list);

  openSheet(wrap);
}
