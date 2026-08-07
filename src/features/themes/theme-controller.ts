type ThemePreference = "light" | "dark" | "system";

export function initializeThemeController(): void {
	const systemTheme = matchMedia("(prefers-color-scheme: dark)");
	const themeColor = document.querySelector<HTMLMetaElement>("meta[data-theme-color]");
	const root = document.documentElement;

	let currentPreference = (root.dataset.themePreference ?? "system") as ThemePreference;

	function applyPreference(preference: ThemePreference): void {
		if (preference === "system") {
			root.removeAttribute("data-theme");
		} else {
			root.dataset.theme = preference;
		}

		root.dataset.themePreference = preference;

		themeColor?.setAttribute("content", preference === "dark" || (preference === "system" && systemTheme.matches) ? "#000000" : "#ffffff");

		for (const control of document.querySelectorAll<HTMLButtonElement>("button[data-theme-preference]")) {
			control.setAttribute("aria-pressed", String(control.dataset.themePreference === preference));
		}
	}

	document.addEventListener("click", (event) => {
		if (!(event.target instanceof Element)) return;

		const control = event.target.closest<HTMLButtonElement>("button[data-theme-preference]");
		if (!control) return;

		currentPreference = control.dataset.themePreference as ThemePreference;

		try {
			localStorage.setItem("theme-preference", currentPreference);
		} catch {
			// SESSION ONLY
		}

		applyPreference(currentPreference);
	});

	systemTheme.addEventListener("change", () => {
		if (currentPreference === "system") applyPreference(currentPreference);
	});

	applyPreference(currentPreference);
}
