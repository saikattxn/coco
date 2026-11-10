import { expect, test, type Page } from "@playwright/test";
import { expectAccessible, futureTuesday, login, rejectCookies } from "./helpers";

async function book(page: Page, opts: { name: string; email: string; party: number; date: string }) {
  await page.goto("/book");
  await rejectCookies(page);
  await page.getByLabel("Number of guests").selectOption(String(opts.party));
  await page.getByLabel("Date", { exact: true }).fill(opts.date);
  const firstTime = page.getByRole("radiogroup", { name: "Available times" }).locator("input:not([disabled])").first();
  await expect(firstTime).toBeAttached();
  await firstTime.check({ force: true });
  await page.getByLabel("Full name").fill(opts.name);
  await page.getByLabel("Phone number").fill("07700 900456");
  await page.getByLabel("Email", { exact: true }).fill(opts.email);
  await page.getByLabel("Special requests").fill("Window table if possible");
  await page.getByRole("button", { name: /^Book for/ }).click();
}

test("customer books a table and can manage it", async ({ page }) => {
  await book(page, { name: "Asha Patel", email: "asha@example.com", party: 2, date: futureTuesday() });
  await expect(page.getByRole("heading", { name: "Your table is booked" })).toBeVisible();
  const reference = await page.locator("dd").first().textContent();
  expect(reference).toMatch(/^CT-/);
  await page.getByRole("link", { name: "View or manage this booking" }).click();
  await expect(page.getByRole("heading", { name: "Your table is confirmed" })).toBeVisible();
  await expect(page.getByText(reference!).first()).toBeVisible();
  await expectAccessible(page);
});

test("validation errors are shown and announced", async ({ page }) => {
  await page.goto("/book");
  await rejectCookies(page);
  await page.getByLabel("Date", { exact: true }).fill(futureTuesday());
  await page.getByRole("radiogroup", { name: "Available times" }).locator("input:not([disabled])").first().check({ force: true });
  await page.getByLabel("Email", { exact: true }).fill("not-an-email");
  await page.getByRole("button", { name: /^Book for/ }).click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();
  await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveAttribute("aria-invalid", "true");
});

test("admin confirms a pending booking and the guest is emailed", async ({ page }) => {
  // 8 guests is above the auto-confirm limit (6), so it waits for staff
  await book(page, { name: "Rohan Large Party", email: "rohan@example.com", party: 8, date: futureTuesday(12) });
  await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible();
  const reference = (await page.locator("dd").first().textContent())!;

  await login(page);
  await page.goto(`/admin/reservations/${reference}`);
  await expect(page.getByText("Pending").first()).toBeVisible();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText("Booking marked confirmed.")).toBeVisible();

  // Emails are sent right after the response; reload until the confirmation shows as sent
  await expect(async () => {
    await page.reload();
    await expect(page.getByText(/Your table is confirmed.*→ rohan@example.com/).locator("..").getByText("Sent")).toBeVisible();
  }).toPass({ timeout: 20_000 });
});

test("staff create a phone booking and cannot double-book its table", async ({ page }) => {
  await login(page);
  await page.goto("/admin/reservations/new");
  const date = futureTuesday(16);
  await page.getByLabel("Date", { exact: true }).fill(date);
  await page.getByLabel("Guests").fill("2");
  await page.getByLabel(/^Time/).selectOption("19:00");
  await page.getByLabel("Table").selectOption((await page.getByLabel("Table").locator("option").filter({ hasText: /^M1 · / }).getAttribute("value"))!);
  await page.getByLabel("Name", { exact: true }).fill("Phone Guest");
  await page.getByLabel("Phone", { exact: true }).fill("01844 000000");
  await page.getByRole("button", { name: "Create booking" }).click();
  await expect(page.getByText("Booking created.")).toBeVisible();

  await page.goto("/admin/reservations/new");
  await page.getByLabel("Date", { exact: true }).fill(date);
  await page.getByLabel(/^Time/).selectOption("19:30");
  await page.getByLabel("Table").selectOption((await page.getByLabel("Table").locator("option").filter({ hasText: /^M1 · / }).getAttribute("value"))!);
  await page.getByLabel("Name", { exact: true }).fill("Clashing Guest");
  await page.getByLabel("Phone", { exact: true }).fill("01844 000001");
  await page.getByRole("button", { name: "Create booking" }).click();
  await expect(page.getByText(/not free|is too small/)).toBeVisible();
});
