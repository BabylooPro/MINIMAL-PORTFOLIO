import { expect, test } from "@playwright/test";

const locales = ["en", "fr", "de"] as const;

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

test("keeps the mobile role stable when reduced motion is requested", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/en/");

	const visibleRole = page.locator("[data-mobile-role]:not([hidden])");
	const initialRole = await visibleRole.textContent();

	if (!initialRole) {
		throw new Error("The mobile role rotator needs a visible initial role.");
	}

	await page.waitForTimeout(5_100);
	await expect(page.locator("[data-mobile-role]:not([hidden])")).toHaveText(initialRole);
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

test("keeps localized legal links and language switching on every locale", async ({ page }) => {
	for (const locale of locales) {
		await page.goto(`/${locale}/privacy/`);

		await expect(page.locator("html")).toHaveAttribute("lang", locale);
		await expect(page.locator(`[data-page-footer] a[href="/${locale}/legal/"]`)).toBeVisible();

		for (const targetLocale of locales) {
			await expect(page.locator(`a[hreflang="${targetLocale}"]`)).toHaveAttribute(
				"href",
				`/${targetLocale}/privacy/`,
			);
		}

		const alternateLocale = locales.find((targetLocale) => targetLocale !== locale);

		if (!alternateLocale) {
			throw new Error("Each localized page needs an alternate language.");
		}

		await page.locator(`a[hreflang="${alternateLocale}"]`).click();
		await expect(page).toHaveURL(`/${alternateLocale}/privacy/`);

		await page.goto(`/${locale}/legal/`);
		await expect(
			page.locator(`[data-page-footer] a[href="/${locale}/privacy/"]`),
		).toBeVisible();
	}
});
