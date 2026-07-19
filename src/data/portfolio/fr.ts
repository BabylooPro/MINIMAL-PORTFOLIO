import type { Portfolio } from "../../types/portfolio";
import { createLocalizedExperiences, type LocalizedExperienceContent } from "./shared/experiences";
import { sharedPortfolioDetails } from "./shared/portfolio-details";
import { createSkillGroups, type LocalizedSkillGroupLabels } from "./shared/skill-groups";

const experienceContent = {
	"muum-software-engineer": {
		role: "Ingénieur logiciel",
		employmentType: "Freelance",
		location: "À distance, sur site",
		description:
			"Développement d’une application de respiration en Swift/SwiftUI pour iOS et watchOS, intégrant Apple Watch, Garmin, HealthKit et le biofeedback HR/HRV en temps réel.",
	},
	"confidential-client-software-engineer": {
		company: "Client confidentiel",
		role: "Ingénieur logiciel",
		employmentType: "Freelance",
		location: "Télétravail intégral",
		description:
			"Conception et développement d’une plateforme distribuée d’arbitrage de cryptomonnaies avec C#, ASP.NET Core, MAUI, Docker, Grafana et Prometheus.",
	},
	"new-tells-studio-frontend-developer": {
		role: "Développeur frontend",
		employmentType: "Freelance",
		location: "Télétravail intégral",
		description:
			"Création d’un portfolio Next.js responsive à partir de Figma, avec des animations Rive, pour une entreprise de motion design.",
	},
	"max-remy-dev-founder": {
		role: "Fondateur",
		location: "Suisse - Télétravail intégral",
		description:
			"Gestion d’une entreprise individuelle proposant des services freelance en informatique.",
	},
	"various-clients-freelance-developer": {
		company: "Divers clients via une agence",
		role: "Développeur freelance",
		location: "Suisse - À distance, sur site",
		description:
			"Réalisation de solutions backend, d’automatisation, web, mobiles et de jeux pour différents clients.",
	},
} satisfies LocalizedExperienceContent;

const skillGroupLabels = {
	"programming-languages": "Langages de programmation",
	backend: "Backend",
	frontend: "Frontend",
	databases: "Bases de données",
	"devops-cloud": "DevOps et cloud",
	practices: "Pratiques",
} satisfies LocalizedSkillGroupLabels;

export const portfolioFr = {
	...sharedPortfolioDetails,
	role: "Ingénieur logiciel | Développeur full-stack",
	location: "Moudon, Vaud, Suisse",
	summary:
		"Un développeur logiciel polyvalent avec 10 ans d’expérience en freelance.\nEntièrement autodidacte, sans diplôme formel.",
	languages: [
		"Français - langue maternelle (C2)",
		"Anglais - niveau intermédiaire (B1+)",
		"Allemand - niveau débutant (A1)",
	],
	experiences: createLocalizedExperiences(experienceContent),
	skillGroups: createSkillGroups(skillGroupLabels),
} satisfies Portfolio;
