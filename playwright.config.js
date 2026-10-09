// @ts-check
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  reporter: [["list"]],
  // Default is cores/2 (1 on a 2-core box); page loads dominate, so 2 is safe.
  workers: 2,
  use: {
    headless: true,
    viewport: { width: 390, height: 844 } // iPhone-ish; the app is mobile-first
  },
  projects: [
    // Original smoke suite (onboarding), unchanged: Chromium, 390x844.
    {
      name: "chromium",
      testIgnore: /personas\.spec\.js/,
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
    }
  ]
});
