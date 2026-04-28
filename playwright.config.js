// @ts-check
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  reporter: [["list"]],
  use: {
    headless: true,
    viewport: { width: 390, height: 844 } // iPhone-ish; the app is mobile-first
  }
});
