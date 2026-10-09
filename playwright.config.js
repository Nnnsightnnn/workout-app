// @ts-check
const { defineConfig } = require("@playwright/test");

// iPhone-like WebKit configs for e2e/ui-invariants.spec.js: three viewports ×
// cream (default) and dark ("nearblack" background preference) themes.
const UI_VIEWPORTS = [
  { width: 320, height: 568 }, // iPhone SE (1st gen)
  { width: 375, height: 667 }, // iPhone SE (2nd/3rd gen), 8
  { width: 390, height: 844 }  // iPhone 12-15
];
const UI_THEMES = [
  { theme: "cream", dark: false },
  { theme: "dark", dark: true }
];

module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  // Page loads and transition waits dominate, not CPU, so use every core.
  workers: "100%",
  reporter: [["list"]],
  use: {
    headless: true,
    viewport: { width: 390, height: 844 } // iPhone-ish; the app is mobile-first
  },
  projects: [
    // Original smoke suite (onboarding): Chromium, 390x844.
    {
      name: "chromium",
      testIgnore: /(personas|ui-invariants)\.spec\.js/,
      use: { browserName: "chromium" }
    },
    // Persona suite: WebKit with an iPhone-like context (Safari engine,
    // touch, mobile viewport) — where real users like Nick run the app.
    {
      name: "webkit",
      testMatch: /personas\.spec\.js/,
      use: {
        browserName: "webkit",
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true
      }
    },
    // UI invariants: npx playwright test --project='webkit-ui-*'
    ...UI_THEMES.flatMap(t => UI_VIEWPORTS.map(vp => ({
      name: `webkit-ui-${t.theme}-${vp.width}x${vp.height}`,
      testMatch: /ui-invariants\.spec\.js/,
      use: {
        browserName: /** @type {"webkit"} */ ("webkit"),
        uiConfig: { theme: t.theme, dark: t.dark, width: vp.width, height: vp.height }
      }
    })))
  ]
});
