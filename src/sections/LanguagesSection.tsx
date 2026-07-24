import { Section, SectionHeading } from "../layout/Section";

type LanguagesSectionProps = {
	title: string;
	languages: readonly string[];
};

export function LanguagesSection({ languages, title }: LanguagesSectionProps) {
	if (languages.length === 0) {
		return null;
	}

	return (
		<Section labelledBy="languages-title">
			<SectionHeading id="languages-title">{title}</SectionHeading>

			<ul className="mt-2 list-disc space-y-0.5 pl-5">
				{languages.map((language) => (
					<li key={language}>{language}</li>
				))}
			</ul>
		</Section>
	);
}
