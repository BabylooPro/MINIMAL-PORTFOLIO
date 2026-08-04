import type { ReactNode } from "react";

import { renderToStaticMarkup } from "react-dom/server";
import { PageRenderer } from "@/app/routing/page-renderer";
import { type AppRoute, getRouteTitle } from "@/app/routing/routes";
import { defaultLocale, getLegalPageAbsoluteUrl, localeConfigs, rootUrl } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { validateDictionaries } from "@/lib/i18n/validate";
import { socialImage } from "@/lib/seo/social-image";
import { createStructuredData, createWebPageStructuredData } from "@/lib/seo/structured-data";

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

function renderPageHtml(content: ReactNode): string {
	return renderToStaticMarkup(content);
}

function validateBeforeRendering(): void {
	if (!dictionariesAreValidated) {
		validateDictionaries();
		dictionariesAreValidated = true;
	}
}

export function renderPage(route: AppRoute): RenderedPage {
	validateBeforeRendering();

	if (route.kind === "root") {
		const dictionary = getDictionary(defaultLocale);

		return {
			appHtml: renderPageHtml(<PageRenderer dictionary={dictionary} route={route} />),
			lang: localeConfigs[defaultLocale].htmlLang,
			indexable: false,
			pathname: "/",
			title: getRouteTitle(route, dictionary),
			description: dictionary.messages.meta.description,
			ogDescription: dictionary.messages.meta.ogDescription,
			canonical: rootUrl,
			ogLocale: "en_CH",
			ogType: "website",
			socialImage: { ...socialImage, alt: dictionary.messages.meta.socialImageAlt },
			structuredData: createStructuredData(defaultLocale, dictionary, rootUrl),
		};
	}

	const dictionary = getDictionary(route.locale);
	const localeConfig = localeConfigs[route.locale];

	if (route.kind === "not-found") {
		const canonical = new URL("404.html", rootUrl).href;
		const title = getRouteTitle(route, dictionary);
		const description = dictionary.messages.notFound.description;

		return {
			appHtml: renderPageHtml(<PageRenderer dictionary={dictionary} route={route} />),
			lang: localeConfig.htmlLang,
			indexable: false,
			pathname: "/404.html",
			title,
			description,
			ogDescription: description,
			canonical,
			ogLocale: localeConfig.ogLocale,
			ogType: "website",
			socialImage: { ...socialImage, alt: dictionary.messages.meta.socialImageAlt },
			structuredData: createWebPageStructuredData(route.locale, canonical, title, description),
		};
	}

	if (route.kind === "legal") {
		const content = dictionary.messages.legalPages[route.page];
		const canonical = getLegalPageAbsoluteUrl(route.locale, route.page);
		const title = getRouteTitle(route, dictionary);

		return {
			appHtml: renderPageHtml(<PageRenderer dictionary={dictionary} route={route} />),
			lang: localeConfig.htmlLang,
			indexable: false,
			pathname: canonical,
			title,
			description: content.description,
			ogDescription: content.description,
			canonical,
			ogLocale: localeConfig.ogLocale,
			ogType: "website",
			socialImage: { ...socialImage, alt: dictionary.messages.meta.socialImageAlt },
			structuredData: createWebPageStructuredData(route.locale, canonical, title, content.description),
		};
	}

	return {
		appHtml: renderPageHtml(<PageRenderer dictionary={dictionary} route={route} />),
		lang: localeConfig.htmlLang,
		indexable: true,
		pathname: localeConfig.pathname,
		title: getRouteTitle(route, dictionary),
		description: dictionary.messages.meta.description,
		ogDescription: dictionary.messages.meta.ogDescription,
		canonical: localeConfig.absoluteUrl,
		ogLocale: localeConfig.ogLocale,
		ogType: "profile",
		socialImage: { ...socialImage, alt: dictionary.messages.meta.socialImageAlt },
		structuredData: createStructuredData(route.locale, dictionary),
	};
}
