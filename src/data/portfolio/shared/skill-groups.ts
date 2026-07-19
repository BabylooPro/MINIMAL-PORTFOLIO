import type { SkillGroup } from "../../../types/portfolio";

type SkillGroupMetadata = Pick<SkillGroup, "id" | "skills">;

const sharedSkillGroups = [
	{
		id: "programming-languages",
		skills: ["C#", "Python", "Swift", "JavaScript", "TypeScript"],
	},
	{
		id: "backend",
		skills: [".NET", "ASP.NET Core", "Django", "Node.js", "Express.js"],
	},
	{
		id: "frontend",
		skills: ["React.js", "Next.js", "HTML", "CSS", "Tailwind CSS"],
	},
	{
		id: "databases",
		skills: ["MySQL", "NoSQL", "SQLite", "PostgreSQL"],
	},
	{
		id: "devops-cloud",
		skills: ["Docker", "GitHub Actions", "AWS", "GCP", "Azure", "Kubernetes"],
	},
	{
		id: "practices",
		skills: ["REST APIs", "CI/CD", "TDD", "BDD", "Agile/Scrum", "HERMES"],
	},
] as const satisfies readonly SkillGroupMetadata[];

type SkillGroupId = (typeof sharedSkillGroups)[number]["id"];

export type LocalizedSkillGroupLabels = Record<SkillGroupId, string>;

export function createSkillGroups(labels: LocalizedSkillGroupLabels): SkillGroup[] {
	return sharedSkillGroups.map((skillGroup) => ({
		...skillGroup,
		label: labels[skillGroup.id],
	}));
}
