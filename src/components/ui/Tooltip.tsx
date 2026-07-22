import type { ReactNode } from "react";

type TooltipProps = {
	children: ReactNode;
	id: string;
	label: string;
	trigger: ReactNode;
};

export function Tooltip({ children, id, label, trigger }: TooltipProps) {
	const desktopTooltipId = `${id}-desktop-tooltip`;
	const mobileTooltipId = `${id}-mobile-tooltip`;

	return (
		<>
			<span
				className={[
					// LAYOUT & BREAKPOINT
					"group relative hidden sm:flex",
					// HOVER BRIDGE TO THE PANEL
					"after:absolute after:right-0 after:top-full after:z-20 after:h-2 after:w-[min(24rem,calc(100vw-2rem))] after:content-[''] sm:after:left-1/2 sm:after:right-auto sm:after:-translate-x-1/2",
				].join(" ")}
			>
				<button
					aria-describedby={desktopTooltipId}
					aria-label={label}
					className={[
						// TRIGGER APPEARANCE
						"rounded-full p-0.5",
						"text-(--muted-color) hover:text-(--foreground-color)",
						// KEYBOARD ACCESSIBILITY
						"focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:outline-offset-2",
					].join(" ")}
					type="button"
				>
					{trigger}
				</button>

				<div
					className={[
						// ANCHOR & SIZE
						"absolute left-1/2 top-full z-20 mt-2 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2",
						// PANEL SURFACE
						"rounded-md border border-(--border-color) bg-(--background-color) p-3 shadow-lg",
						// CONTENT STYLE
						"text-sm leading-5 text-(--body-color)",
						// HIDDEN STATE & MOTION
						"opacity-(--info-tooltip-opacity,0) [pointer-events:var(--info-tooltip-pointer-events,none)] transition-opacity motion-reduce:transition-none",
						// REVEAL TRIGGERS
						"group-focus-within:[--info-tooltip-opacity:1] group-focus-within:[--info-tooltip-pointer-events:auto] group-hover:[--info-tooltip-opacity:1] group-hover:[--info-tooltip-pointer-events:auto]",
					].join(" ")}
					id={desktopTooltipId}
				>
					{children}
				</div>
			</span>

			<details className="group relative flex sm:hidden">
				<summary
					aria-describedby={mobileTooltipId}
					aria-label={label}
					className={[
						// NATIVE TRIGGER & APPEARANCE
						"relative list-none rounded-full p-0.5 text-(--muted-color) hover:text-(--foreground-color) [&::-webkit-details-marker]:hidden",
						// KEYBOARD ACCESSIBILITY
						"focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:outline-offset-2",
						// TAP-OUTSIDE LAYER WHILE OPEN
						"group-open:before:fixed group-open:before:inset-0 group-open:before:z-10 group-open:before:content-['']",
					].join(" ")}
				>
					{trigger}
				</summary>

				<div
					className={[
						// VIEWPORT-CENTERED, SCROLLABLE PANEL
						"fixed left-1/2 top-1/2 z-20 max-h-[calc(100dvh-2rem)] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
						// PANEL SURFACE & CONTENT STYLE
						"rounded-md border border-(--border-color) bg-(--background-color) p-3 text-sm leading-5 text-(--body-color) shadow-lg",
						// HIDDEN STATE & MOTION
						"opacity-(--info-tooltip-opacity,0) [pointer-events:var(--info-tooltip-pointer-events,none)] transition-opacity motion-reduce:transition-none",
						// REVEAL WHILE OPEN
						"group-open:[--info-tooltip-opacity:1] group-open:[--info-tooltip-pointer-events:auto]",
					].join(" ")}
					id={mobileTooltipId}
				>
					{children}
				</div>
			</details>
		</>
	);
}
