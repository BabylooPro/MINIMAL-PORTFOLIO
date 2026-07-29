(() => {
	const storageKey = "theme-preference";
	const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

	function isThemePreference(value) {
		return value === "light" || value === "dark" || value === "system";
	}

	let preference = "system";

	try {
		const storedPreference = window.localStorage.getItem(storageKey);

		if (isThemePreference(storedPreference)) {
			preference = storedPreference;
		}
	} catch {
		// DEFAULT TO SYSTEM
	}

	const isDark = preference === "dark" || (preference === "system" && systemTheme.matches);

	if (preference === "system") {
		document.documentElement.removeAttribute("data-theme");
	} else {
		document.documentElement.dataset.theme = preference;
	}

	document.documentElement.dataset.themePreference = preference;

	const themeColor = document.querySelector("meta[data-theme-color]");

	if (themeColor) {
		themeColor.setAttribute("content", isDark ? "#000000" : "#ffffff");
	}
})();
