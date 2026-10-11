import { expect, test } from "@playwright/test";

test("keeps the mobile role stable when reduced motion is requested", async ({ page }) => {
	await page.clock.install();
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/en/");

	const visibleRole = page.locator("[data-mobile-role]:not([hidden])");
	const initialRole = await visibleRole.textContent();

	if (!initialRole) throw new Error("The mobile role rotator needs a visible initial role.");

	await page.clock.fastForward(5_100);
	await expect(visibleRole).toHaveText(initialRole);

	const allRoles = page.locator("[data-mobile-role]");
	const roleCount = await allRoles.count();
	expect(roleCount).toBeGreaterThan(1);

	for (let index = 0; index < roleCount; index += 1) await expect(allRoles.nth(index)).toBeVisible();
});

test("morphs the desktop identity in step with the scroll position", async ({ page }) => {
	await page.goto("/en/");
	await page.locator("[data-header-scroll-hidden][data-ready]").waitFor();

	const nameScale = () => page.locator("[data-header-morph='name']").evaluate((element) => Number(getComputedStyle(element).scale));
	const scrollToY = (top: number) => page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), top);

	await scrollToY(140);
	await expect.poll(nameScale).toBeLessThan(1);
	expect(await nameScale()).toBeGreaterThan(2 / 3);

	await scrollToY(200);
	await expect.poll(nameScale).toBeCloseTo(2 / 3);

	const misalignment = await page.evaluate(() => {
		function box(selector: string, isText: boolean) {
			const element = document.querySelector(selector);
			if (!element) throw new Error(`${selector} must be rendered.`);
			if (!isText) return element.getBoundingClientRect();

			const range = document.createRange();
			range.selectNodeContents(element);
			return range.getBoundingClientRect();
		}

		const pairs = [
			["[data-header-morph='avatar']", "[data-header-compact-identity] > div", false],
			["[data-header-morph='name']", "[data-header-compact-identity] p:first-of-type", true],
			["[data-header-morph='role']", "[data-header-compact-identity] p:last-of-type", true],
		] as const;

		return pairs.flatMap(([expanded, compact, isText]) => {
			const from = box(expanded, isText);
			const to = box(compact, isText);

			return [from.left - to.left, from.width - to.width, from.top + from.height / 2 - (to.top + to.height / 2)].map(Math.abs);
		});
	});

	expect(Math.max(...misalignment)).toBeLessThan(1);

	await scrollToY(0);
	await expect.poll(nameScale).toBe(1);
});

test("persists the theme and applies desktop and mobile header states", async ({ page }) => {
	await page.goto("/en/");

	await page.getByRole("button", { name: "Dark" }).click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

	await page.reload();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

	await page.evaluate(() => window.scrollTo(0, 200));
	await expect(page.locator("[data-page-header]")).toHaveAttribute("data-fully-compact", "");

	const details = page.locator("[data-header-scroll-hidden]");

	await page.setViewportSize({ width: 390, height: 844 });
	await page.evaluate(() => window.scrollTo({ top: 90, behavior: "instant" }));
	await expect.poll(() => details.evaluate((element) => getComputedStyle(element).opacity)).toBe("0.5");
	await expect(details).not.toHaveAttribute("inert");

	await page.evaluate(() => window.scrollTo({ top: 200, behavior: "instant" }));
	await expect(details).toHaveAttribute("inert", "");
});
