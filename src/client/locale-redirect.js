(() => {
	if (window.location.pathname !== "/") {
		return;
	}

	const supportedLocales = new Set(["en", "fr", "de"]);
	const browserLanguages = Array.from(
		new Set([...(navigator.languages ?? []), navigator.language]),
	);
	const locale = browserLanguages
		.filter((language) => typeof language === "string")
		.map((language) => language.trim().toLowerCase().split("-")[0])
		.find((language) => supportedLocales.has(language));

	window.location.replace(`/${locale ?? "en"}/`);
})();
