const desktopPointerMediaQuery = matchMedia("(min-width: 40rem) and (hover: hover) and (pointer: fine)");

let isTouchGesture = false;

addEventListener("pointerover", (event) => { isTouchGesture = event.pointerType === "touch" }, true);
addEventListener("keydown", () => { isTouchGesture = false }, true);

export function isDesktopPointer(): boolean {
	return desktopPointerMediaQuery.matches;
}

export function isDesktopGesture(): boolean {
	return desktopPointerMediaQuery.matches && !isTouchGesture;
}

export function onPointerModeChange(callback: () => void): void {
	desktopPointerMediaQuery.addEventListener("change", callback);
}
