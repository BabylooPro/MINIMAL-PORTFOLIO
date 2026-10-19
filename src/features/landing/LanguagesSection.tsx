import { Section, SectionHeading } from "@/src/components/ui/Section";

import type { Language } from "@/src/types/portfolio";

type LanguagesSectionProps = {
	title: string;
	languages: readonly Language[];
};

const capabilityIds = ["listening", "speaking", "writing"] as const satisfies readonly (keyof Language["capabilities"])[];

export function LanguagesSection({ languages, title }: Readonly<LanguagesSectionProps>) {
	if (languages.length === 0) return null;

	return (
		<Section labelledBy="languages-title">
			<SectionHeading id="languages-title">{title}</SectionHeading>

			<ul className="mt-2 list-disc space-y-0.5 pl-5">
				{languages.map((language) => (
					<li key={language.label}>
						{language.label}

						<span className="text-(--muted-color)"> - {capabilityIds.flatMap((id) => language.capabilities[id] ?? []).join(", ")}</span>
					</li>
				))}
			</ul>
		</Section>
	);
}
