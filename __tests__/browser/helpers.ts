import { expect, type Locator, type Page } from "@playwright/test";

export const mediaOrigin = "https://media.maxremy.dev";

export async function revealBelowStickyHeader(target: Locator): Promise<void> {
	const margin = 8;
	let settledHeaderBottom = Number.NaN;

	await expect
		.poll(async () => {
			const { isClear, headerBottom } = await target.evaluate((element, gap) => {
				const shell = document.querySelector("[data-page-header-shell]");
				if (!shell) throw new Error("The page header shell must be rendered.");

				const box = element.getBoundingClientRect();
				const bottom = shell.getBoundingClientRect().bottom;
				const isClear = box.top >= bottom + gap && box.bottom <= innerHeight - gap;
				if (!isClear) scrollBy({ top: box.top - bottom - (innerHeight - bottom - box.height) / 2, behavior: "instant" });

				return { isClear, headerBottom: bottom };
			}, margin);

			const isSettled = isClear && headerBottom === settledHeaderBottom;
			settledHeaderBottom = headerBottom;

			return isSettled;
		}, { timeout: 15_000 })
		.toBe(true);
}

export async function expectOverlayStack(page: Page, panelSelector: string): Promise<void> {
	expect(
		await page.evaluate((selector) => {
			const header = document.querySelector<HTMLElement>("[data-page-header-shell]");
			const panel = document.querySelector<HTMLElement>(selector);
			if (!header || !panel) throw new Error("The header and overlay panel must be rendered.");

			return { header: getComputedStyle(header).zIndex, panel: getComputedStyle(panel).zIndex };
		}, panelSelector),
	).toEqual({ header: "40", panel: "30" });
}

export async function scrollProofWorkPlayerOutOfView(page: Page): Promise<void> {
	await page.evaluate(() => new Promise<void>((resolve) => {
		const player = document.querySelector("[data-proof-work-player]");
		if (!player) throw new Error("The Proof Work player must be rendered.");

		const observer = new IntersectionObserver(([entry]) => {
			if ((entry?.intersectionRatio ?? 0) >= 0.25) return;
			observer.disconnect();
			requestAnimationFrame(() => resolve());
		}, { threshold: 0.25 });

		observer.observe(player);
		scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
	}));
}

export function proofWorkPlayer(page: Page) {
	const player = page.locator("[data-proof-work-player]");
	const isPaused = () => player.evaluate((element) => (element as HTMLVideoElement).paused);

	return {
		player,
		isPaused,
		currentSource: () => player.evaluate((element) => (element as HTMLVideoElement).currentSrc),
		settle: async () => {
			await player.evaluate((element) => element.scrollIntoView({ block: "center" }));
			await expect.poll(isPaused, { timeout: 20_000 }).toBe(false);
		},
	};
}
