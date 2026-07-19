import type { Experience } from "../../../types/portfolio";

type ExperienceMetadata = Omit<
	Pick<Experience, "id" | "company" | "startDate" | "endDate" | "datePrecision">,
	"company"
> & {
	company?: string;
};

type LocalizedExperience = Pick<Experience, "role" | "employmentType" | "location" | "description">;

const sharedExperiences = [
	{
		id: "muum-software-engineer",
		company: "MUUM",
		startDate: "2025-05",
		endDate: null,
		datePrecision: "month",
	},
	{
		id: "confidential-client-software-engineer",
		startDate: "2024-08",
		endDate: "2025-03",
		datePrecision: "month",
	},
	{
		id: "new-tells-studio-frontend-developer",
		company: "New Tells Studio",
		startDate: "2024-08",
		endDate: "2024-12",
		datePrecision: "month",
	},
	{
		id: "max-remy-dev-founder",
		company: "Max Remy Dev",
		startDate: "2023-03",
		endDate: null,
		datePrecision: "month",
	},
	{
		id: "various-clients-freelance-developer",
		startDate: "2017",
		endDate: "2023",
		datePrecision: "year",
	},
] as const satisfies readonly ExperienceMetadata[];

type ExperienceId = (typeof sharedExperiences)[number]["id"];
type LocalizedCompanyExperienceId =
	| "confidential-client-software-engineer"
	| "various-clients-freelance-developer";

export type LocalizedExperienceContent = {
	[Id in ExperienceId]: LocalizedExperience &
		(Id extends LocalizedCompanyExperienceId
			? Pick<Experience, "company">
			: { company?: never });
};

export function createLocalizedExperiences(content: LocalizedExperienceContent): Experience[] {
	return sharedExperiences.map((experience) => {
		const localizedExperience = content[experience.id];
		const sharedCompany = "company" in experience ? experience.company : undefined;
		const company = localizedExperience.company ?? sharedCompany;

		if (!company) {
			throw new Error(`Missing company for ${experience.id}.`);
		}

		return {
			...experience,
			...localizedExperience,
			company,
		};
	});
}
