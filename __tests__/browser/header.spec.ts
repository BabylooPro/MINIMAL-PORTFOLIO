import { expect, test } from "@playwright/test";

test("keeps the professional role static on mobile", async ({ page }) => {
	await page.clock.install();
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/en/");

	const header = page.locator("[data-page-header]");
	const role = header.getByText("Software Engineer", { exact: true });

	await expect(role).toBeVisible();
	await page.clock.fastForward(10_000);
	await expect(role).toBeVisible();
	expect(await header.innerText()).not.toContain("Mountain Athlete");
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

	await page.setViewportSize({ width: 390, height: 844 });
	await page.evaluate(() => window.scrollTo(0, 100));
	await expect(page.locator("[data-header-scroll-hidden]")).toHaveAttribute("data-collapsed", "");
});
