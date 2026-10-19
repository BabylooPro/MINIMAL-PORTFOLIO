import { expect, type Page, test } from "@playwright/test";

type Placement = { key: string; top: number; bottom: number; headerBottom: number; limit: number; inChrome: boolean; tall: boolean };

const viewports = [
	{ width: 320, height: 740 },
	{ width: 390, height: 844 },
	{ width: 1_280, height: 800 },
];

const paths = ["/en/", "/en/privacy/", "/en/404.html"];

function readFocusedPlacement(page: Page): Promise<Placement | null> {
	return page.evaluate(async () => {
		function read() {
			const element = document.activeElement;
			if (!(element instanceof HTMLElement) || element === document.body) return null;

			const header = document.querySelector("[data-page-header-shell]");
			const footer = document.querySelector("[data-page-footer]");
			const backToTop = document.querySelector<HTMLElement>("[data-back-to-top]");
			if (!header || !footer || !backToTop) throw new Error("The header, footer and back-to-top must be rendered.");

			const box = element.getBoundingClientRect();
			const headerBottom = header.getBoundingClientRect().bottom;
			const limit = backToTop.hidden ? footer.getBoundingClientRect().top : backToTop.getBoundingClientRect().top;

			return {
				key: element.outerHTML.slice(0, 120),
				top: Math.round(box.top),
				bottom: Math.round(box.bottom),
				headerBottom: Math.round(headerBottom),
				limit: Math.round(limit),
				inChrome: header.contains(element) || footer.contains(element) || getComputedStyle(element).position === "fixed",
				tall: box.height > limit - headerBottom,
			};
		}

		let previous = JSON.stringify(read());

		for (let attempt = 0; attempt < 20; attempt += 1) {
			await new Promise((resolve) => setTimeout(resolve, 120));
			const current = JSON.stringify(read());
			if (current === previous) return JSON.parse(current);
			previous = current;
		}

		return JSON.parse(previous);
	});
}

function expectClear(placement: Placement): void {
	if (placement.inChrome) return;

	expect(placement.top, `${placement.key} is hidden under the header`).toBeGreaterThanOrEqual(placement.headerBottom);
	if (!placement.tall) expect(placement.bottom, `${placement.key} is hidden under the footer`).toBeLessThanOrEqual(placement.limit);
}

for (const viewport of viewports) {
	for (const path of paths) {
		test(`keeps focused elements clear of the fixed header and footer on ${path} at ${viewport.width}px`, async ({ browserName, page }) => {
			const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";

			await page.setViewportSize(viewport);
			await page.goto(path);
			await page.locator("[data-header-scroll-hidden][data-ready], [data-page-header]").first().waitFor();

			const forward: string[] = [];

			for (let step = 0; step < 120; step += 1) {
				await page.keyboard.press(tab);
				const placement = await readFocusedPlacement(page);
				if (!placement || placement.key === forward[0]) break;

				forward.push(placement.key);
				expectClear(placement);
			}

			expect(forward.length).toBeGreaterThan(3);

			for (let step = 1; step < forward.length; step += 1) {
				await page.keyboard.press(`Shift+${tab}`);
				const placement = await readFocusedPlacement(page);
				if (!placement) break;

				expectClear(placement);
			}

			const end = await page.evaluate(async () => {
				scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
				await new Promise((resolve) => setTimeout(resolve, 600));

				const main = document.querySelector("main");
				const footer = document.querySelector("[data-page-footer]");
				const backToTop = document.querySelector<HTMLElement>("[data-back-to-top]");
				if (!main || !footer || !backToTop) throw new Error("The main content, footer and back-to-top must be rendered.");

				const focusable = [...main.querySelectorAll<HTMLElement>("a[href], button, video[tabindex], [tabindex='0']")].filter((element) => element.getClientRects().length > 0);
				const lastContent = main.lastElementChild?.getBoundingClientRect().bottom ?? 0;
				const lastFocusable = focusable.at(-1)?.getBoundingClientRect().bottom ?? 0;
				const limit = backToTop.hidden ? footer.getBoundingClientRect().top : backToTop.getBoundingClientRect().top;

				return { lastContent: Math.round(lastContent), lastFocusable: Math.round(lastFocusable), limit: Math.round(limit) };
			});

			expect(end.lastFocusable).toBeLessThanOrEqual(end.limit);
			expect(end.lastContent).toBeLessThanOrEqual(end.limit);
		});
	}
}

test("keeps keyboard focus clear when the browser skips the focus scroll", async ({ page }) => {
	await page.setViewportSize({ width: 1_280, height: 800 });
	await page.goto("/en/");
	await page.locator("[data-header-scroll-hidden][data-ready]").waitFor();

	const previousVideo = page.getByRole("button", { name: "Previous video" });

	expect(await previousVideo.evaluate((element) => element.getBoundingClientRect().bottom > innerHeight - 45)).toBe(true);

	const box = await previousVideo.boundingBox();
	if (!box) throw new Error("The previous video control must be laid out.");

	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 4);
	await page.waitForTimeout(300);
	expect(await page.evaluate(() => scrollY)).toBe(0);

	await previousVideo.evaluate((element) => (element as HTMLButtonElement).blur());
	await page.keyboard.press("Shift");
	await previousVideo.evaluate((element) => (element as HTMLButtonElement).focus({ preventScroll: true }));

	await expect.poll(async () => {
		const placement = await readFocusedPlacement(page);
		return placement !== null && placement.top >= placement.headerBottom && placement.bottom <= placement.limit;
	}).toBe(true);
});

for (const { heading, path } of [
	{ heading: "Profile", path: "/en/" },
	{ heading: "Privacy", path: "/en/privacy/" },
]) {
	test(`moves past the header with the skip link on ${path}`, async ({ browserName, page }) => {
		const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";

		for (const viewport of [{ width: 1_280, height: 800 }, { width: 390, height: 844 }]) {
			await page.setViewportSize(viewport);
			await page.goto(path);

			const skipLink = page.getByRole("link", { name: "Skip to content" });
			const main = page.locator("main");

			await page.keyboard.press(tab);
			await expect(skipLink).toBeFocused();
			await expect(skipLink).toBeInViewport();

			await page.keyboard.press("Enter");
			await expect(main).toBeFocused();

			await expect.poll(() => main.getByRole("heading", { name: heading, exact: true }).evaluate((element) => {
				const header = document.querySelector("[data-page-header-shell]");
				if (!header) throw new Error("The page header shell must be rendered.");

				const box = element.getBoundingClientRect();
				return box.top >= header.getBoundingClientRect().bottom && box.bottom <= innerHeight;
			})).toBe(true);

			await page.keyboard.press(tab);
			expect(await main.evaluate((element) => element.contains(document.activeElement) && element !== document.activeElement)).toBe(true);
		}
	});
}

test("lands section links below the sticky header", async ({ page }) => {
	const ids = ["proof-work-title", "skills-title", "languages-title", "side-projects-title", "experience-title", "contact-title"];

	async function readSettledLanding(id: string): Promise<boolean> {
		return page.locator(`#${id}`).evaluate(async (element) => {
			const header = document.querySelector("[data-page-header-shell]");
			const footer = document.querySelector("[data-page-footer]");
			if (!header || !footer) throw new Error("The header and footer must be rendered.");

			let previous = "";

			for (let attempt = 0; attempt < 40; attempt += 1) {
				await new Promise((resolve) => setTimeout(resolve, 100));

				const box = element.getBoundingClientRect();
				const headerBottom = header.getBoundingClientRect().bottom;
				const current = `${box.top}/${headerBottom}`;

				if (current === previous) return box.top >= headerBottom && box.bottom <= footer.getBoundingClientRect().top;
				previous = current;
			}

			return false;
		});
	}

	for (const viewport of viewports) {
		await page.setViewportSize(viewport);

		for (const id of ids) {
			await page.goto("/en/");
			await page.locator("[data-header-scroll-hidden][data-ready]").waitFor();
			await page.getByRole("navigation", { name: "On this page" }).locator(`a[href="#${id}"]`).click();
			expect(await readSettledLanding(id), `${id} after a click at ${viewport.width}px`).toBe(true);

			await page.goto(`/en/#${id}`);
			expect(await readSettledLanding(id), `${id} on load at ${viewport.width}px`).toBe(true);
		}
	}
});
