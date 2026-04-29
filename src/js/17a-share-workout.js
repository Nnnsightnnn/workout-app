// ============================================================
// SHARE / IMPORT A SINGLE WORKOUT
// ============================================================
// Lets the user share one workout day (current day) with a buddy
// as plain text + a deep link, and lets a buddy import a shared
// workout as an ad-hoc session (does not modify program[]).

const SHARE_SCHEMA = 1;

// ----- serialize -------------------------------------------------------------

function _shareCleanExercise(ex) {
  const out = { exId: ex.exId, name: ex.name };
  if (Array.isArray(ex.muscles) && ex.muscles.length) out.muscles = ex.muscles.slice();
  if (ex.sets != null) out.sets = ex.sets;
  if (ex.reps != null) out.reps = ex.reps;
  if (ex.rest != null) out.rest = ex.rest;
  if (ex.defaultWeight != null && ex.defaultWeight !== 0) out.defaultWeight = ex.defaultWeight;
  if (ex.bodyweight) out.bodyweight = true;
  if (ex.perSide) out.perSide = true;
  if (ex.isTime) out.isTime = true;
  if (ex.isDistance) out.isDistance = true;
  if (ex.noRpe) out.noRpe = true;
  if (ex.tempo) out.tempo = ex.tempo;
  if (ex.notes) out.notes = ex.notes;
  if (ex.isWarmup) out.isWarmup = true;
  return out;
}

function serializeDayForShare(day) {
  if (!day || !Array.isArray(day.blocks)) return null;
  return {
    v: SHARE_SCHEMA,
    name: day.name || "Workout",
    sub: day.sub || "",
    blocks: day.blocks.map(b => ({
      blockType: b.blockType || null,
      type: b.type || null,
      name: b.name || "",
      exercises: (b.exercises || []).map(_shareCleanExercise)
    }))
  };
}

// ----- plain-text formatting -------------------------------------------------

function _shareFmtSetsReps(ex) {
  const sets = ex.sets || 1;
  let repsLabel;
  if (ex.isTime) repsLabel = (ex.reps || 0) + "s";
  else if (ex.isDistance) repsLabel = (ex.reps || 0) + "m";
  else repsLabel = String(ex.reps == null ? "—" : ex.reps);
  return sets + "×" + repsLabel;
}

function _shareFmtWeight(ex, unit) {
  if (ex.bodyweight) return "bodyweight";
  if (!ex.defaultWeight) return null;
  return ex.defaultWeight + " " + (unit || "lbs") + (ex.perSide ? "/side" : "");
}

function _shareFmtRest(sec) {
  if (!sec) return null;
  if (typeof formatRest === "function") return formatRest(sec);
  const m = Math.floor(sec / 60), s = sec % 60;
  return m === 0 ? s + "s" : m + ":" + String(s).padStart(2, "0");
}

function formatDayAsText(day, opts) {
  opts = opts || {};
  const unit = opts.unit || (typeof state !== "undefined" && state && state.unit) || "lbs";
  const lines = [];
  lines.push("🏋️ " + (day.name || "Workout"));
  if (day.sub) lines.push(day.sub);
  lines.push("");

  (day.blocks || []).forEach((block, bi) => {
    const letter = String.fromCharCode(65 + bi);
    const head = block.name ? (letter + ". " + block.name) : ("Block " + letter);
    lines.push(head);
    lines.push("─".repeat(Math.min(head.length, 32)));

    const exs = (block.exercises || []).filter(e => !e.isWarmup);
    exs.forEach((ex, i) => {
      const sr = _shareFmtSetsReps(ex);
      const wt = _shareFmtWeight(ex, unit);
      const head = (i + 1) + ". " + (ex.name || "Exercise") +
        " — " + sr + (wt ? " @ " + wt : "");
      lines.push(head);
      const sub = [];
      const rest = _shareFmtRest(ex.rest);
      if (rest) sub.push("rest " + rest);
      if (ex.tempo) sub.push("tempo " + ex.tempo);
      if (sub.length) lines.push("   " + sub.join(" · "));
      if (ex.notes) lines.push("   " + ex.notes);
    });
    lines.push("");
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ----- encode / decode -------------------------------------------------------

function _b64UrlEncode(str) {
  // btoa works on latin1; UTF-8 safety via encodeURIComponent → bytes
  const bytes = unescape(encodeURIComponent(str));
  return btoa(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function _b64UrlDecode(enc) {
  let s = enc.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return decodeURIComponent(escape(atob(s)));
}

function encodeDayForShare(day) {
  const payload = serializeDayForShare(day);
  if (!payload) return null;
  return _b64UrlEncode(JSON.stringify(payload));
}

function buildShareUrl(day) {
  const enc = encodeDayForShare(day);
  if (!enc) return null;
  // Use location.origin + pathname so the user lands on this exact app build
  const base = (typeof location !== "undefined")
    ? (location.origin + location.pathname)
    : "https://nnnsightnnn.github.io/workout-app/";
  return base + "#share=" + enc;
}

function decodeSharedDay(input) {
  if (!input || typeof input !== "string") return null;
  let enc = input.trim();
  // Accept either a raw token or a full URL with #share=
  const hashIdx = enc.indexOf("#share=");
  if (hashIdx >= 0) enc = enc.slice(hashIdx + 7);
  // Tolerate stray leading "?" or "#"
  enc = enc.replace(/^[#?]+/, "");
  if (!enc) return null;
  try {
    const json = _b64UrlDecode(enc);
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

function validateImportedDay(obj) {
  const errors = [];
  if (!obj || typeof obj !== "object") {
    errors.push("Not a valid shared workout");
    return errors;
  }
  if (typeof obj.v !== "number") {
    errors.push("Missing version field");
  } else if (obj.v > SHARE_SCHEMA) {
    errors.push("Shared workout uses a newer format (v" + obj.v + "). Update the app.");
  }
  if (!Array.isArray(obj.blocks) || obj.blocks.length === 0) {
    errors.push("No exercise blocks found");
  } else {
    let totalEx = 0;
    obj.blocks.forEach(b => {
      if (Array.isArray(b.exercises)) totalEx += b.exercises.length;
    });
    if (totalEx === 0) errors.push("No exercises found");
  }
  return errors;
}

// ----- adapt imported day → ad-hoc-shaped day --------------------------------

function _adaptImportedExercise(ex) {
  const libEx = (ex.exId && typeof LIB_BY_ID !== "undefined") ? LIB_BY_ID[ex.exId] : null;
  const base = libEx
    ? (typeof mkSets === "function" ? mkSets(libEx) : {})
    : {};
  return Object.assign({}, base, {
    exId: ex.exId || (libEx ? libEx.id : null),
    name: ex.name || (libEx ? libEx.name : "Unknown exercise"),
    muscles: (libEx && libEx.muscles) ? libEx.muscles.slice() : (ex.muscles || []),
    sets: ex.sets != null ? ex.sets : (base.sets || 3),
    reps: ex.reps != null ? ex.reps : (base.reps || 8),
    rest: ex.rest != null ? ex.rest : (base.rest || 90),
    defaultWeight: ex.defaultWeight != null ? ex.defaultWeight : (base.defaultWeight || 0),
    bodyweight: !!(ex.bodyweight || (libEx && libEx.bodyweight)),
    perSide: !!(ex.perSide || (libEx && libEx.perSide)),
    isTime: !!(ex.isTime || (libEx && libEx.isTime)),
    isDistance: !!(ex.isDistance || (libEx && libEx.isDistance)),
    noRpe: !!(ex.noRpe || (libEx && libEx.noRpe)),
    tempo: ex.tempo || "",
    notes: ex.notes || "",
    isWarmup: !!ex.isWarmup
  });
}

function _beginImportedSession(importedDay) {
  if (state.adhocActive) {
    showToast("Finish the current quick workout first");
    return;
  }
  // Flatten all non-warmup exercises into one block (matches existing ad-hoc
  // rendering, which treats each ad-hoc workout as a single block "A").
  // Block names are preserved as section markers in notes when meaningful.
  const allExercises = [];
  (importedDay.blocks || []).forEach(b => {
    (b.exercises || []).forEach(ex => {
      if (ex.isWarmup) return; // skip warmups in the live session
      allExercises.push(_adaptImportedExercise(ex));
    });
  });

  if (allExercises.length === 0) {
    showToast("Shared workout has no exercises to run");
    return;
  }

  const blocks = [{
    id: "adhoc-block-1",
    letter: "A",
    name: importedDay.name || "Shared workout",
    exercises: allExercises
  }];

  state.adhocActive = true;
  state.adhocDay = {
    id: "adhoc",
    name: importedDay.name || "Shared workout",
    sub: importedDay.sub || "Imported · won't affect program",
    blocks: blocks
  };
  state.adhocCustomName = null;
  state.adhocExercises = allExercises.slice();
  state.adhocStartedAt = Date.now();
  state.adhocInputs = {};
  state.dayChosen = true;
  state.workoutView = "chapters";

  if (typeof showScreen === "function") showScreen("workout");
  if (typeof renderAdhocScreen === "function") renderAdhocScreen();
}

// ----- share entry point -----------------------------------------------------

function shareCurrentWorkout() {
  const day = (typeof getCurrentDay === "function") ? getCurrentDay() : null;
  if (!day) { showToast("No workout to share"); return; }

  const text = formatDayAsText(day, { unit: state.unit });
  const url = buildShareUrl(day);
  const title = day.name || "Workout";
  const fullText = url ? (text + "\n\n" + url) : text;

  // Prefer native share sheet on mobile (iMessage, etc.)
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  if (canShare) {
    navigator.share({ title: title, text: text, url: url || undefined })
      .then(() => { /* user shared */ })
      .catch(err => {
        // User cancel is normal — only fall back on actual failure
        if (err && err.name === "AbortError") return;
        _shareFallbackCopy(fullText);
      });
    return;
  }
  _shareFallbackCopy(fullText);
}

function _shareFallbackCopy(text) {
  const done = () => showToast("Workout copied — paste it in iMessage", "success");
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => _shareShowTextSheet(text));
    return;
  }
  _shareShowTextSheet(text);
}

function _shareShowTextSheet(text) {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <h3 style="margin:0;">Share workout</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>
    </div>
    <p style="color:var(--text-dim); font-size:12px; margin-bottom:8px;">
      Copy this and send to your buddy.
    </p>
    <textarea id="shareTextArea" readonly style="width:100%;min-height:240px;background:var(--bg-elev);color:var(--text);border:1px solid var(--border);border-radius:10px;padding:10px;font-family:var(--font-mono,monospace);font-size:12px;">${safe}</textarea>
    <div class="sheet-actions">
      <button class="primary" id="shareCopyBtn">Copy</button>
    </div>
  `;
  openSheet(html);
  setTimeout(() => {
    const ta = document.getElementById("shareTextArea");
    if (ta) { ta.focus(); ta.select(); }
    const btn = document.getElementById("shareCopyBtn");
    if (btn) btn.onclick = () => {
      const t = document.getElementById("shareTextArea");
      if (t) { t.select(); document.execCommand && document.execCommand("copy"); }
      showToast("Copied", "success");
    };
  }, 30);
}

// ----- import entry points ---------------------------------------------------

function openImportWorkoutSheet() {
  const html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <h3 style="margin:0;">Import workout</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>
    </div>
    <p style="color:var(--text-dim); font-size:12px; margin-bottom:8px;">
      Paste a share link or code from a friend. Their workout runs as a one-off — your program stays untouched.
    </p>
    <textarea id="shareImportInput" placeholder="Paste link or code…" autocomplete="off" style="width:100%;min-height:120px;background:var(--bg-elev);color:var(--text);border:1px solid var(--border);border-radius:10px;padding:10px;font-family:var(--font-mono,monospace);font-size:12px;"></textarea>
    <div class="sheet-actions">
      <button id="shareImportCancel">Cancel</button>
      <button class="primary" id="shareImportNext">Next</button>
    </div>
  `;
  openSheet(html);
  setTimeout(() => {
    const ta = document.getElementById("shareImportInput");
    if (ta) ta.focus();
    const cancel = document.getElementById("shareImportCancel");
    if (cancel) cancel.onclick = closeSheet;
    const next = document.getElementById("shareImportNext");
    if (next) next.onclick = () => {
      const raw = (document.getElementById("shareImportInput") || {}).value || "";
      const decoded = decodeSharedDay(raw);
      const errors = validateImportedDay(decoded);
      if (errors.length) { showToast(errors[0]); return; }
      _showImportConfirmSheet(decoded);
    };
  }, 30);
}

function _showImportConfirmSheet(decoded) {
  let exCount = 0;
  (decoded.blocks || []).forEach(b => {
    (b.exercises || []).forEach(e => { if (!e.isWarmup) exCount++; });
  });
  const safeName = (decoded.name || "Shared workout").replace(/</g, "&lt;");
  const safeSub = (decoded.sub || "").replace(/</g, "&lt;");
  const html = `
    <h3>Import this workout?</h3>
    <div style="background:var(--bg-elev);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin:8px 0 10px;">
      <div style="font-weight:700;">${safeName}</div>
      ${safeSub ? `<div style="color:var(--text-dim);font-size:12px;">${safeSub}</div>` : ""}
      <div style="color:var(--text-dim);font-size:12px;margin-top:4px;">${exCount} exercise${exCount !== 1 ? "s" : ""}</div>
    </div>
    <p style="color:var(--text-dim); font-size:12px; line-height:1.5;">
      This starts as a quick workout. Your program rotation and history are not affected — when you finish, it saves like any ad-hoc session.
    </p>
    <div class="sheet-actions">
      <button id="shareImportConfirmCancel">Cancel</button>
      <button class="primary" id="shareImportConfirmStart">Train now</button>
    </div>
  `;
  openSheet(html);
  setTimeout(() => {
    const cancel = document.getElementById("shareImportConfirmCancel");
    if (cancel) cancel.onclick = closeSheet;
    const start = document.getElementById("shareImportConfirmStart");
    if (start) start.onclick = () => {
      closeSheet();
      _beginImportedSession(decoded);
    };
  }, 30);
}

// Called from init on app boot if the URL contains #share=...
function maybeHandleShareDeepLink() {
  if (typeof location === "undefined" || !location.hash) return false;
  const m = location.hash.match(/[#&]share=([^&]+)/);
  if (!m) return false;
  // Strip the share param from the URL so refresh doesn't re-prompt
  try {
    const cleaned = location.hash
      .replace(/(^|[#&])share=[^&]+/, "")
      .replace(/^[#&]+/, "");
    history.replaceState(null, "", location.pathname + location.search + (cleaned ? "#" + cleaned : ""));
  } catch (e) { /* non-fatal */ }

  const decoded = decodeSharedDay(m[1]);
  const errors = validateImportedDay(decoded);
  if (errors.length) {
    setTimeout(() => showToast("Couldn't import: " + errors[0]), 600);
    return true;
  }
  // Defer slightly so the workout screen is mounted before the sheet opens
  setTimeout(() => _showImportConfirmSheet(decoded), 600);
  return true;
}

// Expose for tests
try {
  if (typeof window !== "undefined") {
    window.serializeDayForShare = serializeDayForShare;
    window.formatDayAsText = formatDayAsText;
    window.encodeDayForShare = encodeDayForShare;
    window.decodeSharedDay = decodeSharedDay;
    window.validateImportedDay = validateImportedDay;
  }
} catch (e) {}
