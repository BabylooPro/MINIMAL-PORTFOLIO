import { isDesktopPointer } from "@/src/components/utils/behavior/pointer-mode";

export type Overlay = {
	panel: HTMLElement;
	root: HTMLElement;
	timer: number | undefined;
	trigger: HTMLButtonElement;
};

const hoverOpenDelay = 300;
const hoverCloseDelay = 150;

export function collectOverlays(name: string): Overlay[] {
	return [...document.querySelectorAll<HTMLElement>(`[data-${name}]`)].flatMap((root) => {
		const trigger = root.querySelector<HTMLButtonElement>(`[data-${name}-trigger]`);
		const panel = root.querySelector<HTMLElement>(`[data-${name}-panel]`);
		return trigger && panel ? [{ panel, root, timer: undefined, trigger }] : [];
	});
}

export function clearOverlayTimer(overlay: Overlay): void {
	window.clearTimeout(overlay.timer);
	overlay.timer = undefined;
}

export function isOverlayEngaged({ panel, root, trigger }: Overlay): boolean {
	return trigger.matches(":hover") || panel.matches(":hover") || root.contains(document.activeElement);
}

export function bindOverlayHover(overlay: Overlay, open: () => void, close: () => void): void {
	function onDesktop(action: () => void): () => void {
		return () => { if (isDesktopPointer()) action() };
	}

	function schedule(action: () => void, delay: number): void {
		clearOverlayTimer(overlay);
		overlay.timer = window.setTimeout(action, delay);
	}

	const scheduleClose = onDesktop(() => schedule(() => { if (!isOverlayEngaged(overlay)) close() }, hoverCloseDelay));
	const cancelClose = onDesktop(() => clearOverlayTimer(overlay));

	overlay.trigger.addEventListener("pointerenter", onDesktop(() => schedule(open, hoverOpenDelay)));
	overlay.trigger.addEventListener("focus", onDesktop(open));
	overlay.trigger.addEventListener("blur", scheduleClose);
	overlay.panel.addEventListener("pointerenter", cancelClose);
	overlay.panel.addEventListener("focusin", cancelClose);
	overlay.panel.addEventListener("focusout", scheduleClose);

	for (const element of [overlay.trigger, overlay.panel]) element.addEventListener("pointerleave", scheduleClose);
}
