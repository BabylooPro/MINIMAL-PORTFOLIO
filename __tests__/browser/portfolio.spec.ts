import { expect, test } from "@playwright/test";

test("keeps the back-to-top link usable without JavaScript", async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();

	await page.goto("http://127.0.0.1:4174/en/");
	await expect(page.locator("[data-back-to-top]")).toBeVisible();
	await context.close();
});

test("updates the Proof Work carousel without autoplaying for reduced motion", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/en/");

	const player = page.locator("[data-proof-work-player]");

	await expect(player).toHaveAttribute("aria-label", "Timelapse 1");
	await expect(player.locator("source")).toHaveAttribute("src", "/videos/timelapse/1.mp4");

	await page.locator('[data-proof-work-direction="next"]').click();

	await expect(player).toHaveAttribute("aria-label", "Timelapse 2");
	await expect(player.locator("source")).toHaveAttribute("src", "/videos/timelapse/2.mp4");
	await expect(page.locator("[data-proof-work-counter]")).toHaveText("Video 2 of 6");

	expect(
		await player.evaluate((element) => {
			if (!(element instanceof HTMLVideoElement)) {
				throw new TypeError("Proof Work player must be a video element.");
			}

			return element.paused;
		}),
	).toBe(true);
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
