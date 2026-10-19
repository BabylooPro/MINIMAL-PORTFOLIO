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

test("names the identity heading once at desktop and mobile widths", async ({ page }) => {
	for (const viewport of [{ width: 1_280, height: 800 }, { width: 390, height: 844 }]) {
		await page.setViewportSize(viewport);
		await page.goto("/en/");

		const heading = page.getByRole("heading", { level: 1 });

		await expect(heading).toHaveCount(1);
		await expect(heading).toBeVisible();
		await expect(heading).toHaveAccessibleName("Max Remy");
		await expect(page.locator("[data-page-header]").getByRole("link", { name: "Home", exact: true })).toBeVisible();
	}
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

test("keeps the desktop identity unscaled when reduced motion is requested", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/en/");
	await page.locator("[data-header-scroll-hidden][data-ready]").waitFor();

	const name = page.locator("[data-header-morph='name']");

	for (const top of [140, 160, 175, 185, 200]) {
		await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), top);
		await expect(name).toHaveCSS("scale", "none");

		await expect.poll(() => page.evaluate(() => {
			const frame = document.querySelector("[data-header-identity-transition]");
			const identity = document.querySelector("[data-header-identity]");
			const compact = document.querySelector("[data-header-compact-identity]");
			if (!frame || !identity || !compact) throw new Error("The header identities must be rendered.");

			const full = Number(getComputedStyle(identity).opacity);
			const small = Number(getComputedStyle(compact).opacity);
			const fitsFrame = frame.getBoundingClientRect().height >= identity.getBoundingClientRect().height - 0.5;

			return (full === 1 && small === 0 && fitsFrame) || (full === 0 && small === 1);
		}), `identity state at scrollY ${top}`).toBe(true);
	}
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
