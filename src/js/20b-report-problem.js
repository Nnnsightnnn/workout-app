// ============================================================
// REPORT A PROBLEM
// ------------------------------------------------------------
// The boot-crash rescue screen (template.html) only catches a
// dead app. This covers the quieter case: the app runs, but
// something feels wrong. It keeps two small ring buffers (recent
// runtime errors, recent tap labels) and, on request, builds a
// plain-text report for Kenny: where they were, what they tapped,
// what broke, the build, and the SHAPE of their data — never the
// weights, reps, names or notes they logged.
// ============================================================
const REPORT_RING_SIZE = 20;
const _reportErrors = [];
const _reportTaps = [];
const _reportBootAt = Date.now();

function _reportPush(ring, item) {
  ring.push(item);
  if (ring.length > REPORT_RING_SIZE) ring.splice(0, ring.length - REPORT_RING_SIZE);
}

function _reportClock(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}

// Mask anything that could be a logged number (weights, reps, body
// weight): decimals and 2+ digit numbers become "#". Single digits
// survive so "Day 3" / "Week 4" still read.
function _reportMaskNumbers(s) {
  return String(s).replace(/\d+[.,]\d+|\d{2,}/g, "#");
}

function _reportTrim(s, n) {
  s = String(s || "").replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function _reportScreenId() {
  const el = document.querySelector(".screen.active");
  return el && el.id ? el.id : "(none)";
}

// Short, value-free label for a tapped element.
function _reportTapLabel(target) {
  if (!target || target.nodeType !== 1) return null;
  const el = target.closest(
    "button, a, label, summary, select, input, textarea, [role=button], [onclick], [data-action]"
  ) || target;
  const tag = el.tagName.toLowerCase();
  // Form fields: identify the field, never its value.
  if (tag === "input" || tag === "textarea" || tag === "select") {
    const name = el.id ? "#" + el.id : (el.name ? "[" + el.name + "]" : "");
    const type = tag === "input" ? (el.type || "text") : tag;
    return tag + "(" + type + ")" + name;
  }
  let text = el.getAttribute("aria-label") || el.getAttribute("title") || "";
  // Set rows and editors carry logged numbers in their text; skip text there.
  const inData = el.closest(".paper-set-row, .paper-set-list, .set-editor, [data-no-report-text]");
  if (!text && !inData) text = el.textContent || "";
  text = _reportMaskNumbers(_reportTrim(text, 30));
  if (text) return tag + ' "' + text + '"';
  if (el.id) return tag + "#" + el.id;
  const cls = (typeof el.className === "string" ? el.className : "").trim().split(/\s+/).slice(0, 2).join(".");
  return tag + (cls ? "." + cls : "");
}

function _reportRecordError(message, source, line, col, stack) {
  _reportPush(_reportErrors, {
    at: Date.now(),
    screen: _reportScreenId(),
    message: _reportTrim(message || "(no message)", 200),
    where: source ? String(source).split("/").pop() + ":" + (line || 0) + ":" + (col || 0) : "",
    stack: stack ? String(stack).split("\n").slice(0, 4).map(l => l.trim()).join("\n      ") : ""
  });
}

function initReportProblem() {
  if (window.__knReportWired) return;
  window.__knReportWired = true;
  window.addEventListener("error", (e) => {
    const err = e && e.error;
    _reportRecordError(e && e.message, e && e.filename, e && e.lineno, e && e.colno, err && err.stack);
  });
  window.addEventListener("unhandledrejection", (e) => {
    const r = e && e.reason;
    const msg = r && r.message ? r.message : String(r);
    _reportRecordError("Unhandled rejection: " + msg, "", 0, 0, r && r.stack);
  });
  document.addEventListener("click", (e) => {
    try {
      const label = _reportTapLabel(e.target);
      if (label) _reportPush(_reportTaps, { at: Date.now(), screen: _reportScreenId(), label });
    } catch (_) { /* never let the recorder break a tap */ }
  }, true);
}
initReportProblem();

// What was on top of the page when the reporter opened. The nav menu
// sheet itself is not interesting (it is how they got here).
function _reportOverlaySnapshot() {
  const out = [];
  const sheetBg = document.getElementById("sheetBg");
  const content = document.getElementById("sheetContent");
  if (sheetBg && sheetBg.classList.contains("active") && content
      && !content.querySelector(".paper-menu-sheet, .report-problem")) {
    const h = content.querySelector("h1, h2, h3, h4, .paper-menu-sheet-kicker, [class*='title'], [class*='kicker']");
    const title = h ? _reportMaskNumbers(_reportTrim(h.textContent, 40)) : "(untitled)";
    const first = content.firstElementChild;
    const cls = first && typeof first.className === "string" ? first.className.trim().split(/\s+/)[0] : "";
    out.push("bottom sheet: " + title + (cls ? " (." + cls + ")" : ""));
  }
  [["sidebarBg", "sidebar"], ["infoGuideOverlay", "info guide"],
   ["onboardingOverlay", "onboarding"], ["tutorialOverlay", "tutorial"]].forEach(([id, name]) => {
    const el = document.getElementById(id);
    if (el && el.classList.contains("active")) out.push(name + " overlay");
  });
  return out;
}

function _reportDataShape() {
  const lines = [];
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (_) {}
  lines.push("store size: " + (raw ? (raw.length / 1024).toFixed(1) + " KB" : "empty"));
  let s = null;
  try { s = raw ? JSON.parse(raw) : null; } catch (e) { lines.push("store parse: FAILED (" + e.message + ")"); }
  if (!s) return { storedSchema: "(none)", lines };
  lines.push("unit: " + s.unit);
  lines.push("users: " + (Array.isArray(s.users) ? s.users.length : "?"));
  const ob = s.onboarding;
  if (ob) {
    lines.push("onboarding: done=" + !!ob.completedAt
      + " injuries=[" + (Array.isArray(ob.injuries) ? ob.injuries.join(",") : "") + "]"
      + " equipment=" + (ob.equipment || "-")
      + " equipmentDetail=[" + (Array.isArray(ob.equipmentDetail) ? ob.equipmentDetail.join(",") : "") + "]");
  } else {
    lines.push("onboarding: none");
  }
  const u = Array.isArray(s.users) ? s.users.find(x => x && x.id === s.currentUserId) : null;
  if (!u) { lines.push("current user: none"); return { storedSchema: s._schemaVersion, lines }; }
  lines.push("sessions: " + (u.sessions || []).length
    + " · measurements: " + (u.measurements || []).length
    + " · programs: " + (u.programs || []).length
    + " · pinned lifts: " + (u.pinnedLifts || []).length);
  const p = Array.isArray(u.programs) ? u.programs.find(x => x && x.id === u.activeProgramId) : null;
  if (p) {
    lines.push("active program: " + p.templateId
      + " · week " + p.currentWeek + "/" + p.totalWeeks
      + " · " + p.daysPerWeek + " days/wk"
      + " · " + (Array.isArray(p.program) ? p.program.length : 0) + " days defined"
      + " · draft " + (p.draft ? "yes" : "no")
      + " · rp " + (p.rp && p.rp.enabled ? "on" : "off"));
  } else {
    lines.push("active program: none");
  }
  const pr = u.preferences || {};
  lines.push("appearance: bg=" + (pr.bgColor || "default") + " text=" + (pr.textColor || "auto")
    + " ink=" + u.paperInk + " rule=" + u.paperRule + " hand=" + u.paperHand);
  lines.push("workout in progress: " + (state && state.workoutStartedAt != null ? "yes" : "no")
    + " · adhoc: " + (state && state.adhocActive ? "yes" : "no"));
  return { storedSchema: s._schemaVersion, lines };
}

function _reportStandalone() {
  let dm = false;
  try { dm = !!(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches); } catch (_) {}
  return (navigator.standalone === true || dm) ? "yes" : "no";
}

// Build the plain-text report. `snapshot` is what was open when the
// reporter was summoned (so the reporter sheet itself does not mask it).
function buildProblemReport(note, snapshot) {
  const now = Date.now();
  const shape = _reportDataShape();
  const overlays = snapshot && snapshot.overlays ? snapshot.overlays : _reportOverlaySnapshot();
  const screen = snapshot && snapshot.screen ? snapshot.screen : _reportScreenId();
  const out = [];
  out.push("K&N Lifts problem report");
  out.push("========================");
  out.push("");
  out.push("What happened:");
  out.push((note && String(note).trim()) ? String(note).trim() : "(no note)");
  out.push("");
  out.push("-- Where --");
  out.push("screen: " + screen);
  out.push("open on top: " + (overlays.length ? overlays.join("; ") : "nothing"));
  out.push("");
  out.push("-- Last taps (oldest first) --");
  if (_reportTaps.length) {
    _reportTaps.forEach(t => out.push(_reportClock(t.at) + "  " + t.screen.replace(/^screen-/, "") + "  " + t.label));
  } else {
    out.push("(none recorded)");
  }
  out.push("");
  out.push("-- Errors (" + _reportErrors.length + ") --");
  if (_reportErrors.length) {
    _reportErrors.forEach(e => {
      out.push(_reportClock(e.at) + "  " + e.message + (e.where ? "  @ " + e.where : ""));
      if (e.stack) out.push("      " + e.stack);
    });
  } else {
    out.push("(none)");
  }
  out.push("");
  out.push("-- Build --");
  out.push("build: " + (typeof APP_BUILD !== "undefined" ? APP_BUILD : "?")
    + " · app schema: " + (typeof APP_VERSION !== "undefined" ? APP_VERSION : "?")
    + " · stored schema: " + shape.storedSchema);
  out.push("uptime: " + Math.round((now - _reportBootAt) / 1000) + "s · reported " + new Date(now).toISOString());
  out.push("");
  out.push("-- Data shape (no weights, reps or notes) --");
  shape.lines.forEach(l => out.push(l));
  out.push("");
  out.push("-- Device --");
  out.push("viewport: " + window.innerWidth + "x" + window.innerHeight
    + " @" + (window.devicePixelRatio || 1) + "x · standalone: " + _reportStandalone());
  out.push("ua: " + navigator.userAgent);
  return out.join("\n");
}

// Deliver: share sheet → clipboard + toast → selectable <pre>.
// Resolves to the path taken: "share" | "cancelled" | "clipboard" | "manual".
async function sendProblemReport(text) {
  if (navigator.share) {
    try {
      await navigator.share({ title: "K&N Lifts problem report", text });
      return "share";
    } catch (e) {
      if (e && e.name === "AbortError") return "cancelled";
    }
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      if (typeof showToast === "function") showToast("Copied — paste it to Kenny", "", 2600);
      return "clipboard";
    } catch (_) { /* fall through */ }
  }
  _reportShowManual(text);
  return "manual";
}

function _reportShowManual(text) {
  const body = document.querySelector(".report-problem");
  if (!body) {
    openSheet('<div class="report-problem"></div>');
    return _reportShowManual(text);
  }
  body.innerHTML = `
    <div class="report-problem-head">
      <span class="report-problem-kicker">report a problem</span>
      <button class="report-problem-close" type="button" aria-label="Close">&times;</button>
    </div>
    <p class="report-problem-lede">Couldn't hand it off automatically. Press and hold to copy this, then send it to Kenny.</p>
    <pre class="report-problem-pre" tabindex="0"></pre>
    <div class="report-problem-actions">
      <button class="report-problem-cancel" type="button">Done</button>
    </div>`;
  body.querySelector(".report-problem-pre").textContent = text;
  body.querySelector(".report-problem-close").addEventListener("click", () => closeSheet());
  body.querySelector(".report-problem-cancel").addEventListener("click", () => closeSheet());
}

function openReportProblem() {
  if (typeof openSheet !== "function") return;
  // Snapshot before our own sheet replaces whatever was open.
  const snapshot = { screen: _reportScreenId(), overlays: _reportOverlaySnapshot() };
  const wrap = document.createElement("div");
  wrap.className = "report-problem";
  wrap.innerHTML = `
    <div class="report-problem-head">
      <span class="report-problem-kicker">report a problem</span>
      <button class="report-problem-close" type="button" aria-label="Close">&times;</button>
    </div>
    <h3 class="report-problem-title">Something feel off?</h3>
    <p class="report-problem-lede">This sends Kenny where you were, your last few taps, any errors, and the build. Your weights, reps and notes stay on your phone.</p>
    <label class="report-problem-label" for="reportProblemNote">What happened? <span>(optional)</span></label>
    <textarea id="reportProblemNote" class="report-problem-note" rows="3"
      placeholder="e.g. the swap sheet wouldn't close"></textarea>
    <div class="report-problem-actions">
      <button class="report-problem-cancel" type="button">Cancel</button>
      <button class="primary paper-stamp-btn report-problem-send" type="button">Send to Kenny</button>
    </div>`;
  openSheet(wrap);
  wrap.querySelector(".report-problem-close").addEventListener("click", () => closeSheet());
  wrap.querySelector(".report-problem-cancel").addEventListener("click", () => closeSheet());
  const sendBtn = wrap.querySelector(".report-problem-send");
  sendBtn.addEventListener("click", async () => {
    if (sendBtn.disabled) return;
    sendBtn.disabled = true;
    const note = wrap.querySelector(".report-problem-note").value;
    const text = buildProblemReport(note, snapshot);
    const how = await sendProblemReport(text);
    sendBtn.disabled = false;
    if (how === "share" || how === "clipboard") closeSheet();
  });
}
