import { expect, test } from "@playwright/test";
import { defaultLocale, getLegalPagePath, getLocalePath, localeConfigs, locales } from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n/dictionaries";
import { mediaOrigin, revealBelowStickyHeader } from "./helpers";

const localizedNotFoundPages = locales.map((locale) => ({
	locale,
	title: getDictionary(locale).messages.notFound.title,
	backToPortfolio: getDictionary(locale).messages.labels.backToPortfolio,
}));

test("keeps the default locale at the root and redirects every other supported browser locale", async ({ browser }) => {
	const siteOrigin = "http://127.0.0.1:4174";

	for (const locale of locales) {
		const context = await browser.newContext({ locale: localeConfigs[locale].intlLocale });
		const page = await context.newPage();

		await page.goto(`${siteOrigin}/`);
		await expect(page).toHaveURL(`${siteOrigin}${locale === defaultLocale ? "/" : getLocalePath(locale)}`);
		await context.close();
	}

	const unsupportedContext = await browser.newContext({ locale: "it-CH" });
	const unsupportedPage = await unsupportedContext.newPage();

	await unsupportedPage.goto(`${siteOrigin}/`);
	await expect(unsupportedPage).toHaveURL(`${siteOrigin}/`);
	await expect(unsupportedPage.locator("main")).toContainText(getDictionary(defaultLocale).messages.sections.profile);
	await unsupportedContext.close();
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

	for (const route of ["/", ...locales.map(getLocalePath)]) {
		await page.goto(`${siteOrigin}${route}`, { waitUntil: "domcontentloaded" });
		await expect(page.locator("main")).toBeVisible();
	}

	await page.goto(`${siteOrigin}/en/`, { waitUntil: "domcontentloaded" });
	const carousel = page.locator("[data-proof-work-carousel]");

	const nextControl = page.locator('[data-proof-work-direction="next"]');
	await revealBelowStickyHeader(nextControl);
	await nextControl.click();
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

test("keeps localized legal links and language switching on every locale", async ({ page }) => {
	for (const locale of locales) {
		await page.goto(getLegalPagePath(locale, "privacy"));

		await expect(page.locator("html")).toHaveAttribute("lang", localeConfigs[locale].htmlLang);
		await expect(page.locator(`[data-page-footer] a[href="${getLegalPagePath(locale, "legal")}"]`)).toBeVisible();
		await expect(page.locator('main a[href^="mailto:"]')).toBeVisible();
		await expect(page.locator("[data-page-header] a[href^='mailto:'], [data-page-header] a[href^='tel:']")).toHaveCount(0);

		for (const targetLocale of locales) {
			await expect(page.locator(`a[hreflang="${localeConfigs[targetLocale].htmlLang}"]`)).toHaveAttribute("href", getLegalPagePath(targetLocale, "privacy"));
		}

		const alternateLocale = locales.find((targetLocale) => targetLocale !== locale);
		if (!alternateLocale) throw new Error("Each localized page needs an alternate language.");

		await page.locator(`a[hreflang="${localeConfigs[alternateLocale].htmlLang}"]`).click();
		await expect(page).toHaveURL(getLegalPagePath(alternateLocale, "privacy"));

		await page.goto(getLegalPagePath(locale, "legal"));
		await expect(page.locator(`[data-page-footer] a[href="${getLegalPagePath(locale, "privacy")}"]`)).toBeVisible();
		await expect(page.locator('main a[href^="mailto:"]')).toBeVisible();
	}
});
