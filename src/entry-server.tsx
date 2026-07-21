import { renderToStaticMarkup } from "react-dom/server";
import App from "./App";
import { createStructuredData } from "./data/structured-data";
import { defaultLocale, type Locale, localeConfigs, rootUrl } from "./i18n/config";
import { getDictionary } from "./i18n/dictionaries";
import { validateDictionaries } from "./i18n/validate";

export type StaticRoute = { kind: "root" } | { kind: "locale"; locale: Locale };

export type RenderedPage = {
	appHtml: string;
	lang: string;
	pathname: string;
	title: string;
	description: string;
	ogDescription: string;
	canonical: string;
	ogLocale: string;
	structuredData: object;
};

let dictionariesAreValidated = false;

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
			appHtml: renderToStaticMarkup(
				<App dictionary={dictionary} locale={defaultLocale} showSideProjects={false} />,
			),
			lang: "en",
			pathname: "/",
			title: dictionary.messages.meta.title,
			description: dictionary.messages.meta.description,
			ogDescription: dictionary.messages.meta.ogDescription,
			canonical: rootUrl,
			ogLocale: "en_CH",
			structuredData: createStructuredData(defaultLocale, dictionary, rootUrl),
		};
	}

	const dictionary = getDictionary(route.locale);
	const localeConfig = localeConfigs[route.locale];

	return {
		appHtml: renderToStaticMarkup(
			<App dictionary={dictionary} locale={route.locale} showSideProjects />,
		),
		lang: localeConfig.htmlLang,
		pathname: localeConfig.pathname,
		title: dictionary.messages.meta.title,
		description: dictionary.messages.meta.description,
		ogDescription: dictionary.messages.meta.ogDescription,
		canonical: localeConfig.absoluteUrl,
		ogLocale: localeConfig.ogLocale,
		structuredData: createStructuredData(route.locale, dictionary),
	};
}
