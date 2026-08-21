import type { ReactNode } from "react";

type TooltipProps = {
	children: ReactNode;
	id: string;
	trigger: ReactNode;
	triggerLabel: string;
};

export function Tooltip({ children, id, trigger, triggerLabel }: Readonly<TooltipProps>) {
	return (
		<div className="inline-flex" data-tooltip>
			<button
				aria-describedby={id}
				aria-label={triggerLabel}
				className={[
					"flex size-6 items-center justify-center rounded-full text-(--muted-color) hover:text-(--foreground-color)",
					"focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:outline-offset-2",
				].join(" ")}
				data-tooltip-trigger
				type="button"
			>
				{trigger}
			</button>

			<div
				aria-live="off"
				className={[
					// BASE STYLING
					"fixed left-(--tooltip-left,50%) top-(--tooltip-top,50%) z-30 max-h-[calc(100dvh-2rem)] w-max max-w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 overflow-y-auto",
					"rounded-md border border-(--border-color) bg-(--background-color) p-3 text-sm leading-5 text-(--body-color) shadow-lg",
					// TOOLTIP PLACEMENT
					"data-[tooltip-placement=above]:-translate-y-full",
					// HIDDEN STYLES AND TRANSITIONS
					"invisible pointer-events-none opacity-0 transition-opacity motion-reduce:transition-none",
					// OPEN (VISIBLE) STATE
					"data-[open=true]:visible data-[open=true]:pointer-events-auto data-[open=true]:opacity-100",
				].join(" ")}
				data-tooltip-panel
				id={id}
				role="tooltip"
			>
				{children}
			</div>
		</div>
	);
}
