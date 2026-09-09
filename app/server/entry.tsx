import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PageRenderer } from "@/app/routing/page-renderer";
import { type AppRoute, getRouteLocale, getRouteTitle } from "@/app/routing/routes";

import { defaultLocale, getLegalPageAbsoluteUrl, localeConfigs, rootUrl } from "@/src/lib/i18n/config";

import type { Dictionary } from "@/src/lib/i18n/dictionaries";

import { getDictionary } from "@/src/lib/i18n/dictionaries";
import { validateDictionaries } from "@/src/lib/i18n/validate";
import { socialImage } from "@/src/lib/seo/social-image";
import { createStructuredData, createWebPageStructuredData } from "@/src/lib/seo/structured-data";

export type { AppRoute as StaticRoute } from "@/app/routing/routes";

export type RenderedPage = {
	appHtml: string;
	lang: string;
	indexable: boolean;
	pathname: string;
	title: string;
	description: string;
	ogDescription: string;
	canonical: string;
	ogLocale: string;
	ogType: "profile" | "website";
	socialImage: typeof socialImage & { alt: string };
	structuredData: object;
};

let dictionariesAreValidated = false;

type PageMetadata = Omit<RenderedPage, "appHtml" | "lang" | "ogLocale" | "socialImage">;

function renderPageHtml(content: ReactNode): string {
	return renderToStaticMarkup(content);
}

function validateBeforeRendering(): void {
	if (!dictionariesAreValidated) {
		validateDictionaries();
		dictionariesAreValidated = true;
	}
}

function createRenderedPage(route: AppRoute, dictionary: Dictionary, metadata: PageMetadata): RenderedPage {
	const locale = getRouteLocale(route);

	return {
		...metadata,
		appHtml: renderPageHtml(<PageRenderer dictionary={dictionary} route={route} />),
		lang: localeConfigs[locale].htmlLang,
		ogLocale: localeConfigs[locale].ogLocale,
		socialImage: { ...socialImage, alt: dictionary.messages.meta.socialImageAlt },
	};
}

export function renderPage(route: AppRoute): RenderedPage {
	validateBeforeRendering();

	if (route.kind === "root") {
		const dictionary = getDictionary(defaultLocale);

		return createRenderedPage(route, dictionary, {
			indexable: false,
			pathname: "/",
			title: getRouteTitle(route, dictionary),
			description: dictionary.messages.meta.description,
			ogDescription: dictionary.messages.meta.ogDescription,
			canonical: rootUrl,
			ogType: "website",
			structuredData: createStructuredData(defaultLocale, dictionary, rootUrl),
		});
	}

	const dictionary = getDictionary(route.locale);

	if (route.kind === "not-found") {
		const canonical = new URL("404.html", rootUrl).href;
		const title = getRouteTitle(route, dictionary);
		const description = dictionary.messages.notFound.description;

		return createRenderedPage(route, dictionary, {
			indexable: false,
			pathname: "/404.html",
			title,
			description,
			ogDescription: description,
			canonical,
			ogType: "website",
			structuredData: createWebPageStructuredData(route.locale, canonical, title, description),
		});
	}

	if (route.kind === "legal") {
		const content = dictionary.messages.legalPages[route.page];
		const canonical = getLegalPageAbsoluteUrl(route.locale, route.page);
		const title = getRouteTitle(route, dictionary);

		return createRenderedPage(route, dictionary, {
			indexable: false,
			pathname: canonical,
			title,
			description: content.description,
			ogDescription: content.description,
			canonical,
			ogType: "website",
			structuredData: createWebPageStructuredData(route.locale, canonical, title, content.description),
		});
	}

	return createRenderedPage(route, dictionary, {
		indexable: true,
		pathname: localeConfigs[route.locale].pathname,
		title: getRouteTitle(route, dictionary),
		description: dictionary.messages.meta.description,
		ogDescription: dictionary.messages.meta.ogDescription,
		canonical: localeConfigs[route.locale].absoluteUrl,
		ogType: "profile",
		structuredData: createStructuredData(route.locale, dictionary),
	});
}
