(() => {
	const root = document.documentElement;

	let preference = "system";

	try {
		const storedPreference = localStorage.getItem("theme-preference");
		if (storedPreference === "light" || storedPreference === "dark" || storedPreference === "system") preference = storedPreference;
	} catch {
		// DEFAULT TO SYSTEM
	}

	if (preference === "system") {
		delete root.dataset.theme;
	} else {
		root.dataset.theme = preference;
	}

	root.dataset.themePreference = preference;

	const isDark = preference === "dark" || (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);

	document.querySelector("meta[data-theme-color]")?.setAttribute("content", isDark ? "#000000" : "#ffffff");
})();
