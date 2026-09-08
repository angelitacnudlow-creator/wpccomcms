import { test, expect } from "@playwright/test";

// Each run gets a unique suffix so re-running the suite against the same
// dev database never collides on a slug/SKU unique constraint.
const runId = Date.now();

test("publish a post and see it live", async ({ page }) => {
  await page.goto("/admin/posts/new");

  await page.getByLabel("Title", { exact: true }).fill(`Smoke Test Post ${runId}`);

  await page.getByRole("button", { name: "Add block" }).click();
  await page.getByRole("menuitem", { name: "Paragraph" }).click();
  await page.getByPlaceholder("Paragraph text").fill("Content written by the Playwright smoke suite.");

  await page.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: "Published" }).click();

  await page.getByRole("button", { name: "Create post" }).click();
  await expect(page).toHaveURL(/\/admin\/posts$/);

  const slug = `smoke-test-post-${runId}`;
  await page.goto(`/blog/${slug}`);
  await expect(page.getByRole("heading", { name: `Smoke Test Post ${runId}` })).toBeVisible();
  await expect(page.getByText("Content written by the Playwright smoke suite.")).toBeVisible();
});

test("submit a comment and see it pending", async ({ page }) => {
  // Reuses the post from the previous test — Playwright runs files serially
  // here (workers: 1), so it already exists.
  const slug = `smoke-test-post-${runId}`;
  await page.goto(`/blog/${slug}`);

  const commentBody = `Smoke test comment ${runId}`;
  await page.getByPlaceholder("Write a comment…").fill(commentBody);
  await page.getByRole("button", { name: "Post comment" }).click();

  await expect(page.getByText(commentBody)).toBeVisible();
  await expect(page.getByText("(awaiting approval)")).toBeVisible();
});

test("add a product to cart, checkout with COD, and see the order", async ({ page }) => {
  // The test account's cart persists across runs (one cart per user, by
  // design — see MASTER_PROMPT.md §7). A prior failed run can leave stray
  // items in it, which would silently inflate this test's expected total.
  // Clear it first so this test's assertions are about *this* run's item.
  await page.goto("/cart");
  while (await page.getByRole("button", { name: "Remove" }).count()) {
    await page.getByRole("button", { name: "Remove" }).first().click();
    await page.waitForTimeout(300);
  }

  // Create a throwaway product so this test doesn't depend on catalog state.
  await page.goto("/admin/products/new");
  await page.getByLabel("Name", { exact: true }).fill(`Smoke Test Widget ${runId}`);
  await page.getByLabel("Base price (৳)").fill("100");

  await page.getByRole("button", { name: "Add block" }).click();
  await page.getByRole("menuitem", { name: "Paragraph" }).click();
  await page.getByPlaceholder("Paragraph text").fill("A widget for testing checkout.");

  // "Base price (৳)" contains "Price (৳)" as a substring, so this needs
  // exact:true to land on the variant's price field, not the base price.
  await page.getByLabel("SKU").fill(`SMOKE-${runId}`);
  await page.getByLabel("Price (৳)", { exact: true }).fill("100");
  await page.getByLabel("Stock").fill("5");

  await page.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: "Published" }).click();

  await page.getByRole("button", { name: "Create product" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);

  const slug = `smoke-test-widget-${runId}`;
  await page.goto(`/shop/${slug}`);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText("Added to cart")).toBeVisible();

  await page.goto("/checkout");
  await page.getByLabel("Full name").fill("Smoke Test");
  await page.getByLabel("Phone").fill("01700000000");
  await page.getByLabel("Address", { exact: true }).fill("1 Test Street");
  await page.getByLabel("City").fill("Dhaka");
  await page.getByRole("button", { name: /Place order/ }).click();

  await expect(page.getByRole("heading", { name: "Thanks for your order!" })).toBeVisible();

  await page.goto("/account");
  await expect(page.getByText("৳100.00").first()).toBeVisible();
});
