import { createLocalizedExperiences, type LocalizedExperienceContent } from "@/src/features/landing/data/portfolio/shared/experiences";
import { sharedPortfolioDetails } from "@/src/features/landing/data/portfolio/shared/portfolio-details";
import { createSkillGroups, type LocalizedSkillGroupLabels } from "@/src/features/landing/data/portfolio/shared/skill-groups";

import type { Portfolio } from "@/src/types/portfolio";

const experienceContent = {
	"muum-software-engineer": {
		role: "Software Engineer",
		employmentType: "Freelance",
		location: "Remote, On-site",
		description: "Breathwork app for iOS and watchOS. Built the app and its Apple Watch, Garmin and HealthKit integrations, with real-time HR/HRV biofeedback. Stack: Swift, SwiftUI.",
	},
	"confidential-client-software-engineer": {
		company: "Confidential Client",
		role: "Software Engineer",
		employmentType: "Freelance",
		location: "Fully remote",
		description: "Distributed cryptocurrency arbitrage platform, which I designed and built. Stack: C#, ASP.NET Core, MAUI, Docker, Grafana, Prometheus.",
	},
	"new-tells-studio-frontend-developer": {
		role: "Frontend Developer",
		employmentType: "Freelance",
		location: "Fully remote",
		description: "Portfolio for a motion design company. Built a responsive site from the Figma designs, with Rive animations. Stack: Next.js, Rive.",
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
		description: "Delivered backend, automation, web, mobile, and game jobs for local clients and assignments passed on by an agency.",
	},
	"self-taught-junior-developer": {
		company: "Personal Projects",
		role: "Self-Taught Path",
		location: "Switzerland",
		description: "Discovered computing at the age of 8, then learned on my own: modding and building games, how PCs and software work, first software and contributions to projects.",
	},
} satisfies LocalizedExperienceContent;

const skillGroupLabels = {
	"dotnet-backend": "C#/.NET backend",
	apple: "Apple",
	web: "Web",
	"devops-cloud": "DevOps & Cloud",
	"other-stacks": "Other languages & frameworks",
	databases: "Databases",
	practices: "Practices",
	platform: "Platforms",
} satisfies LocalizedSkillGroupLabels;

export const portfolioEn = {
	...sharedPortfolioDetails,
	role: "Software Engineer | Full-Stack Developer | Mountain Athlete",
	location: "Moudon, Vaud, Switzerland",
	summary: "A Swiss Army knife developer with over ten years of hands-on development.\nEntirely self-taught, with no formal degree.",
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
