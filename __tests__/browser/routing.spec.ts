import { expect, test } from "@playwright/test";
import { localeConfigs } from "@/src/lib/i18n/config";
import { mediaOrigin } from "./helpers";

const locales = ["en", "fr", "de"] as const;

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
