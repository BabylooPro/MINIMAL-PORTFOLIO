const mobileMediaQuery = window.matchMedia("(max-width: 39.999rem)");
let isTooltipControllerInitialized = false;

export function initializeTooltipController(): void {
	if (isTooltipControllerInitialized) return;
	isTooltipControllerInitialized = true;

	const tooltips = [...document.querySelectorAll<HTMLDetailsElement>("[data-mobile-tooltip]")];
	if (tooltips.length === 0) return;

	function updatePlacement(tooltip: HTMLDetailsElement): void {
		const trigger = tooltip.querySelector<HTMLElement>("summary");
		const panel = tooltip.parentElement?.querySelector<HTMLElement>("[data-tooltip-panel]");
		if (!trigger || !panel) return;

		if (!mobileMediaQuery.matches || !tooltip.open) {
			delete panel.dataset.mobileTooltipPlacement;
			return;
		}

		const triggerRect = trigger.getBoundingClientRect();
		const panelHeight = panel.getBoundingClientRect().height;
		const spaceAbove = triggerRect.top;
		const spaceBelow = window.innerHeight - triggerRect.bottom;
		const tooltipGap = 8;

		if (spaceAbove >= panelHeight + tooltipGap && spaceAbove > spaceBelow) {
			panel.dataset.mobileTooltipPlacement = "above";
			return;
		}

		delete panel.dataset.mobileTooltipPlacement;
	}

	function updateOpenTooltips(): void {
		for (const tooltip of tooltips) updatePlacement(tooltip);
	}

	for (const tooltip of tooltips) {
		tooltip.addEventListener("toggle", () => {
			if (tooltip.open) {
				for (const otherTooltip of tooltips) {
					if (otherTooltip !== tooltip) otherTooltip.open = false;
				}
			}

			requestAnimationFrame(updateOpenTooltips);
		});
	}

	window.addEventListener("resize", updateOpenTooltips);
	window.addEventListener("scroll", updateOpenTooltips, { passive: true });
	mobileMediaQuery.addEventListener("change", updateOpenTooltips);
}
