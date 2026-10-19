import { createLocalizedExperiences, type LocalizedExperienceContent } from "@/src/features/landing/data/portfolio/shared/experiences";
import { sharedPortfolioDetails } from "@/src/features/landing/data/portfolio/shared/portfolio-details";
import { createSkillGroups, type LocalizedSkillGroupLabels } from "@/src/features/landing/data/portfolio/shared/skill-groups";

import type { Portfolio } from "@/src/types/portfolio";

const experienceContent = {
	"muum-software-engineer": {
		role: "Softwareentwickler",
		employmentType: "Freiberuflich",
		location: "Remote, vor Ort",
		description: "Entwicklung einer Atemtrainings-App in Swift/SwiftUI für iOS und watchOS mit Apple Watch, Garmin, HealthKit sowie HR/HRV-Biofeedback in Echtzeit.",
	},
	"confidential-client-software-engineer": {
		company: "Vertraulicher Kunde",
		role: "Softwareentwickler",
		employmentType: "Freiberuflich",
		location: "Vollständig remote",
		description: "Konzeption und Entwicklung einer verteilten Plattform für Kryptowährungsarbitrage mit C#, ASP.NET Core, MAUI, Docker, Grafana und Prometheus.",
	},
	"new-tells-studio-frontend-developer": {
		role: "Frontend-Entwickler",
		employmentType: "Freiberuflich",
		location: "Vollständig remote",
		description: "Entwicklung eines responsiven Next.js-Portfolios nach Figma mit Rive-Animationen für ein Motion-Design-Unternehmen.",
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
		role: "Junior-Entwickler",
		location: "Schweiz",
		description: "Autodidaktischer Einstieg in die Informatik: Modding bestehender Spiele und Entwicklung eigener Spiele, Verstehen von PCs und Software, Entwicklung von Software und Beiträge zu Projekten.",
	},
	"self-taught-computing-beginnings": {
		company: "Eigenes Lernen",
		role: "Erste Schritte in der Informatik",
		location: "Schweiz",
		description: "Einstieg in die Informatik ab dem Alter von 8 Jahren: Erkundung von Windows, Hardware, Software und Spielen sowie erste technische Experimente, noch vor dem Programmieren.",
	},
} satisfies LocalizedExperienceContent;

const skillGroupLabels = {
	"programming-languages": "Programmiersprachen",
	backend: "Backend",
	frontend: "Frontend",
	databases: "Datenbanken",
	"devops-cloud": "DevOps & Cloud",
	practices: "Praktiken",
	platform: "Plattformen",
} satisfies LocalizedSkillGroupLabels;

export const portfolioDe = {
	...sharedPortfolioDetails,
	role: "Softwareentwickler | Full-Stack-Entwickler | Bergsportler",
	location: "Moudon, Waadt, Schweiz",
	summary: "Ein Schweizer Taschenmesser-Entwickler mit über zehn Jahren Entwicklungspraxis.\nVollständig autodidaktisch, ohne formalen Abschluss.",
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
