// ============================================================
// INFO GUIDE
// ============================================================

let _igPage = 0;

const INFO_PAGES = [
  {
    label: "About",
    title: "K&N Lifts",
    subtitle: "A workout tracker built for lifters who just want to train.",
    type: "grid",
    cards: [
      { icon: "💸", title: "Free Forever",         desc: "No subscription, no ads, no upsells" },
      { icon: "📡", title: "Works Offline",         desc: "Single file — no internet needed" },
      { icon: "🔒", title: "Your Data Stays Here",  desc: "Stored on your device, never sent anywhere" },
      { icon: "⚡", title: "No Account Needed",     desc: "Open the app and start training" }
    ]
  },
  {
    label: "How to Train",
    title: "4 Steps to Lift",
    subtitle: "Everything you need to know in 30 seconds.",
    type: "steps",
    cards: [
      { num: "1", title: "Pick a Program",     desc: "27+ templates — from Conjugate to PPL. Onboarding recommends one for you." },
      { num: "2", title: "Log Your Sets",       desc: "Tap weight & reps. Last session auto-fills. Rest timer fires between sets." },
      { num: "3", title: "Finish & Track",      desc: "Complete a session to log PRs. Your program auto-advances to the next day." },
      { num: "4", title: "Customize Anything",  desc: "Swap exercises, reorder blocks, rename days — make it yours." }
    ]
  },
  {
    label: "Features",
    title: "Built for Lifters",
    subtitle: "Everything you need, nothing you don't.",
    type: "grid",
    cards: [
      { icon: "📋", title: "27 Programs",     desc: "Every methodology, beginner to advanced" },
      { icon: "⭐", title: "PR Tracking",      desc: "Weight, e1RM, and rep records" },
      { icon: "⏱", title: "Rest Timer",       desc: "Audio + vibration cues between sets" },
      { icon: "🍽", title: "Plate Calculator", desc: "Visual bar loading diagram" },
      { icon: "👥", title: "Multi-User",       desc: "Share a device, keep separate profiles" },
      { icon: "📈", title: "Body Tracking",    desc: "Weight & measurement trends" }
    ]
  }
];

function openInfoGuide() {
  _igPage = 0;
  var overlay = document.getElementById("infoGuideOverlay");
  if (!overlay) return;
  overlay.classList.add("active");
  _renderIGPage();
}

function closeInfoGuide() {
  var overlay = document.getElementById("infoGuideOverlay");
  if (overlay) overlay.classList.remove("active");
}

function _renderIGPage() {
  var inner = document.getElementById("infoGuideInner");
  if (!inner) return;
  var page = INFO_PAGES[_igPage];
  var total = INFO_PAGES.length;

  // Build cards
  var cardsHtml = "";
  if (page.type === "grid") {
    cardsHtml = '<div class="ig-grid">';
    page.cards.forEach(function(c) {
      cardsHtml += '<div class="ig-card">' +
        '<span class="ig-card-icon">' + c.icon + '</span>' +
        '<div class="ig-card-title">' + c.title + '</div>' +
        '<div class="ig-card-desc">' + c.desc + '</div>' +
      '</div>';
    });
    cardsHtml += '</div>';
  } else {
    cardsHtml = '<div class="ig-steps">';
    page.cards.forEach(function(c) {
      cardsHtml += '<div class="ig-step">' +
        '<div class="ig-step-num">' + c.num + '</div>' +
        '<div class="ig-step-body">' +
          '<div class="ig-step-title">' + c.title + '</div>' +
          '<div class="ig-step-desc">' + c.desc + '</div>' +
        '</div>' +
      '</div>';
    });
    cardsHtml += '</div>';
  }

  // Dots
  var dotsHtml = '<div class="ig-dots">';
  for (var i = 0; i < total; i++) {
    dotsHtml += '<button class="ig-dot' + (i === _igPage ? ' active' : '') + '" data-idx="' + i + '"></button>';
  }
  dotsHtml += '</div>';

  // Footer on last page
  var footerHtml = "";
  if (_igPage === total - 1) {
    var ver = (typeof APP_DISPLAY_VERSION !== "undefined") ? APP_DISPLAY_VERSION : "";
    var build = (typeof APP_BUILD !== "undefined") ? APP_BUILD : "";
    footerHtml = '<div class="ig-footer">' +
      '<div class="hanko-stamp"><span class="hanko-icon">&#127947;&#65039;</span><span class="hanko-text">K&N</span></div>' +
      '<div class="ig-footer-version">v' + ver + ' · ' + build + '</div>' +
    '</div>';
  }

  inner.innerHTML =
    '<div class="ig-header">' +
      '<div class="ig-page-label">' + page.label + ' · ' + (_igPage + 1) + ' of ' + total + '</div>' +
      '<button class="ig-close" onclick="closeInfoGuide()">✕</button>' +
    '</div>' +
    '<div class="ig-body">' +
      '<h2 class="ig-title">' + page.title + '</h2>' +
      '<p class="ig-subtitle">' + page.subtitle + '</p>' +
      cardsHtml +
      footerHtml +
    '</div>' +
    '<div class="ig-nav">' +
      dotsHtml +
      '<div class="ig-nav-btns">' +
        (_igPage > 0 ? '<button class="ig-nav-btn" id="igPrev">← Back</button>' : '<span></span>') +
        (_igPage < total - 1
          ? '<button class="ig-nav-btn ig-nav-primary" id="igNext">Next →</button>'
          : '<button class="ig-nav-btn ig-nav-primary" id="igDone">Done</button>') +
      '</div>' +
    '</div>';

  // Wire buttons
  var prev = document.getElementById("igPrev");
  var next = document.getElementById("igNext");
  var done = document.getElementById("igDone");
  if (prev) prev.onclick = function() { _igPage--; _renderIGPage(); };
  if (next) next.onclick = function() { _igPage++; _renderIGPage(); };
  if (done) done.onclick = closeInfoGuide;

  // Wire dots
  inner.querySelectorAll(".ig-dot").forEach(function(dot) {
    dot.onclick = function() {
      _igPage = parseInt(dot.dataset.idx, 10);
      _renderIGPage();
    };
  });

  // Swipe handler
  var _sx = 0;
  inner.ontouchstart = function(e) { _sx = e.touches[0].clientX; };
  inner.ontouchend = function(e) {
    var dx = e.changedTouches[0].clientX - _sx;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && _igPage < total - 1) { _igPage++; _renderIGPage(); }
      if (dx > 0 && _igPage > 0) { _igPage--; _renderIGPage(); }
    }
  };
}
