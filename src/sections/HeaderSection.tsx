import { LanguageSwitcher } from "../components/ui/LanguageSwitcher";
import type { Locale } from "../i18n/config";
import type { Portfolio } from "../types/portfolio";
import { isExternalHttpLink } from "../utils/isExternalHttpLink";

type HeaderSectionProps = {
	currentLocale: Locale;
	downloadCvLabel: string;
	languageSwitcherLabel: string;
	emailLabel: string;
	phoneLabel: string;
	portfolio: Pick<Portfolio, "name" | "role" | "location" | "links">;
};

function getContactLinkLabel(
	link: Portfolio["links"][number],
	emailLabel: string,
	phoneLabel: string,
) {
	if (link.href.startsWith("mailto:")) {
		return `${emailLabel}: ${link.label}`;
	}

	if (link.href.startsWith("tel:")) {
		return `${phoneLabel}: ${link.label}`;
	}

	return undefined;
}

export function HeaderSection({
	currentLocale,
	downloadCvLabel,
	emailLabel,
	languageSwitcherLabel,
	phoneLabel,
	portfolio,
}: HeaderSectionProps) {
	const contactLinks = portfolio.links.filter((link) => !isExternalHttpLink(link.href));
	const profileLinks = portfolio.links.filter((link) => isExternalHttpLink(link.href));

	return (
		<header className="pb-9 pt-10 text-left">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-(--foreground-color)">
						<img
							src="/myface.png"
							alt="My Face"
							aria-hidden="true"
							className="size-10 rounded-md object-cover"
						/>

						{portfolio.name}
					</h1>
					<p className="mt-2 font-medium text-(--foreground-color)">{portfolio.role}</p>
					<p>{portfolio.location}</p>
				</div>

				<LanguageSwitcher currentLocale={currentLocale} label={languageSwitcherLabel} />
			</div>

			{portfolio.links.length > 0 ? (
				<div className="mt-4">
					{contactLinks.length > 0 ? (
						<p>
							{contactLinks.map((link, index) => (
								<span key={link.href}>
									{index > 0 ? " - " : ""}
									<a
										aria-label={getContactLinkLabel(
											link,
											emailLabel,
											phoneLabel,
										)}
										href={link.href}
										className="underline underline-offset-2"
									>
										{link.label}
									</a>
								</span>
							))}
						</p>
					) : null}

					{profileLinks.length > 0 ? (
						<p>
							{profileLinks.map((link, index) => (
								<span key={link.href}>
									{index > 0 ? " - " : ""}

									<a
										className="underline underline-offset-2"
										href={link.href}
										rel="noreferrer"
										target="_blank"
									>
										{link.label}
									</a>
								</span>
							))}
						</p>
					) : null}
				</div>
			) : null}

			<a
				className="mt-1 inline-flex underline underline-offset-2"
				download="CV_Developer_Max_Remy.pdf"
				href="/CV_Developer_Max_Remy.pdf"
			>
				{downloadCvLabel}
			</a>
		</header>
	);
}
