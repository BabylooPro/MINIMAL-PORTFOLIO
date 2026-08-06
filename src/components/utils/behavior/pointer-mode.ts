const desktopPointerMediaQuery = window.matchMedia("(min-width: 40rem) and (hover: hover) and (pointer: fine)");

export type PointerMode = "desktop" | "touch";

export function getPointerMode(): PointerMode {
	return desktopPointerMediaQuery.matches ? "desktop" : "touch";
}

export function onPointerModeChange(callback: (mode: PointerMode) => void): void {
	desktopPointerMediaQuery.addEventListener("change", () => callback(getPointerMode()));
}
