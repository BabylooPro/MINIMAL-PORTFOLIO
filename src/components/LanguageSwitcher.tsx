import { type Locale, localeConfigs, locales } from "../i18n/config";

type LanguageSwitcherProps = {
	currentLocale: Locale;
	label: string;
};

export function LanguageSwitcher({ currentLocale, label }: LanguageSwitcherProps) {
	return (
		<nav aria-label={label} className="no-print shrink-0">
			<ul className="flex items-center text-xs">
				{locales.map((locale, index) => {
					const config = localeConfigs[locale];
					const isCurrentLocale = locale === currentLocale;

					return (
						<li className="flex items-center" key={locale}>
							<a
								aria-current={isCurrentLocale ? "page" : undefined}
								className={
									isCurrentLocale
										? "rounded-sm bg-(--foreground-color) px-1 py-0.5 font-medium text-(--background-color)! no-underline"
										: "rounded-sm px-1 py-0.5 hover:bg-(--inactive-hover-color)"
								}
								href={config.pathname}
								hrefLang={locale}
								lang={locale}
							>
								{config.shortLabel}
							</a>
							{index < locales.length - 1 ? (
								<span aria-hidden="true">&nbsp;·&nbsp;</span>
							) : null}
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
