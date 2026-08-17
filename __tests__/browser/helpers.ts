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

export async function scrollProofWorkPlayerOutOfView(page: Page): Promise<void> {
	await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
	await page.waitForTimeout(600);
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
