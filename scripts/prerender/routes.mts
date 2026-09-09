import { defaultLocale, getLocalePath, type LegalPageId, type Locale, legalPageIds, locales } from "@/src/lib/i18n/config.ts";

export type StaticRoute =
	| { kind: "root" }
	| { kind: "locale"; locale: Locale }
	| { kind: "legal"; locale: Locale; page: LegalPageId }
	| { kind: "not-found"; locale: Locale; rootFallback?: true };

export const staticRoutes = [
	{ kind: "root" },
	{ kind: "not-found", locale: defaultLocale, rootFallback: true },

	...locales.map((locale) => ({ kind: "not-found" as const, locale })),
	...locales.map((locale) => ({ kind: "locale" as const, locale })),
	...legalPageIds.flatMap((page) => locales.map((locale) => ({ kind: "legal" as const, locale, page }))),
] satisfies readonly StaticRoute[];

export const primaryRoutePaths = ["/", ...locales.map(getLocalePath)] as const;

export function getStaticOutputPath(route: StaticRoute): string {
	if (route.kind === "root") return "index.html";
	if (route.kind === "not-found") return route.rootFallback ? "404.html" : `${route.locale}/404.html`;
	return route.kind === "legal" ? `${route.locale}/${route.page}/index.html` : `${route.locale}/index.html`;
}
