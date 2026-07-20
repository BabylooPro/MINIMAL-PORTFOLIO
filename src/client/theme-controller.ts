type ThemePreference = "light" | "dark" | "system";

const storageKey = "theme-preference";

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

const themeColor = document.querySelector<HTMLMetaElement>("meta[data-theme-color]");

function isThemePreference(value: unknown): value is ThemePreference {
	return value === "light" || value === "dark" || value === "system";
}

function readStoredPreference(): ThemePreference {
	try {
		const value = window.localStorage.getItem(storageKey);

		return isThemePreference(value) ? value : "system";
	} catch {
		return "system";
	}
}

function savePreference(preference: ThemePreference): void {
	try {
		window.localStorage.setItem(storageKey, preference);
	} catch {
		// SESSION ONLY
	}
}

let currentPreference = readStoredPreference();

function isDarkTheme(preference: ThemePreference): boolean {
	return preference === "dark" || (preference === "system" && systemTheme.matches);
}

function updateThemeControl(preference: ThemePreference): void {
	const controls = document.querySelectorAll<HTMLButtonElement>("button[data-theme-preference]");

	for (const control of controls) {
		control.setAttribute(
			"aria-pressed",
			String(control.dataset.themePreference === preference),
		);
	}
}

function applyPreference(preference: ThemePreference): void {
	const isDark = isDarkTheme(preference);

	if (preference === "system") {
		document.documentElement.removeAttribute("data-theme");
	} else {
		document.documentElement.dataset.theme = preference;
	}

	document.documentElement.dataset.themePreference = preference;

	themeColor?.setAttribute("content", isDark ? "#000000" : "#ffffff");

	updateThemeControl(preference);
}

document.addEventListener("click", (event) => {
	if (!(event.target instanceof Element)) {
		return;
	}

	const control = event.target.closest<HTMLButtonElement>("button[data-theme-preference]");
	const preference = control?.dataset.themePreference;

	if (!isThemePreference(preference)) {
		return;
	}

	savePreference(preference);
	currentPreference = preference;
	applyPreference(currentPreference);
});

systemTheme.addEventListener("change", () => {
	if (currentPreference === "system") {
		applyPreference(currentPreference);
	}
});

applyPreference(currentPreference);
