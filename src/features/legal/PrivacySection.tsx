import { Section, SectionHeading } from "@/components/ui/Section";
import type { Messages } from "@/lib/i18n/messages/types";

// TODO: MAKE A LIST URL
const cloudflarePrivacyPolicyUrl = "https://www.cloudflare.com/privacypolicy/";
const googlePrivacyPolicyUrl = "https://policies.google.com/privacy";

type PrivacySectionProps = {
	content: Messages["legalPages"]["privacy"];
	email: string | null;
};

export function PrivacySection({ content, email }: PrivacySectionProps) {
	return (
		<>
			<p className="leading-6">{content.intro}</p>

			<Section labelledBy="privacy-theme-title">
				<SectionHeading id="privacy-theme-title">{content.themeTitle}</SectionHeading>
				<p className="mt-1 leading-6">{content.themeDescription}</p>
			</Section>

			<Section labelledBy="privacy-language-title">
				<SectionHeading id="privacy-language-title">{content.languageTitle}</SectionHeading>
				<p className="mt-1 leading-6">{content.languageDescription}</p>
			</Section>

			<Section labelledBy="privacy-cv-download-title">
				<SectionHeading id="privacy-cv-download-title">{content.cvDownloadTitle}</SectionHeading>
				<p className="mt-1 leading-6">{content.cvDownloadDescription}</p>
			</Section>

			<Section labelledBy="privacy-hosting-title">
				<SectionHeading id="privacy-hosting-title">{content.hostingTitle}</SectionHeading>
				<p className="mt-1 leading-6">{content.hostingDescription}</p>

				<a className="mt-1 inline-flex underline underline-offset-2" href={cloudflarePrivacyPolicyUrl} rel="noopener noreferrer" target="_blank">
					{content.hostingPrivacyPolicyLabel}
					<span aria-hidden="true">&nbsp;↗</span>
				</a>
			</Section>

			<Section labelledBy="privacy-external-links-title">
				<SectionHeading id="privacy-external-links-title">{content.externalLinksTitle}</SectionHeading>
				<p className="mt-1 leading-6">{content.externalLinksDescription}</p>
			</Section>

			<Section labelledBy="privacy-contact-title">
				<SectionHeading id="privacy-contact-title">{content.contactTitle}</SectionHeading>
				<p className="mt-1 leading-6">{content.contactDescription}</p>

				{email ? (
					<a className="mt-1 inline-flex underline underline-offset-2" href={`mailto:${email}`}>
						{email}
					</a>
				) : null}

				<a className="mt-1 block w-fit underline underline-offset-2" href={googlePrivacyPolicyUrl} rel="noopener noreferrer" target="_blank">
					{content.emailProviderPrivacyPolicyLabel}
					<span aria-hidden="true">&nbsp;↗</span>
				</a>
			</Section>

			<Section labelledBy="privacy-rights-title">
				<SectionHeading id="privacy-rights-title">{content.rightsTitle}</SectionHeading>
				<p className="mt-1 leading-6">{content.rightsDescription}</p>
			</Section>

			<Section labelledBy="privacy-retention-title">
				<SectionHeading id="privacy-retention-title">{content.retentionTitle}</SectionHeading>
				<p className="mt-1 leading-6">{content.retentionDescription}</p>
			</Section>

			<Section labelledBy="privacy-updates-title">
				<SectionHeading id="privacy-updates-title">{content.updatesTitle}</SectionHeading>
				<p className="mt-1 leading-6">{content.updatesDescription}</p>
			</Section>
		</>
	);
}
