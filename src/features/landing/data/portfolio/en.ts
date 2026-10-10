import { createLocalizedExperiences, type LocalizedExperienceContent } from "@/src/features/landing/data/portfolio/shared/experiences";
import { sharedPortfolioDetails } from "@/src/features/landing/data/portfolio/shared/portfolio-details";
import { createSkillGroups, type LocalizedSkillGroupLabels } from "@/src/features/landing/data/portfolio/shared/skill-groups";

import type { Portfolio } from "@/src/types/portfolio";

const experienceContent = {
	"muum-software-engineer": {
		role: "Software Engineer",
		employmentType: "Freelance",
		location: "Remote, On-site",
		description: "Built a Swift/SwiftUI breathwork app for iOS and watchOS, integrating Apple Watch, Garmin, HealthKit, and real-time HR/HRV biofeedback.",
	},
	"confidential-client-software-engineer": {
		company: "Confidential Client",
		role: "Software Engineer",
		employmentType: "Freelance",
		location: "Fully remote",
		description: "Designed and built a distributed cryptocurrency arbitrage platform using C#, ASP.NET Core, MAUI, Docker, Grafana, and Prometheus.",
	},
	"new-tells-studio-frontend-developer": {
		role: "Frontend Developer",
		employmentType: "Freelance",
		location: "Fully remote",
		description: "Built a responsive Next.js portfolio from Figma, with Rive animations for a motion design company.",
	},
	"max-remy-dev-founder": {
		role: "Founder",
		location: "Switzerland - Fully remote",
		description: "Operate an individual company offering freelance services in IT.",
	},
	"various-clients-freelance-developer": {
		company: "Direct Clients and Agency Assignments",
		role: "Independent Developer, Umbrella Company",
		location: "Switzerland - Remote, On-site",
		description: "Backend, automation, web, mobile, and game jobs for local clients and assignments passed on by an agency.",
	},
	"self-taught-junior-developer": {
		company: "Personal Projects",
		role: "Junior Developer",
		location: "Switzerland",
		description: "Self-taught start in computing: modding existing games and building games, learning how PCs and software work, writing software and contributing to projects.",
	},
	"self-taught-computing-beginnings": {
		company: "Personal Learning",
		role: "Computing Beginnings",
		location: "Switzerland",
		description: "Discovered computing from the age of 8: exploring Windows, hardware, software, and games, with first hands-on technical tinkering before learning to code.",
	},
} satisfies LocalizedExperienceContent;

const skillGroupLabels = {
	"programming-languages": "Programming languages",
	backend: "Backend",
	frontend: "Frontend",
	databases: "Databases",
	"devops-cloud": "DevOps & Cloud",
	practices: "Practices",
	platform: "Platforms",
} satisfies LocalizedSkillGroupLabels;

export const portfolioEn = {
	...sharedPortfolioDetails,
	role: "Software Engineer | Full-Stack Developer | Mountain Athlete",
	location: "Moudon, Vaud, Switzerland",
	summary: "A Swiss Army knife developer with 10 years of freelance experience.\nEntirely self-taught, with no formal degree.",
	languages: [
		{
			label: "French - Native (C2)",
			capabilities: {
				listening: "Listening",
				speaking: "Fluent speaking",
				writing: "Writing",
			},
		},
		{
			label: "English - Intermediate (B1+)",
			capabilities: {
				listening: "Listening",
				speaking: "Intermediate speaking",
				writing: "Writing",
			},
		},
		{
			label: "German - Beginner (A1)",
			capabilities: {
				listening: "Listening",
			},
		},
	],
	experiences: createLocalizedExperiences(experienceContent),
	skillGroups: createSkillGroups(skillGroupLabels),
} satisfies Portfolio;
