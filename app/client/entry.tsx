import { StrictMode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { PageRenderer } from "@/app/routing/page-renderer";
import { getRouteFromPathname, getRouteLocale, getRouteTitle } from "@/app/routing/routes";
import { getDictionary } from "@/src/lib/i18n/dictionaries";

const root = document.getElementById("root");
if (!root) throw new Error('Root element "#root" was not found.');

const route = getRouteFromPathname(window.location.pathname);
const locale = getRouteLocale(route);
const dictionary = getDictionary(locale);

document.documentElement.lang = locale;
document.title = getRouteTitle(route, dictionary);

const appRoot = createRoot(root);

flushSync(() => {
	appRoot.render(
		<StrictMode>
			<PageRenderer dictionary={dictionary} route={route} />
		</StrictMode>,
	);
});
