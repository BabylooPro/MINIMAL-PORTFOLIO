export const locales = ["en", "fr", "de"] as const;

export type Locale = (typeof locales)[number];

export const legalPageIds = ["privacy", "legal"] as const;

export type LegalPageId = (typeof legalPageIds)[number];

export const defaultLocale: Locale = "en";

type LocaleConfig = {
	htmlLang: Locale;
	intlLocale: string;
	label: string;
	shortLabel: string;
	pathname: string;
	absoluteUrl: string;
	ogLocale: string;
};

export const localeConfigs = {
	en: {
		htmlLang: "en",
		intlLocale: "en-CH",
		label: "English",
		shortLabel: "EN",
		pathname: "/en/",
		absoluteUrl: "https://maxremy.dev/en/",
		ogLocale: "en_CH",
	},
	fr: {
		htmlLang: "fr",
		intlLocale: "fr-CH",
		label: "Français",
		shortLabel: "FR",
		pathname: "/fr/",
		absoluteUrl: "https://maxremy.dev/fr/",
		ogLocale: "fr_CH",
	},
	de: {
		htmlLang: "de",
		intlLocale: "de-CH",
		label: "Deutsch",
		shortLabel: "DE",
		pathname: "/de/",
		absoluteUrl: "https://maxremy.dev/de/",
		ogLocale: "de_CH",
	},
} satisfies Record<Locale, LocaleConfig>;

export const rootUrl = "https://maxremy.dev/";

export function isLocale(value: string): value is Locale {
	return locales.includes(value as Locale);
}

export function getLocaleFromPathname(pathname: string): Locale | null {
	const firstSegment = pathname.split("/").filter(Boolean).at(0);

	if (!firstSegment || !isLocale(firstSegment)) {
		return null;
	}

	return firstSegment;
}

export function getLocalePath(locale: Locale): string {
	return localeConfigs[locale].pathname;
}

export function getLegalPagePath(locale: Locale, page: LegalPageId): string {
	return `${getLocalePath(locale)}${page}/`;
}

export function getLegalPageAbsoluteUrl(locale: Locale, page: LegalPageId): string {
	return new URL(getLegalPagePath(locale, page), rootUrl).href;
}

export function getLegalPageFromPathname(pathname: string): LegalPageId | null {
	const segments = pathname.split("/").filter(Boolean);
	const locale = segments[0];
	const page = segments[1];

	return segments.length === 2 &&
		locale !== undefined &&
		isLocale(locale) &&
		legalPageIds.includes(page as LegalPageId)
		? (page as LegalPageId)
		: null;
}
