import type { ReactNode } from "react";

import { Section, SectionHeading } from "@/src/components/ui/Section";

type LegalSectionProps = {
	children?: ReactNode;
	description?: string;
	id: string;
	title: string;
};

export function LegalSection({ children, description, id, title }: Readonly<LegalSectionProps>) {
	return (
		<Section labelledBy={id}>
			<SectionHeading id={id}>{title}</SectionHeading>

			{description ? (
				<p className="mt-1 leading-6">{description}</p>
			) : null}

			{children}
		</Section>
	);
}

export function ContactEmail({ email }: Readonly<{ email: string | null }>) {
	return email ? (
		<a className="mt-1 inline-flex underline underline-offset-2" href={`mailto:${email}`}>
			{email}
		</a>
	) : null;
}

type LegalExternalLinkProps = {
	children: ReactNode;
	className: string;
	href: string;
};

export function LegalExternalLink({ children, className, href }: Readonly<LegalExternalLinkProps>) {
	return (
		<a className={className} href={href} rel="noopener noreferrer" target="_blank">
			{children} <span aria-hidden="true">&nbsp;↗</span>
		</a>
	);
}
