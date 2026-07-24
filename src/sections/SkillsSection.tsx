import { Section, SectionHeading } from "../layout/Section";
import type { SkillGroup } from "../types/portfolio";

type SkillsSectionProps = {
	title: string;
	skillGroups: readonly SkillGroup[];
};

export function SkillsSection({ skillGroups, title }: SkillsSectionProps) {
	if (skillGroups.length === 0) {
		return null;
	}

	return (
		<Section labelledBy="skills-title">
			<SectionHeading id="skills-title">{title}</SectionHeading>

			<ul className="mt-2 space-y-0.5">
				{skillGroups.map((skillGroup) => (
					<li key={skillGroup.id} className="leading-5">
						<h3 className="inline font-semibold text-(--foreground-color)">
							{skillGroup.label}:
						</h3>{" "}
						<span>{skillGroup.skills.join(", ")}</span>
					</li>
				))}
			</ul>
		</Section>
	);
}
