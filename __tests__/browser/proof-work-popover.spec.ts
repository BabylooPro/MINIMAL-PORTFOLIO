import { expect, test } from "@playwright/test";
import { revealBelowStickyHeader } from "./helpers";

test("keeps the mobile Proof Work popover above the sticky header and restores focus", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 350 });
	await page.goto("/en/");

	const trigger = page.locator("[data-popover-trigger]");
	await revealBelowStickyHeader(trigger);
	await trigger.click();

	const popover = page.locator("#proof-work");
	const closeButton = popover.getByRole("button", { name: "Close" });

	await expect(trigger).toHaveAttribute("aria-expanded", "true");
	await expect(popover).toBeVisible();
	await expect(popover).toHaveAttribute("role", "dialog");
	await expect(popover).toHaveAttribute("aria-label", "About Proof of Work");
	await expect(popover).toHaveCSS("border-left-width", "1px");
	await expect(popover).toHaveCSS("border-right-width", "1px");
	await expect(page.locator("[data-popover-backdrop]")).toBeVisible();

	expect(
		await page.evaluate(() => {
			const backdrop = document.querySelector<HTMLElement>("[data-popover-backdrop]");
			const activeCard = document.querySelector<HTMLElement>("[data-proof-work-active-card]");
			if (!backdrop || !activeCard) throw new Error("The Proof Work backdrop and active card must be rendered.");

			return { blurLayer: getComputedStyle(backdrop).zIndex, activeCard: getComputedStyle(activeCard).zIndex };
		}),
	).toEqual({ blurLayer: "20", activeCard: "10" });

	expect(
		await page.evaluate(() => {
			const header = document.querySelector<HTMLElement>("[data-page-header-shell]");
			const panel = document.querySelector<HTMLElement>("#proof-work");
			if (!header || !panel) throw new Error("The header and Proof Work popover must be rendered.");

			const headerBox = header.getBoundingClientRect();
			const panelBox = panel.getBoundingClientRect();
			const left = Math.max(headerBox.left, panelBox.left);
			const right = Math.min(headerBox.right, panelBox.right);
			const top = Math.max(headerBox.top, panelBox.top);
			const bottom = Math.min(headerBox.bottom, panelBox.bottom);

			if (right <= left || bottom <= top) throw new Error("The mobile popover must overlap the sticky header in this test.");

			const topmostElement = document.elementFromPoint(left + (right - left) / 2, top + (bottom - top) / 2);
			return Boolean(topmostElement && panel.contains(topmostElement));
		}),
	).toBe(true);

	expect(await popover.evaluate((panel) => ({ panel: getComputedStyle(panel).zIndex, trigger: getComputedStyle(panel.parentElement as HTMLElement).zIndex }))).toEqual({ panel: "50", trigger: "auto" });

	await closeButton.focus();
	await expect(closeButton).toBeFocused();
	await popover.locator("a").focus();
	await expect(popover.locator("a")).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(popover).toBeHidden();
	await expect(trigger).toBeFocused();
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("blurs only the header details behind the touch Proof Work popover backdrop", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/en/");

	const trigger = page.locator("[data-popover-trigger]");
	const headerBackdrop = page.locator("[data-header-details-backdrop]");

	await expect(headerBackdrop).toBeHidden();

	await revealBelowStickyHeader(trigger);
	await trigger.click();
	await expect(page.locator("#proof-work")).toBeVisible();

	await expect(headerBackdrop).toBeVisible();
	await expect(headerBackdrop).toHaveCSS("backdrop-filter", "blur(8px)");
	await expect(page.locator("[data-popover-backdrop]")).toHaveCSS("backdrop-filter", "blur(8px)");
	await expect(page.locator("[data-header-scroll-content]")).toHaveCSS("filter", "none");

	expect(
		await page.evaluate(() => {
			const backdrop = document.querySelector<HTMLElement>("[data-header-details-backdrop]");
			const details = document.querySelector<HTMLElement>("[data-header-scroll-content]");
			const header = document.querySelector<HTMLElement>("[data-page-header]");
			const identity = document.querySelector<HTMLElement>("[data-header-identity]");
			if (!backdrop || !details || !header || !identity) throw new Error("The header details backdrop, details, shell and identity must be rendered.");

			const backdropBox = backdrop.getBoundingClientRect();
			const detailsBox = details.getBoundingClientRect();

			return {
				startsAtDetails: backdropBox.top === detailsBox.top,
				coversDetails: backdropBox.bottom >= detailsBox.bottom,
				bleedsSideways: backdropBox.left < detailsBox.left && backdropBox.right > detailsBox.right,
				keepsIdentitySharp: backdropBox.top >= identity.getBoundingClientRect().bottom,
				staysInsideHeader: backdropBox.bottom <= header.getBoundingClientRect().bottom,
			};
		}),
	).toEqual({ startsAtDetails: true, coversDetails: true, bleedsSideways: true, keepsIdentitySharp: true, staysInsideHeader: true });

	await page.keyboard.press("Escape");
	await expect(headerBackdrop).toBeHidden();
});

test("keeps the header details sharp behind the desktop Proof Work popover", async ({ page }) => {
	await page.setViewportSize({ width: 1_280, height: 800 });
	await page.goto("/en/");

	await page.locator("[data-popover-trigger]").hover();
	await page.waitForTimeout(750);

	await expect(page.locator("#proof-work")).toBeVisible();
	await expect(page.locator("[data-header-details-backdrop]")).toBeHidden();
});

test("localizes the Proof Work popover close action", async ({ page }) => {
	for (const [locale, closeLabel] of [["en", "Close"], ["fr", "Fermer"], ["de", "Schliessen"]] as const) {
		await page.goto(`/${locale}/`);
		await expect(page.locator("[data-popover-close]")).toHaveAttribute("aria-label", closeLabel);
	}
});

test("keeps the desktop Proof Work popover hoverable below the sticky header", async ({ page }) => {
	await page.setViewportSize({ width: 1_280, height: 800 });
	await page.goto("/en/");

	const trigger = page.locator("[data-popover-trigger]");
	const popover = page.locator("#proof-work");

	await trigger.hover();
	await expect(popover).toBeHidden();
	await page.waitForTimeout(750);
	await expect(popover).toBeVisible();
	await popover.hover();
	await page.waitForTimeout(200);
	await expect(popover).toBeVisible();

	await page.mouse.move(0, 0);
	await page.waitForTimeout(200);
	await expect(popover).toBeHidden();

	await trigger.evaluate((element) => (element as HTMLButtonElement).focus());
	await expect(popover).toBeVisible();
	await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
	await expect(trigger).toHaveAttribute("aria-expanded", "true");
	await expect(popover.getByRole("button", { name: "Close" })).toBeHidden();

	expect(
		await page.evaluate(() => {
			const header = document.querySelector<HTMLElement>("[data-page-header-shell]");
			const panel = document.querySelector<HTMLElement>("#proof-work");
			if (!header || !panel) throw new Error("The header and Proof Work popover must be rendered.");

			return { header: getComputedStyle(header).zIndex, panel: getComputedStyle(panel).zIndex };
		}),
	).toEqual({ header: "40", panel: "30" });
});

test("keeps the touch Proof Work popover inside the content column", async ({ browser }) => {
	const context = await browser.newContext({
		hasTouch: true,
		isMobile: true,
		viewport: { width: 1_024, height: 768 },
	});
	const page = await context.newPage();

	await page.goto("/en/");

	const trigger = page.locator("[data-popover-trigger]");
	await revealBelowStickyHeader(trigger);
	await trigger.click();

	const popover = page.locator("#proof-work");
	await expect(popover).toBeVisible();
	await expect(popover.getByRole("button", { name: "Close" })).toBeVisible();

	await page.locator("[data-popover-backdrop]").click({ position: { x: 8, y: 700 } });
	await expect(popover).toBeHidden();
	await expect(trigger).toHaveAttribute("aria-expanded", "false");

	await trigger.focus();
	await trigger.click();
	await expect(popover).toBeVisible();

	const bounds = await popover.evaluate((element) => {
		const { left, right, width } = element.getBoundingClientRect();
		return { left, right, viewportWidth: window.innerWidth, width };
	});

	expect(bounds.width).toBeLessThanOrEqual(384);
	expect(bounds.left).toBeGreaterThanOrEqual(16);
	expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth - 16);

	await context.close();
});
