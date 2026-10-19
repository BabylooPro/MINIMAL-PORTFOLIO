import type { SkillGroup } from "@/src/types/portfolio";

type SkillGroupMetadata = Pick<SkillGroup, "id" | "skills" | "core">;

const sharedSkillGroups = [
	{ id: "dotnet-backend", skills: ["C#", ".NET", "ASP.NET Core", "REST APIs"], core: true },
	{ id: "apple", skills: ["Swift", "SwiftUI"], core: true },
	{ id: "web", skills: ["TypeScript", "JavaScript", "React.js", "Next.js", "HTML", "CSS", "Tailwind CSS"], core: true },
	{ id: "devops-cloud", skills: ["Docker", "GitHub Actions", "CI/CD", "Kubernetes", "AWS", "GCP", "Azure"], core: true },
	{ id: "other-stacks", skills: ["Python", "Django", "Node.js", "Express.js", "Flutter"] },
	{ id: "databases", skills: ["MySQL", "NoSQL", "SQLite", "PostgreSQL"] },
	{ id: "practices", skills: ["TDD", "BDD", "Agile/Scrum", "HERMES"] },
	{ id: "platform", skills: ["Windows", "MacOS", "Linux"] },
] as const satisfies readonly SkillGroupMetadata[];

type SkillGroupId = (typeof sharedSkillGroups)[number]["id"];

export type LocalizedSkillGroupLabels = Record<SkillGroupId, string>;

export function createSkillGroups(labels: LocalizedSkillGroupLabels): SkillGroup[] {
	return sharedSkillGroups.map((skillGroup) => ({ ...skillGroup, label: labels[skillGroup.id] }));
}
