import { interpolate, progressBetween, smoothstep } from "@/src/components/utils/behavior/header-scroll-state";

let backToTop: HTMLAnchorElement | null = null;

let collapsible: HTMLElement | null = null;
let collapsibleContent: HTMLElement | null = null;
let collapsibleHeight = 0;

let compactIdentity: HTMLElement | null = null;
let compactIdentityHeight = 0;

let footer: HTMLElement | null = null;
let header: HTMLElement | null = null;

let identity: HTMLElement | null = null;
let identityHeight = 0;
let identityTransition: HTMLElement | null = null;

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

let initialPaddingBottom = -1;
let initialPaddingTop = -1;

let pageTop: HTMLElement | null = null;

export function queryScrollStateElements(): void {
	backToTop = document.querySelector<HTMLAnchorElement>("[data-back-to-top]");
	collapsible = document.querySelector<HTMLElement>("[data-header-scroll-hidden]");
	collapsibleContent = collapsible?.querySelector<HTMLElement>("[data-header-scroll-content]") ?? null;
	compactIdentity = document.querySelector<HTMLElement>("[data-header-compact-identity]");
	footer = document.querySelector<HTMLElement>("[data-page-footer]");
	header = document.querySelector<HTMLElement>("[data-page-header]");
	identity = document.querySelector<HTMLElement>("[data-header-identity]");
	identityTransition = document.querySelector<HTMLElement>("[data-header-identity-transition]");
	pageTop = document.querySelector<HTMLElement>("[data-page-top]");
}

export function observeHeaderElements(observer: ResizeObserver): void {
	if (identity) observer.observe(identity);
	if (compactIdentity) observer.observe(compactIdentity);
	if (collapsibleContent) observer.observe(collapsibleContent);
}

export function bindBackToTop(): void {
	backToTop?.addEventListener("click", (event) => {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

		event.preventDefault();
		scrollTo(0, 0);
		requestAnimationFrame(() => {
			pageTop?.focus({ preventScroll: true });
			scrollTo(0, 0);
		});
	});
}

export function updateBackToTopVisibility(): void {
	backToTop?.toggleAttribute("hidden", scrollY === 0);
}

export function getVisibleBand(): [number, number] {
	return [(pageTop as HTMLElement).getBoundingClientRect().bottom, (footer as HTMLElement).getBoundingClientRect().top - 44];
}

export function keepFocusClear(force?: boolean): void {
	const element = document.activeElement;
	if (!element?.closest("main") || !(force || element.matches(":focus-visible"))) return;

	const box = element.getBoundingClientRect();
	const [top, bottom] = getVisibleBand();
	const offset = box.top < top ? box.top - top - 16 : Math.max(0, box.bottom - bottom + 16);
	if (offset && box.height * 2 < innerHeight) scrollBy({ top: offset, behavior: "instant" });
}

export function measureHeaderElements(): void {
	if (identity && compactIdentity) {
		const normalHeight = identity.getBoundingClientRect().height;
		const compactHeight = compactIdentity.getBoundingClientRect().height;

		if (normalHeight > 0) identityHeight = normalHeight;
		if (compactHeight > 0) compactIdentityHeight = compactHeight;
	}

	if (collapsibleContent && collapsible) {
		const height = collapsibleContent.getBoundingClientRect().height;

		if (height > 0) {
			collapsibleHeight = height;
			collapsible.style.setProperty("--header-details-height", `${height}px`);
		}
	}
}

export function updateCollapsibleElements(progress: number): void {
	if (!collapsible) return;

	const remaining = 1 - progress;

	collapsible.style.height = `${collapsibleHeight * remaining}px`;
	collapsible.style.opacity = remaining as unknown as string;
	collapsible.toggleAttribute("inert", progress === 1);
}

export function updateHeaderIdentity(progress: number): void {
	if (!identity || !compactIdentity || !identityTransition || !identityHeight || !compactIdentityHeight) return;

	const identityProgress = reducedMotion.matches ? +(progress >= 0.9) : progress;
	const morphProgress = smoothstep(progressBetween(identityProgress, 0.65, 0.9));

	identityTransition.style.height = `${interpolate(identityHeight, compactIdentityHeight, morphProgress)}px`;
	identityTransition.style.setProperty("--header-morph", morphProgress as unknown as string);
	identity.style.opacity = (1 - progressBetween(identityProgress, 0.95, 1)) as unknown as string;
	compactIdentity.style.opacity = progressBetween(identityProgress, 0.9, 0.95) as unknown as string;
}

export function resetHeaderIdentityStyles(): void {
	identityTransition?.style.removeProperty("height");
	identityTransition?.style.removeProperty("--header-morph");
	identity?.style.removeProperty("opacity");
	compactIdentity?.style.removeProperty("opacity");
}

export function resetCollapsibleElements(): void {
	collapsible?.style.removeProperty("height");
	collapsible?.style.removeProperty("opacity");
	collapsible?.removeAttribute("data-collapsed");
	collapsible?.removeAttribute("inert");
}

export function updateMobileScrollState(): void {
	const detailsCollapsed = scrollY > 24;

	header?.toggleAttribute("data-scrolled", scrollY > 0);

	collapsible?.toggleAttribute("data-collapsed", detailsCollapsed);
	collapsible?.toggleAttribute("inert", detailsCollapsed);
}

export function resetDesktopHeaderStyles(): void {
	header?.removeAttribute("data-fully-compact");
	footer?.removeAttribute("data-expanded");
	header?.style.removeProperty("padding");
}

export function updateDesktopScrollState(progress: number, isAtPageBottom: boolean): void {
	if (header && initialPaddingTop < 0) {
		const style = getComputedStyle(header);

		initialPaddingBottom = Number.parseFloat(style.paddingBottom) || 0;
		initialPaddingTop = Number.parseFloat(style.paddingTop) || 0;
	}

	header?.toggleAttribute("data-scrolled", progress > 0);
	header?.toggleAttribute("data-fully-compact", progress === 1);
	footer?.toggleAttribute("data-expanded", isAtPageBottom);

	if (!header) return;

	header.style.paddingTop = `${interpolate(initialPaddingTop, 16, progress)}px`;
	header.style.paddingBottom = `${progress === 1 ? 16 : interpolate(initialPaddingBottom, 16, progress)}px`;
}

export function markCollapsibleElementsReady(): void {
	collapsible?.setAttribute("data-ready", "");
}
