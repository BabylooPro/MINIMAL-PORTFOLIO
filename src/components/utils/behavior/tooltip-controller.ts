import { getPointerMode, onPointerModeChange, type PointerMode } from "@/src/components/utils/behavior/pointer-mode";

type TooltipItem = {
	panel: HTMLElement;
	root: HTMLElement;
	timer: number | undefined;
	trigger: HTMLButtonElement;
};

const params = {
	tooltipGap: 8,
	viewportInset: 16,
	hoverOpenDelay: 300,
	hoverCloseDelay: 150,
};

const state = {
	isInitialized: false,
};

function updateTooltipPlacement({ panel, trigger }: TooltipItem): void {
	panel.style.removeProperty("max-height");

	const triggerRect = trigger.getBoundingClientRect();
	const panelRect = panel.getBoundingClientRect();

	const spaceAbove = triggerRect.top - params.tooltipGap - params.viewportInset;
	const spaceBelow = window.innerHeight - triggerRect.bottom - params.tooltipGap - params.viewportInset;

	const above = panelRect.height <= spaceBelow ? false : spaceAbove > spaceBelow;
	const availableHeight = Math.max(0, above ? spaceAbove : spaceBelow);

	const minimumLeft = params.viewportInset + panelRect.width / 2;
	const maximumLeft = window.innerWidth - params.viewportInset - panelRect.width / 2;

	const left = Math.max(minimumLeft, Math.min(triggerRect.left + triggerRect.width / 2, maximumLeft));
	const top = above ? triggerRect.top - params.tooltipGap : triggerRect.bottom + params.tooltipGap;

	panel.dataset.tooltipPlacement = above ? "above" : "below";
	panel.style.maxHeight = `${availableHeight}px`;
	panel.style.setProperty("--tooltip-left", `${left}px`);
	panel.style.setProperty("--tooltip-top", `${top}px`);
}

function clearTooltipTimer(tooltip: TooltipItem): void {
	if (tooltip.timer !== undefined) window.clearTimeout(tooltip.timer);
	tooltip.timer = undefined;
}

function openDesktopTooltip(tooltip: TooltipItem): void {
	clearTooltipTimer(tooltip);
	delete tooltip.panel.dataset.dismissed;
	tooltip.panel.dataset.open = "true";
	updateTooltipPlacement(tooltip);
}

function scheduleDesktopTooltipClose(tooltip: TooltipItem): void {
	clearTooltipTimer(tooltip);
	tooltip.timer = window.setTimeout(() => {
		if (!tooltip.trigger.matches(":hover") && !tooltip.panel.matches(":hover") && !tooltip.root.contains(document.activeElement)) delete tooltip.panel.dataset.open;
	}, params.hoverCloseDelay);
}

const desktopActions: Record<PointerMode, (action: () => void) => void> = {
	desktop: (action) => action(),
	touch: () => undefined,
};

function runDesktopAction(action: () => void): void {
	desktopActions[getPointerMode()](action);
}

const tooltipSemantics: Record<PointerMode, (tooltip: TooltipItem) => void> = {
	desktop: ({ panel, trigger }) => {
		panel.removeAttribute("aria-hidden");
		panel.setAttribute("aria-live", "off");
		panel.setAttribute("role", "tooltip");
		trigger.setAttribute("aria-describedby", panel.id);
		trigger.removeAttribute("aria-controls");
		trigger.removeAttribute("aria-expanded");
	},
	touch: ({ panel, trigger }) => {
		panel.setAttribute("aria-hidden", String(panel.dataset.open !== "true"));
		panel.setAttribute("aria-live", "polite");
		panel.setAttribute("role", "status");
		trigger.removeAttribute("aria-describedby");
		trigger.setAttribute("aria-controls", panel.id);
		trigger.setAttribute("aria-expanded", String(panel.dataset.open === "true"));
	},
};

function syncTooltipSemantics(tooltip: TooltipItem): void {
	tooltipSemantics[getPointerMode()](tooltip);
}

function closeToggletips(tooltips: TooltipItem[]): void {
	for (const tooltip of tooltips) {
		delete tooltip.panel.dataset.open;
		syncTooltipSemantics(tooltip);
	}
}

function toggleToggletip(tooltip: TooltipItem, tooltips: TooltipItem[]): void {
	const opens = tooltip.panel.dataset.open !== "true";
	closeToggletips(tooltips);
	if (!opens) return;
	tooltip.panel.dataset.open = "true";
	syncTooltipSemantics(tooltip);
	updateTooltipPlacement(tooltip);
}

export function closeOpenToggletips(): void {
	if (getPointerMode() !== "touch") return;

	const tooltips: TooltipItem[] = [...document.querySelectorAll<HTMLElement>("[data-tooltip]")].flatMap((root) => {
		const trigger = root.querySelector<HTMLButtonElement>("[data-tooltip-trigger]");
		const panel = root.querySelector<HTMLElement>("[data-tooltip-panel]");
		return trigger && panel?.dataset.open === "true" ? [{ panel, root, timer: undefined, trigger }] : [];
	});
	closeToggletips(tooltips);
}

export function initializeTooltipController(): void {
	if (state.isInitialized) return;
	state.isInitialized = true;

	const tooltips: TooltipItem[] = [...document.querySelectorAll<HTMLElement>("[data-tooltip]")].flatMap((root) => {
		const trigger = root.querySelector<HTMLButtonElement>("[data-tooltip-trigger]");
		const panel = root.querySelector<HTMLElement>("[data-tooltip-panel]");
		return trigger && panel ? [{ panel, root, timer: undefined, trigger }] : [];
	});
	const tooltipClickActions: Record<PointerMode, (tooltip: TooltipItem) => void> = {
		desktop: () => undefined,
		touch: (tooltip) => toggleToggletip(tooltip, tooltips),
	};
	const dismissTooltipActions: Record<PointerMode, () => boolean> = {
		desktop: () => {
			const activeTooltips = tooltips.filter((tooltip) => tooltip.trigger.matches(":hover") || tooltip.panel.matches(":hover") || tooltip.root.contains(document.activeElement));
			for (const tooltip of activeTooltips) {
				clearTooltipTimer(tooltip);
				delete tooltip.panel.dataset.open;
				tooltip.panel.dataset.dismissed = "true";
			}
			return activeTooltips.length > 0;
		},
		touch: () => {
			const openTooltips = tooltips.filter((tooltip) => tooltip.panel.dataset.open === "true");
			closeToggletips(openTooltips);
			return openTooltips.length > 0;
		},
	};
	const outsidePointerDownActions: Record<PointerMode, (event: PointerEvent) => void> = {
		desktop: () => undefined,
		touch: (event) => closeToggletips(tooltips.filter((tooltip) => !tooltip.root.contains(event.target as Node))),
	};

	for (const tooltip of tooltips) {
		syncTooltipSemantics(tooltip);
		updateTooltipPlacement(tooltip);

		tooltip.trigger.addEventListener("click", () => tooltipClickActions[getPointerMode()](tooltip));
		tooltip.trigger.addEventListener("pointerenter", () => {
			runDesktopAction(() => {
				clearTooltipTimer(tooltip);
				tooltip.timer = window.setTimeout(() => openDesktopTooltip(tooltip), params.hoverOpenDelay);
			})
		});
		tooltip.trigger.addEventListener("pointerleave", () => { runDesktopAction(() => scheduleDesktopTooltipClose(tooltip)); });
		tooltip.panel.addEventListener("pointerenter", () => { runDesktopAction(() => clearTooltipTimer(tooltip)); });
		tooltip.panel.addEventListener("pointerleave", () => { runDesktopAction(() => scheduleDesktopTooltipClose(tooltip)); });
		tooltip.trigger.addEventListener("focus", () => { runDesktopAction(() => openDesktopTooltip(tooltip)); });
		tooltip.trigger.addEventListener("blur", () => { runDesktopAction(() => scheduleDesktopTooltipClose(tooltip)); });

		for (const element of [tooltip.trigger, tooltip.panel]) {
			element.addEventListener("pointerleave", () => {
				window.setTimeout(() => { if (!tooltip.trigger.matches(":hover") && !tooltip.panel.matches(":hover")) delete tooltip.panel.dataset.dismissed }, 0);
			});

			element.addEventListener("focusout", () => {
				window.setTimeout(() => { if (!tooltip.root.contains(document.activeElement)) delete tooltip.panel.dataset.dismissed }, 0);
			});
		}
	}

	document.addEventListener("pointerdown", (event) => {
		outsidePointerDownActions[getPointerMode()](event);
	});

	document.addEventListener("keydown", (event) => {
		if (event.key !== "Escape") return;
		if (dismissTooltipActions[getPointerMode()]()) event.preventDefault();
	});

	let animationFrame: number | undefined;
	function updateOpenTooltips(): void {
		if (animationFrame !== undefined) return;
		animationFrame = requestAnimationFrame(() => {
			animationFrame = undefined;
			for (const tooltip of tooltips) if (tooltip.panel.dataset.open === "true") updateTooltipPlacement(tooltip);
		});
	}

	onPointerModeChange(() => {
		for (const tooltip of tooltips) {
			clearTooltipTimer(tooltip);
			delete tooltip.panel.dataset.open;
			delete tooltip.panel.dataset.dismissed;
			syncTooltipSemantics(tooltip);
		}
	});

	window.addEventListener("resize", updateOpenTooltips);
	window.addEventListener("scroll", updateOpenTooltips, { passive: true });
}
