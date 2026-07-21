import type { Portfolio } from "../../types/portfolio";
import { createLocalizedExperiences, type LocalizedExperienceContent } from "./shared/experiences";
import { sharedPortfolioDetails } from "./shared/portfolio-details";
import { createSkillGroups, type LocalizedSkillGroupLabels } from "./shared/skill-groups";

const experienceContent = {
	"muum-software-engineer": {
		role: "Softwareentwickler",
		employmentType: "Freiberuflich",
		location: "Remote, vor Ort",
		description:
			"Entwicklung einer Atemtrainings-App in Swift/SwiftUI für iOS und watchOS mit Apple Watch, Garmin, HealthKit sowie HR/HRV-Biofeedback in Echtzeit.",
	},
	"confidential-client-software-engineer": {
		company: "Vertraulicher Kunde",
		role: "Softwareentwickler",
		employmentType: "Freiberuflich",
		location: "Vollständig remote",
		description:
			"Konzeption und Entwicklung einer verteilten Plattform für Kryptowährungsarbitrage mit C#, ASP.NET Core, MAUI, Docker, Grafana und Prometheus.",
	},
	"new-tells-studio-frontend-developer": {
		role: "Frontend-Entwickler",
		employmentType: "Freiberuflich",
		location: "Vollständig remote",
		description:
			"Entwicklung eines responsiven Next.js-Portfolios nach Figma mit Rive-Animationen für ein Motion-Design-Unternehmen.",
	},
	"max-remy-dev-founder": {
		role: "Gründer",
		location: "Schweiz - Vollständig remote",
		description: "Führung eines Einzelunternehmens für freiberufliche IT-Dienstleistungen.",
	},
	"various-clients-freelance-developer": {
		company: "Verschiedene Kunden über eine Agentur",
		role: "Freiberuflicher Entwickler",
		location: "Schweiz - Remote, vor Ort",
		description:
			"Bereitstellung von Lösungen für Backend, Automatisierung, Web, Mobile und Spieleentwicklung für verschiedene Kunden.",
	},
} satisfies LocalizedExperienceContent;

const skillGroupLabels = {
	"programming-languages": "Programmiersprachen",
	backend: "Backend",
	frontend: "Frontend",
	databases: "Datenbanken",
	"devops-cloud": "DevOps & Cloud",
	practices: "Praktiken",
} satisfies LocalizedSkillGroupLabels;

export const portfolioDe = {
	...sharedPortfolioDetails,
	role: "Softwareentwickler | Full-Stack-Entwickler",
	location: "Moudon, Waadt, Schweiz",
	summary:
		"Ein Schweizer Taschenmesser-Entwickler mit 10 Jahren Erfahrung als Freiberufler.\nVollständig autodidaktisch, ohne formalen Abschluss.",
	languages: [
		"Französisch - Muttersprache (C2)",
		"Englisch - Mittelstufe (B1+)",
		"Deutsch - Anfänger (A1)",
	],
	experiences: createLocalizedExperiences(experienceContent),
	skillGroups: createSkillGroups(skillGroupLabels),
} satisfies Portfolio;
