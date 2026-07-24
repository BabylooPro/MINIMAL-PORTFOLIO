import { ArrowUpIcon } from "../components/svg/ArrowUpIcon";
import { ThemeSwitcher } from "../components/ui/ThemeSwitcher";
import { getLegalPagePath, type LegalPageId, type Locale } from "../i18n/config";
import type { Messages } from "../i18n/messages/types";

type FooterSectionProps = {
	company: string;
	currentLocale: Locale;
	currentPage?: LegalPageId;
	footer: Messages["footer"];
	theme: Messages["theme"];
};

export function FooterSection({
	company,
	currentLocale,
	currentPage,
	footer,
	theme,
}: FooterSectionProps) {
	const year = new Date().getFullYear();

	return (
		<footer
			className="group/footer fixed inset-x-0 bottom-0 z-40 bg-(--background-color) pb-[env(safe-area-inset-bottom)] text-sm text-(--muted-color)"
			data-page-footer
		>
			<a
				aria-label={footer.backToTop}
				className="absolute bottom-full left-1/2 z-50 mb-2 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-(--border-color) bg-(--background-color) text-(--foreground-color) shadow-sm transition-[background-color,color,transform] hover:bg-(--foreground-color) hover:text-(--background-color) focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:outline-offset-2"
				href="#top"
				hidden
				data-back-to-top
				title={footer.backToTop}
			>
				<ArrowUpIcon />
			</a>

			<div className="mx-auto w-full max-w-2xl px-6 sm:px-8">
				<div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t border-(--border-color) py-3 sm:py-3 sm:transition-[padding] sm:duration-150 sm:ease-[ease] sm:group-data-expanded/footer:py-6">
					<div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
						<p className="text-xs sm:transition-[font-size] sm:duration-150 sm:ease-[ease] sm:group-data-expanded/footer:text-sm">
							© {year} {company}
						</p>

						<nav aria-label={footer.navigationLabel}>
							<ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
								<li>
									<a
										aria-current={
											currentPage === "privacy" ? "page" : undefined
										}
										className="hover:text-(--foreground-color)"
										href={getLegalPagePath(currentLocale, "privacy")}
									>
										{footer.privacy}
									</a>
								</li>

								<li>
									<a
										aria-current={currentPage === "legal" ? "page" : undefined}
										className="hover:text-(--foreground-color)"
										href={getLegalPagePath(currentLocale, "legal")}
									>
										{footer.legal}
									</a>
								</li>
							</ul>
						</nav>
					</div>

					<ThemeSwitcher theme={theme} />
				</div>
			</div>
		</footer>
	);
}
