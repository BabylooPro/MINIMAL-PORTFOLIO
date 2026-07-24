import { type Locale, localeConfigs, rootUrl } from "../i18n/config";
import type { Dictionary } from "../i18n/dictionaries";
import { isExternalHttpLink } from "../utils/isExternalHttpLink";
import { socialImage } from "./social-image";

export function createStructuredData(
	locale: Locale,
	dictionary: Dictionary,
	pageUrl = localeConfigs[locale].absoluteUrl,
): object {
	const email = dictionary.portfolio.links.find((link) => link.href.startsWith("mailto:"));
	const telephone = dictionary.portfolio.links.find((link) => link.href.startsWith("tel:"));
	const image = {
		"@type": "ImageObject",
		url: socialImage.url,
		contentUrl: socialImage.url,
		encodingFormat: socialImage.type,
		width: socialImage.width,
		height: socialImage.height,
		caption: dictionary.messages.meta.socialImageAlt,
	};

	return {
		"@context": "https://schema.org",
		"@type": "ProfilePage",
		url: pageUrl,
		inLanguage: localeConfigs[locale].htmlLang,
		name: dictionary.messages.meta.title,
		description: dictionary.messages.meta.description,
		primaryImageOfPage: image,
		mainEntity: {
			"@type": "Person",
			"@id": `${rootUrl}#max-remy`,
			name: dictionary.portfolio.name,
			jobTitle: dictionary.portfolio.role,
			url: pageUrl,
			...(email ? { email: email.href.replace("mailto:", "") } : {}),
			...(telephone ? { telephone: telephone.href.replace("tel:", "") } : {}),
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

export function createLegalPageStructuredData(
	locale: Locale,
	pageUrl: string,
	title: string,
	description: string,
): object {
	return {
		"@context": "https://schema.org",
		"@type": "WebPage",
		url: pageUrl,
		inLanguage: localeConfigs[locale].htmlLang,
		name: title,
		description,
	};
}
