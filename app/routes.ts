import {
	defaultLocale,
	getLegalPageFromPathname,
	getLocaleFromPathname,
	type LegalPageId,
	type Locale,
} from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type AppRoute =
	| { kind: "root" }
	| { kind: "locale"; locale: Locale }
	| { kind: "legal"; locale: Locale; page: LegalPageId };

export function getRouteFromPathname(pathname: string): AppRoute {
	const locale = getLocaleFromPathname(pathname);
	const page = getLegalPageFromPathname(pathname);

	if (locale && page) {
		return { kind: "legal", locale, page };
	}

	return locale ? { kind: "locale", locale } : { kind: "root" };
}

export function getRouteLocale(route: AppRoute): Locale {
	return route.kind === "root" ? defaultLocale : route.locale;
}

export function getRouteTitle(route: AppRoute, dictionary: Dictionary): string {
	return route.kind === "legal"
		? `${dictionary.messages.legalPages[route.page].title} | ${dictionary.portfolio.name}`
		: dictionary.messages.meta.title;
}
