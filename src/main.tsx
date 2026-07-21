import { StrictMode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import App from "./App";
import { defaultLocale, getLocaleFromPathname } from "./i18n/config";
import { getDictionary } from "./i18n/dictionaries";
import "./styles/global.css";

const root = document.getElementById("root");

if (!root) {
	throw new Error('Root element "#root" was not found.');
}

const requestedLocale = getLocaleFromPathname(window.location.pathname);
const locale = requestedLocale ?? defaultLocale;
const dictionary = getDictionary(locale);

document.documentElement.lang = locale;
document.title = dictionary.messages.meta.title;

const appRoot = createRoot(root);

flushSync(() => {
	appRoot.render(
		<StrictMode>
			<App
				dictionary={dictionary}
				locale={locale}
				showSideProjects={requestedLocale !== null}
			/>
		</StrictMode>,
	);
});
