import type { ReactNode } from "react";

type TooltipProps = {
	children: ReactNode;
	id: string;
	interactive?: boolean;
	label: string;
	mobilePlacement?: "centered" | "anchored";
	trigger: ReactNode;
};

export function Tooltip({ children, id, interactive = false, label, mobilePlacement = "centered", trigger }: TooltipProps) {
	return (
		<div
			className={[
				"group relative flex [@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:static",
				mobilePlacement === "anchored" ? "[anchor-scope:--tooltip-trigger]" : "",
				"[&:has(details[open])]:[--info-tooltip-opacity:1] [&:has(details[open])]:[--info-tooltip-pointer-events:auto]"
			].join(" ")}
		>
			<button
				aria-describedby={id}
				aria-label={label}
				className={[
					// DESKTOP TRIGGER
					"relative hidden [@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:flex",
					"rounded-full p-0.5 text-(--muted-color) hover:text-(--foreground-color)",
					// KEYBOARD ACCESSIBILITY
					"focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:outline-offset-2",
					// HOVER BRIDGE FOR INTERACTIVE CONTENT
					interactive ? [
						"after:absolute after:right-0 after:top-full after:z-20 after:h-2 after:w-[min(24rem,calc(100vw-2rem))] after:content-['']",
						"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:after:left-1/2",
						"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:after:right-auto",
						"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:after:-translate-x-1/2"
					].join(" ") : "",
				].join(" ")}
				type="button"
			>
				{trigger}
			</button>

			<details className="group relative flex [@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:hidden" data-mobile-tooltip={mobilePlacement === "anchored" ? "" : undefined}>
				<summary
					aria-describedby={id}
					aria-label={label}
					className={[
						// NATIVE TRIGGER & APPEARANCE
						"relative list-none rounded-full p-0.5 text-(--muted-color) hover:text-(--foreground-color) [&::-webkit-details-marker]:hidden",
						mobilePlacement === "anchored" ? "[anchor-name:--tooltip-trigger]" : "",
						// KEYBOARD ACCESSIBILITY
						"focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:outline-offset-2",
						// TAP-OUTSIDE LAYER WHILE OPEN
						"group-open:before:fixed group-open:before:inset-0 group-open:before:z-20 group-open:before:content-['']",
						interactive ? "group-open:before:backdrop-blur-sm" : "",
					].join(" ")}
				>
					{trigger}
				</summary>
			</details>

			<div
				className={[
					// PANEL SURFACE & CONTENT STYLE
					"rounded-md border border-(--border-color) bg-(--background-color) p-3 text-sm leading-5 text-(--body-color) shadow-lg",
					// HIDDEN STATE & MOTION
					"opacity-(--info-tooltip-opacity,0) transition-opacity motion-reduce:transition-none",
					// KEYBOARD INTERACTIONS
					interactive ? "[pointer-events:var(--info-tooltip-pointer-events,none)]" : "pointer-events-none",

					// MOBILE/TABLET TOUCH
					mobilePlacement === "anchored" ? [
						"absolute left-1/2 top-full z-50 mt-2 max-h-[calc(100dvh-2rem)] w-max max-w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 overflow-y-auto",
						"[@media(max-width:39.999rem)_or_(hover:none)_or_(pointer:coarse)]:[position-anchor:--tooltip-trigger]",
						"[@media(max-width:39.999rem)_or_(hover:none)_or_(pointer:coarse)]:left-[calc(anchor(center)+var(--mobile-tooltip-offset-x,0px))]",
						"[@media(max-width:39.999rem)_or_(hover:none)_or_(pointer:coarse)]:top-[anchor(bottom)]",
						"[@media(max-width:39.999rem)_or_(hover:none)_or_(pointer:coarse)]:supports-[position-anchor:--tooltip-trigger]:fixed",
						"[@media(max-width:39.999rem)_or_(hover:none)_or_(pointer:coarse)]:data-[mobile-tooltip-placement=above]:top-[anchor(top)]",
						"[@media(max-width:39.999rem)_or_(hover:none)_or_(pointer:coarse)]:data-[mobile-tooltip-placement=above]:mt-0",
						"[@media(max-width:39.999rem)_or_(hover:none)_or_(pointer:coarse)]:data-[mobile-tooltip-placement=above]:[translate:-50%_calc(-100%-0.5rem)]"
					].join(" ") : "fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-max max-w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
					[
						"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:absolute",
						"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:top-full",
						"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:mt-2",
						"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:max-h-none",
						"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:max-w-96",
						"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:translate-y-0"
					].join(" "),
					// DESKTOP HOVER
					"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:group-focus-within:[--info-tooltip-opacity:1]",
					"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:group-hover:[--info-tooltip-opacity:1]",
					interactive ? [
						"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:group-focus-within:[--info-tooltip-pointer-events:auto]",
						"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:group-hover:[--info-tooltip-pointer-events:auto]"
					].join(" ") : "",
				].join(" ")}
				data-tooltip-panel
				id={id}
				role={interactive ? undefined : "tooltip"}
			>
				{children}
			</div>
		</div>
	);
}
