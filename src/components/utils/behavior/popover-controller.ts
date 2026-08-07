import { bindOverlayHover, clearOverlayTimer, collectOverlays, type Overlay } from "@/src/components/utils/behavior/overlay";
import { isDesktopPointer, onPointerModeChange } from "@/src/components/utils/behavior/pointer-mode";
import { closeOpenTooltips } from "@/src/components/utils/behavior/tooltip-controller";

type PopoverItem = Overlay & {
	backdrop: HTMLElement;
	closeButton: HTMLButtonElement;
	isRestoringFocus: boolean;
};

let popovers: PopoverItem[] = [];
let isInitialized = false;

function isPopoverOpen(popover: PopoverItem): boolean {
	return !popover.panel.hidden;
}

function closePopover(popover: PopoverItem, returnFocus = false): void {
	clearOverlayTimer(popover);
	if (!isPopoverOpen(popover)) return;

	const focusWasInPanel = popover.panel.contains(document.activeElement);
	popover.panel.hidden = true;
	popover.backdrop.hidden = true;
	popover.trigger.setAttribute("aria-expanded", "false");
	if (!returnFocus || !focusWasInPanel) return;

	popover.isRestoringFocus = true;
	popover.trigger.focus();
	popover.isRestoringFocus = false;
}

function openPopover(popover: PopoverItem): void {
	clearOverlayTimer(popover);
	const isTouch = !isDesktopPointer();

	if (isTouch) {
		for (const other of popovers) if (other !== popover) closePopover(other);
		closeOpenTooltips();
	}

	popover.panel.hidden = false;
	popover.backdrop.hidden = false;
	popover.trigger.setAttribute("aria-expanded", "true");

	if (isTouch) popover.closeButton.focus();
}

export function initializePopoverController(): void {
	if (isInitialized) return;
	isInitialized = true;

	popovers = collectOverlays("popover").flatMap((overlay) => {
		const backdrop = overlay.root.querySelector<HTMLElement>("[data-popover-backdrop]");
		const closeButton = overlay.root.querySelector<HTMLButtonElement>("[data-popover-close]");
		return backdrop && closeButton ? [{ ...overlay, backdrop, closeButton, isRestoringFocus: false }] : [];
	});

	for (const popover of popovers) {
		bindOverlayHover(popover, () => { if (!popover.isRestoringFocus) openPopover(popover) }, () => closePopover(popover));

		popover.trigger.addEventListener("click", () => {
			if (!isDesktopPointer() && isPopoverOpen(popover)) closePopover(popover);
			else openPopover(popover);
		});

		popover.closeButton.addEventListener("click", () => closePopover(popover, true));
		popover.backdrop.addEventListener("pointerdown", () => { if (!isDesktopPointer()) closePopover(popover, true) });
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

	onPointerModeChange(() => { for (const popover of popovers) closePopover(popover, true) });
}
