// ============================================================
// ONBOARDING
// ============================================================

// Exercise IDs flagged per injury category (warning chip shown, nothing removed)
const INJURY_EXERCISE_MAP = {
  lowerback: ["deadlift","sumo","trapbar","rdl","slrdl","goodmorning","kbswing",
               "backsquat","frontsquat","ssbsquat","pausesquat"],
  knees:     ["backsquat","frontsquat","pausesquat","ssbsquat","ohsquat","goblet",
               "bulgarian","stepup"],
  shoulders: ["strictpress","pushpress","logpress","bench","incbench","tempobench",
               "cgbench","floorpress","dbbench","inclinedb","dbshoulder","hkpress",
               "arnold","pushup","dip","pullup","weightedpullup","chinup",
               "pulldown","facepull"]
};

const ONBOARDING_STEPS = [
  {
    id: "goals",
    title: "What are your training goals?",
    subtitle: "Pick all that apply — we'll find the best match.",
    type: "multi",
    options: [
      { value: "strength",    label: "Strength",             icon: "🏋", sub: "Max lifts & peak power" },
      { value: "hypertrophy", label: "Hypertrophy",          icon: "📐", sub: "Muscle size & definition" },
      { value: "athletic",    label: "Athletic Performance", icon: "⚡", sub: "Speed, power & conditioning" },
      { value: "general",     label: "General Fitness",      icon: "🎯", sub: "Health, endurance & wellness" }
    ]
  },
  {
    id: "physiquePriority",
    title: "Any physique priorities?",
    subtitle: "Pick all that apply. Matching exercises get placed first in your accessory work.",
    type: "multi",
    layout: "grid",
    skippable: true,
    options: [
      { value: "bigger_arms",     label: "Bigger arms",           icon: "💪", sub: "Curls & tricep extensions" },
      { value: "bigger_chest",    label: "Bigger chest",          icon: "🫁", sub: "Incline press & cable flyes" },
      { value: "wider_shoulders", label: "Wider shoulders",       icon: "↔",  sub: "Lateral raises & cables" },
      { value: "bigger_back",     label: "Bigger back / V-taper", icon: "🔻", sub: "Pulldowns & wide rows" },
      { value: "stronger_legs",   label: "Stronger legs",         icon: "🦵", sub: "Quads, hamstrings & press" },
      { value: "glutes",          label: "Glutes",                icon: "🍑", sub: "Hip thrusts & split squats" },
      { value: "athletic",        label: "Athletic / Lean",       icon: "⚡", sub: "Balanced, no bias" },
      { value: "none",            label: "Balanced",              icon: "⚖",  sub: "No preference", deemph: true }
    ]
  },
  {
    id: "bodyGoal",
    title: "What's your body composition goal?",
    type: "single",
    options: [
      { value: "fat_loss", label: "Lose Fat",      icon: "🔥", sub: "Lean out while keeping muscle" },
      { value: "muscle",   label: "Build Muscle",  icon: "💪", sub: "Gain size and strength" },
      { value: "recomp",   label: "Recomp",        icon: "⚖", sub: "Lose fat + build muscle together" },
      { value: "maintain",  label: "Maintain",      icon: "✓",  sub: "Keep what I have, stay healthy" }
    ]
  },
  {
    id: "experience",
    title: "How long have you been training?",
    type: "single",
    options: [
      { value: "beginner",     label: "Beginner",     icon: "🌱", sub: "Under 1 year" },
      { value: "intermediate", label: "Intermediate", icon: "📈", sub: "1–3 years" },
      { value: "advanced",     label: "Advanced",     icon: "🏆", sub: "3+ years" }
    ]
  },
  {
    id: "days",
    title: "How many days per week can you train?",
    type: "single",
    options: [
      { value: 2, label: "2 Days / Week", icon: "2", sub: "Tue · Thu" },
      { value: 3, label: "3 Days / Week", icon: "3", sub: "Mon · Wed · Fri" },
      { value: 4, label: "4 Days / Week", icon: "4", sub: "Mon · Tue · Thu · Fri" },
      { value: 5, label: "5 Days / Week", icon: "5", sub: "Mon through Fri" },
      { value: 6, label: "6 Days / Week", icon: "6", sub: "Mon through Sat" }
    ]
  },
  {
    id: "selectedDays",
    title: "Which days work for you?",
    subtitle: "Pick the days you can train. We'll auto-pick if you skip.",
    type: "multi",
    skippable: true,
    layout: "chips",
    options: [
      { value: "mon", label: "Mon", icon: "M", sub: "" },
      { value: "tue", label: "Tue", icon: "T", sub: "" },
      { value: "wed", label: "Wed", icon: "W", sub: "" },
      { value: "thu", label: "Thu", icon: "T", sub: "" },
      { value: "fri", label: "Fri", icon: "F", sub: "" },
      { value: "sat", label: "Sat", icon: "S", sub: "" },
      { value: "sun", label: "Sun", icon: "S", sub: "" }
    ]
  },
  {
    id: "duration",
    title: "How long can you train per session?",
    type: "single",
    options: [
      { value: 30, label: "30 min",  icon: "⚡", sub: "Quick and efficient" },
      { value: 45, label: "45 min",  icon: "🎯", sub: "Focused session" },
      { value: 60, label: "60 min",  icon: "💪", sub: "Standard session" },
      { value: 90, label: "90 min",  icon: "🏋", sub: "Full training session" }
    ]
  },
  {
    id: "gender",
    title: "How should we tailor your program?",
    type: "single",
    options: [
      { value: "male",   label: "Balanced",           icon: "⚖", sub: "Even upper/lower emphasis" },
      { value: "female", label: "Glute & Lower Focus", icon: "🍑", sub: "More glute, hip, and leg work" },
      { value: "skip",   label: "No Preference",      icon: "→",  sub: "Use default programming" }
    ]
  },
  {
    id: "equipment",
    title: "What equipment do you have access to?",
    type: "single",
    options: [
      { value: "full",       label: "Full Gym",           icon: "🏋", sub: "Barbells, machines & cables" },
      { value: "barbell",    label: "Home + Barbell",     icon: "🔧", sub: "Barbell, rack & dumbbells" },
      { value: "bodyweight", label: "Bodyweight + Bands", icon: "⭕", sub: "No barbell needed" }
    ]
  },
  {
    id: "age",
    title: "Age range (optional)",
    type: "single",
    skippable: true,
    options: [
      { value: "under30", label: "Under 30", icon: "⚡", sub: "Generally faster recovery" },
      { value: "30to40",  label: "30–40",    icon: "🎯", sub: "Balanced training capacity" },
      { value: "40plus",  label: "40+",      icon: "♻",  sub: "Recovery may benefit from extra attention" }
    ]
  },
  {
    id: "bodyWeight",
    title: "What's your current body weight?",
    subtitle: "Used for bodyweight exercises like pullups and dips. You can update this anytime.",
    type: "number",
    skippable: true,
    inputConfig: {
      min: 50,
      max: 500,
      step: 1,
      placeholderLbs: "e.g. 185",
      placeholderKg: "e.g. 84"
    }
  },
  {
    id: "smartSuggestions",
    title: "Want smart weight suggestions?",
    subtitle: "We can recommend weights based on your training history and effort level.",
    type: "single",
    options: [
      { value: "yes", label: "Yes, suggest weights", icon: "🧠", sub: "Learns from your sessions to optimize load" },
      { value: "no",  label: "No thanks",            icon: "→",  sub: "I'll choose my own weights", deemph: true }
    ]
  },
  {
    id: "rpeCalibration",
    title: "Understanding effort levels",
    type: "info",
    showIf: function(answers) { return answers.smartSuggestions === "yes"; },
    content: {
      heading: "RIR = Reps In Reserve",
      bullets: [
        { label: "RIR 4", desc: "You could do 4 more reps" },
        { label: "RIR 3", desc: "3 more reps in the tank" },
        { label: "RIR 2", desc: "2 more — moderate effort" },
        { label: "RIR 1", desc: "Almost at your limit" },
        { label: "RIR 0", desc: "Nothing left — failure" }
      ],
      footer: "After each set, you'll rate your effort. This helps the app learn your strength levels."
    }
  },
  {
    id: "injuries",
    title: "Any areas to watch out for?",
    subtitle: "We'll flag exercises that may need modification — nothing gets removed.",
    type: "multi",
    options: [
      { value: "lowerback", label: "Lower Back", icon: "⚠", sub: "Disc issues, chronic pain" },
      { value: "knees",     label: "Knees",      icon: "⚠", sub: "Tendon or joint pain" },
      { value: "shoulders", label: "Shoulders",  icon: "⚠", sub: "Rotator cuff, impingement" },
      { value: "none",      label: "All Clear",  icon: "✓",  sub: "No known issues" }
    ]
  }
];

// ---- Template recommendation ----
function getRecommendedTemplate(a) {
  var days = a.days || 4;
  var dur = a.duration || 60;
  var injuries = a.injuries || [];
  var hasKnees = injuries.includes("knees");
  var wantsGlutes = a.gender === "female";

  // Resolve primary goal: goals[] (new) or goal (legacy fallback)
  var goals = a.goals && a.goals.length ? a.goals : (a.goal ? [a.goal] : ["general"]);
  var primaryGoal = goals[0];
  var hasStrength = goals.includes("strength");
  var hasHypertrophy = goals.includes("hypertrophy");
  var hasAthletic = goals.includes("athletic");

  // Equipment gate — bodyweight users
  if (a.equipment === "bodyweight") {
    if (days >= 4) return "calisthenics4";
    return "minimal3";
  }

  // Short sessions → time-efficient programs
  if (dur <= 30) return days <= 3 ? "rpt3" : "rpt3"; // RPT is built for 30-45 min
  if (dur <= 45 && !hasAthletic) {
    if (days <= 3) return "rpt3";
    // 4+ days at 45min works for most programs
  }

  // Age gate — 40+
  if (a.age === "40plus") {
    if (hasKnees) return "kot3";
    if (days <= 2) return "runner2";
    if (days <= 3) return "masters3";
    if (days === 4) return "strength_cond4";
    return "conjugate5";
  }

  // Beginner gate
  if (a.experience === "beginner") {
    if (days <= 2) return "runner2";
    if (days === 3) return "ss3"; // Novice LP — classic linear progression
    if (days === 4) return "upperlower4";
    return "beginner3"; // fallback full body
  }

  // Glute emphasis override
  if (wantsGlutes) {
    if (days <= 2) return "glutes2";
    if (days === 3) return "ppl3"; // PPL with glute pool weighting
    if (days === 4) return "filly4"; // Filly has good glute work
    return "hypertrophy5";
  }

  // Multi-goal combos: strength + hypertrophy → powerbuilding
  if (hasStrength && hasHypertrophy) {
    if (days <= 3) return "jbrown3";
    if (days === 4) return "phul4"; // PHUL blends strength + hypertrophy
    return "conjugate5";
  }

  // Primary goal × days × experience matrix
  if (primaryGoal === "strength") {
    if (days <= 2) return "runner2";
    if (days === 3) return a.experience === "advanced" ? "rpt3" : "jbrown3";
    if (days === 4) {
      if (a.experience === "advanced") return "wendler4"; // 5/3/1 for experienced
      return "powerlifting4";
    }
    return "conjugate5";
  }

  if (primaryGoal === "hypertrophy") {
    if (days <= 2) return "glutes2";
    if (days === 3) return "ppl3";
    if (days === 4) {
      if (a.bodyGoal === "fat_loss") return "strength_cond4"; // more conditioning
      if (a.experience === "advanced") return dur >= 90 ? "gvt4" : "gzcl4";
      return "phul4"; // PHUL for intermediate hypertrophy
    }
    if (days === 5) return "hypertrophy5";
    return "ppl6"; // 6-day
  }

  if (primaryGoal === "athletic") {
    if (days <= 2) return "runner2";
    if (days === 3) return "jbrown3";
    if (days === 4) return a.experience === "advanced" ? "prvn4" : "athletic4";
    return "hybrid5";
  }

  // General fitness
  if (days <= 2) return "runner2";
  if (days === 3) {
    if (a.bodyGoal === "fat_loss") return "strength_cond4"; // wait, 3 day... use ppl3
    return "ppl3";
  }
  if (days === 4) return "strength_cond4";
  if (days === 5) return "functional5";
  return "ppl6"; // 6-day general
}

function getDefaultRestSeconds(experience) {
  return experience === "beginner" ? 120 : 90;
}

// Returns a Set of exercise IDs that conflict with the user's reported injuries.
function getInjuryWarnings() {
  const s = loadStore();
  if (!s.onboarding || !s.onboarding.injuries) return new Set();
  const out = new Set();
  for (const inj of s.onboarding.injuries) {
    if (inj === "none") continue;
    const ids = INJURY_EXERCISE_MAP[inj];
    if (ids) ids.forEach(id => out.add(id));
  }
  return out;
}

// Persist answers to s.onboarding inside kn-lifts-v3.
function saveOnboarding(answers) {
  const s = loadStore();
  const recommendedTemplate = getRecommendedTemplate(answers);
  const defaultRestSeconds = getDefaultRestSeconds(answers.experience);
  s.onboarding = {
    ...answers,
    recommendedTemplate,
    defaultRestSeconds,
    completedAt: Date.now()
  };
  saveStore(s);
  return s.onboarding;
}

// ---- Flow state (not persisted) ----
let _obStep = 0;
let _obAnswers = {};
let _obIsRedo = false;

function showOnboardingFlow(redo) {
  _obStep = 0;
  _obAnswers = {};
  _obIsRedo = !!redo;
  if (_obIsRedo) {
    const s = loadStore();
    // Clear dismissal when user actively opens onboarding from settings
    if (s.onboardingDismissedAt) {
      s.onboardingDismissedAt = null;
      saveStore(s);
    }
    if (s.onboarding) {
      ONBOARDING_STEPS.forEach(step => {
        if (s.onboarding[step.id] !== undefined) {
          _obAnswers[step.id] = s.onboarding[step.id];
        }
      });
    }
  }
  const overlay = document.getElementById("onboardingOverlay");
  if (!overlay) return;
  overlay.classList.add("active");
  _renderObStep();
}

function closeOnboarding() {
  const overlay = document.getElementById("onboardingOverlay");
  if (overlay) overlay.classList.remove("active");
}

function dismissOnboarding() {
  const s = loadStore();
  s.onboardingDismissedAt = Date.now();
  saveStore(s);
  closeOnboarding();
}

function _obIsStepVisible(step) {
  return !step.showIf || step.showIf(_obAnswers);
}

function _renderObStep() {
  const inner = document.getElementById("onboardingInner");
  if (!inner) return;

  // Skip hidden steps (conditional showIf)
  const step = ONBOARDING_STEPS[_obStep];
  if (!_obIsStepVisible(step)) {
    _obStep++;
    if (_obStep < ONBOARDING_STEPS.length) { _renderObStep(); }
    return;
  }

  const visibleSteps = ONBOARDING_STEPS.filter(_obIsStepVisible);
  const total = visibleSteps.length;
  const visibleIndex = visibleSteps.indexOf(step);
  const isLast = _obStep === ONBOARDING_STEPS.length - 1;
  const canSkip = !!step.skippable;
  const pct = Math.round((visibleIndex / total) * 100);

  // Build content based on step type
  let contentHtml = "";

  if (step.type === "number") {
    const cfg = step.inputConfig;
    const unit = (typeof loadStore === "function" ? loadStore().unit : null) || "lbs";
    const placeholder = unit === "lbs" ? cfg.placeholderLbs : cfg.placeholderKg;
    const curVal = _obAnswers[step.id] || "";
    contentHtml = `
      <div class="ob-number-input-row">
        <input type="number" class="ob-number-input" id="obNumberInput"
          min="${cfg.min}" max="${cfg.max}" step="${cfg.step}"
          placeholder="${placeholder}" inputmode="decimal"
          value="${curVal}">
        <span class="ob-number-unit">${unit}</span>
      </div>`;

  } else if (step.type === "info") {
    const c = step.content;
    contentHtml = `
      <div class="ob-info-card">
        <h3 class="ob-info-heading">${c.heading}</h3>
        <div class="ob-info-scale">
          ${c.bullets.map(b => `<div class="ob-info-row"><span class="ob-info-label">${b.label}</span><span class="ob-info-desc">${b.desc}</span></div>`).join("")}
        </div>
        <p class="ob-info-footer">${c.footer}</p>
      </div>`;

  } else {
    // Standard option cards (single / multi)
    const selectedVals = step.type === "multi" ? (_obAnswers[step.id] || []) : [];
    const gridClass = step.layout === "grid"  ? " ob-grid"
                    : step.layout === "chips" ? " ob-chips"
                    : "";
    contentHtml = `<div class="ob-options${gridClass}" id="obOptions">${step.options.map(opt => {
      const isSel = step.type === "multi"
        ? selectedVals.includes(opt.value)
        : _obAnswers[step.id] === opt.value;
      const deemph = opt.deemph ? " ob-opt-deemph" : "";
      return `<button class="ob-option${isSel ? " selected" : ""}${deemph}" data-value="${opt.value}">
        <span class="ob-opt-icon">${opt.icon}</span>
        <div class="ob-opt-text">
          <div class="ob-opt-label">${opt.label}</div>
          <div class="ob-opt-sub">${opt.sub}</div>
        </div>
        <span class="ob-opt-check">✓</span>
      </button>`;
    }).join("")}</div>`;
  }

  const showContinue = step.type === "multi" || step.type === "number" || step.type === "info" || isLast || canSkip;
  const continueLabel = step.type === "info" ? "Got it — let's go" : (isLast ? "Finish Setup" : "Continue →");

  inner.innerHTML = `
    <div class="ob-progress"><div class="ob-progress-fill" style="width:${pct}%"></div></div>
    <div class="ob-body">
      ${_obStep > 0 ? `<div class="ob-nav-row"><button class="ob-back-btn" id="obBackBtn">← Back</button></div>` : ""}
      <div class="ob-step-label">Step ${visibleIndex + 1} of ${total}</div>
      <h2 class="ob-title">${step.title}</h2>
      ${step.subtitle ? `<p class="ob-subtitle">${step.subtitle}</p>` : ""}
      ${contentHtml}
      ${showContinue ? `<div class="ob-actions">
        <button class="ob-continue-btn" id="obContinueBtn">${continueLabel}</button>
        ${(canSkip && !isLast) ? `<button class="ob-skip-btn" id="obSkipBtn">Skip →</button>` : ""}
        ${isLast ? `<button class="ob-skip-btn" id="obSkipBtn">Skip questionnaire →</button>` : ""}
      </div>` : ""}
      ${!_obIsRedo ? `<button class="ob-dismiss-btn" id="obDismissBtn">Don't show me this again</button>` : ""}
    </div>`;

  // Bind option card clicks (single / multi steps)
  inner.querySelectorAll(".ob-option").forEach(btn => {
    btn.addEventListener("click", () => _obSelect(step, btn.dataset.value));
  });

  // Back button — skip hidden steps backward
  const backEl = document.getElementById("obBackBtn");
  if (backEl) backEl.addEventListener("click", () => {
    _obStep--;
    while (_obStep >= 0 && !_obIsStepVisible(ONBOARDING_STEPS[_obStep])) {
      _obStep--;
    }
    if (_obStep < 0) _obStep = 0;
    _renderObStep();
  });

  // Continue button
  const continueEl = document.getElementById("obContinueBtn");
  if (continueEl) {
    continueEl.addEventListener("click", () => {
      // Number input: validate and store
      if (step.type === "number") {
        const val = parseFloat(document.getElementById("obNumberInput").value);
        if (!val || val <= 0) { document.getElementById("obNumberInput").focus(); return; }
        _obAnswers[step.id] = val;
      }
      // Info step: mark calibration complete
      if (step.type === "info" && step.id === "rpeCalibration") {
        _obAnswers.rpeCalibration = { completedAt: Date.now() };
      }
      if (isLast) { _obFinish(); } else { _obStep++; _renderObStep(); }
    });
  }

  // Skip button
  const skipEl = document.getElementById("obSkipBtn");
  if (skipEl) {
    skipEl.addEventListener("click", () => {
      if (isLast) {
        dismissOnboarding();
      } else {
        _obStep++;
        _renderObStep();
      }
    });
  }

  const dismissBtn = document.getElementById("obDismissBtn");
  if (dismissBtn) dismissBtn.addEventListener("click", dismissOnboarding);

  // Auto-focus number input
  if (step.type === "number") {
    const numInput = document.getElementById("obNumberInput");
    if (numInput) setTimeout(() => numInput.focus(), 100);
  }
}

function _obSelect(step, rawValue) {
  // data-value attributes are always strings; convert days to number for template logic
  const value = step.id === "days" ? parseInt(rawValue, 10) : rawValue;

  if (step.type === "single") {
    _obAnswers[step.id] = value;
    setTimeout(() => { _obStep++; _renderObStep(); }, 120);
  } else {
    // Multi-select: "none" is mutually exclusive with all other values
    let arr = _obAnswers[step.id] || [];
    if (value === "none") {
      arr = arr.includes("none") ? [] : ["none"];
    } else {
      arr = arr.filter(v => v !== "none");
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(value);
    }
    _obAnswers[step.id] = arr;
    _renderObStep();
  }
}

function _obFinish() {
  if (!_obAnswers.goals || !_obAnswers.goals.length) {
    _obAnswers.goals = ["general"];
  }
  if (!_obAnswers.injuries || !_obAnswers.injuries.length) {
    _obAnswers.injuries = ["none"];
  }
  const onb = saveOnboarding(_obAnswers);

  // Apply experience-based default rest to the custom timer input
  const timerEl = document.getElementById("customTimerSec");
  if (timerEl) timerEl.value = onb.defaultRestSeconds;

  // Propagate onboarding data to current user record (redo path — first-run handled in addUser)
  if (_obIsRedo && state.userId) {
    updateUser(u => {
      u.physiquePriority = _obAnswers.physiquePriority || [];

      // Body weight
      if (_obAnswers.bodyWeight) {
        if (!u.measurements) u.measurements = [];
        const today = new Date().toISOString().slice(0, 10);
        const alreadyLogged = u.measurements.some(m => m.date === today);
        if (!alreadyLogged) {
          const unit = loadStore().unit || "lbs";
          u.measurements.push({ date: today, weight: _obAnswers.bodyWeight, unit: unit });
        }
      }

      // Smart suggestions → rp.enabled
      if (_obAnswers.smartSuggestions === "yes") {
        u.rp.enabled = true;
        if (_obAnswers.rpeCalibration && _obAnswers.rpeCalibration.completedAt) {
          u.rp.rpeCalibrationCompletedAt = _obAnswers.rpeCalibration.completedAt;
          u.rp.rpeCalibrationMethod = "onboarding";
        }
      } else if (_obAnswers.smartSuggestions === "no") {
        u.rp.enabled = false;
      }
    });
  }

  if (_obIsRedo) {
    _renderObHandoffRedo(onb);
  } else {
    // Pre-select the recommended template in the add-user dialog (sheet is open behind overlay)
    _obPreselectTemplate(onb.recommendedTemplate);
    _renderObHandoff(onb);
  }
}

// ---- Warm handoff screen ----
function _buildHandoffReasons(a, tplId) {
  const goalLabels = { strength: "Strength", hypertrophy: "Hypertrophy",
                       athletic: "Athletic Performance", general: "General Fitness" };
  const reasons = [];
  const goals = a.goals && a.goals.length ? a.goals : (a.goal ? [a.goal] : []);
  if (goals.length) {
    const goalText = goals.map(g => goalLabels[g] || g).join(" + ");
    reasons.push(`Matches your goal${goals.length > 1 ? "s" : ""}: <strong>${goalText}</strong>`);
  }
  if (a.experience === "beginner")     reasons.push("Beginner-friendly: longer rest periods between sets");
  if (a.experience === "advanced")     reasons.push("Advanced track: high-intensity conjugate periodisation");
  if (a.equipment === "bodyweight")    reasons.push("No barbell needed — bands & bodyweight throughout");
  if (a.equipment === "barbell")       reasons.push("Built for home barbell setups");
  if (a.age === "40plus")              reasons.push("You mentioned 40+ — this template includes recovery-friendly programming");
  const flaggedInjuries = (a.injuries || []).filter(i => i !== "none");
  if (flaggedInjuries.length) {
    const labels = flaggedInjuries.map(
      i => ({ lowerback: "lower back", knees: "knees", shoulders: "shoulders" }[i] || i)
    );
    const exCount = getInjuryWarnings().size;
    reasons.push(`⚠ ${exCount} exercise${exCount !== 1 ? "s" : ""} flagged for ${labels.join(" & ")} — nothing removed`);
  }
  return reasons;
}

function _renderObHandoff(onb) {
  const inner = document.getElementById("onboardingInner");
  if (!inner) return;
  const tpl = (typeof PROGRAM_TEMPLATES !== "undefined")
    ? PROGRAM_TEMPLATES.find(t => t.id === onb.recommendedTemplate) : null;
  const tplName = tpl ? tpl.name : onb.recommendedTemplate;
  const reasons = _buildHandoffReasons(_obAnswers, onb.recommendedTemplate);
  const reasonsHtml = reasons.map(r => `<li>${r}</li>`).join("");

  inner.innerHTML = `
    <div class="ob-progress"><div class="ob-progress-fill" style="width:100%"></div></div>
    <div class="ob-body ob-handoff">
      <div class="ob-step-label">You're all set</div>
      <h2 class="ob-title">Your program is ready —</h2>
      <div class="ob-program-name">${tplName}</div>
      <ul class="ob-reasons">${reasonsHtml}</ul>
      <p class="ob-handoff-hint">Enter your name below to start training.</p>
      <div class="ob-actions">
        <button class="ob-continue-btn" id="obStartBtn">Let's Go →</button>
      </div>
    </div>`;

  document.getElementById("obStartBtn").addEventListener("click", () => {
    closeOnboarding();
    setTimeout(() => {
      const nameInput = document.getElementById("newUserName");
      if (nameInput) nameInput.focus();
    }, 150);
  });
}

function _obPreselectTemplate(tplId) {
  const hiddenInput = document.getElementById("newUserTpl");
  if (!hiddenInput) return;
  hiddenInput.value = tplId;
  const container = document.getElementById("sheetContent");
  if (!container) return;
  container.querySelectorAll(".tpl-option").forEach(el => {
    el.classList.toggle("active", el.dataset.tpl === tplId);
  });
}

// ---- Redo handoff screen ----
function _renderObHandoffRedo(onb) {
  const inner = document.getElementById("onboardingInner");
  if (!inner) return;
  const tpl = (typeof PROGRAM_TEMPLATES !== "undefined")
    ? PROGRAM_TEMPLATES.find(t => t.id === onb.recommendedTemplate) : null;
  const tplName = tpl ? tpl.name : onb.recommendedTemplate;
  const reasons = _buildHandoffReasons(_obAnswers, onb.recommendedTemplate);
  const reasonsHtml = reasons.map(r => `<li>${r}</li>`).join("");

  const u = userData();
  const currentTplId = u ? u.templateId : null;
  const isDifferent = currentTplId && currentTplId !== onb.recommendedTemplate;

  let actionHtml;
  if (isDifferent) {
    const currentTpl = PROGRAM_TEMPLATES.find(t => t.id === currentTplId);
    const currentName = currentTpl ? currentTpl.name : currentTplId;
    actionHtml = `
      <p class="ob-handoff-hint">You're currently on <strong>${currentName}</strong>.
      We now recommend <strong>${tplName}</strong> based on your updated profile.</p>
      <div class="ob-actions">
        <button class="ob-continue-btn" id="obSwitchBtn">Switch to ${tplName}</button>
        <button class="ob-skip-btn" id="obKeepBtn">Keep current program →</button>
      </div>`;
  } else {
    actionHtml = `
      <p class="ob-handoff-hint">Your training profile has been updated.</p>
      <div class="ob-actions">
        <button class="ob-continue-btn" id="obDoneBtn">Done</button>
      </div>`;
  }

  inner.innerHTML = `
    <div class="ob-progress"><div class="ob-progress-fill" style="width:100%"></div></div>
    <div class="ob-body ob-handoff">
      <div class="ob-step-label">Profile updated</div>
      <h2 class="ob-title">Your recommendation —</h2>
      <div class="ob-program-name">${tplName}</div>
      <ul class="ob-reasons">${reasonsHtml}</ul>
      ${actionHtml}
    </div>`;

  const closeAndRefresh = () => {
    closeOnboarding();
    renderWorkoutScreen();
    renderProfileCard();
    showToast("Training profile updated", "success");
  };

  if (isDifferent) {
    document.getElementById("obSwitchBtn").addEventListener("click", () => {
      const newTpl = PROGRAM_TEMPLATES.find(t => t.id === onb.recommendedTemplate);
      if (newTpl) {
        closeOnboarding();
        openDurationPicker(newTpl.id);
        renderProfileCard();
        return;
      }
      closeOnboarding();
      renderProfileCard();
    });
    document.getElementById("obKeepBtn").addEventListener("click", closeAndRefresh);
  } else {
    document.getElementById("obDoneBtn").addEventListener("click", closeAndRefresh);
  }
}

// ---- Training Profile card in Settings ----
function renderProfileCard() {
  const el = document.getElementById("profileContent");
  if (!el) return;
  const s = loadStore();
  const ob = s.onboarding;

  if (ob && ob.completedAt) {
    const goalLabels = { strength: "Strength", hypertrophy: "Hypertrophy",
                         athletic: "Athletic Performance", general: "General Fitness" };
    const expLabels = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
    const eqLabels = { full: "Full Gym", barbell: "Home + Barbell", bodyweight: "Bodyweight + Bands" };
    const ppLabels = {
      bigger_arms: "Bigger arms", bigger_chest: "Bigger chest",
      wider_shoulders: "Wider shoulders", bigger_back: "Bigger back / V-taper",
      stronger_legs: "Stronger legs", glutes: "Glutes",
      athletic: "Athletic / Lean", none: "Balanced"
    };
    const injList = (ob.injuries || []).filter(i => i !== "none");
    const injText = injList.length
      ? injList.map(i => ({ lowerback: "Lower back", knees: "Knees", shoulders: "Shoulders" }[i] || i)).join(", ")
      : "None";
    const ppArr = Array.isArray(ob.physiquePriority) ? ob.physiquePriority : (ob.physiquePriority ? [ob.physiquePriority] : []);
    const ppText = ppArr.length ? ppArr.filter(v => v !== "none").map(v => ppLabels[v] || v).join(", ") || "Balanced" : "—";
    const bwText = ob.bodyWeight ? (ob.bodyWeight + " " + (s.unit || "lbs")) : "—";
    const ssText = ob.smartSuggestions === "yes" ? "On" : (ob.smartSuggestions === "no" ? "Off" : "—");

    el.innerHTML = `
      <div class="profile-summary">
        <div class="profile-row"><span class="profile-label">Goal${((ob.goals && ob.goals.length > 1) || false) ? "s" : ""}</span><span class="profile-value">${(ob.goals && ob.goals.length ? ob.goals.map(g => goalLabels[g] || g).join(", ") : goalLabels[ob.goal] || ob.goal) || "—"}</span></div>
        <div class="profile-row"><span class="profile-label">Physique</span><span class="profile-value">${ppText}</span></div>
        <div class="profile-row"><span class="profile-label">Experience</span><span class="profile-value">${expLabels[ob.experience] || ob.experience || "—"}</span></div>
        <div class="profile-row"><span class="profile-label">Days / week</span><span class="profile-value">${ob.days || "—"}</span></div>
        <div class="profile-row"><span class="profile-label">Equipment</span><span class="profile-value">${eqLabels[ob.equipment] || ob.equipment || "—"}</span></div>
        <div class="profile-row"><span class="profile-label">Body Weight</span><span class="profile-value">${bwText}</span></div>
        <div class="profile-row"><span class="profile-label">Smart Suggestions</span><span class="profile-value">${ssText}</span></div>
        <div class="profile-row"><span class="profile-label">Flags</span><span class="profile-value">${injText}</span></div>
      </div>
      <button class="program-change-btn" onclick="showOnboardingFlow(true)">Update Training Profile</button>
    `;
  } else {
    el.innerHTML = `
      <p style="color:var(--text-dim);font-size:13px;line-height:1.5;margin:0 0 10px;">
        Complete the training questionnaire to get personalized program recommendations and exercise safety flags.
      </p>
      <button class="program-change-btn" onclick="showOnboardingFlow(true)">Complete Questionnaire</button>
    `;
  }
}
