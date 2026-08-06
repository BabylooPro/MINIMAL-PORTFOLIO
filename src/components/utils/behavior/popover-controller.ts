import { getPointerMode, onPointerModeChange, type PointerMode } from "@/src/components/utils/behavior/pointer-mode";
import { closeOpenToggletips } from "@/src/components/utils/behavior/tooltip-controller";

type PopoverItem = {
	backdrop: HTMLElement;
	closeButton: HTMLButtonElement;
	isRestoringFocus: boolean;
	panel: HTMLElement;
	root: HTMLElement;
	timer: number | undefined;
	trigger: HTMLButtonElement;
};

const params = {
	hoverOpenDelay: 300,
	hoverCloseDelay: 150,
};

const state = {
	isInitialized: false,
};

function isPopoverOpen(popover: PopoverItem): boolean {
	return !popover.panel.hidden;
}

function clearPopoverTimer(popover: PopoverItem): void {
	if (popover.timer !== undefined) window.clearTimeout(popover.timer);
	popover.timer = undefined;
}

export function initializePopoverController(): void {
	if (state.isInitialized) return;
	state.isInitialized = true;

	const popovers: PopoverItem[] = [...document.querySelectorAll<HTMLElement>("[data-popover]")].flatMap((root) => {
		const trigger = root.querySelector<HTMLButtonElement>("[data-popover-trigger]");
		const panel = root.querySelector<HTMLElement>("[data-popover-panel]");
		const backdrop = root.querySelector<HTMLElement>("[data-popover-backdrop]");
		const closeButton = root.querySelector<HTMLButtonElement>("[data-popover-close]");
		return trigger && panel && backdrop && closeButton ? [{ backdrop, closeButton, isRestoringFocus: false, panel, root, timer: undefined, trigger }] : [];
	});

	function closePopover(popover: PopoverItem, returnFocus = false): void {
		clearPopoverTimer(popover);

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

	const preparePopoverOpen: Record<PointerMode, (popover: PopoverItem) => void> = {
		desktop: () => undefined,
		touch: (popover) => {
			popovers.filter((otherPopover) => otherPopover !== popover).forEach((otherPopover) => { closePopover(otherPopover) });
			closeOpenToggletips();
		},
	};

	function openPopover(popover: PopoverItem): void {
		clearPopoverTimer(popover);
		preparePopoverOpen[getPointerMode()](popover);

		popover.panel.hidden = false;
		popover.backdrop.hidden = false;
		popover.trigger.setAttribute("aria-expanded", "true");

		if (getPointerMode() === "touch") popover.closeButton.focus();
	}

	function schedulePopoverClose(popover: PopoverItem): void {
		clearPopoverTimer(popover);
		popover.timer = window.setTimeout(() => {
			if (!popover.trigger.matches(":hover") && !popover.panel.matches(":hover") && !popover.root.contains(document.activeElement)) closePopover(popover);
		}, params.hoverCloseDelay);
	}

	function togglePopover(popover: PopoverItem): void {
		const action = isPopoverOpen(popover) ? closePopover : openPopover;
		action(popover);
	}

	function onDesktopPointer(callback: () => void): () => void {
		return () => { if (getPointerMode() === "desktop") callback() };
	}

	const popoverClickActions: Record<PointerMode, (popover: PopoverItem) => void> = {
		desktop: openPopover,
		touch: togglePopover,
	};

	for (const popover of popovers) {
		popover.trigger.addEventListener("pointerenter", onDesktopPointer(() => { clearPopoverTimer(popover); popover.timer = window.setTimeout(() => openPopover(popover), params.hoverOpenDelay); }));
		popover.trigger.addEventListener("pointerleave", onDesktopPointer(() => schedulePopoverClose(popover)));
		popover.panel.addEventListener("pointerenter", onDesktopPointer(() => clearPopoverTimer(popover)));
		popover.panel.addEventListener("pointerleave", onDesktopPointer(() => schedulePopoverClose(popover)));
		popover.trigger.addEventListener("focus", onDesktopPointer(() => { if (!popover.isRestoringFocus) openPopover(popover) }));
		popover.trigger.addEventListener("blur", onDesktopPointer(() => schedulePopoverClose(popover)));
		popover.panel.addEventListener("focusin", onDesktopPointer(() => clearPopoverTimer(popover)));
		popover.panel.addEventListener("focusout", onDesktopPointer(() => schedulePopoverClose(popover)));
		popover.trigger.addEventListener("click", () => popoverClickActions[getPointerMode()](popover));
		popover.closeButton.addEventListener("click", () => closePopover(popover, true));
		popover.backdrop.addEventListener("pointerdown", () => { if (getPointerMode() === "touch") closePopover(popover, true) });
	}

	document.addEventListener("pointerdown", (event) => {
		popovers.filter((popover) => isPopoverOpen(popover) && !popover.root.contains(event.target as Node)).forEach((popover) => { closePopover(popover, true) });
	});

	document.addEventListener("keydown", (event) => {
		if (event.key !== "Escape") return;

		const openPopovers = popovers.filter(isPopoverOpen);
		openPopovers.forEach((popover) => { closePopover(popover, true) });
		if (openPopovers.length > 0) event.preventDefault();
	});

	onPointerModeChange(() => { popovers.forEach((popover) => { closePopover(popover) }) });
}
