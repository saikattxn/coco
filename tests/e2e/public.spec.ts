import { expect, test } from "@playwright/test";
import { expectAccessible, rejectCookies } from "./helpers";

test.describe("public website", () => {
  test("homepage communicates identity, location, booking and ordering", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Fine Indian dining");
    await expect(page.getByText("HP27 9LY").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Book a table|^Book$/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Order/ }).first()).toHaveAttribute("href", /order\.cocotamarindhp27\.co\.uk/);
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(jsonLd!)["@type"]).toBe("Restaurant");
    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport).not.toContain("user-scalable=no");
    await rejectCookies(page);
    await expectAccessible(page);
  });

  test("cookie banner blocks analytics until consent", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("dialog", { name: "Cookies on this site" })).toBeVisible();
    await page.getByRole("button", { name: "Reject non-essential" }).click();
    await expect(page.getByRole("dialog", { name: "Cookies on this site" })).toBeHidden();
    expect(await page.locator('script[src*="googletagmanager"]').count()).toBe(0);
    await page.reload();
    await expect(page.getByRole("dialog", { name: "Cookies on this site" })).toBeHidden();
  });

  test("customer views the menu and filters it", async ({ page }) => {
    await page.goto("/menu");
    await rejectCookies(page);
    await expect(page.getByRole("heading", { name: "Tandoori Specialities" })).toBeVisible();
    await expect(page.getByText("Lamb Chops", { exact: true })).toBeVisible();
    await expect(page.getByText("Allergen information to be confirmed").first()).toBeVisible();
    await page.getByLabel("Vegetarian").check();
    await expect(page.getByText("Lamb Chops", { exact: true })).toBeHidden();
    await expect(page.getByText("Saag Paneer", { exact: true })).toBeVisible();
    await expectAccessible(page);
  });

  test("key pages load with correct titles", async ({ page }) => {
    for (const [path, title] of [["/about", /Our story/], ["/celebrations", /Birthdays|Celebrations/], ["/contact", /Contact/], ["/offers", /Offers/], ["/gallery", /Gallery/], ["/order", /Order online/], ["/privacy", /Privacy/]] as const) {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
    }
  });

  test("old WordPress links redirect", async ({ page }) => {
    await page.goto("/reservation/");
    await expect(page).toHaveURL(/\/book$/);
  });

  test("robots and sitemap are served", async ({ request }) => {
    expect((await request.get("/sitemap.xml")).status()).toBe(200);
    expect(await (await request.get("/robots.txt")).text()).toContain("User-Agent");
  });
});
