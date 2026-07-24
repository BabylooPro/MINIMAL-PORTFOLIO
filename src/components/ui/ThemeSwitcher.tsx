import type { Messages } from "../../i18n/messages/types";
import { MoonIcon } from "../svg/MoonIcon";
import { SunIcon } from "../svg/SunIcon";
import { SystemIcon } from "../svg/SystemIcon";
import { ChoiceSwitcher } from "./ChoiceSwitcher";

type ThemePreference = "light" | "dark" | "system";

type ThemeSwitcherProps = {
	theme: Messages["theme"];
};

const defaultPreference: ThemePreference = "system";

export function ThemeSwitcher({ theme }: ThemeSwitcherProps) {
	const preferences = [
		{
			buttonProps: { "data-theme-preference": "system" },
			icon: <SystemIcon />,
			id: "system",
			isSelected: defaultPreference === "system",
			label: theme.system,
		},
		{
			buttonProps: { "data-theme-preference": "light" },
			icon: <SunIcon />,
			id: "light",
			isSelected: defaultPreference === "light",
			label: theme.light,
		},
		{
			buttonProps: { "data-theme-preference": "dark" },
			icon: <MoonIcon />,
			id: "dark",
			isSelected: defaultPreference === "dark",
			label: theme.dark,
		},
	];

	return (
		<fieldset className="no-print m-0 min-is-0 flex-none p-0">
			<legend className="sr-only">{theme.legend}</legend>
			<ChoiceSwitcher action="button" choices={preferences} />
		</fieldset>
	);
}
