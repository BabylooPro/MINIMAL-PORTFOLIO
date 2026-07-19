export type ExternalLink = {
	label: string;
	href: string;
};

export type Experience = {
	id: string;
	company: string;
	role: string;
	employmentType?: string;
	location?: string;
	startDate: string;
	endDate?: string;
	description: string;
};

export type SkillGroup = {
	id: string;
	label: string;
	skills: readonly string[];
};

export type Portfolio = {
	name: string;
	company: string;
	role: string;
	location: string;
	profile: string;
	availability?: string;
	links: readonly ExternalLink[];
	experiences: readonly Experience[];
	skillGroups: readonly SkillGroup[];
	languages: readonly string[];
};
