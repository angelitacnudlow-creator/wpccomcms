import { test as setup, expect } from "@playwright/test";

// Logs in once as the test admin account (created in Phase 1 via the
// Supabase Admin API — see MASTER_PROMPT.md) and saves the session so every
// other spec reuses it instead of logging in per-test.
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? "wpc.testadmin@gmail.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? "TestPassword123!";

setup("authenticate as test admin", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("link", { name: "My account" })).toBeVisible();
  await page.context().storageState({ path: "tests/.auth/admin.json" });
});
