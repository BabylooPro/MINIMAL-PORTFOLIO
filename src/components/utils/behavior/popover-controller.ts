import { bindOverlayHover, clearOverlayTimer, collectOverlays, type Overlay } from "@/src/components/utils/behavior/overlay";
import { isDesktopGesture, isDesktopPointer, onPointerModeChange } from "@/src/components/utils/behavior/pointer-mode";

type PopoverItem = Overlay & {
	backdrop: HTMLElement;
	closeButton: HTMLButtonElement;
	isRestoringFocus: boolean;
};

let popovers: PopoverItem[] = [];
let pageTop: HTMLElement | null = null;

function getHeaderBottom(): number {
	return pageTop?.getBoundingClientRect().bottom ?? 0;
}

function getFooterTop(): number {
	return (document.querySelector("[data-back-to-top]:not([hidden])") ?? document.querySelector("[data-page-footer]"))?.getBoundingClientRect().top ?? innerHeight;
}

function isPopoverOpen(popover: PopoverItem): boolean {
	return !popover.panel.hidden;
}

function syncOverlayBlur(): void {
	document.documentElement.toggleAttribute("data-overlay-blur", !isDesktopPointer() && popovers.some(isPopoverOpen));
}

function closePopover(popover: PopoverItem, returnFocus = false): void {
	clearOverlayTimer(popover);
	if (!isPopoverOpen(popover)) return;

	const focusWasInPanel = popover.panel.contains(document.activeElement);
	popover.panel.hidden = true;
	popover.panel.style.transform = "";
	popover.backdrop.hidden = true;
	popover.trigger.setAttribute("aria-expanded", "false");
	syncOverlayBlur();
	if (!returnFocus || !focusWasInPanel) return;

	const { bottom, top } = popover.trigger.getBoundingClientRect();
	popover.isRestoringFocus = true;
	popover.trigger.focus({ preventScroll: top >= getHeaderBottom() && bottom <= getFooterTop() });
	popover.isRestoringFocus = false;
}

function followScroll(popover: PopoverItem): void {
	if (!isDesktopPointer() || !isPopoverOpen(popover)) return;

	popover.panel.style.transform = "";
	if (!popover.panel.contains(document.activeElement)) {
		if (popover.trigger.getBoundingClientRect().bottom < getHeaderBottom()) closePopover(popover);
		return;
	}

	const shift = getHeaderBottom() + 8 - popover.panel.getBoundingClientRect().top;
	if (shift > 0) popover.panel.style.transform = `translateY(${shift}px)`;
}

function openPopover(popover: PopoverItem): void {
	clearOverlayTimer(popover);
	const isTouch = !isDesktopPointer();

	if (isTouch) {
		for (const other of popovers) if (other !== popover) closePopover(other);
	}

	popover.panel.hidden = false;
	popover.backdrop.hidden = false;
	popover.trigger.setAttribute("aria-expanded", "true");
	syncOverlayBlur();

	if (isTouch) popover.closeButton.focus();
}

export function initializePopoverController(): void {
	pageTop = document.querySelector<HTMLElement>("[data-page-top]");
	popovers = collectOverlays("popover").flatMap((overlay) => {
		const backdrop = overlay.root.querySelector<HTMLElement>("[data-popover-backdrop]");
		const closeButton = overlay.root.querySelector<HTMLButtonElement>("[data-popover-close]");
		return backdrop && closeButton ? [{ ...overlay, backdrop, closeButton, isRestoringFocus: false }] : [];
	});

	for (const popover of popovers) {
		bindOverlayHover(popover, () => { if (!popover.isRestoringFocus) openPopover(popover) }, () => closePopover(popover));

		popover.trigger.addEventListener("click", () => {
			if (!isDesktopGesture() && isPopoverOpen(popover)) closePopover(popover);
			else openPopover(popover);
		});

		popover.closeButton.addEventListener("click", () => closePopover(popover, true));
		popover.backdrop.addEventListener("pointerdown", () => { if (!isDesktopGesture()) closePopover(popover, true) });
	}

	document.addEventListener("pointerdown", (event) => {
		for (const popover of popovers) if (isPopoverOpen(popover) && !popover.root.contains(event.target as Node)) closePopover(popover, true);
	});

	document.addEventListener("keydown", (event) => {
		if (event.key !== "Escape") return;
		const hadOpenPopover = popovers.some(isPopoverOpen);
		for (const popover of popovers) closePopover(popover, true);
		if (hadOpenPopover) event.preventDefault();
	});

	addEventListener("scroll", () => { for (const popover of popovers) followScroll(popover) }, { passive: true });
	onPointerModeChange(() => { for (const popover of popovers) closePopover(popover, true) });
}
