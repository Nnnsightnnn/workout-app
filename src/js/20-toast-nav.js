// ============================================================
// TOAST + NAV
// ============================================================
let toastTimer = null;
let _undoPending = null; // { session, userId, timerId, onExpire }

function showToast(msg, type = "") {
  if (_undoPending) clearUndoToast();
  const t = document.getElementById("toast");
  t.innerHTML = "";
  t.textContent = msg;
  t.className = "toast show " + type;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = "toast " + type; }, 1900);
}

function showUndoToast(msg, onExpire) {
  // Finalize any prior pending undo
  if (_undoPending) {
    if (_undoPending.timerId) clearTimeout(_undoPending.timerId);
    if (_undoPending.onExpire) _undoPending.onExpire();
  }
  if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }

  const t = document.getElementById("toast");
  t.innerHTML = `
    <span class="toast-undo-msg">${msg}</span>
    <button class="toast-undo-btn" onclick="undoDeleteSession()">Undo</button>
    <div class="toast-undo-progress"></div>
  `;
  t.className = "toast toast-undo show";

  const timerId = setTimeout(() => {
    t.className = "toast";
    t.innerHTML = "";
    if (onExpire) onExpire();
    _undoPending = null;
  }, 5000);

  if (_undoPending) {
    _undoPending.timerId = timerId;
    _undoPending.onExpire = onExpire;
  }
}

function clearUndoToast() {
  if (!_undoPending) return;
  if (_undoPending.timerId) clearTimeout(_undoPending.timerId);
  if (_undoPending.onExpire) _undoPending.onExpire();
  _undoPending = null;
  const t = document.getElementById("toast");
  t.className = "toast";
  t.innerHTML = "";
}

function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById("screen-" + name).classList.add("active");
  document.querySelectorAll("nav.bottom button").forEach(b => b.classList.toggle("active", b.dataset.screen === name));
  if (name === "history") renderHistory();
  if (name === "workout") renderWorkoutScreen();
  if (name === "settings") { renderUserSection(); renderBodySection(); renderProgramPicker(); renderProfileCard(); }
  if (name === "prs") { _prDetailExId = null; renderPRScreen(); }
  // Hide floating timer button off-workout
  document.querySelector(".fab").style.display = name === "workout" ? "" : "none";
}