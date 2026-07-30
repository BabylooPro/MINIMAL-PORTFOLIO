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
	| { kind: "legal"; locale: Locale; page: LegalPageId }
	| { kind: "not-found"; locale: Locale };

export function getRouteFromPathname(pathname: string): AppRoute {
	const segments = pathname.split("/").filter(Boolean);

	if (segments.length === 0) {
		return { kind: "root" };
	}

	const locale = getLocaleFromPathname(pathname);
	const page = getLegalPageFromPathname(pathname);

	if (locale && page) {
		return { kind: "legal", locale, page };
	}

	return locale && segments.length === 1
		? { kind: "locale", locale }
		: { kind: "not-found", locale: locale ?? defaultLocale };
}

export function getRouteLocale(route: AppRoute): Locale {
	return route.kind === "root" ? defaultLocale : route.locale;
}

export function getRouteTitle(route: AppRoute, dictionary: Dictionary): string {
	if (route.kind === "legal") {
		return `${dictionary.messages.legalPages[route.page].title} | ${dictionary.portfolio.name}`;
	}

	return route.kind === "not-found"
		? `${dictionary.messages.notFound.title} | ${dictionary.portfolio.name}`
		: dictionary.messages.meta.title;
}
