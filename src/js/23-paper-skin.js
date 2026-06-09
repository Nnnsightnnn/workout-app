// ============================================================
// PAPER SKIN — primitives for the notebook reskin
// ============================================================
// Port of mockups/.../paper.jsx to vanilla JS. All helpers return
// HTML strings (callers concatenate into innerHTML). Color tokens
// and SVG filters mirror the design spec exactly.

const PAPER = {
  // paper stocks
  cream:        '#f4ecd3',
  creamDeep:    '#ead9ac',
  pulp:         '#f1e6c3',
  shadow:       'rgba(82, 60, 18, 0.10)',
  // rulings
  rule:         'rgba(40, 80, 150, 0.18)',
  margin:       'rgba(190, 60, 60, 0.55)',
  // inks
  inkBlue:      '#1e3a72',
  inkBlueSoft:  'rgba(30, 58, 114, 0.78)',
  inkBlack:     '#1a1612',
  inkPencil:    '#5a534a',
  inkRed:       '#a83a2a',
  // accents
  marker:       '#f4d33a',
  markerSoft:   'rgba(244, 211, 58, 0.5)',
  tape:         'rgba(255, 232, 130, 0.55)',
  postit:       '#ffe48a',
  postitShadow: 'rgba(160, 110, 20, 0.25)',
};

// Map ink id → hex string. Used by applyPaperSkin() and Settings picker.
const PAPER_INK_MAP = {
  blue:   PAPER.inkBlue,
  black:  PAPER.inkBlack,
  pencil: PAPER.inkPencil,
  red:    PAPER.inkRed,
};

// Map hand id → css font-family value.
const PAPER_HAND_MAP = {
  'Kalam':              '"Kalam", cursive',
  'Caveat':             '"Caveat", cursive',
  'Patrick Hand':       '"Patrick Hand", cursive',
  'Shadows Into Light': '"Shadows Into Light", cursive',
};

// Typewriter font used for labels (FORM in the design spec).
const PAPER_FORM = '"Special Elite", "Courier Prime", "Courier New", monospace';

// Inject the SVG `<defs>` with the paper-roughen turbulence/displacement
// filter once at app init. Idempotent — safe to call multiple times.
function paperRoughenDefs() {
  if (document.getElementById('paperRoughenDefs')) return;
  const wrap = document.createElement('div');
  wrap.id = 'paperRoughenDefs';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
  wrap.innerHTML = `
    <svg width="0" height="0" style="position:absolute;">
      <defs>
        <filter id="paper-roughen">
          <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" seed="3"/>
          <feDisplacementMap in="SourceGraphic" scale="1.4"/>
        </filter>
      </defs>
    </svg>
  `;
  document.body.appendChild(wrap);
}

// Hand-drawn checkbox SVG (wobbly square; ink X when checked).
function paperCheckboxSvg(checked, ink, size) {
  ink = ink || 'currentColor';
  size = size || 16;
  const check = checked ? `
    <g stroke="${ink}" stroke-width="2.1" stroke-linecap="round" fill="none">
      <path d="M5 6 L17 17"/>
      <path d="M17 5 L5.5 16.5"/>
    </g>` : '';
  return `<svg class="paper-checkbox" width="${size}" height="${size}" viewBox="0 0 22 22" aria-hidden="true" style="flex-shrink:0;">
    <path d="M2.5 3 L19.5 2 L20 19.2 L3 19.8 Z"
      fill="none" stroke="${ink}" stroke-width="1.6"
      stroke-linecap="round" stroke-linejoin="round"
      style="filter:url(#paper-roughen);"/>
    ${check}
  </svg>`;
}

// Wobbly strikethrough wrapper. Returns HTML string.
// opts.animate: if true, tag the wrapper so CSS animates the path drawing.
function paperStrikeWrap(html, ink, opts) {
  ink = ink || 'currentColor';
  const animClass = (opts && opts.animate) ? ' is-animating' : '';
  return `<span class="paper-strike${animClass}" style="position:relative;display:inline-block;">
    <span style="opacity:0.55;">${html}</span>
    <svg style="position:absolute;left:-2px;right:-2px;top:52%;width:calc(100% + 4px);height:8px;pointer-events:none;"
      viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
      <path d="M1 5 Q 25 2, 50 4.5 T 99 3.5"
        stroke="${ink}" stroke-width="1.6" fill="none" stroke-linecap="round"
        style="filter:url(#paper-roughen);"/>
    </svg>
  </span>`;
}

// Weighted compress + spring rebound for buttons. Idempotent.
function paperWirePress(el) {
  if (!el || el._paperPressWired) return;
  el._paperPressWired = true;
  let releaseTimer = null;
  const down = () => {
    if (releaseTimer) { clearTimeout(releaseTimer); releaseTimer = null; }
    el.classList.remove('is-releasing');
    el.classList.add('is-pressing');
  };
  const up = () => {
    if (!el.classList.contains('is-pressing')) return;
    el.classList.remove('is-pressing');
    el.classList.add('is-releasing');
    releaseTimer = setTimeout(() => {
      el.classList.remove('is-releasing');
      releaseTimer = null;
    }, 200);
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', up);
}

// Hero "you logged a set" reveal — yellow marker bloom radiating from the row
// center, plus a left-to-right sweep. The strikethrough draw is wired via
// paperStrikeWrap({animate:true}) injected into the row's value spans.
function paperInkBloom(rowEl) {
  if (!rowEl) return;
  if (typeof getComputedStyle === "function") {
    const pos = getComputedStyle(rowEl).position;
    if (pos === "static") rowEl.style.position = "relative";
  }
  const bloom = document.createElement('div');
  bloom.className = 'paper-ink-bloom';
  rowEl.appendChild(bloom);
  rowEl.classList.add('is-sweeping');

  // Inject animated strikethrough overlays on the value spans, so the
  // wavy ink draws itself L→R rather than appearing instantly on rerender.
  const ink = (typeof paperInkColor === "function") ? paperInkColor() : "#1e3a72";
  rowEl.querySelectorAll('[data-field="w"], [data-field="r"], [data-field="p"]').forEach(span => {
    if (span.querySelector('.paper-strike')) return;
    span.innerHTML = paperStrikeWrap(span.innerHTML, ink, { animate: true });
  });

  setTimeout(() => {
    if (bloom.parentNode) bloom.remove();
    rowEl.classList.remove('is-sweeping');
    rowEl.classList.add('is-logged');
  }, 320);
}

// Ensō-eye mark: one brush-stroke ring + a single dot ("awareness, not
// surveillance" per brand/ETHOS.md). Ai Indigo by default. The ring uses a
// dash-array gap so it reads as a brush stroke rather than a closed circle.
// roughen=true applies the paper-roughen displacement filter for hand-drawn
// wobble — leave off for favicons / canvas / contexts without the filter def.
function paperEnso(size, ink, roughen) {
  size = size || 64;
  ink = ink || '#2B4A7A';
  const filt = (roughen === false) ? '' : ' style="filter:url(#paper-roughen);"';
  return `<svg class="paper-enso" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <circle cx="32" cy="32" r="22" fill="none" stroke="${ink}" stroke-width="2.4"
      stroke-linecap="round" stroke-dasharray="128 10"
      transform="rotate(-14 32 32)"${filt}/>
    <circle cx="44" cy="27" r="2.6" fill="${ink}"/>
  </svg>`;
}

// Rubber-stamp pill (e.g. "PR", "DONE", "All-time"). Default = red ink.
function paperStamp(text, color, angle) {
  color = color || PAPER.inkRed;
  angle = (typeof angle === 'number') ? angle : -10;
  return `<span class="paper-stamp" style="
    display:inline-block;border:2.5px solid ${color};color:${color};
    padding:4px 10px 3px;font-family:${PAPER_FORM};font-size:13px;
    letter-spacing:0.12em;text-transform:uppercase;font-weight:700;
    transform:rotate(${angle}deg);opacity:0.85;
    box-shadow:inset 0 0 0 2px rgba(168,58,42,0.12);
  ">${text}</span>`;
}

// Margin note: a scribbled arrow + handwritten text.
function paperMarginNote(text, ink) {
  ink = ink || 'currentColor';
  return `<div class="paper-margin-note" style="
    display:flex;align-items:flex-start;gap:6px;
    color:${ink};font-family:'Kalam',cursive;font-size:13px;
    transform:rotate(-2deg);
  ">
    <svg width="22" height="14" viewBox="0 0 22 14" style="margin-top:4px;flex-shrink:0;" aria-hidden="true">
      <path d="M1 7 Q 8 4, 18 7 L 14 4 M 18 7 L 14 10"
        fill="none" stroke="${ink}" stroke-width="1.4"
        stroke-linecap="round" stroke-linejoin="round"
        style="filter:url(#paper-roughen);"/>
    </svg>
    <span>${text}</span>
  </div>`;
}

// Washi tape strip (decorative).
function paperTape(opts) {
  opts = opts || {};
  const width = opts.width || 70;
  const angle = (typeof opts.angle === 'number') ? opts.angle : -8;
  const color = opts.color || PAPER.tape;
  const extra = opts.style || '';
  return `<div class="paper-tape" style="
    width:${width}px;height:22px;background:${color};
    transform:rotate(${angle}deg);
    box-shadow:0 2px 6px rgba(120,90,20,0.18);
    border-top:1px dashed rgba(120,80,20,0.18);
    border-bottom:1px dashed rgba(120,80,20,0.18);
    ${extra}
  "></div>`;
}

// Torn paper edge (top or bottom of a card).
function paperTornEdge(side, color) {
  side = (side === 'top') ? 'top' : 'bottom';
  color = color || PAPER.creamDeep;
  const d = (side === 'bottom')
    ? 'M0 0 L0 6 L8 4 L16 7 L26 3 L36 6 L48 4 L60 7 L72 3 L84 6 L96 4 L110 7 L124 3 L138 6 L152 4 L166 7 L180 3 L194 6 L200 4 L200 0 Z'
    : 'M0 10 L0 4 L8 6 L16 3 L26 7 L36 4 L48 6 L60 3 L72 7 L84 4 L96 6 L110 3 L124 7 L138 4 L152 6 L166 3 L180 7 L194 4 L200 6 L200 10 Z';
  return `<svg class="paper-torn-edge" aria-hidden="true" style="
    position:absolute;left:0;right:0;${side}:-8px;width:100%;height:10px;display:block;
  " viewBox="0 0 200 10" preserveAspectRatio="none">
    <path d="${d}" fill="${color}"/>
  </svg>`;
}

// ─────────────────────────────────────────────────────────────
// Theme application
// ─────────────────────────────────────────────────────────────
// Background presets exposed by the Appearance picker. `null` id = use the
// paper-skin default (don't override --paper-bg). Other ids set both the
// page background and a slightly-darker "deep" tone for nav/sheets.
const PAPER_BG_PRESETS = [
  { id: null,        label: 'Paper',     bg: null,      deep: null      },
  { id: 'white',     label: 'White',     bg: '#ffffff', deep: '#f0eee8' },
  { id: 'lightgray', label: 'Light',     bg: '#e6e3dc', deep: '#d4d0c6' },
  { id: 'darkgray',  label: 'Slate',     bg: '#3a3a3e', deep: '#2c2c30' },
  { id: 'nearblack', label: 'Near-Black',bg: '#16161a', deep: '#0e0e12' },
  { id: 'navy',      label: 'Navy',      bg: '#0f1d3a', deep: '#0a1428' },
];

// Look up a preset by id (or by raw hex for custom colors). Returns
// { bg, deep } or null. Custom hex → derive a 12% darker deep tone.
function paperResolveBg(id) {
  if (!id) return null;
  const preset = PAPER_BG_PRESETS.find(p => p.id === id);
  if (preset && preset.bg) return { bg: preset.bg, deep: preset.deep };
  // Treat as raw hex (custom color).
  if (typeof id === 'string' && /^#[0-9a-f]{6}$/i.test(id)) {
    return { bg: id, deep: paperDarken(id, 0.12) };
  }
  return null;
}

// Pure-JS hex darken by a 0..1 factor. Used to derive --paper-bg-deep for
// custom colors so the bottom nav / sheets don't all collapse to one tone.
function paperDarken(hex, factor) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const f = Math.max(0, Math.min(1, factor));
  const c = [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)]
    .map(v => Math.max(0, Math.min(255, Math.round(v * (1 - f)))));
  return '#' + c.map(v => v.toString(16).padStart(2,'0')).join('');
}

// Perceptual luminance (0..255) using ITU-R BT.601. <128 ⇒ dark surface,
// so default-light text becomes unreadable and we flip to dark mode.
function paperLuminance(hex) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
  if (!m) return 255;
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Apply v19 appearance prefs (background + text-color override) by writing
// inline CSS-variable overrides on <body> and toggling data-paper-mode.
// Called from applyPaperSkin() so it runs on boot AND after every prefs
// update — single source of truth, no separate boot hook needed.
function applyAppearancePrefs() {
  const body = document.body;
  if (!body) return;
  const u = (typeof userData === 'function') ? userData() : null;
  const prefs = (u && u.preferences) || {};
  const bgResolved = paperResolveBg(prefs.bgColor);
  if (bgResolved) {
    body.style.setProperty('--paper-bg', bgResolved.bg);
    body.style.setProperty('--paper-bg-deep', bgResolved.deep);
  } else {
    body.style.removeProperty('--paper-bg');
    body.style.removeProperty('--paper-bg-deep');
  }
  // Text-color decision: 'light' forces dark-mode tokens; 'auto' decides
  // based on the effective background luminance. Default (no override) =
  // light surface, dark text — no data-paper-mode attr.
  const textColor = prefs.textColor || 'auto';
  let mode = null;
  if (textColor === 'light') {
    mode = 'dark';
  } else if (bgResolved && paperLuminance(bgResolved.bg) < 128) {
    mode = 'dark';
  }
  if (mode) body.setAttribute('data-paper-mode', mode);
  else      body.removeAttribute('data-paper-mode');
}

// Read current user's paper-skin prefs and apply them via data attributes
// on <body>. Safe to call on every render — cheap attribute set.
function applyPaperSkin() {
  const u = (typeof userData === 'function') ? userData() : null;
  const body = document.body;
  if (!body) return;
  if (!u) {
    // No user yet — apply skin defaults so onboarding feels coherent.
    body.setAttribute('data-skin', 'paper');
    body.setAttribute('data-paper-rule', 'ruled');
    body.setAttribute('data-paper-ink',  'blue');
    body.setAttribute('data-paper-hand', 'Shadows Into Light');
    applyAppearancePrefs();
    return;
  }
  // Paper is the look — always on. The picker only controls paper/ink/hand.
  body.setAttribute('data-skin', 'paper');
  body.setAttribute('data-paper-rule', u.paperRule || 'ruled');
  body.setAttribute('data-paper-ink',  u.paperInk  || 'blue');
  body.setAttribute('data-paper-hand', u.paperHand || 'Shadows Into Light');
  applyAppearancePrefs();
}

// Helper: am I in paper-skin mode right now?
function isPaperSkin() {
  return document.body && document.body.getAttribute('data-skin') === 'paper';
}

// Helper for renderers: returns the current hand font CSS, or system fallback.
function paperHandFont() {
  const h = (document.body && document.body.getAttribute('data-paper-hand')) || 'Shadows Into Light';
  return PAPER_HAND_MAP[h] || PAPER_HAND_MAP['Shadows Into Light'];
}

// Helper for renderers: returns the current ink hex.
function paperInkColor() {
  const k = (document.body && document.body.getAttribute('data-paper-ink')) || 'blue';
  return PAPER_INK_MAP[k] || PAPER.inkBlue;
}

// ─────────────────────────────────────────────────────────────
// Renderers — inject paper-specific affordances when active
// ─────────────────────────────────────────────────────────────

// Inject (or update) a "K&N LIFTS · TRAINING JOURNAL · WK x/y · PG. n"
// kicker above the day-bar in the workout screen. No-op outside paper skin.
function renderPaperKicker() {
  const screen = document.getElementById('screen-workout');
  if (!screen) return;
  let kicker = screen.querySelector('.paper-kicker');
  if (!isPaperSkin()) {
    if (kicker) kicker.remove();
    return;
  }
  const u = (typeof userData === 'function') ? userData() : null;
  const ap = (typeof activeProgram === 'function') ? activeProgram() : null;
  const wk = (ap && ap.currentWeek)  ? ap.currentWeek : 1;
  const tot = (ap && ap.totalWeeks)  ? ap.totalWeeks  : 16;
  // Page number = total session count + 1 (current day index).
  const pg = (u && Array.isArray(u.sessions)) ? (u.sessions.length + 1) : 1;
  const pgStr = String(pg).padStart(3, '0');
  const html = `
    <span>K&amp;N Lifts &middot; Training journal</span>
    <span>WK ${String(wk).padStart(2,'0')} / ${String(tot).padStart(2,'0')} &middot; PG. ${pgStr}</span>
  `;
  if (!kicker) {
    kicker = document.createElement('div');
    kicker.className = 'paper-kicker';
    screen.insertBefore(kicker, screen.firstChild);
  }
  kicker.innerHTML = html;
}

// Re-render the kicker whenever the workout screen renders. This wraps the
// existing renderWorkoutScreen() so we don't pollute its body.
(function wrapRender() {
  if (typeof window === 'undefined') return;
  const tryWrap = () => {
    if (typeof window.renderWorkoutScreen !== 'function') return false;
    if (window.renderWorkoutScreen.__paperWrapped) return true;
    const orig = window.renderWorkoutScreen;
    const wrapped = function() {
      const r = orig.apply(this, arguments);
      try { renderPaperKicker(); } catch (e) {}
      return r;
    };
    wrapped.__paperWrapped = true;
    window.renderWorkoutScreen = wrapped;
    return true;
  };
  // Try immediately; if renderWorkoutScreen isn't defined yet (load order),
  // attach to DOMContentLoaded as a fallback.
  if (!tryWrap()) {
    document.addEventListener('DOMContentLoaded', tryWrap);
  }
})();

// ─────────────────────────────────────────────────────────────
// Settings: Notebook style picker
// ─────────────────────────────────────────────────────────────
// Renders three rows of buttons (paper / ink / hand) + an enable toggle.
// Reads/writes u.paperSkin/paperRule/paperInk/paperHand via updateUser.

function renderNotebookStylePicker(rootEl) {
  if (!rootEl) return;
  const u = (typeof userData === 'function') ? userData() : null;
  if (!u) { rootEl.innerHTML = ''; return; }
  const enabled = u.paperSkin !== false;
  const ruleSel = u.paperRule || 'ruled';
  const inkSel  = u.paperInk  || 'blue';
  const handSel = u.paperHand || 'Shadows Into Light';

  const rules = [
    { id: 'ruled', label: 'Ruled' },
    { id: 'dot',   label: 'Dot'   },
    { id: 'graph', label: 'Graph' },
  ];
  const inks = [
    { id: 'blue',   label: 'Blue',   color: PAPER.inkBlue },
    { id: 'black',  label: 'Black',  color: PAPER.inkBlack },
    { id: 'pencil', label: 'Pencil', color: PAPER.inkPencil },
    { id: 'red',    label: 'Red',    color: PAPER.inkRed },
  ];
  const hands = [
    { id: 'Kalam',              label: 'Kalam'   },
    { id: 'Caveat',             label: 'Caveat'  },
    { id: 'Patrick Hand',       label: 'Patrick' },
    { id: 'Shadows Into Light', label: 'Loose'   },
  ];

  const ruleBtns = rules.map(o =>
    `<button class="paper-pref-btn${o.id === ruleSel ? ' active' : ''}" data-rule="${o.id}">${o.label}</button>`
  ).join('');
  const inkBtns = inks.map(o => {
    const on = o.id === inkSel;
    const ring = on ? `box-shadow:0 0 0 2px var(--paper-bg, #f4ecd3), 0 0 0 3.4px ${o.color};` : '';
    return `<button class="paper-pref-ink-btn${on ? ' active' : ''}" data-ink="${o.id}" aria-label="${o.label}"
      style="${on ? 'border-color:' + o.color + ';' : ''}">
      <span class="swatch" style="background:${o.color};${ring}"></span>${o.label}
    </button>`;
  }).join('');
  const handBtns = hands.map(o =>
    `<button class="paper-pref-btn paper-pref-hand-btn${o.id === handSel ? ' active' : ''}" data-hand="${o.id}">${o.label}</button>`
  ).join('');

  rootEl.innerHTML = `
    <div class="paper-pref-row">
      <span class="paper-pref-label">Paper</span>
      <div class="paper-pref-options">${ruleBtns}</div>
    </div>
    <div class="paper-pref-row">
      <span class="paper-pref-label">Ink</span>
      <div class="paper-pref-ink-row">${inkBtns}</div>
    </div>
    <div class="paper-pref-row">
      <span class="paper-pref-label">Hand</span>
      <div class="paper-pref-options">${handBtns}</div>
    </div>
  `;

  // Wire up clicks
  const onUpdate = () => {
    applyPaperSkin();
    try { if (typeof renderWorkoutScreen === 'function') renderWorkoutScreen(); } catch (e) {}
    try { renderNotebookStylePicker(rootEl); } catch (e) {}
  };

  rootEl.querySelectorAll('[data-rule]').forEach(btn => {
    btn.addEventListener('click', () => {
      updateUser(u => { u.paperRule = btn.dataset.rule; });
      onUpdate();
    });
  });
  rootEl.querySelectorAll('[data-ink]').forEach(btn => {
    btn.addEventListener('click', () => {
      updateUser(u => { u.paperInk = btn.dataset.ink; });
      onUpdate();
    });
  });
  rootEl.querySelectorAll('[data-hand]').forEach(btn => {
    btn.addEventListener('click', () => {
      updateUser(u => { u.paperHand = btn.dataset.hand; });
      onUpdate();
    });
  });
}

// Inject a "Notebook style" section into the settings screen if not present.
function ensureNotebookStyleSection() {
  const screen = document.getElementById('screen-settings');
  if (!screen) return;
  let card = document.getElementById('notebookStyleCard');
  if (!card) {
    card = document.createElement('div');
    card.id = 'notebookStyleCard';
    card.className = 'paper-pref-section';
    const heading = document.createElement('div');
    heading.className = 'section-title';
    heading.textContent = 'Notebook style';
    // Insert near the top of settings — after the header, before Program.
    const programTitle = Array.from(screen.querySelectorAll('.section-title'))
      .find(el => el.textContent.trim() === 'Program');
    if (programTitle) {
      screen.insertBefore(heading, programTitle);
      screen.insertBefore(card, programTitle);
    } else {
      screen.appendChild(heading);
      screen.appendChild(card);
    }
  }
  renderNotebookStylePicker(card);
  ensureAppearanceSection();
}

// ─────────────────────────────────────────────────────────────
// Settings: Appearance picker (v19 — background color + text color)
// ─────────────────────────────────────────────────────────────

function renderAppearancePicker(rootEl) {
  if (!rootEl) return;
  const u = (typeof userData === 'function') ? userData() : null;
  if (!u) { rootEl.innerHTML = ''; return; }
  const prefs = u.preferences || {};
  const currentBg = prefs.bgColor || null;
  const currentText = prefs.textColor || 'auto';
  // The "active" highlight only matches when the value is a known preset id.
  // Custom hex colors fall through and light up the custom-color input instead.
  const isPresetMatch = PAPER_BG_PRESETS.some(p => p.id === currentBg);
  const customHex = (!isPresetMatch && typeof currentBg === 'string') ? currentBg : '';

  const swatchBtns = PAPER_BG_PRESETS.map(p => {
    const id = p.id === null ? 'null' : p.id;
    const active = (currentBg === p.id) ? ' active' : '';
    const sw = p.bg || '#f4ecd3';
    return `<button class="paper-bg-btn${active}" data-bg="${id}" aria-label="${p.label}"
      style="--swatch:${sw};" title="${p.label}"></button>`;
  }).join('');

  rootEl.innerHTML = `
    <div class="paper-pref-row">
      <span class="paper-pref-label">Bg</span>
      <div class="paper-bg-row">
        ${swatchBtns}
        <input type="color" class="paper-bg-custom" id="paperBgCustom"
          value="${customHex || '#f4ecd3'}" title="Custom color">
      </div>
    </div>
    <div class="paper-pref-row">
      <span class="paper-pref-label">Text</span>
      <div class="paper-pref-options">
        <button class="paper-pref-btn${currentText === 'auto'  ? ' active' : ''}" data-text="auto">Auto</button>
        <button class="paper-pref-btn${currentText === 'light' ? ' active' : ''}" data-text="light">Light</button>
      </div>
    </div>
  `;

  const onUpdate = () => {
    if (typeof applyPaperSkin === 'function') applyPaperSkin();
    try { if (typeof renderWorkoutScreen === 'function') renderWorkoutScreen(); } catch (e) {}
    try { renderAppearancePicker(rootEl); } catch (e) {}
  };

  rootEl.querySelectorAll('[data-bg]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.bg === 'null' ? null : btn.dataset.bg;
      updateUser(u => {
        if (!u.preferences) u.preferences = {};
        u.preferences.bgColor = id;
      });
      onUpdate();
    });
  });
  const customEl = rootEl.querySelector('#paperBgCustom');
  if (customEl) {
    customEl.addEventListener('input', () => {
      updateUser(u => {
        if (!u.preferences) u.preferences = {};
        u.preferences.bgColor = customEl.value;
      });
      // Live preview while dragging — don't re-render the picker on every
      // input tick, just push the variable change.
      if (typeof applyAppearancePrefs === 'function') applyAppearancePrefs();
    });
    customEl.addEventListener('change', onUpdate);
  }
  rootEl.querySelectorAll('[data-text]').forEach(btn => {
    btn.addEventListener('click', () => {
      updateUser(u => {
        if (!u.preferences) u.preferences = {};
        u.preferences.textColor = btn.dataset.text;
      });
      onUpdate();
    });
  });
}

// Inject an "Appearance" section into settings, just after Notebook style.
function ensureAppearanceSection() {
  const screen = document.getElementById('screen-settings');
  if (!screen) return;
  let card = document.getElementById('appearanceCard');
  if (!card) {
    card = document.createElement('div');
    card.id = 'appearanceCard';
    card.className = 'paper-appearance-section';
    const heading = document.createElement('div');
    heading.className = 'section-title';
    heading.textContent = 'Appearance';
    // Insert immediately after the Notebook style card (which sits before Program).
    const notebookCard = document.getElementById('notebookStyleCard');
    if (notebookCard && notebookCard.nextSibling) {
      screen.insertBefore(heading, notebookCard.nextSibling);
      screen.insertBefore(card, heading.nextSibling);
    } else {
      const programTitle = Array.from(screen.querySelectorAll('.section-title'))
        .find(el => el.textContent.trim() === 'Program');
      if (programTitle) {
        screen.insertBefore(heading, programTitle);
        screen.insertBefore(card, programTitle);
      } else {
        screen.appendChild(heading);
        screen.appendChild(card);
      }
    }
  }
  renderAppearancePicker(card);
}

// Expose for tests + console use.
try {
  if (typeof window !== 'undefined') {
    window.PAPER = PAPER;
    window.PAPER_INK_MAP = PAPER_INK_MAP;
    window.PAPER_HAND_MAP = PAPER_HAND_MAP;
    window.paperCheckboxSvg = paperCheckboxSvg;
    window.paperStrikeWrap = paperStrikeWrap;
    window.paperWirePress = paperWirePress;
    window.paperInkBloom = paperInkBloom;
    window.paperStamp = paperStamp;
    window.paperEnso = paperEnso;
    window.paperMarginNote = paperMarginNote;
    window.paperTape = paperTape;
    window.paperTornEdge = paperTornEdge;
    window.paperRoughenDefs = paperRoughenDefs;
    window.applyPaperSkin = applyPaperSkin;
    window.isPaperSkin = isPaperSkin;
    window.paperHandFont = paperHandFont;
    window.paperInkColor = paperInkColor;
    window.renderPaperKicker = renderPaperKicker;
    window.renderNotebookStylePicker = renderNotebookStylePicker;
    window.ensureNotebookStyleSection = ensureNotebookStyleSection;
    window.PAPER_BG_PRESETS = PAPER_BG_PRESETS;
    window.paperResolveBg = paperResolveBg;
    window.paperLuminance = paperLuminance;
    window.applyAppearancePrefs = applyAppearancePrefs;
    window.renderAppearancePicker = renderAppearancePicker;
    window.ensureAppearanceSection = ensureAppearanceSection;
  }
} catch (e) {}
