// ============================================================
// TOAST + NAV
// ============================================================
let toastTimer = null;
function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = "toast " + type; }, 1900);
}

function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById("screen-" + name).classList.add("active");
  document.querySelectorAll("nav.bottom button").forEach(b => b.classList.toggle("active", b.dataset.screen === name));
  if (name === "history") renderHistory();
  if (name === "workout") renderWorkoutScreen();
  if (name === "tools") { renderBodySection(); renderProgramPicker(); }
  // Hide floating timer button off-workout
  document.querySelector(".fab").style.display = name === "workout" ? "" : "none";
}