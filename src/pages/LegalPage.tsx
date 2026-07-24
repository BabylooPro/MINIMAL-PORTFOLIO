import { Container } from "../components/ui/Container";
import { getLocalePath, type LegalPageId, type Locale } from "../i18n/config";
import type { Dictionary } from "../i18n/dictionaries";
import type { Messages } from "../i18n/messages/types";
import { Footer } from "../layout/Footer";
import { Header } from "../layout/Header";

const externalUrls = {
	commercialRegister: "https://www.zefix.ch/fr/search/entity/list/firm/1580533",
	googlePrivacyPolicy: "https://policies.google.com/privacy",
	hostingerPrivacyPolicy: "https://www.hostinger.com/legal/privacy-policy",
	sourceRepositoryLicense: "https://github.com/BabylooPro/MINIMAL-PORTFOLIO/blob/main/LICENSE",
} as const;

type LegalPageProps = {
	dictionary: Dictionary;
	locale: Locale;
	page: LegalPageId;
};

type LegalContentSectionProps = {
	description: string;
	title: string;
};

function LegalContentSection({ description, title }: LegalContentSectionProps) {
	return (
		<section>
			<h2 className="font-semibold text-(--foreground-color)">{title}</h2>
			<p className="mt-1 leading-6">{description}</p>
		</section>
	);
}

function PrivacyContent({
	content,
	email,
}: {
	content: Messages["legalPages"]["privacy"];
	email: string | null;
}) {
	return (
		<>
			<p className="leading-6">{content.intro}</p>

			<div className="mt-6 space-y-6">
				<LegalContentSection
					description={content.themeDescription}
					title={content.themeTitle}
				/>

				<LegalContentSection
					description={content.languageDescription}
					title={content.languageTitle}
				/>

				<LegalContentSection
					description={content.cvDownloadDescription}
					title={content.cvDownloadTitle}
				/>

				<section>
					<h2 className="font-semibold text-(--foreground-color)">
						{content.hostingTitle}
					</h2>

					<p className="mt-1 leading-6">{content.hostingDescription}</p>

					<a
						className="mt-1 inline-flex underline underline-offset-2"
						href={externalUrls.hostingerPrivacyPolicy}
						rel="noopener noreferrer"
						target="_blank"
					>
						{content.hostingPrivacyPolicyLabel}
						<span aria-hidden="true">&nbsp;↗</span>
					</a>
				</section>

				<LegalContentSection
					description={content.externalLinksDescription}
					title={content.externalLinksTitle}
				/>

				<section>
					<h2 className="font-semibold text-(--foreground-color)">
						{content.contactTitle}
					</h2>

					<p className="mt-1 leading-6">{content.contactDescription}</p>

					{email ? (
						<a
							className="mt-1 inline-flex underline underline-offset-2"
							href={`mailto:${email}`}
						>
							{email}
						</a>
					) : null}

					<a
						className="mt-1 block w-fit underline underline-offset-2"
						href={externalUrls.googlePrivacyPolicy}
						rel="noopener noreferrer"
						target="_blank"
					>
						{content.emailProviderPrivacyPolicyLabel}
						<span aria-hidden="true">&nbsp;↗</span>
					</a>
				</section>

				<LegalContentSection
					description={content.rightsDescription}
					title={content.rightsTitle}
				/>

				<LegalContentSection
					description={content.retentionDescription}
					title={content.retentionTitle}
				/>

				<LegalContentSection
					description={content.updatesDescription}
					title={content.updatesTitle}
				/>
			</div>
		</>
	);
}

function LegalNoticeContent({
	content,
	email,
}: {
	content: Messages["legalPages"]["legal"];
	email: string | null;
}) {
	return (
		<div className="space-y-6">
			<LegalContentSection
				description={content.publisherDescription}
				title={content.publisherTitle}
			/>

			<section>
				<h2 className="font-semibold text-(--foreground-color)">
					{content.businessInformation.title}
				</h2>

				<dl className="mt-1 space-y-2 leading-6">
					<LegalInformationItem
						label={content.businessInformation.legalFormLabel}
						value={content.businessInformation.legalFormValue}
					/>

					<LegalInformationItem
						label={content.businessInformation.ownerLabel}
						value={content.businessInformation.ownerValue}
					/>

					<LegalInformationItem
						label={content.businessInformation.addressLabel}
						value={content.businessInformation.addressValue}
					/>

					<LegalInformationItem
						label={content.businessInformation.uidLabel}
						value={content.businessInformation.uidValue}
					/>

					<LegalInformationItem
						label={content.businessInformation.commercialRegisterLabel}
						href={externalUrls.commercialRegister}
						value={content.businessInformation.commercialRegisterValue}
					/>
				</dl>
			</section>

			<section>
				<h2 className="font-semibold text-(--foreground-color)">{content.contactTitle}</h2>
				<p className="mt-1 leading-6">{content.contactDescription}</p>

				{email ? (
					<a
						className="mt-1 inline-flex underline underline-offset-2"
						href={`mailto:${email}`}
					>
						{email}
					</a>
				) : null}
			</section>

			<LegalContentSection
				description={content.responsibilityDescription}
				title={content.responsibilityTitle}
			/>

			<LegalContentSection
				description={content.intellectualPropertyDescription}
				title={content.intellectualPropertyTitle}
			/>

			<a
				className="inline-flex underline underline-offset-2"
				href={externalUrls.sourceRepositoryLicense}
				rel="noopener noreferrer"
				target="_blank"
			>
				{content.sourceCodeLicenseLabel}
				<span aria-hidden="true">&nbsp;↗</span>
			</a>

			<LegalContentSection
				description={content.externalLinksDescription}
				title={content.externalLinksTitle}
			/>
		</div>
	);
}

function LegalInformationItem({
	href,
	label,
	value,
}: {
	href?: string;
	label: string;
	value: string;
}) {
	return (
		<div>
			<dt className="font-medium text-(--foreground-color)">{label}</dt>

			<dd>
				{href ? (
					<a
						className="underline underline-offset-2"
						href={href}
						rel="noopener noreferrer"
						target="_blank"
					>
						{value}
						<span aria-hidden="true">&nbsp;↗</span>
					</a>
				) : (
					value
				)}
			</dd>
		</div>
	);
}

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
				isPermanentlyCompact
				usePageHeading={false}
			/>

			<Container>
				<main className="mt-6 pb-44 sm:mt-0 sm:pb-44">
					<article aria-labelledby="legal-page-title" className="max-w-prose">
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

						<div className="mt-6">
							{page === "privacy" ? (
								<PrivacyContent
									content={messages.legalPages.privacy}
									email={email ?? null}
								/>
							) : (
								<LegalNoticeContent
									content={messages.legalPages.legal}
									email={email ?? null}
								/>
							)}

							<p className="mt-8 text-sm text-(--muted-color)">
								{messages.legalPages.lastUpdated}
							</p>
						</div>
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
