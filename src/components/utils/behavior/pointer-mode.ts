const desktopPointerMediaQuery = window.matchMedia("(min-width: 40rem) and (hover: hover) and (pointer: fine)");

export function isDesktopPointer(): boolean {
	return desktopPointerMediaQuery.matches;
}

export function onPointerModeChange(callback: () => void): void {
	desktopPointerMediaQuery.addEventListener("change", callback);
}
