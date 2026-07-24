import {
	getDesktopHeaderPadding,
	getHeaderIdentityProgress,
	type HeaderPadding,
	headerScrollConfig,
	interpolate,
	isMobileDetailsCollapsed,
} from "./header-scroll-state";

export type CollapsibleElement = {
	content: HTMLElement | null;
	element: HTMLElement;
	height: number;
};

export type HeaderIdentityHeights = {
	compact: number;
	normal: number;
};

export type ScrollStateElements = {
	backToTop: HTMLAnchorElement | null;
	collapsibleElements: CollapsibleElement[];
	compactHeaderIdentity: HTMLElement | null;
	footer: HTMLElement | null;
	header: HTMLElement | null;
	headerIdentity: HTMLElement | null;
	headerIdentityTransition: HTMLElement | null;
	pageTop: HTMLElement | null;
};

export function getScrollStateElements(): ScrollStateElements {
	return {
		backToTop: document.querySelector<HTMLAnchorElement>("[data-back-to-top]"),
		collapsibleElements: Array.from(
			document.querySelectorAll<HTMLElement>("[data-header-scroll-hidden]"),
		).map((element) => ({
			content: element.querySelector<HTMLElement>("[data-header-scroll-content]"),
			element,
			height: 0,
		})),
		compactHeaderIdentity: document.querySelector<HTMLElement>(
			"[data-header-compact-identity]",
		),
		footer: document.querySelector<HTMLElement>("[data-page-footer]"),
		header: document.querySelector<HTMLElement>("[data-page-header]"),
		headerIdentity: document.querySelector<HTMLElement>("[data-header-identity]"),
		headerIdentityTransition: document.querySelector<HTMLElement>(
			"[data-header-identity-transition]",
		),
		pageTop: document.querySelector<HTMLElement>("[data-page-top]"),
	};
}

function readPixels(value: string): number {
	const pixels = Number.parseFloat(value);
	return Number.isFinite(pixels) ? pixels : 0;
}

export function readInitialHeaderPadding(header: HTMLElement | null): HeaderPadding | null {
	if (!header) {
		return null;
	}

	return {
		bottom: readPixels(getComputedStyle(header).paddingBottom),
		top: readPixels(getComputedStyle(header).paddingTop),
	};
}

export function updateBackToTopVisibility(
	backToTop: HTMLAnchorElement | null,
	scrollY: number,
): void {
	backToTop?.toggleAttribute("hidden", scrollY === 0);
}

export function returnFocusToPageTop(event: MouseEvent, pageTop: HTMLElement | null): void {
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
		return;
	}

	event.preventDefault();
	window.scrollTo(0, 0);
	window.requestAnimationFrame(() => {
		pageTop?.focus({ preventScroll: true });
		window.scrollTo(0, 0);
	});
}

export function measureCollapsibleElements(collapsibleElements: CollapsibleElement[]): void {
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

export function measureHeaderIdentity(
	{ headerIdentity, compactHeaderIdentity }: ScrollStateElements,
	headerIdentityHeights: HeaderIdentityHeights,
): void {
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

export function updateCollapsibleElements(
	collapsibleElements: CollapsibleElement[],
	progress: number,
): void {
	for (const { element, height } of collapsibleElements) {
		const remaining = 1 - progress;

		element.style.height = `${height * remaining}px`;
		element.style.opacity = String(remaining);
		element.toggleAttribute("inert", progress === 1);
	}
}

export function updateHeaderIdentity(
	{ headerIdentity, compactHeaderIdentity, headerIdentityTransition }: ScrollStateElements,
	headerIdentityHeights: HeaderIdentityHeights,
	progress: number,
): void {
	if (
		!headerIdentity ||
		!compactHeaderIdentity ||
		!headerIdentityTransition ||
		headerIdentityHeights.normal === 0 ||
		headerIdentityHeights.compact === 0
	) {
		return;
	}

	const { compactIdentityProgress, isCompactIdentity } = getHeaderIdentityProgress(progress);

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

export function resetHeaderIdentityStyles({
	headerIdentity,
	compactHeaderIdentity,
	headerIdentityTransition,
}: ScrollStateElements): void {
	headerIdentityTransition?.style.removeProperty("height");
	headerIdentity?.style.removeProperty("opacity");
	headerIdentity?.style.removeProperty("transform");
	compactHeaderIdentity?.style.removeProperty("opacity");
	compactHeaderIdentity?.style.removeProperty("transform");
}

export function resetCollapsibleElements(collapsibleElements: CollapsibleElement[]): void {
	for (const { element } of collapsibleElements) {
		element.style.removeProperty("height");
		element.style.removeProperty("opacity");
		element.removeAttribute("data-collapsed");
		element.removeAttribute("inert");
	}
}

export function updateMobileScrollState(
	{ header, collapsibleElements }: ScrollStateElements,
	scrollY: number,
): void {
	const detailsCollapsed = isMobileDetailsCollapsed(scrollY);

	header?.toggleAttribute("data-scrolled", scrollY > 0);

	for (const { element } of collapsibleElements) {
		element.toggleAttribute("data-collapsed", detailsCollapsed);
		element.toggleAttribute("inert", detailsCollapsed);
	}
}

export function updateForcedCompactMobileHeader({
	header,
	footer,
	collapsibleElements,
}: ScrollStateElements): void {
	footer?.removeAttribute("data-expanded");
	header?.style.removeProperty("padding-top");
	header?.style.removeProperty("padding-bottom");

	for (const { element } of collapsibleElements) {
		element.setAttribute("data-collapsed", "");
		element.setAttribute("inert", "");
	}
}

export function updateDesktopScrollState(
	{ header, footer }: ScrollStateElements,
	initialHeaderPadding: HeaderPadding | null,
	progress: number,
	isAtPageBottom: boolean,
): void {
	header?.toggleAttribute("data-scrolled", progress > 0);
	header?.toggleAttribute("data-fully-compact", progress === 1);
	footer?.toggleAttribute("data-expanded", isAtPageBottom);

	if (!header || !initialHeaderPadding) {
		return;
	}

	const padding = getDesktopHeaderPadding(initialHeaderPadding, progress);
	header.style.paddingTop = `${padding.top}px`;
	header.style.paddingBottom = `${padding.bottom}px`;
}

export function updateForcedCompactDesktopHeader(
	elements: ScrollStateElements,
	headerIdentityHeights: HeaderIdentityHeights,
	isAtPageBottom: boolean,
): void {
	const { header, footer, collapsibleElements } = elements;

	footer?.toggleAttribute("data-expanded", isAtPageBottom);

	if (header) {
		header.style.paddingTop = `${headerScrollConfig.compactHeaderPadding}px`;
		header.style.paddingBottom = `${headerScrollConfig.compactHeaderPadding}px`;
	}

	updateHeaderIdentity(elements, headerIdentityHeights, 1);
	updateCollapsibleElements(collapsibleElements, 1);
}

export function prepareForPrint(collapsibleElements: CollapsibleElement[]): void {
	resetCollapsibleElements(collapsibleElements);
}

export function markCollapsibleElementsReady(collapsibleElements: CollapsibleElement[]): void {
	for (const { element } of collapsibleElements) {
		element.setAttribute("data-ready", "");
	}
}
