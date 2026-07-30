import { LegalPage } from "@/app/pages/legal/page";
import { NotFoundPage } from "@/app/pages/not-found/page";
import PortfolioPage from "@/app/pages/portfolio/page";

import { type AppRoute, getRouteLocale } from "@/app/routing/routes";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type PageRendererProps = {
	dictionary: Dictionary;
	route: AppRoute;
};

export function PageRenderer({ dictionary, route }: PageRendererProps) {
	const locale = getRouteLocale(route);

	if (route.kind === "not-found") {
		return <NotFoundPage dictionary={dictionary} locale={locale} />;
	}

	if (route.kind === "legal") {
		return <LegalPage dictionary={dictionary} locale={locale} page={route.page} />;
	}

	return (
		<PortfolioPage
			dictionary={dictionary}
			locale={locale}
			showSideProjects={route.kind === "locale"}
		/>
	);
}
