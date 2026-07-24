import { StrictMode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import App from "./App";
import { defaultLocale, getLegalPageFromPathname, getLocaleFromPathname } from "./i18n/config";
import { getDictionary } from "./i18n/dictionaries";
import { LegalPage } from "./pages/LegalPage";
import "./styles/global.css";

const root = document.getElementById("root");

if (!root) {
	throw new Error('Root element "#root" was not found.');
}

const requestedLocale = getLocaleFromPathname(window.location.pathname);
const locale = requestedLocale ?? defaultLocale;
const legalPage = getLegalPageFromPathname(window.location.pathname);
const dictionary = getDictionary(locale);
const title = legalPage
	? `${dictionary.messages.legalPages[legalPage].title} | ${dictionary.portfolio.name}`
	: dictionary.messages.meta.title;

document.documentElement.lang = locale;
document.title = title;

const appRoot = createRoot(root);

flushSync(() => {
	appRoot.render(
		<StrictMode>
			{legalPage ? (
				<LegalPage dictionary={dictionary} locale={locale} page={legalPage} />
			) : (
				<App
					dictionary={dictionary}
					locale={locale}
					showSideProjects={requestedLocale !== null}
				/>
			)}
		</StrictMode>,
	);
});
