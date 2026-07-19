import type { Messages } from "../i18n/messages/types";

type ThemePreference = "light" | "dark" | "system";

type ThemeControlProps = {
	theme: Messages["theme"];
};

const defaultPreference: ThemePreference = "system";

export function ThemeControl({ theme }: ThemeControlProps) {
	const preferences: { label: string; value: ThemePreference }[] = [
		{ label: theme.system, value: "system" },
		{ label: theme.light, value: "light" },
		{ label: theme.dark, value: "dark" },
	];

	return (
		<fieldset className="theme-control no-print">
			<legend className="sr-only">{theme.legend}</legend>
			{preferences.map(({ label, value }) => (
				<button
					aria-pressed={defaultPreference === value}
					className={
						defaultPreference === value
							? "theme-option theme-option-active"
							: "theme-option"
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
