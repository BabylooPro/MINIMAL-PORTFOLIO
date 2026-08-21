import { ChoiceSwitcher } from "@/src/components/ui/ChoiceSwitcher";
import { getLegalPagePath, type LegalPageId, type Locale, localeConfigs, locales } from "@/src/lib/i18n/config";

type LanguageSwitcherProps = {
	currentLocale: Locale;
	label: string;
	page?: LegalPageId;
};

export function LanguageSwitcher({ currentLocale, label, page }: Readonly<LanguageSwitcherProps>) {
	const choices = locales.map((locale) => {
		const config = localeConfigs[locale];
		return {
			id: locale,
			isSelected: locale === currentLocale,
			label: config.shortLabel,
			linkProps: {
				href: page ? getLegalPagePath(locale, page) : config.pathname,
				hrefLang: config.htmlLang,
				lang: config.htmlLang
			}
		};
	});

	return (
		<nav aria-label={label} className="no-print shrink-0">
			<ChoiceSwitcher action="link" choices={choices} />
		</nav>
	);
}
