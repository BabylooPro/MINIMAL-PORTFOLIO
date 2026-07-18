import { SectionHeading } from "../components/SectionHeading";
import type { SkillGroup } from "../types/portfolio";

type SkillsSectionProps = {
	skillGroups: readonly SkillGroup[];
};

export function SkillsSection({ skillGroups }: SkillsSectionProps) {
	if (skillGroups.length === 0) {
		return null;
	}

	return (
		<section aria-labelledby="skills-title">
			<SectionHeading id="skills-title">Skills</SectionHeading>
			<ul className="mt-2 space-y-0.5">
				{skillGroups.map((skillGroup) => (
					<li key={skillGroup.id} className="leading-5">
						<h3 className="inline font-semibold">{skillGroup.label}: </h3>
						<span>{skillGroup.skills.join(", ")}</span>
					</li>
				))}
			</ul>
		</section>
	);
}
