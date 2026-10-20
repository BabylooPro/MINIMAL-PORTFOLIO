import { createLocalizedExperiences, type LocalizedExperienceContent } from "@/src/features/landing/data/portfolio/shared/experiences";
import { sharedPortfolioDetails } from "@/src/features/landing/data/portfolio/shared/portfolio-details";
import { createSkillGroups, type LocalizedSkillGroupLabels } from "@/src/features/landing/data/portfolio/shared/skill-groups";

import type { Portfolio } from "@/src/types/portfolio";

const experienceContent = {
	"muum-software-engineer": {
		role: "Ingénieur logiciel",
		employmentType: "Freelance",
		location: "À distance, sur site",
		description: "Développement d’une application de respiration en Swift/SwiftUI pour iOS et watchOS, intégrant Apple Watch, Garmin, HealthKit et le biofeedback HR/HRV en temps réel.",
	},
	"confidential-client-software-engineer": {
		company: "Client confidentiel",
		role: "Ingénieur logiciel",
		employmentType: "Freelance",
		location: "Télétravail intégral",
		description: "Conception et développement d’une plateforme distribuée d’arbitrage de cryptomonnaies avec C#, ASP.NET Core, MAUI, Docker, Grafana et Prometheus.",
	},
	"new-tells-studio-frontend-developer": {
		role: "Développeur frontend",
		employmentType: "Freelance",
		location: "Télétravail intégral",
		description: "Création d’un portfolio Next.js responsive à partir de Figma, avec des animations Rive, pour une entreprise de motion design.",
	},
	"max-remy-dev-founder": {
		role: "Fondateur",
		location: "Suisse - Télétravail intégral",
		description: "Gestion d’une entreprise individuelle proposant des services freelance en informatique.",
	},
	"various-clients-freelance-developer": {
		company: "Clients directs et missions d’agence",
		role: "Développeur indépendant, portage salarial",
		location: "Suisse - À distance, sur site",
		description: "Prestations backend, automatisation, web, mobiles et jeux, pour des clients locaux et des missions confiées par une agence.",
	},
	"self-taught-junior-developer": {
		company: "Projets personnels",
		role: "Développeur junior",
		location: "Suisse",
		description: "Apprentissage autodidacte de l’informatique : modding de jeux existants et création de jeux, compréhension du fonctionnement des PC et des logiciels, développement de logiciels et contributions à des projets.",
	},
	"self-taught-computing-beginnings": {
		company: "Apprentissage personnel",
		role: "Débuts en informatique",
		location: "Suisse",
		description: "Découverte de l’informatique dès l’âge de 8 ans : exploration de Windows, du matériel, des logiciels et des jeux, premières manipulations techniques avant d’apprendre à coder.",
	},
} satisfies LocalizedExperienceContent;

const skillGroupLabels = {
	"dotnet-backend": "Backend C#/.NET",
	apple: "Apple",
	web: "Web",
	"devops-cloud": "DevOps et cloud",
	"other-stacks": "Autres langages et frameworks",
	databases: "Bases de données",
	practices: "Pratiques",
	platform: "Plateformes",
} satisfies LocalizedSkillGroupLabels;

export const portfolioFr = {
	...sharedPortfolioDetails,
	role: "Ingénieur logiciel | Développeur full-stack | Athlète de montagne",
	location: "Moudon, Vaud, Suisse",
	summary: "Un développeur couteau suisse avec plus de dix ans de pratique du développement.\nEntièrement autodidacte, sans diplôme formel.",
	languages: [
		{
			label: "Français - Maternelle (C2)",
			capabilities: {
				listening: "Compréhension orale",
				speaking: "Expression orale fluide",
				writing: "Expression écrite",
			},
		},
		{
			label: "Anglais - Intermédiaire (B1+)",
			capabilities: {
				listening: "Compréhension orale",
				speaking: "Expression orale de niveau intermédiaire",
				writing: "Expression écrite",
			},
		},
		{
			label: "Allemand - Débutant (A1)",
			capabilities: {
				listening: "Compréhension orale",
			},
		},
	],
	experiences: createLocalizedExperiences(experienceContent),
	skillGroups: createSkillGroups(skillGroupLabels),
} satisfies Portfolio;
