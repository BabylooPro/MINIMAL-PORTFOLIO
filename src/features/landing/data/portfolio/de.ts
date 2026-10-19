import { createLocalizedExperiences, type LocalizedExperienceContent } from "@/src/features/landing/data/portfolio/shared/experiences";
import { sharedPortfolioDetails } from "@/src/features/landing/data/portfolio/shared/portfolio-details";
import { createSkillGroups, type LocalizedSkillGroupLabels } from "@/src/features/landing/data/portfolio/shared/skill-groups";

import type { Portfolio } from "@/src/types/portfolio";

const experienceContent = {
	"muum-software-engineer": {
		role: "Softwareentwickler",
		employmentType: "Freiberuflich",
		location: "Remote, vor Ort",
		description: "Atemtrainings-App für iOS und watchOS. Entwicklung der App und ihrer Integrationen mit Apple Watch, Garmin und HealthKit, inklusive HR/HRV-Biofeedback in Echtzeit. Stack: Swift, SwiftUI.",
	},
	"confidential-client-software-engineer": {
		company: "Vertraulicher Kunde",
		role: "Softwareentwickler",
		employmentType: "Freiberuflich",
		location: "Vollständig remote",
		description: "Verteilte Plattform für Kryptowährungsarbitrage, von mir konzipiert und entwickelt. Stack: C#, ASP.NET Core, MAUI, Docker, Grafana, Prometheus.",
	},
	"new-tells-studio-frontend-developer": {
		role: "Frontend-Entwickler",
		employmentType: "Freiberuflich",
		location: "Vollständig remote",
		description: "Portfolio für ein Motion-Design-Unternehmen. Responsive Umsetzung nach den Figma-Entwürfen, mit Rive-Animationen. Stack: Next.js, Rive.",
	},
	"max-remy-dev-founder": {
		role: "Gründer",
		location: "Schweiz - Vollständig remote",
		description: "Führung eines Einzelunternehmens für freiberufliche IT-Dienstleistungen.",
	},
	"various-clients-freelance-developer": {
		company: "Direktkunden und Agenturmandate",
		role: "Selbstständiger Entwickler, Payrolling",
		location: "Schweiz - Remote, vor Ort",
		description: "Aufträge in Backend, Automatisierung, Web, Mobile und Spieleentwicklung für lokale Kunden und über eine Agentur vermittelte Mandate.",
	},
	"self-taught-junior-developer": {
		company: "Eigene Projekte",
		role: "Autodidaktischer Werdegang",
		location: "Schweiz",
		description: "Einstieg in die Informatik mit 8 Jahren, danach autodidaktisches Lernen: Modding und Entwicklung von Spielen, Funktionsweise von PCs und Software, erste Software und Beiträge zu Projekten.",
	},
} satisfies LocalizedExperienceContent;

const skillGroupLabels = {
	"dotnet-backend": "C#/.NET-Backend",
	apple: "Apple",
	web: "Web",
	"devops-cloud": "DevOps & Cloud",
	"other-stacks": "Weitere Sprachen & Frameworks",
	databases: "Datenbanken",
	practices: "Praktiken",
	platform: "Plattformen",
} satisfies LocalizedSkillGroupLabels;

export const portfolioDe = {
	...sharedPortfolioDetails,
	role: "Softwareentwickler | Full-Stack-Entwickler | Bergsportler",
	location: "Moudon, Waadt, Schweiz",
	summary: "Ich konzipiere und entwickle C#/.NET-Backends, Apple-Apps mit Swift/SwiftUI und Weboberflächen mit React/Next.js, mit Docker und CI/CD.\nSchweizer Taschenmesser-Entwickler mit über zehn Jahren Entwicklungspraxis, seit 2017 selbstständig.\nAutodidakt, durch die Praxis ausgebildet.",
	languages: [
		{
			label: "Französisch - Muttersprache (C2)",
			capabilities: {
				listening: "Hörverständnis",
				speaking: "Fliessendes Sprechen",
				writing: "Schreiben",
			},
		},
		{
			label: "Englisch - Mittelstufe (B1+)",
			capabilities: {
				listening: "Hörverständnis",
				speaking: "Sprechen auf Mittelstufenniveau",
				writing: "Schreiben",
			},
		},
		{
			label: "Deutsch - Anfänger (A1)",
			capabilities: {
				listening: "Hörverständnis",
			},
		},
	],
	experiences: createLocalizedExperiences(experienceContent),
	skillGroups: createSkillGroups(skillGroupLabels),
} satisfies Portfolio;
