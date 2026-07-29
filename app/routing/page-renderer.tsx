import PortfolioPage from "@/app/pages/(landing)/page";
import { LegalPage } from "@/app/pages/(legal)/[page]/page";
import { type AppRoute, getRouteLocale } from "@/app/routing/routes";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type PageRendererProps = {
	dictionary: Dictionary;
	route: AppRoute;
};

export function PageRenderer({ dictionary, route }: PageRendererProps) {
	const locale = getRouteLocale(route);

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
