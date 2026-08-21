import type { ReactNode } from "react";

import type { Locale } from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n/dictionaries";

type PopoverProps = {
	children: ReactNode;
	id: string;
	label: string;
	locale: Locale;
	trigger: ReactNode;
};

export function Popover({ children, id, label, locale, trigger }: Readonly<PopoverProps>) {
	return (
		<div data-popover className="relative flex [@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:static">
			<button
				aria-controls={id}
				aria-expanded="false"
				aria-haspopup="dialog"
				aria-label={label}
				className={[
					"flex size-6 items-center justify-center rounded-full text-(--muted-color) hover:text-(--foreground-color)",
					"focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:outline-offset-2",
				].join(" ")}
				data-popover-trigger
				type="button"
			>
				{trigger}
			</button>

			<div
				className="fixed inset-0 z-20 backdrop-blur-sm [@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:hidden"
				data-popover-backdrop
				hidden
			/>

			<div
				aria-label={label}
				className={[
					// BASE STYLING
					"fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-max max-w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
					"rounded-md border border-(--border-color) bg-(--background-color) p-3 text-sm leading-5 text-(--body-color) shadow-lg",
					// DESKTOP/HOVER+POINTER OVERRIDES
					"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:absolute",
					"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:top-full",
					"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:z-30",
					"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:mt-2",
					"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:max-h-none",
					"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:max-w-96",
					"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:translate-y-0",
				].join(" ")}
				data-popover-panel
				hidden
				id={id}
				role="dialog"
			>
				<button
					aria-label={getDictionary(locale).messages.labels.close}
					className={[
						"absolute right-2 top-2 flex size-6 items-center justify-center rounded-sm text-lg leading-none text-(--muted-color)",
						"[@media(min-width:40rem)_and_(hover:hover)_and_(pointer:fine)]:hidden",
						"hover:text-(--foreground-color) focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:outline-offset-2",
					].join(" ")}
					data-popover-close
					type="button"
				>
					<span aria-hidden="true">×</span>
				</button>

				<div className="pr-8">
					{children}
				</div>
			</div>
		</div >
	);
}
