import { Section, SectionHeading } from "@/components/ui/Section";
import type { Messages } from "@/lib/i18n/messages/types";

const legalNoticeUrls = {
	commercialRegister: "https://www.zefix.ch/fr/search/entity/list/firm/1580533",
	sourceRepositoryLicense: "https://github.com/BabylooPro/MINIMAL-PORTFOLIO/blob/main/LICENSE",
} as const;

type LegalNoticeSectionProps = { content: Messages["legalPages"]["legal"]; email: string | null };

export function LegalNoticeSection({ content, email }: LegalNoticeSectionProps) {
	return (
		<>
			<Section labelledBy="legal-publisher-title">
				<SectionHeading id="legal-publisher-title">{content.publisherTitle}</SectionHeading>
				<p className="mt-1 leading-6">{content.publisherDescription}</p>
			</Section>

			<Section labelledBy="legal-business-information-title">
				<SectionHeading id="legal-business-information-title">{content.businessInformation.title}</SectionHeading>

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
						href={legalNoticeUrls.commercialRegister}
						value={content.businessInformation.commercialRegisterValue}
					/>
				</dl>
			</Section>

			<Section labelledBy="legal-contact-title">
				<SectionHeading id="legal-contact-title">{content.contactTitle}</SectionHeading>
				<p className="mt-1 leading-6">{content.contactDescription}</p>

				{email ? (
					<a className="mt-1 inline-flex underline underline-offset-2" href={`mailto:${email}`}>
						{email}
					</a>
				) : null}
			</Section>

			<Section labelledBy="legal-responsibility-title">
				<SectionHeading id="legal-responsibility-title">{content.responsibilityTitle}</SectionHeading>
				<p className="mt-1 leading-6">{content.responsibilityDescription}</p>
			</Section>

			<Section labelledBy="legal-intellectual-property-title">
				<SectionHeading id="legal-intellectual-property-title">{content.intellectualPropertyTitle}</SectionHeading>
				<p className="mt-1 leading-6">{content.intellectualPropertyDescription}</p>

				<a
					className="mt-1 inline-flex underline underline-offset-2"
					href={legalNoticeUrls.sourceRepositoryLicense}
					rel="noopener noreferrer"
					target="_blank"
				>
					{content.sourceCodeLicenseLabel}
					<span aria-hidden="true">&nbsp;↗</span>
				</a>
			</Section>

			<Section labelledBy="legal-external-links-title">
				<SectionHeading id="legal-external-links-title">{content.externalLinksTitle}</SectionHeading>
				<p className="mt-1 leading-6">{content.externalLinksDescription}</p>
			</Section>
		</>
	);
}

function LegalInformationItem({ href, label, value }: { href?: string; label: string; value: string }) {
	return (
		<div>
			<dt className="font-medium text-(--foreground-color)">
				{label}
			</dt>

			<dd>
				{href ? (
					<a className="underline underline-offset-2" href={href} rel="noopener noreferrer" target="_blank">
						{value} <span aria-hidden="true">&nbsp;↗</span>
					</a>
				) : (
					value
				)}
			</dd>
		</div>
	);
}
