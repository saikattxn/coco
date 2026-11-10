import { expect, test } from "@playwright/test";
import { expectAccessible, futureTuesday, login, rejectCookies } from "./helpers";

test("unauthenticated visitors are sent to sign in", async ({ page }) => {
  await page.goto("/admin/reservations");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("wrong passwords are rejected", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel("Password").fill("definitely-wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
});

test("dashboard overview is accessible", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Good");
  await expectAccessible(page);
});

test("admin updates a menu item and the public menu changes", async ({ page }) => {
  await login(page);
  await page.goto("/admin/menu");
  await page.getByRole("link", { name: "Onion Bhaji" }).click();
  await page.getByLabel("Price (£)").fill("5.95");
  await page.getByRole("textbox", { name: /^Description/ }).fill("Crisp shredded onion fritters in spiced gram flour batter.");
  await page.getByRole("button", { name: "Save dish" }).click();
  await expect(page.getByText("Dish saved.")).toBeVisible();
  await page.goto("/menu");
  await rejectCookies(page);
  const row = page.locator("li", { has: page.getByRole("heading", { name: "Onion Bhaji" }) });
  await expect(row).toContainText("£5.95");
  await expect(row).toContainText("Crisp shredded onion fritters");
});

test("admin creates a promotion that appears on the offers page", async ({ page }) => {
  await login(page);
  await page.goto("/admin/offers/new");
  await page.getByLabel("Title").fill("e2e Midweek supper");
  await page.getByLabel("Type").selectOption("MIDWEEK");
  await page.getByLabel("Description", { exact: true }).fill("Two courses and a drink, Monday to Wednesday evenings.");
  await page.getByLabel("Terms and conditions").fill("Dine-in only. Not with other offers.");
  await page.getByRole("button", { name: "Create offer" }).click();
  await expect(page.getByText("Offer created.")).toBeVisible();
  await page.goto("/offers");
  await expect(page.getByRole("heading", { name: "e2e Midweek supper" })).toBeVisible();
});

test("customer submits an event enquiry and staff see it", async ({ page }) => {
  await page.goto("/celebrations");
  await rejectCookies(page);
  await page.getByLabel("Occasion", { exact: true }).selectOption("ANNIVERSARY");
  await page.getByLabel("Number of guests").fill("18");
  await page.getByLabel("Date", { exact: true }).fill(futureTuesday(30));
  await page.getByLabel("Your name").fill("Meera Joshi");
  await page.getByLabel("Phone", { exact: true }).fill("07700 900789");
  await page.getByLabel("Email", { exact: true }).fill("meera@example.com");
  await page.getByLabel("Anything else we should know?").fill("25th anniversary — a cake would be lovely.");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("heading", { name: "Enquiry sent" })).toBeVisible();

  await login(page);
  await page.goto("/admin/enquiries");
  await expect(page.getByText("Meera Joshi")).toBeVisible();
  await expect(page.getByText("18 guests")).toBeVisible();
});

test("roles restrict access: content editors can't see reservations", async ({ page }) => {
  await login(page, "content@cocotamarind.local");
  await expect(page.getByRole("link", { name: "Reservations" })).toHaveCount(0);
  await page.goto("/admin/reservations");
  await expect(page).toHaveURL(/\/admin\/forbidden/);
  const res = await page.request.get(`/api/v1/admin/reservations?date=${futureTuesday()}`);
  expect(res.status()).toBe(403);
});

test("reservation staff can't manage staff or the menu", async ({ page }) => {
  await login(page, "reservations@cocotamarind.local");
  await page.goto("/admin/staff");
  await expect(page).toHaveURL(/forbidden/);
  await page.goto("/admin/menu");
  await expect(page).toHaveURL(/forbidden/);
});

test("cron endpoints require the secret", async ({ request }) => {
  expect((await request.get("/api/v1/cron/notifications")).status()).toBe(401);
  expect((await request.get("/api/v1/cron/notifications", { headers: { authorization: "Bearer e2e-cron-secret" } })).status()).toBe(200);
});

test("admin API blocks cross-site writes", async ({ page }) => {
  await login(page);
  const res = await page.request.post("/api/v1/admin/reservations", { data: {}, headers: { origin: "https://evil.example" } });
  expect(res.status()).toBe(403);
});
