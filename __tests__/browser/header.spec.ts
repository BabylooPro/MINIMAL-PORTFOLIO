import { expect, test } from "@playwright/test";

test("keeps the mobile role stable when reduced motion is requested", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/en/");

	const visibleRole = page.locator("[data-mobile-role]:not([hidden])");
	const initialRole = await visibleRole.textContent();

	if (!initialRole) throw new Error("The mobile role rotator needs a visible initial role.");

	await page.waitForTimeout(5_100);
	await expect(page.locator("[data-mobile-role]:not([hidden])")).toHaveText(initialRole);

	const allRoles = page.locator("[data-mobile-role]");
	const roleCount = await allRoles.count();
	expect(roleCount).toBeGreaterThan(1);

	for (let index = 0; index < roleCount; index += 1) await expect(allRoles.nth(index)).toBeVisible();
});

test("persists the theme and applies desktop and mobile header states", async ({ page }) => {
	await page.goto("/en/");

	await page.getByRole("button", { name: "Dark" }).click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

	await page.reload();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

	await page.evaluate(() => window.scrollTo(0, 200));
	await expect(page.locator("[data-page-header]")).toHaveAttribute("data-fully-compact", "");

	await page.setViewportSize({ width: 390, height: 844 });
	await page.evaluate(() => window.scrollTo(0, 100));
	await expect(page.locator("[data-header-scroll-hidden]")).toHaveAttribute("data-collapsed", "");
});
