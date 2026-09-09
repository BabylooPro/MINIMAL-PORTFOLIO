import { ExternalLink } from "@/src/components/ui/ExternalLink";
import { ContactEmail, LegalSection } from "@/src/features/legal/LegalContent";
import type { Messages } from "@/src/lib/i18n/messages/types";

const legalNoticeUrls = {
	commercialRegister: "https://www.zefix.ch/fr/search/entity/list/firm/1580533",
	sourceRepositoryLicense: "https://github.com/BabylooPro/MINIMAL-PORTFOLIO/blob/main/LICENSE",
} as const;

type LegalNoticeSectionProps = { content: Messages["legalPages"]["legal"]; email: string | null };

export function LegalNoticeSection({ content, email }: Readonly<LegalNoticeSectionProps>) {
	return (
		<>
			<LegalSection description={content.publisherDescription} id="legal-publisher-title" title={content.publisherTitle} />

			<LegalSection id="legal-business-information-title" title={content.businessInformation.title}>
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
			</LegalSection>

			<LegalSection description={content.contactDescription} id="legal-contact-title" title={content.contactTitle}>
				<ContactEmail email={email} />
			</LegalSection>

			<LegalSection description={content.responsibilityDescription} id="legal-responsibility-title" title={content.responsibilityTitle} />

			<LegalSection description={content.intellectualPropertyDescription} id="legal-intellectual-property-title" title={content.intellectualPropertyTitle}>
				<ExternalLink className="mt-1 inline-flex underline underline-offset-2" href={legalNoticeUrls.sourceRepositoryLicense}>
					{content.sourceCodeLicenseLabel}
				</ExternalLink>
			</LegalSection>

			<LegalSection description={content.externalLinksDescription} id="legal-external-links-title" title={content.externalLinksTitle} />
		</>
	);
}

function LegalInformationItem({ href, label, value }: Readonly<{ href?: string; label: string; value: string }>) {
	return (
		<div>
			<dt className="font-medium text-(--foreground-color)">
				{label}
			</dt>

			<dd>
				{href ? (
					<ExternalLink className="underline underline-offset-2" href={href}>{value}</ExternalLink>
				) : (
					value
				)}
			</dd>
		</div>
	);
}
