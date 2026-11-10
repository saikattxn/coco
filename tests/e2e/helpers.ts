import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

export function futureTuesday(daysAhead = 9): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  while (d.getUTCDay() !== 2) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function login(page: Page, email = process.env.E2E_ADMIN_EMAIL!) {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/** Fails on serious or critical WCAG A/AA violations. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
}

/** Dismiss the cookie banner by rejecting non-essential cookies. */
export async function rejectCookies(page: Page) {
  const btn = page.getByRole("button", { name: "Reject non-essential" });
  if (await btn.isVisible().catch(() => false)) await btn.click();
}
