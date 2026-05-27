// ============================================================
// CSV IMPORT — bulk-import historical workouts from a CSV file
// ============================================================
// Companion to 17a-share-workout.js. Where 17a handles single-day
// shares (friend → friend, live workout), this module handles bulk
// historical imports — e.g. exporting from Strong / Hevy / FitNotes
// and bringing months of past sessions into K&N Lifts.
//
// Each unique `date` in the CSV becomes one session pushed to
// userData().sessions with manual:true and dayId "csv-import".
// Set-level fields (weight/reps/rpe/notes) land in session.sets;
// block info is preserved in the preview only.

const CSV_REQUIRED_COLUMNS = [
  "date", "day_name", "block", "exercise", "set_number",
  "weight", "reps", "rpe", "notes"
];

// ----- tiny inline CSV parser ----------------------------------------------
// Handles RFC 4180-ish quoted fields with embedded commas, escaped quotes
// ("" inside a quoted field), and LF / CRLF line endings.
function _csvParseRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const src = String(text || "");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ",") { row.push(field); field = ""; continue; }
    if (c === "\n" || c === "\r") {
      // Treat \r\n as a single terminator (skip the \n that follows \r).
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      // Skip wholly empty lines (no content at all).
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      continue;
    }
    field += c;
  }
  // Flush trailing field/row if file doesn't end in newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }
  return rows;
}

// ----- exercise lookup ------------------------------------------------------
// Case-insensitive, punctuation-tolerant, with a couple common alias maps.
function _csvNormalizeName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

let _csvLibIndex = null;
function _csvBuildLibIndex() {
  if (_csvLibIndex || typeof LIBRARY === "undefined") return _csvLibIndex;
  const idx = {};
  for (let i = 0; i < LIBRARY.length; i++) {
    const e = LIBRARY[i];
    if (!e || !e.name) continue;
    idx[_csvNormalizeName(e.name)] = e;
  }
  _csvLibIndex = idx;
  return idx;
}

function _csvLookupExercise(name) {
  if (!name || typeof LIBRARY === "undefined" || !Array.isArray(LIBRARY)) return null;
  const idx = _csvBuildLibIndex();
  if (!idx) return null;
  const norm = _csvNormalizeName(name);
  if (idx[norm]) return idx[norm];
  // Loose: strip trailing parens like "Back Squat (high bar)" → "back squat"
  const stripped = norm.replace(/\s+\([^)]*\)\s*$/, "").trim();
  if (stripped && idx[stripped]) return idx[stripped];
  return null;
}

// ----- field validation -----------------------------------------------------
function _csvParseDate(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { iso: m[0], y, mo, d };
}

function _csvParseBlock(s) {
  // "B. Squat" → { letter: "B", name: "Squat" }; "Squat" alone → letter null
  const raw = String(s || "").trim();
  if (!raw) return { letter: null, name: "" };
  const m = raw.match(/^([A-Z])\.\s*(.*)$/);
  if (m) return { letter: m[1], name: m[2].trim() };
  return { letter: null, name: raw };
}

function _csvParseNumber(s) {
  if (s == null || s === "") return null;
  const n = parseFloat(String(s).trim());
  return isFinite(n) ? n : NaN;
}

// ----- main parser ----------------------------------------------------------
// Returns { ok, sessions, unresolved, blockingErrors, totalSets, headers }.
// ok is true iff blockingErrors is empty. Unresolved exercises are listed
// but do NOT block — they import as ad-hoc entries (no exId, no muscles).
function parseCsv(text) {
  const result = {
    ok: false,
    sessions: [],
    unresolved: [],
    blockingErrors: [],
    totalSets: 0,
    headers: []
  };

  const raw = String(text || "");
  if (!raw.trim()) {
    result.blockingErrors.push({ row: 0, message: "CSV is empty." });
    return result;
  }

  const rows = _csvParseRows(raw);
  if (rows.length === 0) {
    result.blockingErrors.push({ row: 0, message: "CSV is empty." });
    return result;
  }

  // Header row — required, order-tolerant.
  const headerRow = rows[0].map(h => String(h || "").trim().toLowerCase());
  result.headers = headerRow.slice();
  const colIdx = {};
  headerRow.forEach((h, i) => { colIdx[h] = i; });

  const missingCols = CSV_REQUIRED_COLUMNS.filter(c => !(c in colIdx));
  if (missingCols.length === CSV_REQUIRED_COLUMNS.length) {
    // None of the expected columns present → not a CSV with a header.
    result.blockingErrors.push({
      row: 1,
      message: "Missing header row. First row must list column names: " + CSV_REQUIRED_COLUMNS.join(", ")
    });
    return result;
  }
  if (missingCols.length) {
    result.blockingErrors.push({
      row: 1,
      message: "Missing required column" + (missingCols.length > 1 ? "s" : "") + ": " + missingCols.join(", ")
    });
    return result;
  }

  // Group rows: by date → array of { block, exercise, setNumber, weight, reps, rpe, notes, rowNum }
  // We preserve insertion order so set_number 1,2,3… ends up in CSV order.
  const byDate = new Map();
  const dayNameByDate = new Map();
  const unresolvedCounts = new Map();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1; // 1-indexed for human messages

    // Skip wholly blank rows (cells all empty / whitespace).
    const allBlank = row.every(c => String(c || "").trim() === "");
    if (allBlank) continue;

    const get = name => {
      const i = colIdx[name];
      return i == null ? "" : String(row[i] == null ? "" : row[i]);
    };

    const dateRaw = get("date").trim();
    const date = _csvParseDate(dateRaw);
    if (!date) {
      result.blockingErrors.push({
        row: rowNum,
        message: "Bad date \"" + dateRaw + "\" — use YYYY-MM-DD."
      });
      continue;
    }

    const dayName = get("day_name").trim() || "Imported workout";
    const block = _csvParseBlock(get("block"));
    const exerciseName = get("exercise").trim();
    if (!exerciseName) {
      result.blockingErrors.push({ row: rowNum, message: "Missing exercise name." });
      continue;
    }

    const setNumberRaw = get("set_number");
    const setNumber = _csvParseNumber(setNumberRaw);
    if (setNumber == null || isNaN(setNumber) || setNumber < 1) {
      result.blockingErrors.push({
        row: rowNum,
        message: "Bad set_number \"" + setNumberRaw + "\" — must be a positive integer."
      });
      continue;
    }

    const repsRaw = get("reps");
    const reps = _csvParseNumber(repsRaw);
    if (reps == null || isNaN(reps) || reps <= 0) {
      result.blockingErrors.push({
        row: rowNum,
        message: "Missing or bad reps on \"" + exerciseName + "\" set " + setNumber + "."
      });
      continue;
    }

    const weightRaw = get("weight");
    const weight = _csvParseNumber(weightRaw);
    const lib = _csvLookupExercise(exerciseName);
    const isBodyweight = !!(lib && lib.bodyweight);

    let resolvedWeight;
    if (weight === null) {
      if (isBodyweight) {
        resolvedWeight = 0;
      } else {
        result.blockingErrors.push({
          row: rowNum,
          message: "Missing weight on \"" + exerciseName + "\" set " + setNumber +
                   " — required for non-bodyweight exercises."
        });
        continue;
      }
    } else if (isNaN(weight) || weight < 0) {
      result.blockingErrors.push({
        row: rowNum,
        message: "Bad weight \"" + weightRaw + "\" on \"" + exerciseName + "\" set " + setNumber + "."
      });
      continue;
    } else {
      resolvedWeight = weight;
    }

    const rpeRaw = get("rpe").trim();
    let rpe = null;
    if (rpeRaw !== "") {
      const rpeN = _csvParseNumber(rpeRaw);
      if (rpeN == null || isNaN(rpeN) || rpeN < 0 || rpeN > 10) {
        result.blockingErrors.push({
          row: rowNum,
          message: "Bad RPE \"" + rpeRaw + "\" on \"" + exerciseName + "\" set " + setNumber + " — must be 0–10."
        });
        continue;
      }
      rpe = rpeN;
    }

    const notes = get("notes").trim();

    if (!lib) {
      unresolvedCounts.set(exerciseName, (unresolvedCounts.get(exerciseName) || 0) + 1);
    }

    const key = date.iso;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push({
      block, exerciseName, lib, setNumber,
      weight: resolvedWeight, reps, rpe, notes,
      bodyweight: isBodyweight, rowNum
    });

    // First non-empty day_name on a date wins.
    if (!dayNameByDate.has(key) && dayName) dayNameByDate.set(key, dayName);
  }

  // Convert grouped rows into preview-ready sessions.
  const sortedDates = Array.from(byDate.keys()).sort();
  sortedDates.forEach(iso => {
    const items = byDate.get(iso);
    // Build per-exercise grouping for the preview, in original CSV order.
    const exMap = new Map(); // key: blockLetter + "|" + exerciseName
    const exOrder = [];
    items.forEach(it => {
      const blockKey = (it.block.letter || "") + "|" + (it.block.name || "");
      const exKey = blockKey + "|" + it.exerciseName.toLowerCase();
      if (!exMap.has(exKey)) {
        exMap.set(exKey, {
          block: it.block,
          name: it.exerciseName,
          lib: it.lib,
          sets: []
        });
        exOrder.push(exKey);
      }
      exMap.get(exKey).sets.push(it);
    });

    // Sort sets within each exercise by setNumber.
    exMap.forEach(ex => ex.sets.sort((a, b) => a.setNumber - b.setNumber));

    const exercises = exOrder.map(k => exMap.get(k));
    const totalSets = exercises.reduce((n, ex) => n + ex.sets.length, 0);
    result.totalSets += totalSets;

    result.sessions.push({
      date: iso,
      dayName: dayNameByDate.get(iso) || "Imported workout",
      exercises,
      setCount: totalSets
    });
  });

  unresolvedCounts.forEach((count, name) => {
    result.unresolved.push({ name, count });
  });

  result.ok = result.blockingErrors.length === 0 && result.sessions.length > 0;
  if (result.blockingErrors.length === 0 && result.sessions.length === 0) {
    result.blockingErrors.push({ row: 0, message: "No data rows found in CSV." });
  }
  return result;
}

// ----- session creation ----------------------------------------------------
// Convert a parsed CSV session into a stored session object (same shape as
// 09b-paper-log-sets.js / finishWorkout). One session per date.
function _csvBuildSession(parsedSession, nowMs, indexHint) {
  const d = parsedSession.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const noon = new Date(+d[1], +d[2] - 1, +d[3], 12, 0, 0, 0);
  // Stagger by index so multiple sessions imported in one batch get unique
  // ids and don't collide on finishedAt sort (same noon otherwise).
  const finishedAt = noon.getTime() + (indexHint || 0);

  const sets = [];
  let setIdxGlobal = 0;
  parsedSession.exercises.forEach(ex => {
    const lib = ex.lib;
    const muscles = (lib && lib.muscles) ? lib.muscles.slice() : [];
    ex.sets.forEach(s => {
      setIdxGlobal++;
      sets.push({
        exId: lib ? lib.id : ex.name,
        exName: ex.name,
        muscles,
        setIdx: s.setNumber,
        weight: s.bodyweight ? 0 : s.weight,
        reps: s.reps,
        rpe: s.rpe,
        bodyweight: s.bodyweight,
        isPR: false,
        notes: s.notes || undefined
      });
    });
  });

  const volume = sets.reduce((a, s) => a + (s.bodyweight ? 0 : s.weight * s.reps), 0);

  // Preserve block-level structure as block notes — gives the user a hint
  // in the history view that this session had named blocks.
  const blockNotes = {};
  parsedSession.exercises.forEach(ex => {
    if (!ex.block || !ex.block.letter) return;
    const id = "csv-" + ex.block.letter;
    if (!blockNotes[id]) {
      blockNotes[id] = {
        name: ex.block.name || ex.block.letter,
        note: ""
      };
    }
  });

  return {
    id: "s-" + nowMs + "-" + (indexHint || 0),
    dayId: "csv-import",
    dayName: parsedSession.dayName,
    startedAt: finishedAt - 3600000,
    finishedAt,
    duration: 3600,
    sets,
    volume,
    prCount: 0,
    manual: true,
    csvImport: true,
    blockNotes: Object.keys(blockNotes).length ? blockNotes : undefined
  };
}

function _csvImportSessions(parsed) {
  if (!parsed || !parsed.ok || !parsed.sessions.length) return 0;
  const nowMs = Date.now();
  const built = parsed.sessions.map((s, i) => _csvBuildSession(s, nowMs, i));

  if (typeof updateUser !== "function") return 0;
  updateUser(u => {
    if (!Array.isArray(u.sessions)) u.sessions = [];
    built.forEach(s => u.sessions.push(s));
    u.sessions.sort((a, b) => a.finishedAt - b.finishedAt);
    // Intentionally no 365-cap trim — a bulk historical import is the
    // exact case where silently dropping rows would be wrong. The data
    // layer holds whatever the user asked us to import.
  });

  if (typeof recomputeAllIsPR === "function") recomputeAllIsPR();
  return built.length;
}

// ----- UI: import sheet integration ----------------------------------------
function openCsvImportSheet() {
  const html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <h3 style="margin:0;">Import CSV</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>
    </div>
    <p style="color:var(--text-dim); font-size:12px; line-height:1.5; margin-bottom:10px;">
      Bulk-import past workouts from a CSV. Required columns:
      <code style="font-family:var(--font-mono,monospace);font-size:11px;">date, day_name, block, exercise, set_number, weight, reps, rpe, notes</code>.
      One row per set, dates in <code style="font-family:var(--font-mono,monospace);font-size:11px;">YYYY-MM-DD</code>.
    </p>
    <input id="csvImportFile" type="file" accept=".csv,text/csv" style="display:none;">
    <button id="csvImportPickBtn" class="primary" style="width:100%;margin-bottom:8px;">Choose CSV file</button>
    <div style="text-align:center;color:var(--text-dim);font-size:11px;margin:6px 0;">— or —</div>
    <textarea id="csvImportText" placeholder="Paste CSV text here…" autocomplete="off" spellcheck="false" style="width:100%;min-height:120px;background:var(--bg-elev);color:var(--text);border:1px solid var(--border);border-radius:10px;padding:10px;font-family:var(--font-mono,monospace);font-size:11px;"></textarea>
    <div class="sheet-actions">
      <button id="csvImportCancel">Cancel</button>
      <button class="primary" id="csvImportPreview">Preview</button>
    </div>
  `;
  openSheet(html);
  setTimeout(() => {
    const fileInput = document.getElementById("csvImportFile");
    const pickBtn = document.getElementById("csvImportPickBtn");
    const ta = document.getElementById("csvImportText");
    const cancel = document.getElementById("csvImportCancel");
    const preview = document.getElementById("csvImportPreview");
    if (pickBtn) pickBtn.onclick = () => fileInput && fileInput.click();
    if (fileInput) fileInput.onchange = () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        _csvShowPreviewSheet(text, f.name);
      };
      reader.onerror = () => showToast("Couldn't read that file");
      reader.readAsText(f);
    };
    if (cancel) cancel.onclick = closeSheet;
    if (preview) preview.onclick = () => {
      const text = ta ? ta.value : "";
      if (!text.trim()) { showToast("Paste CSV text or pick a file"); return; }
      _csvShowPreviewSheet(text, "pasted CSV");
    };
  }, 30);
}

function _csvShowPreviewSheet(text, sourceLabel) {
  const parsed = parseCsv(text);
  const blocking = parsed.blockingErrors;
  const sessions = parsed.sessions;
  const unresolved = parsed.unresolved;

  // Errors block import; render first if present so the user sees them.
  const errorsHtml = blocking.length
    ? `<div style="background:rgba(168,58,42,0.08);border:1px solid var(--paper-red,#a83a2a);border-radius:8px;padding:10px;margin-bottom:10px;">
        <div style="font-weight:700;color:var(--paper-red,#a83a2a);margin-bottom:6px;">
          ${blocking.length} blocking error${blocking.length > 1 ? "s" : ""}
        </div>
        <ul style="margin:0;padding-left:18px;font-size:12px;line-height:1.5;max-height:160px;overflow:auto;">
          ${blocking.slice(0, 25).map(e =>
            `<li>Row ${e.row}: ${escapeHtml(e.message)}</li>`
          ).join("")}
          ${blocking.length > 25 ? `<li><em>…and ${blocking.length - 25} more</em></li>` : ""}
        </ul>
      </div>`
    : "";

  const sessionsHtml = sessions.length
    ? `<details style="background:var(--bg-elev);border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-bottom:8px;">
        <summary style="cursor:pointer;font-weight:600;font-size:13px;">
          ${sessions.length} session${sessions.length !== 1 ? "s" : ""} · ${parsed.totalSets} sets
        </summary>
        <ul style="margin:8px 0 0;padding-left:18px;font-size:12px;line-height:1.6;max-height:200px;overflow:auto;">
          ${sessions.map(s =>
            `<li><strong>${escapeHtml(s.date)}</strong> — ${escapeHtml(s.dayName)} <span style="color:var(--text-dim);">(${s.setCount} sets, ${s.exercises.length} exercises)</span></li>`
          ).join("")}
        </ul>
      </details>`
    : "";

  const unresolvedHtml = unresolved.length
    ? `<details style="background:var(--bg-elev);border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-bottom:8px;">
        <summary style="cursor:pointer;font-weight:600;font-size:13px;color:var(--text-dim);">
          ${unresolved.length} exercise${unresolved.length !== 1 ? "s" : ""} not in library — will import as ad-hoc
        </summary>
        <ul style="margin:8px 0 0;padding-left:18px;font-size:12px;line-height:1.6;max-height:160px;overflow:auto;">
          ${unresolved.map(u =>
            `<li>${escapeHtml(u.name)} <span style="color:var(--text-dim);">(${u.count} set${u.count !== 1 ? "s" : ""})</span></li>`
          ).join("")}
        </ul>
      </details>`
    : "";

  const canImport = parsed.ok && sessions.length > 0;
  const importLabel = canImport
    ? `Import ${sessions.length} session${sessions.length !== 1 ? "s" : ""}`
    : "Fix errors to import";

  const html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <h3 style="margin:0;">CSV preview</h3>
      <button class="icon-btn" onclick="closeSheet()" title="Close">✕</button>
    </div>
    <p style="color:var(--text-dim); font-size:11px; margin-bottom:10px;">From ${escapeHtml(sourceLabel || "CSV")}.</p>
    ${errorsHtml}
    ${sessionsHtml}
    ${unresolvedHtml}
    <div class="sheet-actions">
      <button id="csvPreviewCancel">Cancel</button>
      <button class="primary" id="csvPreviewImport" ${canImport ? "" : "disabled"}>${importLabel}</button>
    </div>
  `;
  openSheet(html);

  setTimeout(() => {
    const cancel = document.getElementById("csvPreviewCancel");
    if (cancel) cancel.onclick = closeSheet;
    const imp = document.getElementById("csvPreviewImport");
    if (imp && canImport) imp.onclick = () => {
      const n = _csvImportSessions(parsed);
      closeSheet();
      if (typeof renderTimelineStrip === "function") renderTimelineStrip();
      if (typeof renderHistory === "function") renderHistory();
      if (typeof renderWorkoutScreen === "function") renderWorkoutScreen();
      showToast("Imported " + n + " session" + (n !== 1 ? "s" : ""), "success");
    };
  }, 30);
}

// Expose for the import sheet wiring + tests.
try {
  if (typeof window !== "undefined") {
    window.parseCsv = parseCsv;
    window._csvLookupExercise = _csvLookupExercise;
    window._csvImportSessions = _csvImportSessions;
    window._csvBuildSession = _csvBuildSession;
    window.openCsvImportSheet = openCsvImportSheet;
    window.CSV_REQUIRED_COLUMNS = CSV_REQUIRED_COLUMNS;
  }
} catch (e) {}
