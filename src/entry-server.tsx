import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
	defaultLocale,
	getLegalPageAbsoluteUrl,
	type LegalPageId,
	type Locale,
	localeConfigs,
	rootUrl,
} from "./i18n/config";
import { getDictionary } from "./i18n/dictionaries";
import { validateDictionaries } from "./i18n/validate";
import { LegalPage } from "./pages/LegalPage";
import PortfolioPage from "./pages/PortfolioPage";
import { socialImage } from "./seo/social-image";
import { createLegalPageStructuredData, createStructuredData } from "./seo/structured-data";

export type StaticRoute =
	| { kind: "root" }
	| { kind: "locale"; locale: Locale }
	| { kind: "legal"; locale: Locale; page: LegalPageId };

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
	return renderToStaticMarkup(<div className="overflow-x-clip">{content}</div>);
}

function validateBeforeRendering(): void {
	if (!dictionariesAreValidated) {
		validateDictionaries();
		dictionariesAreValidated = true;
	}
}

export function renderPage(route: StaticRoute): RenderedPage {
	validateBeforeRendering();

	if (route.kind === "root") {
		const dictionary = getDictionary(defaultLocale);

		return {
			appHtml: renderPageHtml(
				<PortfolioPage
					dictionary={dictionary}
					locale={defaultLocale}
					showSideProjects={false}
				/>,
			),
			lang: localeConfigs[defaultLocale].htmlLang,
			indexable: false,
			pathname: "/",
			title: dictionary.messages.meta.title,
			description: dictionary.messages.meta.description,
			ogDescription: dictionary.messages.meta.ogDescription,
			canonical: rootUrl,
			ogLocale: "en_CH",
			ogType: "website",
			socialImage: {
				...socialImage,
				alt: dictionary.messages.meta.socialImageAlt,
			},
			structuredData: createStructuredData(defaultLocale, dictionary, rootUrl),
		};
	}

	const dictionary = getDictionary(route.locale);
	const localeConfig = localeConfigs[route.locale];

	if (route.kind === "legal") {
		const content = dictionary.messages.legalPages[route.page];
		const canonical = getLegalPageAbsoluteUrl(route.locale, route.page);
		const title = `${content.title} | ${dictionary.portfolio.name}`;

		return {
			appHtml: renderPageHtml(
				<LegalPage dictionary={dictionary} locale={route.locale} page={route.page} />,
			),
			lang: localeConfig.htmlLang,
			indexable: false,
			pathname: canonical,
			title,
			description: content.description,
			ogDescription: content.description,
			canonical,
			ogLocale: localeConfig.ogLocale,
			ogType: "website",
			socialImage: {
				...socialImage,
				alt: dictionary.messages.meta.socialImageAlt,
			},
			structuredData: createLegalPageStructuredData(
				route.locale,
				canonical,
				title,
				content.description,
			),
		};
	}

	return {
		appHtml: renderPageHtml(
			<PortfolioPage dictionary={dictionary} locale={route.locale} showSideProjects />,
		),
		lang: localeConfig.htmlLang,
		indexable: true,
		pathname: localeConfig.pathname,
		title: dictionary.messages.meta.title,
		description: dictionary.messages.meta.description,
		ogDescription: dictionary.messages.meta.ogDescription,
		canonical: localeConfig.absoluteUrl,
		ogLocale: localeConfig.ogLocale,
		ogType: "profile",
		socialImage: {
			...socialImage,
			alt: dictionary.messages.meta.socialImageAlt,
		},
		structuredData: createStructuredData(route.locale, dictionary),
	};
}
