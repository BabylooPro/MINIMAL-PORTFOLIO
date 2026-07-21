import type { Portfolio } from "../../types/portfolio";
import { createLocalizedExperiences, type LocalizedExperienceContent } from "./shared/experiences";
import { sharedPortfolioDetails } from "./shared/portfolio-details";
import { createSkillGroups, type LocalizedSkillGroupLabels } from "./shared/skill-groups";

const experienceContent = {
	"muum-software-engineer": {
		role: "Software Engineer",
		employmentType: "Freelance",
		location: "Remote, On-site",
		description:
			"Built a Swift/SwiftUI breathwork app for iOS and watchOS, integrating Apple Watch, Garmin, HealthKit, and real-time HR/HRV biofeedback.",
	},
	"confidential-client-software-engineer": {
		company: "Confidential Client",
		role: "Software Engineer",
		employmentType: "Freelance",
		location: "Fully remote",
		description:
			"Designed and built a distributed cryptocurrency arbitrage platform using C#, ASP.NET Core, MAUI, Docker, Grafana, and Prometheus.",
	},
	"new-tells-studio-frontend-developer": {
		role: "Frontend Developer",
		employmentType: "Freelance",
		location: "Fully remote",
		description:
			"Built a responsive Next.js portfolio from Figma, with Rive animations for a motion design company.",
	},
	"max-remy-dev-founder": {
		role: "Founder",
		location: "Switzerland - Fully remote",
		description: "Operate an individual company offering freelance services in IT.",
	},
	"various-clients-freelance-developer": {
		company: "Various Clients via Agency",
		role: "Freelance Developer",
		location: "Switzerland - Remote, On-site",
		description:
			"Delivered backend, automation, web, mobile, and game development solutions for various clients.",
	},
} satisfies LocalizedExperienceContent;

const skillGroupLabels = {
	"programming-languages": "Programming languages",
	backend: "Backend",
	frontend: "Frontend",
	databases: "Databases",
	"devops-cloud": "DevOps & Cloud",
	practices: "Practices",
} satisfies LocalizedSkillGroupLabels;

export const portfolioEn = {
	...sharedPortfolioDetails,
	role: "Software Engineer | Full-Stack Developer",
	location: "Moudon, Vaud, Switzerland",
	summary:
		"A Swiss Army knife developer with 10 years of freelance experience.\nEntirely self-taught, with no formal degree.",
	languages: ["French - Native (C2)", "English - Intermediate (B1+)", "German - Beginner (A1)"],
	experiences: createLocalizedExperiences(experienceContent),
	skillGroups: createSkillGroups(skillGroupLabels),
} satisfies Portfolio;
