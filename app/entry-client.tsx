import { StrictMode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import PortfolioPage from "@/app/(landing)/page";
import { LegalPage } from "@/app/(legal)/[page]/page";
import "@/app/styles/global.css";
import { defaultLocale, getLegalPageFromPathname, getLocaleFromPathname } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

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
			<div className="overflow-x-clip">
				{legalPage ? (
					<LegalPage dictionary={dictionary} locale={locale} page={legalPage} />
				) : (
					<PortfolioPage
						dictionary={dictionary}
						locale={locale}
						showSideProjects={requestedLocale !== null}
					/>
				)}
			</div>
		</StrictMode>,
	);
});
