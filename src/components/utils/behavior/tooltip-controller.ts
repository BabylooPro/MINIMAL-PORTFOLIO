import { bindOverlayHover, clearOverlayTimer, collectOverlays, isOverlayEngaged, type Overlay } from "@/src/components/utils/behavior/overlay";
import { isDesktopGesture, isDesktopPointer, onPointerModeChange } from "@/src/components/utils/behavior/pointer-mode";

const tooltipGap = 8;
const viewportInset = 16;

let tooltips: Overlay[] = [];

function applyAttribute(element: HTMLElement, name: string, value: string | null): void {
	if (value === null) element.removeAttribute(name);
	else element.setAttribute(name, value);
}

function updateTooltipPlacement({ panel, trigger }: Overlay): void {
	panel.style.removeProperty("max-height");

	const triggerRect = trigger.getBoundingClientRect();
	const panelRect = panel.getBoundingClientRect();

	const spaceAbove = triggerRect.top - tooltipGap - viewportInset;
	const spaceBelow = innerHeight - triggerRect.bottom - tooltipGap - viewportInset;
	const above = panelRect.height > spaceBelow && spaceAbove > spaceBelow;

	const minimumLeft = viewportInset + panelRect.width / 2;
	const maximumLeft = innerWidth - viewportInset - panelRect.width / 2;
	const left = Math.max(minimumLeft, Math.min(triggerRect.left + triggerRect.width / 2, maximumLeft));

	panel.dataset.tooltipPlacement = above ? "above" : "below";
	panel.style.maxHeight = `${Math.max(0, above ? spaceAbove : spaceBelow)}px`;
	panel.style.setProperty("--tooltip-left", `${left}px`);
	panel.style.setProperty("--tooltip-top", `${above ? triggerRect.top - tooltipGap : triggerRect.bottom + tooltipGap}px`);
}

function isTooltipOpen({ panel }: Overlay): boolean {
	return panel.dataset.open === "true";
}

function syncTooltipSemantics({ panel, trigger }: Overlay): void {
	const isDesktop = isDesktopPointer();
	const isOpen = panel.dataset.open === "true";

	panel.setAttribute("role", isDesktop ? "tooltip" : "status");
	panel.setAttribute("aria-live", isDesktop ? "off" : "polite");
	applyAttribute(panel, "aria-hidden", isDesktop ? null : String(!isOpen));
	applyAttribute(trigger, "aria-describedby", isDesktop ? panel.id : null);
	applyAttribute(trigger, "aria-controls", isDesktop ? null : panel.id);
	applyAttribute(trigger, "aria-expanded", isDesktop ? null : String(isOpen));
}

function closeTooltip(tooltip: Overlay): void {
	if (!isTooltipOpen(tooltip)) return;
	delete tooltip.panel.dataset.open;
	syncTooltipSemantics(tooltip);
}

function openTooltip(tooltip: Overlay): void {
	tooltip.panel.dataset.open = "true";
	syncTooltipSemantics(tooltip);
	updateTooltipPlacement(tooltip);
}

export function closeOpenTooltips(): void {
	for (const tooltip of tooltips) closeTooltip(tooltip);
}

export function initializeTooltipController(): void {
	tooltips = collectOverlays("tooltip");

	for (const tooltip of tooltips) {
		syncTooltipSemantics(tooltip);
		bindOverlayHover(tooltip, () => openTooltip(tooltip), () => closeTooltip(tooltip));

		tooltip.trigger.addEventListener("click", () => {
			if (isDesktopGesture()) return;

			const opens = !isTooltipOpen(tooltip);
			closeOpenTooltips();
			if (opens) openTooltip(tooltip);
		});
	}

	document.addEventListener("pointerdown", (event) => {
		if (isDesktopGesture()) return;
		for (const tooltip of tooltips) if (!tooltip.root.contains(event.target as Node)) closeTooltip(tooltip);
	});

	document.addEventListener("keydown", (event) => {
		if (event.key !== "Escape") return;

		const isDesktop = isDesktopPointer();
		const affected = tooltips.filter((tooltip) => (isDesktop ? isOverlayEngaged(tooltip) : isTooltipOpen(tooltip)));

		for (const tooltip of affected) {
			clearOverlayTimer(tooltip);
			closeTooltip(tooltip);
		}

		if (affected.length > 0) event.preventDefault();
	});

	let animationFrame: number | undefined;
	function updateOpenTooltips(): void {
		if (animationFrame !== undefined) return;
		animationFrame = requestAnimationFrame(() => {
			animationFrame = undefined;
			for (const tooltip of tooltips) if (isTooltipOpen(tooltip)) updateTooltipPlacement(tooltip);
		});
	}

	onPointerModeChange(() => {
		for (const tooltip of tooltips) {
			clearOverlayTimer(tooltip);
			delete tooltip.panel.dataset.open;
			syncTooltipSemantics(tooltip);
		}
	});

	addEventListener("resize", updateOpenTooltips);
	addEventListener("scroll", updateOpenTooltips, { passive: true });
}
