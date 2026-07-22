import { type Locale, localeConfigs } from "../i18n/config";
import type { Dictionary } from "../i18n/dictionaries";
import { isExternalHttpLink } from "../utils/isExternalHttpLink";

export function createStructuredData(
	locale: Locale,
	dictionary: Dictionary,
	pageUrl = localeConfigs[locale].absoluteUrl,
): object {
	const email = dictionary.portfolio.links.find((link) => link.href.startsWith("mailto:"));

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
			...(email ? { email: email.href } : {}),
			address: {
				"@type": "PostalAddress",
				addressLocality: "Moudon",
				addressRegion: "Vaud",
				addressCountry: "CH",
			},
			sameAs: dictionary.portfolio.links
				.filter((link) => isExternalHttpLink(link.href))
				.map((link) => link.href),
		},
	};
}
