import {
	bindBackToTop, keepFocusClear, markCollapsibleElementsReady, measureHeaderElements, observeHeaderElements, queryScrollStateElements, resetCollapsibleElements, resetDesktopHeaderStyles,
	resetHeaderIdentityStyles, updateBackToTopVisibility, updateCollapsibleElements, updateDesktopScrollState,
	updateHeaderIdentity, updateMobileScrollState,
} from "@/src/components/utils/behavior/header-scroll-dom";
import { isDocumentAtBottom } from "@/src/components/utils/behavior/header-scroll-state";


export function initializeScrollStateController(): void {
	const desktopViewport = matchMedia("(min-width: 40rem)");

	queryScrollStateElements();

	let animationFrame: number | undefined;
	let collapseMode: "desktop" | "mobile" | undefined;
	let focusCheckDeadline = 0;
	let hasPendingFocusCheck = false;

	function checkFocus(): void {
		if (hasPendingFocusCheck) {
			hasPendingFocusCheck = false;
			focusCheckDeadline = performance.now() + 600;
		}

		if (performance.now() < focusCheckDeadline) keepFocusClear();
	}

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
			checkFocus();
			return;
		}

		const progress = Math.min(scrollY / 180, 1);

		setCollapseMode("desktop");
		updateDesktopScrollState(progress, isDocumentAtBottom());
		updateHeaderIdentity(progress);
		updateCollapsibleElements(progress);
		checkFocus();
	}

	function scheduleScrollStateUpdate(): void {
		if (animationFrame !== undefined) return;
		animationFrame = requestAnimationFrame(updateScrollState);
	}

	function handleScroll(): void {
		if (!desktopViewport.matches) {
			updateBackToTopVisibility();
			updateMobileScrollState();
			checkFocus();
			return;
		}

		scheduleScrollStateUpdate();
	}

	function handleObservedResize(): void {
		measureHeaderElements();
		scheduleScrollStateUpdate();
	}

	addEventListener("scroll", handleScroll, { passive: true });
	addEventListener("focusin", () => {
		hasPendingFocusCheck = true;
		scheduleScrollStateUpdate();
	});
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
