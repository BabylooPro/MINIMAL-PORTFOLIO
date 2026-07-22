const collapseDistance = 180;
const compactHeaderPadding = 16;
const fullyCollapsedHeaderBottomPadding = compactHeaderPadding;
const mobileCollapseThreshold = 24;
const headerIdentityCollapseStart = 0.65;
const desktopViewport = window.matchMedia("(min-width: 40rem)");

const header = document.querySelector<HTMLElement>("[data-page-header]");
const footer = document.querySelector<HTMLElement>("[data-page-footer]");
const headerIdentity = document.querySelector<HTMLElement>("[data-header-identity]");
const compactHeaderIdentity = document.querySelector<HTMLElement>("[data-header-compact-identity]");
const headerIdentityTransition = document.querySelector<HTMLElement>(
	"[data-header-identity-transition]",
);
let initialHeaderPadding: { bottom: number; top: number } | null = null;
const headerIdentityHeights = { compact: 0, normal: 0 };
const collapsibleElements = Array.from(
	document.querySelectorAll<HTMLElement>("[data-header-scroll-hidden]"),
).map((element) => ({
	content: element.querySelector<HTMLElement>("[data-header-scroll-content]"),
	element,
	height: 0,
}));

let animationFrame: number | undefined;
let collapseMode: "desktop" | "mobile" | undefined;

function readPixels(value: string): number {
	const pixels = Number.parseFloat(value);
	return Number.isFinite(pixels) ? pixels : 0;
}

function interpolate(from: number, to: number, progress: number): number {
	return from + (to - from) * progress;
}

function progressBetween(value: number, start: number, end: number): number {
	return Math.min(Math.max((value - start) / (end - start), 0), 1);
}

function isAtPageBottom(): boolean {
	return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
}

function getInitialHeaderPadding(): { bottom: number; top: number } | null {
	if (!header) {
		return null;
	}

	return {
		bottom: readPixels(getComputedStyle(header).paddingBottom),
		top: readPixels(getComputedStyle(header).paddingTop),
	};
}

function measureCollapsibleElements(): void {
	for (const collapsible of collapsibleElements) {
		if (collapsible.content) {
			const height = collapsible.content.getBoundingClientRect().height;

			if (height > 0) {
				collapsible.height = height;
				collapsible.element.style.setProperty("--header-details-height", `${height}px`);
			}
		}
	}
}

function measureHeaderIdentity(): void {
	if (!headerIdentity || !compactHeaderIdentity) {
		return;
	}

	const normalHeight = headerIdentity.getBoundingClientRect().height;
	const compactHeight = compactHeaderIdentity.getBoundingClientRect().height;

	if (normalHeight > 0) {
		headerIdentityHeights.normal = normalHeight;
	}

	if (compactHeight > 0) {
		headerIdentityHeights.compact = compactHeight;
	}
}

function updateCollapsibleElements(progress: number): void {
	for (const { element, height } of collapsibleElements) {
		const remaining = 1 - progress;

		element.style.height = `${height * remaining}px`;
		element.style.opacity = String(remaining);
		element.toggleAttribute("inert", progress === 1);
	}
}

function updateHeaderIdentity(progress: number): void {
	if (
		!headerIdentity ||
		!compactHeaderIdentity ||
		!headerIdentityTransition ||
		headerIdentityHeights.normal === 0 ||
		headerIdentityHeights.compact === 0
	) {
		return;
	}

	const identityProgress = progressBetween(progress, headerIdentityCollapseStart, 1);
	const compactIdentityStart = 0.3;
	const isCompactIdentity = identityProgress >= compactIdentityStart;
	const compactIdentityProgress = progressBetween(identityProgress, compactIdentityStart, 1);

	headerIdentityTransition.style.height = `${interpolate(
		headerIdentityHeights.normal,
		headerIdentityHeights.compact,
		compactIdentityProgress,
	)}px`;
	headerIdentity.style.opacity = isCompactIdentity ? "0" : "1";
	headerIdentity.style.transform = "none";
	compactHeaderIdentity.style.opacity = isCompactIdentity ? "1" : "0";
	compactHeaderIdentity.style.transform = "none";
}

function resetHeaderIdentityStyles(): void {
	headerIdentityTransition?.style.removeProperty("height");
	headerIdentity?.style.removeProperty("opacity");
	headerIdentity?.style.removeProperty("transform");
	compactHeaderIdentity?.style.removeProperty("opacity");
	compactHeaderIdentity?.style.removeProperty("transform");
}

function setCollapseMode(mode: "desktop" | "mobile"): boolean {
	if (collapseMode === mode) {
		return false;
	}

	collapseMode = mode;

	for (const { element } of collapsibleElements) {
		element.style.removeProperty("height");
		element.style.removeProperty("opacity");
		element.removeAttribute("data-collapsed");
		element.removeAttribute("inert");
	}

	resetHeaderIdentityStyles();

	return true;
}

function updateMobileScrollState(): void {
	const detailsCollapsed = window.scrollY > mobileCollapseThreshold;
	const pageScrolled = window.scrollY > 0;

	header?.toggleAttribute("data-scrolled", pageScrolled);

	for (const { element } of collapsibleElements) {
		element.toggleAttribute("data-collapsed", detailsCollapsed);
		element.toggleAttribute("inert", detailsCollapsed);
	}
}

function updateScrollState(): void {
	animationFrame = undefined;

	if (!desktopViewport.matches) {
		if (setCollapseMode("mobile")) {
			header?.removeAttribute("data-fully-compact");
			footer?.removeAttribute("data-expanded");
			header?.style.removeProperty("padding-top");
			header?.style.removeProperty("padding-bottom");
		}

		updateMobileScrollState();
		return;
	}

	const progress = Math.min(window.scrollY / collapseDistance, 1);

	setCollapseMode("desktop");
	header?.toggleAttribute("data-scrolled", progress > 0);
	header?.toggleAttribute("data-fully-compact", progress === 1);
	footer?.toggleAttribute("data-expanded", isAtPageBottom());
	initialHeaderPadding ??= getInitialHeaderPadding();

	if (header && initialHeaderPadding) {
		const bottomPadding =
			progress === 1
				? fullyCollapsedHeaderBottomPadding
				: interpolate(initialHeaderPadding.bottom, compactHeaderPadding, progress);

		header.style.paddingTop = `${interpolate(
			initialHeaderPadding.top,
			compactHeaderPadding,
			progress,
		)}px`;
		header.style.paddingBottom = `${bottomPadding}px`;
	}

	updateHeaderIdentity(progress);
	updateCollapsibleElements(progress);
}

function scheduleScrollStateUpdate(): void {
	if (animationFrame !== undefined) {
		return;
	}

	animationFrame = window.requestAnimationFrame(updateScrollState);
}

function handleScroll(): void {
	if (!desktopViewport.matches) {
		updateMobileScrollState();
		return;
	}

	scheduleScrollStateUpdate();
}

function prepareForPrint(): void {
	for (const { element } of collapsibleElements) {
		element.style.removeProperty("height");
		element.style.removeProperty("opacity");
		element.removeAttribute("data-collapsed");
		element.removeAttribute("inert");
	}
}

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", scheduleScrollStateUpdate);
window.addEventListener("pageshow", updateScrollState);
window.addEventListener("beforeprint", prepareForPrint);
window.addEventListener("afterprint", updateScrollState);

desktopViewport.addEventListener("change", updateScrollState);

function handleObservedResize(): void {
	measureHeaderIdentity();
	measureCollapsibleElements();
	scheduleScrollStateUpdate();
}

const resizeObserver = new ResizeObserver(handleObservedResize);

if (headerIdentity) {
	resizeObserver.observe(headerIdentity);
}

if (compactHeaderIdentity) {
	resizeObserver.observe(compactHeaderIdentity);
}

for (const { content } of collapsibleElements) {
	if (content) {
		resizeObserver.observe(content);
	}
}

measureHeaderIdentity();
measureCollapsibleElements();
for (const { element } of collapsibleElements) {
	element.setAttribute("data-ready", "");
}
updateScrollState();
