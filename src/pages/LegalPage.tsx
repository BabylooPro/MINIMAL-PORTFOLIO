import { getLocalePath, type LegalPageId, type Locale } from "../i18n/config";
import type { Dictionary } from "../i18n/dictionaries";

import { Container } from "../layout/Container";
import { Footer } from "../layout/Footer";
import { Header } from "../layout/Header";

import { LegalNoticeSection } from "../sections/LegalNoticeSection";
import { PrivacySection } from "../sections/PrivacySection";

type LegalPageProps = {
	dictionary: Dictionary;
	locale: Locale;
	page: LegalPageId;
};

export function LegalPage({ dictionary, locale, page }: LegalPageProps) {
	const { messages, portfolio } = dictionary;
	const content = messages.legalPages[page];
	const email = portfolio.links
		.find((link) => link.href.startsWith("mailto:"))
		?.href.replace("mailto:", "");

	return (
		<>
			<Header
				currentLocale={locale}
				downloadCvLabel={messages.labels.downloadCv}
				emailLabel={messages.labels.email}
				languageSwitcherLabel={messages.labels.languageSwitcher}
				page={page}
				phoneLabel={messages.labels.phone}
				portfolio={portfolio}
				usePageHeading={false}
			/>

			<Container>
				<main className="mt-6 space-y-7 pb-44 sm:mt-0 sm:pb-44">
					<article aria-labelledby="legal-page-title" className="space-y-7">
						<header>
							<a
								className="inline-flex text-sm underline underline-offset-2"
								href={getLocalePath(locale)}
							>
								{messages.labels.backToPortfolio}
							</a>

							<h1
								className="mt-6 text-3xl font-semibold tracking-tight text-(--foreground-color)"
								id="legal-page-title"
							>
								{content.title}
							</h1>
						</header>

						{page === "privacy" ? (
							<PrivacySection
								content={messages.legalPages.privacy}
								email={email ?? null}
							/>
						) : (
							<LegalNoticeSection
								content={messages.legalPages.legal}
								email={email ?? null}
							/>
						)}

						<p className="text-sm text-(--muted-color)">
							{messages.legalPages.lastUpdated}
						</p>
					</article>
				</main>
			</Container>

			<Footer
				company={portfolio.company}
				currentLocale={locale}
				currentPage={page}
				footer={messages.footer}
				theme={messages.theme}
			/>
		</>
	);
}
