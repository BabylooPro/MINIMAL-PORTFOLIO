import { expect, test } from "@playwright/test";
import { mediaOrigin, proofWorkPlayer, scrollProofWorkPlayerOutOfView } from "./helpers";

test("updates the Proof Work carousel and exposes pause controls for reduced motion", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/en/");

	const player = page.locator("[data-proof-work-player]");
	const transitionLoader = page.locator("[data-proof-work-transition-loader]");

	await expect(player).toHaveJSProperty("controls", true);
	await expect(player).toHaveAttribute("aria-label", "Timelapse 1");
	await expect(player.locator("source")).toHaveAttribute("src", `${mediaOrigin}/videos/timelapse/1.mp4`);
	await expect(player).toHaveCSS("color-scheme", "dark");
	await expect(transitionLoader.locator("span")).toHaveClass(/size-20/);

	await page.locator('[data-proof-work-direction="next"]').click();

	await expect(player).toHaveAttribute("aria-label", "Timelapse 2");
	await expect(player.locator("source")).toHaveAttribute("src", `${mediaOrigin}/videos/timelapse/2.mp4`);
	await expect(player).toHaveAttribute("poster", /\/videos\/timelapse\/previews\/2\.avif$/);
	await expect(page.locator("[data-proof-work-counter]")).toHaveText("Video 2 of 6");

	await expect
		.poll(() =>
			player.evaluate((element) => {
				if (!(element instanceof HTMLVideoElement)) throw new TypeError("Proof Work player must be a video element.");
				return element.paused;
			}),
		)
		.toBe(false);
});

test("recovers the Proof Work player after a rejected autoplay request", async ({ page }) => {
	await page.addInitScript(() => {
		const originalPlay = HTMLMediaElement.prototype.play;
		let blocked = true;

		Object.assign(window, { allowProofWorkPlayback: () => { blocked = false } });

		HTMLMediaElement.prototype.play = function play(this: HTMLMediaElement) {
			if (!blocked) return originalPlay.call(this);
			return Promise.reject(new DOMException("Autoplay blocked by test.", "NotAllowedError"));
		};
	});

	await page.goto("/en/");

	const player = page.locator("[data-proof-work-player]");
	const isPaused = () =>
		player.evaluate((element) => {
			if (!(element instanceof HTMLVideoElement)) throw new TypeError("Proof Work player must be a video element.");
			return element.paused;
		});

	await player.scrollIntoViewIfNeeded();
	await expect.poll(isPaused).toBe(true);

	await page.evaluate(() => (window as unknown as { allowProofWorkPlayback: () => void }).allowProofWorkPlayback());
	await page.keyboard.press("Escape");

	await expect.poll(isPaused).toBe(false);
});

test("reveals Proof Work pause controls on tap while autoplaying on touch", async ({ browser }) => {
	const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
	const page = await context.newPage();

	await page.goto("/en/");

	const player = page.locator("[data-proof-work-player]");
	await player.evaluate((element) => element.scrollIntoView({ block: "center" }));

	expect(await page.evaluate(() => matchMedia("(min-width: 40rem) and (hover: hover) and (pointer: fine)").matches)).toBe(false);
	await expect(player).toHaveJSProperty("controls", false);

	await expect
		.poll(() =>
			player.evaluate((element) => {
				if (!(element instanceof HTMLVideoElement)) throw new TypeError("Proof Work player must be a video element.");
				return element.paused;
			}),
		)
		.toBe(false);

	await player.tap();
	await expect(player).toHaveJSProperty("controls", true);

	await context.close();
});

test("hides Proof Work controls again once the visitor switches clips", async ({ browser }) => {
	const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 1_024, height: 768 } });
	const page = await context.newPage();

	await page.goto("/en/");

	const player = page.locator("[data-proof-work-player]");
	const isPaused = () => player.evaluate((element) => (element as HTMLVideoElement).paused);

	await player.evaluate((element) => element.scrollIntoView({ block: "center" }));
	await expect.poll(isPaused, { timeout: 20_000 }).toBe(false);

	await player.tap();
	await expect(player).toHaveJSProperty("controls", true);

	const nextControl = page.locator('[data-proof-work-direction="next"]');
	const box = await nextControl.boundingBox();
	if (!box) throw new Error("The Proof Work next control must be laid out.");
	await page.touchscreen.tap(box.x + box.width - 20, box.y + box.height / 2);

	await expect(page.locator("[data-proof-work-counter]")).toHaveText("Video 2 of 6");
	await expect(player).toHaveJSProperty("controls", false);

	await player.tap();
	await expect(player).toHaveJSProperty("controls", true);

	await context.close();
});

test("hides Proof Work controls again once the clip scrolls out of view", async ({ browser }) => {
	const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
	const page = await context.newPage();

	await page.goto("/en/");

	const player = page.locator("[data-proof-work-player]");
	const isPaused = () => player.evaluate((element) => (element as HTMLVideoElement).paused);

	await player.evaluate((element) => element.scrollIntoView({ block: "center" }));
	await expect.poll(isPaused, { timeout: 20_000 }).toBe(false);

	await player.tap();
	await expect(player).toHaveJSProperty("controls", true);

	await player.evaluate(async (element) => { await (element as HTMLVideoElement).play() });
	await expect.poll(isPaused).toBe(false);

	await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
	await expect(player).toHaveJSProperty("controls", false);

	await player.evaluate((element) => element.scrollIntoView({ block: "center" }));
	await expect.poll(isPaused, { timeout: 20_000 }).toBe(false);
	await expect(player).toHaveJSProperty("controls", false);

	await player.evaluate((element) => {
		const options = { bubbles: true, cancelable: true, pointerType: "touch", pointerId: 1 };
		element.dispatchEvent(new PointerEvent("pointerenter", options));
		element.dispatchEvent(new PointerEvent("pointerdown", options));
		element.dispatchEvent(new PointerEvent("pointercancel", options));
	});
	await expect(player).toHaveJSProperty("controls", false);

	await player.evaluate((element) => {
		element.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "touch", pointerId: 1 }));
	});
	await expect(player).toHaveJSProperty("controls", true);

	await context.close();
});

test("keeps a Proof Work clip paused when the visitor uses the native pause control", async ({ browser }) => {
	const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
	const page = await context.newPage();

	await page.goto("/en/");

	const player = page.locator("[data-proof-work-player]");
	const isPaused = () => player.evaluate((element) => (element as HTMLVideoElement).paused);

	await player.evaluate((element) => element.scrollIntoView({ block: "center" }));
	await expect.poll(isPaused, { timeout: 20_000 }).toBe(false);

	await player.tap();
	await expect(player).toHaveJSProperty("controls", true);

	await player.evaluate((element) => {
		const video = element as HTMLVideoElement;
		video.pause();
		video.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "touch", pointerId: 1 }));
	});

	await page.waitForTimeout(900);
	expect(await isPaused()).toBe(true);

	await context.close();
});

test("keeps the Proof Work card within the header and footer band on a landscape phone", async ({ page }) => {
	await page.setViewportSize({ width: 812, height: 375 });
	await page.goto("/en/");

	await page.evaluate(() => scrollTo(0, 2_000));
	await page.waitForTimeout(700);

	const { card, band } = await page.evaluate(() => {
		const header = document.querySelector("[data-page-header-shell]")?.getBoundingClientRect();
		const footer = document.querySelector("[data-page-footer]")?.getBoundingClientRect();
		const activeCard = document.querySelector("[data-proof-work-active-card]")?.getBoundingClientRect();
		if (!header || !activeCard) throw new Error("The Proof Work card and the page header must be measurable.");

		return { card: activeCard.height, band: (footer ? footer.top : innerHeight) - header.bottom };
	});

	expect(card).toBeLessThanOrEqual(band);
});

test("does not resume a Proof Work clip the visitor paused", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto("/en/");

	const player = page.locator("[data-proof-work-player]");
	await player.evaluate((element) => element.scrollIntoView({ block: "center" }));

	await expect
		.poll(async () => player.evaluate((element) => (element as HTMLVideoElement).paused), { timeout: 20_000 })
		.toBe(false);

	await player.evaluate((element) => (element as HTMLVideoElement).pause());
	await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
	await page.waitForTimeout(600);

	expect(await player.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(true);
});

test("does not advance the Proof Work carousel when a clip ends", async ({ page }) => {
	await page.goto("/en/");

	const counter = page.locator("[data-proof-work-counter]");
	await expect(counter).toHaveText("Video 1 of 6");

	await page.locator("[data-proof-work-player]").evaluate((element) => element.dispatchEvent(new Event("ended")));
	await page.waitForTimeout(300);

	await expect(counter).toHaveText("Video 1 of 6");
});

test("keeps the Proof Work clip playing after the visitor presses the native play button", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto("/en/");

	const { player, isPaused, settle } = proofWorkPlayer(page);
	await settle();

	await player.evaluate((element) => (element as HTMLVideoElement).pause());
	await expect.poll(isPaused).toBe(true);

	await player.evaluate(async (element) => { await (element as HTMLVideoElement).play() });
	await expect.poll(isPaused).toBe(false);

	await player.dispatchEvent("pointerenter");
	await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
	await page.waitForTimeout(600);

	expect(await isPaused()).toBe(false);
});

test("honours a Proof Work pause taken in the same tick as a visibility change", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto("/en/");

	const { player, isPaused, settle } = proofWorkPlayer(page);
	await settle();

	const stayedPaused = await player.evaluate(async (element) => {
		const video = element as HTMLVideoElement;
		video.pause();
		document.dispatchEvent(new Event("visibilitychange"));
		await new Promise((resolve) => setTimeout(resolve, 800));
		return video.paused;
	});

	expect(stayedPaused).toBe(true);
	expect(await isPaused()).toBe(true);
});

test("honours a Proof Work pause taken after switching clips", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto("/en/");

	const { player, isPaused, currentSource, settle } = proofWorkPlayer(page);
	await settle();

	await page.locator('[data-proof-work-direction="next"]').click();
	await expect.poll(currentSource).toContain("/videos/timelapse/2.mp4");
	await expect.poll(isPaused, { timeout: 20_000 }).toBe(false);

	await player.evaluate((element) => (element as HTMLVideoElement).pause());
	await player.dispatchEvent("pointerenter");
	await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
	await page.waitForTimeout(600);

	expect(await isPaused()).toBe(true);
});

test("restores a visible Proof Work player when a clip fails to load", async ({ page }) => {
	await page.route("**/videos/timelapse/2.mp4", (route) => route.abort());
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto("/en/");

	const { player, settle } = proofWorkPlayer(page);
	await settle();

	await page.locator('[data-proof-work-direction="next"]').click();

	await expect.poll(() => player.evaluate((element) => element.dataset.loading)).toBeUndefined();
	expect(await player.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
	await expect(page.locator("[data-proof-work-transition-loader]")).toBeHidden();
});

test("keeps the Proof Work player visible when a clip switch cannot autoplay", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto("/en/");

	const { player, settle } = proofWorkPlayer(page);
	await settle();

	await page.evaluate(() => {
		HTMLMediaElement.prototype.play = function play() {
			return Promise.reject(new DOMException("Autoplay blocked by test.", "NotAllowedError"));
		};
	});

	await page.locator('[data-proof-work-direction="next"]').click();

	await expect.poll(() => player.evaluate((element) => element.dataset.loading)).toBeUndefined();
	expect(await player.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
	await expect(page.locator("[data-proof-work-transition-preview]")).toBeHidden();
	await expect(page.locator("[data-proof-work-transition-loader]")).toBeHidden();
});

test("loads the selected Proof Work clip while the card is below the visibility threshold", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto("/en/");

	const { currentSource, isPaused, settle } = proofWorkPlayer(page);
	await settle();

	await scrollProofWorkPlayerOutOfView(page);
	await expect.poll(isPaused).toBe(true);

	await page.locator('[data-proof-work-direction="next"]').dispatchEvent("click");

	await expect.poll(currentSource, { timeout: 20_000 }).toContain("/videos/timelapse/2.mp4");
	await expect(page.locator("[data-proof-work-counter]")).toHaveText("Video 2 of 6");
});

test("does not restart a finished Proof Work clip when the pointer returns", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto("/en/");

	const { player, isPaused, settle } = proofWorkPlayer(page);
	await settle();

	await expect.poll(() => player.evaluate((element) => (element as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(1);

	await player.evaluate(
		(element) =>
			new Promise<void>((resolve) => {
				const video = element as HTMLVideoElement;
				video.addEventListener("ended", () => resolve(), { once: true });
				video.currentTime = Math.max(0, video.duration - 0.2);
			}),
	);

	await expect.poll(isPaused).toBe(true);

	await player.dispatchEvent("pointerenter");
	await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
	await page.waitForTimeout(600);

	expect(await player.evaluate((element) => (element as HTMLVideoElement).ended)).toBe(true);
});

test("keeps the Proof Work clip playing while it reports as the picture-in-picture element", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.addInitScript(() => {
		Object.defineProperty(document, "pictureInPictureElement", {
			configurable: true,
			get: () =>
				(window as unknown as { proofWorkPictureInPicture?: boolean }).proofWorkPictureInPicture
					? document.querySelector("[data-proof-work-player]") : null,
		});
	});
	await page.goto("/en/");

	const { player, isPaused, settle } = proofWorkPlayer(page);
	await settle();

	await page.evaluate(() => { (window as unknown as { proofWorkPictureInPicture: boolean }).proofWorkPictureInPicture = true });

	await scrollProofWorkPlayerOutOfView(page);
	await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
	await page.waitForTimeout(800);

	expect(await player.evaluate((element) => element.getBoundingClientRect().bottom < 0)).toBe(true);
	expect(await isPaused()).toBe(false);
});
