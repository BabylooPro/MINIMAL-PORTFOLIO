import { type Locale, localeConfigs } from "../i18n/config";
import type { Dictionary } from "../i18n/dictionaries";

export function createStructuredData(
	locale: Locale,
	dictionary: Dictionary,
	pageUrl = localeConfigs[locale].absoluteUrl,
): object {
	return {
		"@context": "https://schema.org",
		"@type": "ProfilePage",
		url: pageUrl,
		inLanguage: locale,
		name: dictionary.messages.meta.title,
		description: dictionary.messages.meta.description,
		mainEntity: {
			"@type": "Person",
			name: dictionary.portfolio.name,
			jobTitle: dictionary.portfolio.role,
			url: pageUrl,
			email: "mailto:maxremy.dev@gmail.com",
			address: {
				"@type": "PostalAddress",
				addressLocality: "Moudon",
				addressRegion: "Vaud",
				addressCountry: "CH",
			},
			sameAs: dictionary.portfolio.links
				.filter((link) => link.href.startsWith("https://"))
				.map((link) => link.href),
		},
	};
}
