import { expect, test } from "@playwright/test";
import { expectOverlayStack, revealBelowStickyHeader } from "./helpers";

test("uses a single standard desktop trigger for language tooltips", async ({ page }) => {
	await page.setViewportSize({ width: 1_280, height: 800 });
	await page.goto("/en/");

	const trigger = page.locator('[data-tooltip-trigger][aria-describedby="language-0-listening"]');
	const tooltip = page.locator("#language-0-listening");

	await expect(trigger).toHaveAccessibleName("French - Native (C2), Listening");
	await expect(page.locator('[data-tooltip-trigger][aria-describedby="footer-version"]')).toHaveAccessibleName(/^© \d{4} Max Remy Dev, Project version$/);
	await expect(trigger).not.toHaveAttribute("aria-expanded", /.+/);
	await expect(tooltip).toHaveAttribute("role", "tooltip");
	await expect(tooltip.locator("a, button, input, select, textarea")).toHaveCount(0);
	await expect(page.locator("[data-tooltip] summary")).toHaveCount(0);

	await revealBelowStickyHeader(trigger);
	await page.clock.install();
	await trigger.hover();
	await expect(tooltip).toHaveCSS("opacity", "0");
	await page.clock.fastForward(300);
	await expect(tooltip).toHaveCSS("opacity", "1");
	await tooltip.hover();
	await page.clock.fastForward(200);
	await expect(tooltip).toHaveCSS("opacity", "1");

	await page.keyboard.press("Escape");
	await expect(tooltip).toHaveCSS("opacity", "0");
	await page.mouse.move(0, 0);
	await trigger.evaluate((element) => (element as HTMLButtonElement).focus());
	await expect(tooltip).toHaveCSS("opacity", "1");
});

test("opens language tooltips as toggletips on tablet touch input", async ({ browser }) => {
	const context = await browser.newContext({
		hasTouch: true,
		isMobile: true,
		viewport: { width: 820, height: 1_180 },
	});
	const page = await context.newPage();

	await page.goto("/en/");
	const trigger = page.locator('[data-tooltip-trigger][aria-controls="language-0-listening"]');
	const tooltip = page.locator("#language-0-listening");
	await expect(trigger).toBeVisible();
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await expect(tooltip).toHaveAttribute("role", "status");
	await expect(tooltip).toHaveAttribute("aria-live", "polite");
	await expect(tooltip).toHaveAttribute("aria-hidden", "true");

	await trigger.click();
	await expect(trigger).toHaveAttribute("aria-expanded", "true");
	await expect(tooltip).toHaveAttribute("aria-hidden", "false");
	await expect(tooltip).toHaveCSS("opacity", "1");
	await page.mouse.click(5, 5);
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await expect(tooltip).toHaveAttribute("aria-hidden", "true");

	await context.close();
});

test("keeps language tooltips inside every touch viewport", async ({ browser }) => {
	for (const { locale, viewport } of [
		{ locale: "en", viewport: { width: 390, height: 844 } },
		{ locale: "fr", viewport: { width: 1_125, height: 844 } },
	]) {
		const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport });
		const page = await context.newPage();

		await page.goto(`/${locale}/`);

		const trigger = page.locator('[data-tooltip-trigger][aria-controls="language-0-writing"]');
		await revealBelowStickyHeader(trigger);
		await trigger.click();

		const tooltip = page.locator("#language-0-writing");
		await expect(trigger).toHaveAttribute("aria-expanded", "true");
		await expect(tooltip).toHaveCSS("opacity", "1");

		await expectOverlayStack(page, "#language-0-writing");

		const bounds = await tooltip.evaluate((element) => {
			const { left, right } = element.getBoundingClientRect();
			return { left, right, viewportWidth: window.innerWidth };
		});

		expect(bounds.left).toBeGreaterThanOrEqual(16);
		expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth - 16);

		await page.keyboard.press("Escape");
		await expect(trigger).toHaveAttribute("aria-expanded", "false");

		await context.close();
	}
});

test("opens overlays by tap on a device that reports desktop pointer capabilities", async ({ browser }) => {
	const context = await browser.newContext({ viewport: { width: 1_280, height: 800 }, hasTouch: true });
	await context.addInitScript(() => {
		const native = window.matchMedia.bind(window);
		window.matchMedia = (query) => {
			const real = native(query);
			if (!query.includes("hover: hover")) return real;

			return {
				media: query,
				matches: true,
				onchange: null,
				addEventListener: (...args: Parameters<MediaQueryList["addEventListener"]>) => real.addEventListener(...args),
				removeEventListener: (...args: Parameters<MediaQueryList["removeEventListener"]>) => real.removeEventListener(...args),
				addListener: (...args: Parameters<MediaQueryList["addListener"]>) => real.addListener(...args),
				removeListener: (...args: Parameters<MediaQueryList["removeListener"]>) => real.removeListener(...args),
				dispatchEvent: (...args: Parameters<MediaQueryList["dispatchEvent"]>) => real.dispatchEvent(...args),
			} as MediaQueryList;
		};
	});

	const page = await context.newPage();
	await page.goto("/en/");


	await page.locator("[data-header-scroll-hidden][data-ready]").waitFor();

	expect(await page.evaluate(() => matchMedia("(min-width: 40rem) and (hover: hover) and (pointer: fine)").matches)).toBe(true);

	async function tap(locator: ReturnType<typeof page.locator>): Promise<void> {
		await revealBelowStickyHeader(locator);

		const box = await locator.boundingBox();
		if (!box) throw new Error("The tap target must be laid out.");

		await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
	}

	const tooltipTrigger = page.locator("[data-tooltip-trigger]").first();
	const tooltipPanel = page.locator("[data-tooltip-panel]").first();

	await tap(tooltipTrigger);
	await expect(tooltipPanel).toHaveAttribute("data-open", "true");

	await tap(tooltipTrigger);
	await expect(tooltipPanel).not.toHaveAttribute("data-open", "true");

	await tap(page.locator("[data-popover-trigger]").first());
	await expect(page.locator("[data-popover-panel]").first()).toBeVisible();

	await page.keyboard.press("Escape");
	await tooltipTrigger.scrollIntoViewIfNeeded();
	await page.mouse.move(5, 5);
	await tooltipTrigger.hover();
	await expect(tooltipPanel).toHaveAttribute("data-open", "true");

	await context.close();
});
