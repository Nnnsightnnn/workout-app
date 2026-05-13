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

// North Star: a missing load is missing data — never silently emit "bodyweight"
// or "@ 0 lbs". Only emit "bodyweight" when the exercise is explicitly flagged
// as bodyweight. Otherwise, an unset load renders as "—" so it's visible.
function _shareFmtWeight(ex, unit) {
  if (ex.bodyweight === true) return "bodyweight";
  if (ex.defaultWeight && ex.defaultWeight > 0) {
    return ex.defaultWeight + " " + (unit || "lbs") + (ex.perSide ? "/side" : "");
  }
  return "—";
}

function _shareFmtRest(sec) {
  if (!sec) return null;
  if (typeof formatRest === "function") return formatRest(sec);
  const m = Math.floor(sec / 60), s = sec % 60;
  return m === 0 ? s + "s" : m + ":" + String(s).padStart(2, "0");
}

// Public: format a single workout day as human-readable plain text.
// Spec lives in CLAUDE.md / project docs — keep this function and its tests
// in sync with that canonical example.
function formatWorkoutAsText(day, opts) {
  opts = opts || {};
  if (!day || !Array.isArray(day.blocks)) return "";
  const unit = opts.unit || (typeof state !== "undefined" && state && state.unit) || "lbs";

  const lines = [];
  lines.push("🏋️ " + (day.name || "Workout"));
  // Subtitle: prefer day.sub; otherwise build from opts.programName/phase if given.
  let subtitle = day.sub || "";
  if (!subtitle && (opts.programName || opts.phase)) {
    subtitle = [opts.programName, opts.phase].filter(Boolean).join(" · ");
  }
  if (subtitle) lines.push(subtitle);
  lines.push("");

  (day.blocks || []).forEach((block, bi) => {
    const letter = String.fromCharCode(65 + bi);
    const head = block.name ? (letter + ". " + block.name) : ("Block " + letter);
    lines.push(head);
    // Divider matches label width — no cap. Box-drawing U+2500 is one char wide.
    lines.push("─".repeat(Array.from(head).length));

    const exs = (block.exercises || []);
    exs.forEach((ex, i) => {
      const sr = _shareFmtSetsReps(ex);
      const wt = _shareFmtWeight(ex, unit);
      lines.push((i + 1) + ". " + (ex.name || "Exercise") + " — " + sr + " @ " + wt);
      const sub = [];
      const rest = _shareFmtRest(ex.rest);
      if (rest) sub.push("rest " + rest);
      if (ex.tempo) sub.push("tempo " + ex.tempo);
      if (sub.length) lines.push("   " + sub.join(" · "));
      if (ex.notes) {
        String(ex.notes).split(/\r?\n/).forEach(n => {
          if (n.length) lines.push("   " + n);
        });
      }
    });
    lines.push("");
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Legacy alias — keep so existing call sites and tests don't break.
function formatDayAsText(day, opts) {
  return formatWorkoutAsText(day, opts);
}

// ----- combined-share helper -------------------------------------------------

const SHARE_IMPORT_LABEL = "📲 Import in K&N Lifts:";
const SHARE_DIVIDER = "────────────";

// Build the combined "text + import URL" blob that's posted to navigator.share()
// or copied wholesale via "Share everything". Recipient can read the workout
// in their messaging app and also tap the URL to import.
function buildCombinedShareText(day, opts) {
  const text = formatWorkoutAsText(day, opts);
  const url = buildShareUrl(day);
  if (!url) return text;
  return text + "\n\n" + SHARE_DIVIDER + "\n" + SHARE_IMPORT_LABEL + "\n" + url;
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
  // Resolve to the app file directly. GitHub Pages serves an index.html at
  // /workout-app/ that meta-refreshes to workout-app.html, and meta-refresh
  // drops the URL hash — so a share URL ending in /workout-app/#share=… loses
  // the payload during redirect. Force the URL to point at workout-app.html.
  let base;
  if (typeof location !== "undefined") {
    base = location.origin + location.pathname;
    if (/\/$/.test(location.pathname)) {
      base += "workout-app.html";
    }
  } else {
    base = "https://nnnsightnnn.github.io/workout-app/workout-app.html";
  }
  return base + "#share=" + enc;
}

// Reason codes for parseShareInput failures, mapped to user-facing messages.
// Surfaced via the import sheet and deep-link handler so the user can tell
// "I pasted half a URL" from "the payload is corrupted" from "this isn't a
// share link at all."
const SHARE_PARSE_REASONS = {
  empty: "Paste a share link or code first.",
  url_missing_payload: "Share link is missing the workout data. Copy the FULL URL — everything after #share= is required.",
  not_a_share: "That doesn't look like a share link. Paste the full URL your friend sent.",
  bad_base64: "Share code is corrupted. Try copying the link again.",
  bad_json: "Share data is corrupted. Try copying the link again.",
  bad_shape: "Share link is missing workout data."
};

function _decodeShareToken(enc) {
  let json;
  try { json = _b64UrlDecode(enc); }
  catch (e) { return { ok: false, reason: "bad_base64" }; }
  let data;
  try { data = JSON.parse(json); }
  catch (e) { return { ok: false, reason: "bad_json" }; }
  if (!data || typeof data !== "object") return { ok: false, reason: "bad_shape" };
  return { ok: true, data: data };
}

// Parse whatever the user pasted into either { ok:true, data } or
// { ok:false, reason }. Reason codes feed SHARE_PARSE_REASONS so the user
// sees a specific diagnostic rather than one generic error.
function parseShareInput(input) {
  if (!input || typeof input !== "string") return { ok: false, reason: "empty" };
  // Strip ALL whitespace first — email/iMessage often wrap long URLs across
  // lines, leaving newlines or spaces inside the base64 payload.
  // Also strip common chat-app wrappers: Slack <url>, parens, quotes, brackets.
  const cleaned = input
    .replace(/\s+/g, "")
    .replace(/^[<("'\[]+|[>)"'\]]+$/g, "");
  if (!cleaned) return { ok: false, reason: "empty" };

  // 1) Try to extract a #share=<token> (or its percent-encoded form).
  //    The [A-Za-z0-9_-]+ class stops at the first non-base64url byte, so
  //    trailing punctuation, query strings, or appended text are trimmed.
  const m = cleaned.match(/(?:#|%23)share=([A-Za-z0-9_\-]+)/i);
  if (m) return _decodeShareToken(m[1]);

  // 2) URL-shaped input that didn't yield a token. Either the payload is
  //    missing (#share alone, #share= empty, or non-base64 garbage after =)
  //    or it isn't a share link at all.
  const looksLikeUrl = /^(https?:|\/\/)/i.test(cleaned) ||
                       /github\.io|workout-app\.html/i.test(cleaned);
  if (looksLikeUrl) {
    if (/(?:#|%23)share/i.test(cleaned)) {
      return { ok: false, reason: "url_missing_payload" };
    }
    return { ok: false, reason: "not_a_share" };
  }

  // 3) Raw-token fallback: caller pasted just the encoded payload (no URL).
  //    Be conservative — require a meaningful run of base64url chars so a
  //    stray "hi there" doesn't get mis-decoded into a generic parse error.
  //    Real workout payloads are hundreds of base64url chars; 20 is well
  //    below that floor but well above accidental short strings.
  const enc = cleaned.replace(/[^A-Za-z0-9_\-]/g, "");
  if (enc.length < 20) return { ok: false, reason: "not_a_share" };
  return _decodeShareToken(enc);
}

// Legacy: returns decoded data or null. Preserved so existing call sites
// and tests keep working; new code should call parseShareInput directly.
function decodeSharedDay(input) {
  const r = parseShareInput(input);
  return r.ok ? r.data : null;
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
  _openShareSheet(day);
}

// Single share sheet — shows the formatted preview and offers:
//   • Copy as text (primary) — readable in iMessage/Slack/email
//   • Copy import link        — base64 URL, secondary
//   • Share…                  — navigator.share with combined text + URL
// Recipient gets both readability AND a tappable import URL.
function _openShareSheet(day) {
  const unit = (typeof state !== "undefined" && state && state.unit) || "lbs";
  const text = formatWorkoutAsText(day, { unit: unit });
  const url = buildShareUrl(day) || "";
  const combined = buildCombinedShareText(day, { unit: unit });
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <h3 style="margin:0;">Share workout</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>
    </div>
    <p style="color:var(--text-dim); font-size:12px; margin-bottom:8px;">
      Anyone can read this — the import link lets K&amp;N Lifts users run it.
    </p>
    <textarea id="shareTextArea" readonly style="width:100%;min-height:220px;max-height:42vh;background:var(--bg-elev);color:var(--text);border:1px solid var(--border);border-radius:10px;padding:10px;font-family:var(--font-mono,monospace);font-size:12px;line-height:1.45;white-space:pre;">${safe}</textarea>
    <div class="sheet-actions" style="display:flex;flex-wrap:wrap;gap:8px;">
      <button class="primary" id="shareCopyTextBtn" style="flex:1 1 auto;min-width:140px;">Copy as text</button>
      <button id="shareCopyLinkBtn" style="flex:1 1 auto;min-width:140px;" ${url ? "" : "disabled"}>Copy import link</button>
      ${canShare ? `<button id="shareNativeBtn" style="flex:1 1 100%;">Share…</button>` : ""}
    </div>
  `;
  openSheet(html);

  setTimeout(() => {
    const ta = document.getElementById("shareTextArea");
    if (ta) ta.scrollTop = 0;

    const copyText = document.getElementById("shareCopyTextBtn");
    if (copyText) copyText.onclick = () => _shareCopy(text, "Workout copied — paste it anywhere");

    const copyLink = document.getElementById("shareCopyLinkBtn");
    if (copyLink && url) copyLink.onclick = () => _shareCopy(url, "Import link copied");

    const nativeBtn = document.getElementById("shareNativeBtn");
    if (nativeBtn) nativeBtn.onclick = () => {
      const title = day.name || "Workout";
      navigator.share({ title: title, text: combined })
        .catch(err => {
          if (err && err.name === "AbortError") return;
          _shareCopy(combined, "Workout copied — paste it anywhere");
        });
    };
  }, 30);
}

function _shareCopy(text, successMsg) {
  const done = () => showToast(successMsg || "Copied", "success");
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => _shareCopyFallback(text, done));
    return;
  }
  _shareCopyFallback(text, done);
}

function _shareCopyFallback(text, done) {
  // execCommand("copy") needs a focused selection of the textarea
  const ta = document.getElementById("shareTextArea");
  if (ta) {
    ta.value = text;
    ta.focus();
    ta.select();
    try {
      if (document.execCommand && document.execCommand("copy")) { done(); return; }
    } catch (e) { /* fall through */ }
  }
  showToast("Couldn't copy — long-press to select", "error");
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
      const parsed = parseShareInput(raw);
      if (!parsed.ok) {
        showToast(SHARE_PARSE_REASONS[parsed.reason] || "Couldn't read share link");
        return;
      }
      const errors = validateImportedDay(parsed.data);
      if (errors.length) { showToast(errors[0]); return; }
      _showImportConfirmSheet(parsed.data);
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

  const parsed = parseShareInput("#share=" + m[1]);
  if (!parsed.ok) {
    const msg = SHARE_PARSE_REASONS[parsed.reason] || "Couldn't read share link";
    setTimeout(() => showToast("Couldn't import: " + msg), 600);
    return true;
  }
  const errors = validateImportedDay(parsed.data);
  if (errors.length) {
    setTimeout(() => showToast("Couldn't import: " + errors[0]), 600);
    return true;
  }
  // Defer slightly so the workout screen is mounted before the sheet opens
  setTimeout(() => _showImportConfirmSheet(parsed.data), 600);
  return true;
}

// Expose for tests
try {
  if (typeof window !== "undefined") {
    window.serializeDayForShare = serializeDayForShare;
    window.formatDayAsText = formatDayAsText;
    window.formatWorkoutAsText = formatWorkoutAsText;
    window.buildCombinedShareText = buildCombinedShareText;
    window.encodeDayForShare = encodeDayForShare;
    window.buildShareUrl = buildShareUrl;
    window.decodeSharedDay = decodeSharedDay;
    window.parseShareInput = parseShareInput;
    window.SHARE_PARSE_REASONS = SHARE_PARSE_REASONS;
    window.SHARE_IMPORT_LABEL = SHARE_IMPORT_LABEL;
    window.SHARE_DIVIDER = SHARE_DIVIDER;
    window.validateImportedDay = validateImportedDay;
  }
} catch (e) {}
