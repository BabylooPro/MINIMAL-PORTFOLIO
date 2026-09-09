import { ContactEmail, LegalExternalLink, LegalSection } from "@/src/features/legal/LegalContent";
import type { Messages } from "@/src/lib/i18n/messages/types";

const privacyPolicyUrls = {
	cloudflare: "https://www.cloudflare.com/privacypolicy/",
	google: "https://policies.google.com/privacy",
} as const;

type PrivacySectionProps = {
	content: Messages["legalPages"]["privacy"];
	email: string | null;
};

export function PrivacySection({ content, email }: Readonly<PrivacySectionProps>) {
	return (
		<>
			<p className="leading-6">{content.intro}</p>

			<LegalSection description={content.themeDescription} id="privacy-theme-title" title={content.themeTitle} />
			<LegalSection description={content.languageDescription} id="privacy-language-title" title={content.languageTitle} />
			<LegalSection description={content.cvDownloadDescription} id="privacy-cv-download-title" title={content.cvDownloadTitle} />

			<LegalSection description={content.hostingDescription} id="privacy-hosting-title" title={content.hostingTitle}>
				<LegalExternalLink className="mt-1 inline-flex underline underline-offset-2" href={privacyPolicyUrls.cloudflare}>
					{content.hostingPrivacyPolicyLabel}
				</LegalExternalLink>
			</LegalSection>

			<LegalSection description={content.externalLinksDescription} id="privacy-external-links-title" title={content.externalLinksTitle} />

			<LegalSection description={content.contactDescription} id="privacy-contact-title" title={content.contactTitle}>
				<ContactEmail email={email} />

				<LegalExternalLink className="mt-1 block w-fit underline underline-offset-2" href={privacyPolicyUrls.google}>
					{content.emailProviderPrivacyPolicyLabel}
				</LegalExternalLink>
			</LegalSection>

			<LegalSection description={content.rightsDescription} id="privacy-rights-title" title={content.rightsTitle} />
			<LegalSection description={content.retentionDescription} id="privacy-retention-title" title={content.retentionTitle} />
			<LegalSection description={content.updatesDescription} id="privacy-updates-title" title={content.updatesTitle} />
		</>
	);
}
