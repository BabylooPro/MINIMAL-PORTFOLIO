import { ThemeControl } from "../components/ThemeControl";
import type { Messages } from "../i18n/messages/types";

type FooterSectionProps = {
	company: string;
	theme: Messages["theme"];
};

export function FooterSection({ company, theme }: FooterSectionProps) {
	const year = new Date().getFullYear();

	return (
		<footer className="flex flex-wrap items-center justify-between gap-4 border-t border-(--border-color) py-6 text-sm text-(--muted-color)">
			<p>
				© {year} {company}
			</p>

			<ThemeControl theme={theme} />
		</footer>
	);
}
