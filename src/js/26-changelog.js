// ============================================================
// CHANGELOG — "What's new" sheet shown once per release
// ============================================================
// Inputs: global `CHANGELOG` array (inlined by build.js from src/changelog.json),
// and root-store field `_lastSeenChangelogVersion` (managed in 06-state-storage.js).

function getPendingChangelog() {
  if (typeof CHANGELOG === "undefined" || !Array.isArray(CHANGELOG) || !CHANGELOG.length) return null;
  const entry = CHANGELOG[0];
  if (!entry || !entry.version) return null;
  const s = loadStore();
  if (s._lastSeenChangelogVersion === entry.version) return null;
  return entry;
}

function showChangelogSheet(entry) {
  const wrap = document.createElement("div");
  wrap.className = "changelog-sheet";

  const head = document.createElement("div");
  head.className = "changelog-head";
  const title = document.createElement("h3");
  title.textContent = "What's new in " + entry.version;
  const close = document.createElement("button");
  close.className = "icon-btn";
  close.title = "Close";
  close.textContent = "\u2715";
  close.onclick = dismiss;
  head.appendChild(title);
  head.appendChild(close);
  wrap.appendChild(head);

  if (entry.title) {
    const subtitle = document.createElement("div");
    subtitle.className = "changelog-subtitle";
    subtitle.textContent = entry.title;
    wrap.appendChild(subtitle);
  }

  if (Array.isArray(entry.items) && entry.items.length) {
    const list = document.createElement("ul");
    list.className = "changelog-list";
    entry.items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
    wrap.appendChild(list);
  }

  const got = document.createElement("button");
  got.className = "sheet-item changelog-got-it";
  got.innerHTML = '<span class="icon">\u2713</span> Got it';
  got.onclick = dismiss;
  wrap.appendChild(got);

  function dismiss() {
    const s = loadStore();
    s._lastSeenChangelogVersion = entry.version;
    saveStore(s);
    closeSheet();
  }

  openSheet(wrap);
}
