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

test("keeps the mobile Proof Work popover above the sticky header and restores focus", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 350 });
	await page.goto("/en/");

	const trigger = page.locator("[data-popover-trigger]");
	await trigger.evaluate((element) => element.scrollIntoView({ block: "center" }));
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

	await trigger.scrollIntoViewIfNeeded();
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
	await trigger.scrollIntoViewIfNeeded();
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

test("uses a single standard desktop trigger for language tooltips", async ({ page }) => {
	await page.setViewportSize({ width: 1_280, height: 800 });
	await page.goto("/en/");

	const trigger = page.locator('[data-tooltip-trigger][aria-describedby="language-0-listening"]');
	const tooltip = page.locator("#language-0-listening");

	await expect(trigger).toHaveAttribute("aria-label", "More information");
	await expect(trigger).not.toHaveAttribute("aria-expanded", /.+/);
	await expect(tooltip).toHaveAttribute("role", "tooltip");
	await expect(tooltip.locator("a, button, input, select, textarea")).toHaveCount(0);
	await expect(page.locator("[data-tooltip] summary")).toHaveCount(0);

	await trigger.scrollIntoViewIfNeeded();
	await page.waitForTimeout(200);
	await trigger.hover();
	await expect(tooltip).toHaveCSS("opacity", "0");
	await page.waitForTimeout(750);
	await expect(tooltip).toHaveCSS("opacity", "1");
	await tooltip.hover();
	await page.waitForTimeout(200);
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
		await trigger.scrollIntoViewIfNeeded();
		await trigger.click();

		const tooltip = page.locator("#language-0-writing");
		await expect(trigger).toHaveAttribute("aria-expanded", "true");
		await expect(tooltip).toHaveCSS("opacity", "1");

		expect(
			await page.evaluate(() => {
				const header = document.querySelector<HTMLElement>("[data-page-header-shell]");
				const panel = document.querySelector<HTMLElement>("#language-0-writing");
				if (!header || !panel) throw new Error("The header and language tooltip must be rendered.");

				return { header: getComputedStyle(header).zIndex, panel: getComputedStyle(panel).zIndex };
			}),
		).toEqual({ header: "40", panel: "30" });

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
		await locator.scrollIntoViewIfNeeded();
		await page.waitForTimeout(200);

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
