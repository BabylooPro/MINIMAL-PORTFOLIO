import type { Messages } from "../i18n/messages/types";

type ThemePreference = "light" | "dark" | "system";

type ThemeControlProps = {
	theme: Messages["theme"];
};

const defaultPreference: ThemePreference = "system";
const themeOptionClassName = [
	// LAYOUT & SIZING
	"px-2.5 py-2 text-xs leading-none",

	// BASIC INTERACTION
	"appearance-none cursor-pointer",

	// STATE: DEFAULT AND PRESSED
	"aria-[pressed=false]:bg-transparent",
	"aria-pressed:bg-(--foreground-color)",
	"aria-pressed:text-(--background-color)",

	// HOVER STATES
	"aria-[pressed=false]:hover:bg-(--inactive-hover-color)",
	"aria-pressed:hover:bg-(--active-hover-color)",

	// FOCUS
	"focus-visible:outline-2",
	"focus-visible:outline-current",
	"focus-visible:outline-solid",
	"focus-visible:-outline-offset-2",

	// FEATURE SUPPORT / COLOR-MIX VARIATIONS
	"supports-[color:color-mix(in_srgb,black,white)]:aria-[pressed=false]:hover:bg-[color-mix(in_srgb,var(--foreground-color)_10%,transparent)]",
	"supports-[color:color-mix(in_srgb,black,white)]:aria-pressed:hover:bg-[color-mix(in_srgb,var(--foreground-color)_85%,var(--background-color))]",
].join(" ");

export function ThemeControl({ theme }: ThemeControlProps) {
	const preferences: { label: string; value: ThemePreference }[] = [
		{ label: theme.system, value: "system" },
		{ label: theme.light, value: "light" },
		{ label: theme.dark, value: "dark" },
	];

	return (
		<fieldset className="no-print m-0 inline-flex min-is-0 flex-none overflow-hidden rounded-md border border-(--border-color) p-0">
			<legend className="sr-only">{theme.legend}</legend>
			{preferences.map(({ label, value }, index) => (
				<button
					aria-pressed={defaultPreference === value}
					className={
						index < preferences.length - 1
							? `${themeOptionClassName} border-r border-(--border-color)`
							: themeOptionClassName
					}
					data-theme-preference={value}
					key={value}
					type="button"
				>
					{label}
				</button>
			))}
		</fieldset>
	);
}
