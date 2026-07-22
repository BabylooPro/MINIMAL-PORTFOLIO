import { ThemeControl } from "../components/ui/ThemeControl";
import type { Messages } from "../i18n/messages/types";

type FooterSectionProps = {
	company: string;
	theme: Messages["theme"];
};

export function FooterSection({ company, theme }: FooterSectionProps) {
	const year = new Date().getFullYear();

	return (
		<footer
			className="group/footer fixed inset-x-0 bottom-0 z-40 bg-(--background-color) pb-[env(safe-area-inset-bottom)] text-sm text-(--muted-color)"
			data-page-footer
		>
			<div className="mx-auto w-full max-w-2xl px-6 sm:px-8">
				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-(--border-color) py-3 sm:gap-4 sm:py-3 sm:transition-[padding] sm:duration-150 sm:ease-[ease] sm:group-data-expanded/footer:py-6">
					<p className="text-xs sm:transition-[font-size] sm:duration-150 sm:ease-[ease] sm:group-data-expanded/footer:text-sm">
						© {year} {company}
					</p>

					<ThemeControl theme={theme} />
				</div>
			</div>
		</footer>
	);
}
