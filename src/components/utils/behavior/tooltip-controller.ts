const touchMediaQuery = window.matchMedia("(max-width: 39.999rem), (hover: none), (pointer: coarse)");
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

		if (!touchMediaQuery.matches || !tooltip.open) {
			delete panel.dataset.mobileTooltipPlacement;
			panel.style.removeProperty("--mobile-tooltip-offset-x");
			return;
		}

		const triggerRect = trigger.getBoundingClientRect();
		const panelHeight = panel.getBoundingClientRect().height;
		const spaceAbove = triggerRect.top;
		const spaceBelow = window.innerHeight - triggerRect.bottom;
		const tooltipGap = 8;

		Object.assign(
			panel.dataset,
			spaceAbove >= panelHeight + tooltipGap && spaceAbove > spaceBelow
				? { mobileTooltipPlacement: "above" }
				: (() => { delete panel.dataset.mobileTooltipPlacement; return {}; })()
		);

		panel.style.removeProperty("--mobile-tooltip-offset-x");

		const panelRect = panel.getBoundingClientRect();
		const viewportInset = 16;
		const offset = Math.min(Math.max(0, viewportInset - panelRect.left), window.innerWidth - viewportInset - panelRect.right);

		panel.style.setProperty("--mobile-tooltip-offset-x", `${offset}px`);
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
	touchMediaQuery.addEventListener("change", updateOpenTooltips);
}
