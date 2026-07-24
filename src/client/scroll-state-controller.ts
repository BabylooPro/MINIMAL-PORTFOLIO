import {
	getScrollStateElements,
	type HeaderIdentityHeights,
	markCollapsibleElementsReady,
	measureCollapsibleElements,
	measureHeaderIdentity,
	prepareForPrint,
	readInitialHeaderPadding,
	resetCollapsibleElements,
	resetHeaderIdentityStyles,
	returnFocusToPageTop,
	updateBackToTopVisibility,
	updateCollapsibleElements,
	updateDesktopScrollState,
	updateForcedCompactDesktopHeader,
	updateForcedCompactMobileHeader,
	updateHeaderIdentity,
	updateMobileScrollState,
} from "./header-scroll-dom";
import {
	getDesktopScrollProgress,
	type HeaderPadding,
	isAtPageBottom,
} from "./header-scroll-state";

let isScrollStateControllerInitialized = false;

export function initializeScrollStateController(): void {
	if (isScrollStateControllerInitialized) {
		return;
	}

	isScrollStateControllerInitialized = true;

	const desktopViewport = window.matchMedia("(min-width: 40rem)");
	const elements = getScrollStateElements();
	let initialHeaderPadding: HeaderPadding | null = null;
	const headerIdentityHeights: HeaderIdentityHeights = { compact: 0, normal: 0 };
	let animationFrame: number | undefined;
	let collapseMode: "desktop" | "mobile" | undefined;

	function isDocumentAtBottom(): boolean {
		return isAtPageBottom({
			documentHeight: document.documentElement.scrollHeight,
			scrollY: window.scrollY,
			viewportHeight: window.innerHeight,
		});
	}

	function setCollapseMode(mode: "desktop" | "mobile"): boolean {
		if (collapseMode === mode) {
			return false;
		}

		collapseMode = mode;
		resetCollapsibleElements(elements.collapsibleElements);
		resetHeaderIdentityStyles(elements);

		return true;
	}

	function updateForcedCompactHeader(): void {
		if (!elements.header?.hasAttribute("data-force-compact")) {
			return;
		}

		elements.header.setAttribute("data-scrolled", "");
		elements.header.setAttribute("data-fully-compact", "");

		if (!desktopViewport.matches) {
			updateForcedCompactMobileHeader(elements);
			return;
		}

		updateForcedCompactDesktopHeader(elements, headerIdentityHeights, isDocumentAtBottom());
	}

	function updateScrollState(): void {
		animationFrame = undefined;
		updateBackToTopVisibility(elements.backToTop, window.scrollY);

		if (elements.header?.hasAttribute("data-force-compact")) {
			setCollapseMode(desktopViewport.matches ? "desktop" : "mobile");
			updateForcedCompactHeader();
			return;
		}

		if (!desktopViewport.matches) {
			if (setCollapseMode("mobile")) {
				elements.header?.removeAttribute("data-fully-compact");
				elements.footer?.removeAttribute("data-expanded");
				elements.header?.style.removeProperty("padding-top");
				elements.header?.style.removeProperty("padding-bottom");
			}

			updateMobileScrollState(elements, window.scrollY);
			return;
		}

		const progress = getDesktopScrollProgress(window.scrollY);

		setCollapseMode("desktop");
		initialHeaderPadding ??= readInitialHeaderPadding(elements.header);
		updateDesktopScrollState(elements, initialHeaderPadding, progress, isDocumentAtBottom());
		updateHeaderIdentity(elements, headerIdentityHeights, progress);
		updateCollapsibleElements(elements.collapsibleElements, progress);
	}

	function scheduleScrollStateUpdate(): void {
		if (animationFrame !== undefined) {
			return;
		}

		animationFrame = window.requestAnimationFrame(updateScrollState);
	}

	function handleScroll(): void {
		if (!desktopViewport.matches) {
			updateBackToTopVisibility(elements.backToTop, window.scrollY);
			updateMobileScrollState(elements, window.scrollY);
			return;
		}

		scheduleScrollStateUpdate();
	}

	function handleObservedResize(): void {
		measureHeaderIdentity(elements, headerIdentityHeights);
		measureCollapsibleElements(elements.collapsibleElements);
		scheduleScrollStateUpdate();
	}

	window.addEventListener("scroll", handleScroll, { passive: true });
	window.addEventListener("resize", scheduleScrollStateUpdate);
	window.addEventListener("pageshow", updateScrollState);
	window.addEventListener("beforeprint", () => prepareForPrint(elements.collapsibleElements));
	window.addEventListener("afterprint", updateScrollState);

	elements.backToTop?.addEventListener("click", (event) =>
		returnFocusToPageTop(event, elements.pageTop),
	);

	desktopViewport.addEventListener("change", updateScrollState);

	const resizeObserver = new ResizeObserver(handleObservedResize);

	if (elements.headerIdentity) {
		resizeObserver.observe(elements.headerIdentity);
	}

	if (elements.compactHeaderIdentity) {
		resizeObserver.observe(elements.compactHeaderIdentity);
	}

	for (const { content } of elements.collapsibleElements) {
		if (content) {
			resizeObserver.observe(content);
		}
	}

	measureHeaderIdentity(elements, headerIdentityHeights);
	measureCollapsibleElements(elements.collapsibleElements);
	markCollapsibleElementsReady(elements.collapsibleElements);
	updateScrollState();
}
