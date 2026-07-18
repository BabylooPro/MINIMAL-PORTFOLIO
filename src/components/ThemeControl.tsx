type ThemePreference = "light" | "dark" | "system";

const themePreferences: { label: string; value: ThemePreference }[] = [
	{ label: "System", value: "system" },
	{ label: "Light", value: "light" },
	{ label: "Dark", value: "dark" },
];

const defaultPreference: ThemePreference = "system";

export function ThemeControl() {
	return (
		<fieldset className="theme-control no-print">
			<legend className="sr-only">Color theme</legend>
			{themePreferences.map(({ label, value }) => (
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
