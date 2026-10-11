import {
	bindBackToTop, markCollapsibleElementsReady, measureHeaderElements, observeHeaderElements, queryScrollStateElements, resetCollapsibleElements, resetDesktopHeaderStyles,
	resetHeaderIdentityStyles, updateBackToTopVisibility, updateCollapsibleElements, updateDesktopScrollState,
	updateHeaderIdentity, updateMobileScrollState,
} from "@/src/components/utils/behavior/header-scroll-dom";
import { isDocumentAtBottom, progressBetween } from "@/src/components/utils/behavior/header-scroll-state";


export function initializeScrollStateController(): void {
	const desktopViewport = matchMedia("(min-width: 40rem)");

	queryScrollStateElements();

	let animationFrame: number | undefined;
	let collapseMode: "desktop" | "mobile" | undefined;

	function setCollapseMode(mode: "desktop" | "mobile"): boolean {
		if (collapseMode === mode) return false;
		collapseMode = mode;

		resetCollapsibleElements();
		resetHeaderIdentityStyles();

		return true;
	}

	function updateScrollState(): void {
		animationFrame = undefined;
		updateBackToTopVisibility();

		if (!desktopViewport.matches) {
			if (setCollapseMode("mobile")) resetDesktopHeaderStyles();

			updateMobileScrollState();
			return;
		}

		const progress = progressBetween(scrollY, 0, 180);

		setCollapseMode("desktop");
		updateDesktopScrollState(progress, isDocumentAtBottom());
		updateHeaderIdentity(progress);
		updateCollapsibleElements(progress);
	}

	function scheduleScrollStateUpdate(): void {
		if (animationFrame !== undefined) return;
		animationFrame = requestAnimationFrame(updateScrollState);
	}

	function handleObservedResize(): void {
		measureHeaderElements();
		scheduleScrollStateUpdate();
	}

	addEventListener("scroll", scheduleScrollStateUpdate, { passive: true });
	addEventListener("resize", scheduleScrollStateUpdate);
	addEventListener("pageshow", updateScrollState);
	addEventListener("beforeprint", resetCollapsibleElements);
	addEventListener("afterprint", updateScrollState);

	bindBackToTop();

	desktopViewport.addEventListener("change", updateScrollState);

	observeHeaderElements(new ResizeObserver(handleObservedResize));

	measureHeaderElements();
	markCollapsibleElementsReady();
	updateScrollState();
}
