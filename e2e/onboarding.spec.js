// @ts-check
// Real-browser smoke test for the onboarding flow. Catches CSS/animation/render
// issues that the jsdom-based test-v3.js can't see (e.g. an overlay rendering
// at z-index 0, animations that don't fire, fonts that fail to inline).
//
// Strategy: open the built workout-app.html via file://, drive a single
// happy-path persona through onboarding, assert the handoff renders + the
// inline user-creation flow lands on the workout screen.
//
// Run: npm run test:smoke

const { test, expect } = require("@playwright/test");
const path = require("path");

const APP_URL = "file://" + path.join(__dirname, "..", "workout-app.html");

test.describe("onboarding smoke", () => {
  test("happy-path persona reaches the workout screen", async ({ page }) => {
    const consoleErrors = [];
    page.on("pageerror", e => consoleErrors.push(e.message));
    page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    await page.goto(APP_URL);

    // Onboarding overlay should be visible on first load (no users in localStorage).
    const overlay = page.locator("#onboardingOverlay");
    await expect(overlay).toHaveClass(/active/);

    // Step 1: goals — multi-select, then continue
    await expect(page.locator(".ob-title")).toContainText("training goals");
    await page.locator('.ob-option[data-value="strength"]').click();
    await page.locator("#obContinueBtn").click();

    // Step 2: physiquePriority — skippable
    await expect(page.locator(".ob-title")).toContainText("physique");
    await page.locator("#obSkipBtn").click();

    // Step 3: bodyGoal — single-select advances automatically
    await expect(page.locator(".ob-title")).toContainText("body composition");
    await page.locator('.ob-option[data-value="muscle"]').click();

    // Step 4: experience
    await expect(page.locator(".ob-title")).toContainText("training");
    await page.locator('.ob-option[data-value="beginner"]').click();

    // Step 5: days
    await expect(page.locator(".ob-title")).toContainText("days per week");
    await page.locator('.ob-option[data-value="3"]').click();

    // Step 6: selectedDays — skippable
    await page.locator("#obSkipBtn").click();

    // Step 7: duration
    await expect(page.locator(".ob-title")).toContainText("How long");
    await page.locator('.ob-option[data-value="60"]').click();

    // Step 8: gender
    await page.locator('.ob-option[data-value="male"]').click();

    // Step 9: equipment
    await page.locator('.ob-option[data-value="full"]').click();

    // Step 10: equipmentDetail — accept defaults
    await expect(page.locator(".ob-title")).toContainText("equipment");
    await page.locator("#obContinueBtn").click();

    // Step 11: age — skippable
    await page.locator("#obSkipBtn").click();

    // Step 12: bodyWeight — skippable
    await page.locator("#obSkipBtn").click();

    // Step 13 (final required for first-run): smartSuggestions
    // Note: rpeCalibration and injuries are conditional (only shown on redo or
    // when smartSuggestions=yes), so picking "no" jumps straight to the handoff.
    await expect(page.locator(".ob-title")).toContainText("smart weight");
    await page.locator('.ob-option[data-value="no"]').click();

    // Handoff: program is recommended, name input visible
    await expect(page.locator(".ob-program-name")).toBeVisible();
    await expect(page.locator(".ob-program-name")).toContainText("Novice Linear Progression");
    await page.locator("#obNameInput").fill("Smoke Test User");
    await page.locator("#obStartBtn").click();

    // After handoff: overlay closes, workout screen visible, user chip shows the name
    await expect(overlay).not.toHaveClass(/active/);
    await expect(page.locator("#userChipName")).toHaveText("Smoke Test User");

    // No JS errors during the run
    expect(consoleErrors).toEqual([]);
  });

  test("dismiss button closes overlay without creating user", async ({ page }) => {
    await page.goto(APP_URL);
    const overlay = page.locator("#onboardingOverlay");
    await expect(overlay).toHaveClass(/active/);

    await page.locator("#obDismissBtn").click();

    await expect(overlay).not.toHaveClass(/active/);
    // No user created; chip still shows "Set up"
    await expect(page.locator("#userChipName")).toHaveText("Set up");
  });
});
