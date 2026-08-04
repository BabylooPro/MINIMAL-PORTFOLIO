import { expect, test } from "@playwright/test";
import { localeConfigs } from "@/src/lib/i18n/config";

const locales = ["en", "fr", "de"] as const;
const mediaOrigin = "https://media.maxremy.dev";

const localizedNotFoundPages = [
	{ locale: "en", title: "Page not found", backToPortfolio: "Back to portfolio" },
	{ locale: "fr", title: "Page introuvable", backToPortfolio: "Retour au portfolio" },
	{ locale: "de", title: "Seite nicht gefunden", backToPortfolio: "Zurück zum Portfolio" },
] as const;

test("keeps English at the root and redirects French browser language", async ({ browser }) => {
	const englishContext = await browser.newContext({ locale: "en-CH" });
	const englishPage = await englishContext.newPage();

	await englishPage.goto("http://127.0.0.1:4174/");
	await expect(englishPage).toHaveURL("http://127.0.0.1:4174/");
	await expect(englishPage.locator("main")).toContainText("Profile");
	await englishContext.close();

	const italianContext = await browser.newContext({ locale: "it-CH" });
	const italianPage = await italianContext.newPage();

	await italianPage.goto("http://127.0.0.1:4174/");
	await expect(italianPage).toHaveURL("http://127.0.0.1:4174/");
	await italianContext.close();

	const frenchContext = await browser.newContext({ locale: "fr-CH" });
	const frenchPage = await frenchContext.newPage();

	await frenchPage.goto("http://127.0.0.1:4174/");
	await expect(frenchPage).toHaveURL("http://127.0.0.1:4174/fr/");
	await frenchContext.close();
});

test("keeps the back-to-top link usable without JavaScript", async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();

	await page.goto("http://127.0.0.1:4174/en/");
	await expect(page.locator("[data-back-to-top]")).toBeVisible();
	await context.close();
});

test("keeps runtime resources on first-party origins", async ({ browser }) => {
	const context = await browser.newContext({ locale: "en-CH" });
	const page = await context.newPage();
	const siteOrigin = "http://127.0.0.1:4174";
	const requestedUrls = new Set<string>();

	page.on("request", (request) => requestedUrls.add(request.url()));

	for (const route of ["/", "/en/", "/fr/", "/de/"]) {
		await page.goto(`${siteOrigin}${route}`, { waitUntil: "domcontentloaded" });
		await expect(page.locator("main")).toBeVisible();
	}

	await page.goto(`${siteOrigin}/en/`, { waitUntil: "domcontentloaded" });
	const carousel = page.locator("[data-proof-work-carousel]");

	await carousel.scrollIntoViewIfNeeded();
	await page.locator('[data-proof-work-direction="next"]').click();
	await expect(page.locator("[data-proof-work-player] source")).toHaveAttribute("src", `${mediaOrigin}/videos/timelapse/2.mp4`);

	const carouselResourceOrigins = await carousel.evaluate((element) => {
		const urls = [...Array.from(element.querySelectorAll<HTMLImageElement>("img")).map((image) => image.src), ...Array.from(element.querySelectorAll<HTMLVideoElement>("video")).flatMap((video) => [video.poster, ...Array.from(video.querySelectorAll<HTMLSourceElement>("source")).map((source) => source.src)])];
		const serializedVideos = element.getAttribute("data-videos");
		if (!serializedVideos) throw new Error("Proof Work carousel must declare its video sources.");

		const videos: unknown = JSON.parse(serializedVideos);
		if (!Array.isArray(videos)) throw new Error("Proof Work carousel video data must be an array.");

		for (const video of videos) {
			if (!video || typeof video !== "object") throw new Error("Proof Work carousel video data must contain objects.");

			const { preview, source } = video as Record<string, unknown>;
			if (typeof preview !== "string" || typeof source !== "string") throw new Error("Proof Work carousel video data must contain source and preview URLs.");

			urls.push(new URL(preview, window.location.href).href, new URL(source, window.location.href).href);
		}

		return urls.filter(Boolean).map((url) => new URL(url).origin);
	});

	expect(carouselResourceOrigins).toEqual(expect.arrayContaining([siteOrigin, mediaOrigin]));
	expect(carouselResourceOrigins.every((origin) => [siteOrigin, mediaOrigin].includes(origin))).toBe(true);

	await expect(page.locator('[data-proof-work-preview="previous"]')).toHaveAttribute("loading", "lazy");
	await expect(page.locator('[data-proof-work-preview="next"]')).toHaveAttribute("loading", "lazy");

	expect([...requestedUrls].filter((url) => !url.startsWith("data:")).every((url) => [siteOrigin, mediaOrigin].includes(new URL(url).origin))).toBe(true);

	await context.close();
});

test("renders the static not-found page", async ({ page }) => {
	await page.emulateMedia({ colorScheme: "light" });
	await page.goto("/404.html");

	await expect(page).toHaveTitle("Page not found | Max Remy");
	await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
	await expect(page.locator("main")).toHaveClass(/justify-center/);

	const backToPortfolio = page.getByRole("link", { name: "Back to portfolio" });
	await expect(backToPortfolio).toHaveAttribute("href", "/en/");
	await expect(backToPortfolio).toHaveCSS("background-color", "rgb(255, 255, 255)");
	await expect(backToPortfolio).toHaveCSS("color", "rgb(0, 0, 0)");

	await backToPortfolio.hover();
	await expect(backToPortfolio).toHaveCSS("background-color", "rgb(0, 0, 0)");
	await expect(backToPortfolio).toHaveCSS("color", "rgb(255, 255, 255)");

	await page.locator("html").evaluate((element) => element.setAttribute("data-theme", "dark"));
	await page.mouse.move(0, 0);
	await expect(backToPortfolio).toHaveCSS("background-color", "rgb(0, 0, 0)");
	await expect(backToPortfolio).toHaveCSS("color", "rgb(255, 255, 255)");

	await backToPortfolio.hover();
	await expect(backToPortfolio).toHaveCSS("background-color", "rgb(255, 255, 255)");
	await expect(backToPortfolio).toHaveCSS("color", "rgb(0, 0, 0)");
});

test("renders a localized static not-found page for every locale", async ({ page }) => {
	for (const { locale, title, backToPortfolio } of localizedNotFoundPages) {
		await page.goto(`/${locale}/404.html`);

		await expect(page.locator("html")).toHaveAttribute("lang", localeConfigs[locale].htmlLang);
		await expect(page.getByRole("heading", { name: title })).toBeVisible();
		await expect(page.getByRole("link", { name: backToPortfolio })).toHaveAttribute("href", `/${locale}/`);
	}
});

test("updates the Proof Work carousel without autoplaying for reduced motion", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/en/");

	const player = page.locator("[data-proof-work-player]");
	const transitionPreview = page.locator("[data-proof-work-transition-preview]");
	const transitionLoader = page.locator("[data-proof-work-transition-loader]");

	await expect(player).not.toHaveAttribute("controls");
	await player.hover();
	await expect(player).toHaveJSProperty("controls", true);

	await expect(player).toHaveAttribute("aria-label", "Timelapse 1");
	await expect(player.locator("source")).toHaveAttribute("src", `${mediaOrigin}/videos/timelapse/1.mp4`);
	await expect(player).toHaveClass(/object-\[50%_67%\]/);
	await expect(player).toHaveCSS("color-scheme", "dark");
	await expect(transitionPreview).toHaveAttribute("src", /\/videos\/timelapse\/previews\/1\.jpg$/);
	await expect(transitionLoader).toBeHidden();
	await expect(transitionLoader.locator("span")).toHaveClass(/size-20/);

	await page.locator('[data-proof-work-direction="next"]').click();

	await expect(player).toHaveAttribute("aria-label", "Timelapse 2");
	await expect(player.locator("source")).toHaveAttribute("src", `${mediaOrigin}/videos/timelapse/2.mp4`);
	await expect(player).toHaveClass(/object-\[50%_72%\]/);
	await expect(player).toHaveAttribute("data-loading", "true");
	await expect(transitionPreview).toHaveAttribute("src", /\/videos\/timelapse\/previews\/2\.jpg$/);
	await expect(page.locator("[data-proof-work-counter]")).toHaveText("Video 2 of 6");

	expect(
		await player.evaluate((element) => {
			if (!(element instanceof HTMLVideoElement)) throw new TypeError("Proof Work player must be a video element.");
			return element.paused;
		}),
	).toBe(true);
});

test("keeps the mobile Proof Work tooltip above the sticky header", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 350 });
	await page.goto("/en/");

	const summary = page.locator('summary[aria-describedby="proof-work"]');
	await summary.evaluate((element) => element.scrollIntoView({ block: "center" }));
	await summary.click();

	const tooltip = page.locator("#proof-work");
	await expect(tooltip).toBeVisible();
	await expect(tooltip).toHaveCSS("opacity", "1");
	await expect(tooltip).toHaveCSS("border-left-width", "1px");
	await expect(tooltip).toHaveCSS("border-right-width", "1px");

	expect(
		await page.evaluate(() => {
			const header = document.querySelector<HTMLElement>("[data-page-header-shell]");
			const panel = document.querySelector<HTMLElement>("#proof-work");
			if (!header || !panel) throw new Error("The header and Proof Work tooltip must be rendered.");

			const headerBox = header.getBoundingClientRect();
			const panelBox = panel.getBoundingClientRect();
			const left = Math.max(headerBox.left, panelBox.left);
			const right = Math.min(headerBox.right, panelBox.right);
			const top = Math.max(headerBox.top, panelBox.top);
			const bottom = Math.min(headerBox.bottom, panelBox.bottom);

			if (right <= left || bottom <= top) throw new Error("The mobile tooltip must overlap the sticky header in this test.");

			const topmostElement = document.elementFromPoint(left + (right - left) / 2, top + (bottom - top) / 2);
			return Boolean(topmostElement && panel.contains(topmostElement));
		}),
	).toBe(true);

	expect(await tooltip.evaluate((panel) => ({ panel: getComputedStyle(panel).zIndex, trigger: getComputedStyle(panel.parentElement as HTMLElement).zIndex }))).toEqual({ panel: "50", trigger: "auto" });
});

test("keeps the mobile role stable when reduced motion is requested", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/en/");

	const visibleRole = page.locator("[data-mobile-role]:not([hidden])");
	const initialRole = await visibleRole.textContent();

	if (!initialRole) throw new Error("The mobile role rotator needs a visible initial role.");

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

		await expect(page.locator("html")).toHaveAttribute("lang", localeConfigs[locale].htmlLang);
		await expect(page.locator(`[data-page-footer] a[href="/${locale}/legal/"]`)).toBeVisible();

		for (const targetLocale of locales) {
			await expect(page.locator(`a[hreflang="${localeConfigs[targetLocale].htmlLang}"]`)).toHaveAttribute("href", `/${targetLocale}/privacy/`);
		}

		const alternateLocale = locales.find((targetLocale) => targetLocale !== locale);

		if (!alternateLocale) {
			throw new Error("Each localized page needs an alternate language.");
		}

		await page.locator(`a[hreflang="${localeConfigs[alternateLocale].htmlLang}"]`).click();
		await expect(page).toHaveURL(`/${alternateLocale}/privacy/`);

		await page.goto(`/${locale}/legal/`);
		await expect(page.locator(`[data-page-footer] a[href="/${locale}/privacy/"]`)).toBeVisible();
	}
});
