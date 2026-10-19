import { createLocalizedExperiences, type LocalizedExperienceContent } from "@/src/features/landing/data/portfolio/shared/experiences";
import { sharedPortfolioDetails } from "@/src/features/landing/data/portfolio/shared/portfolio-details";
import { createSkillGroups, type LocalizedSkillGroupLabels } from "@/src/features/landing/data/portfolio/shared/skill-groups";

import type { Portfolio } from "@/src/types/portfolio";

const experienceContent = {
	"muum-software-engineer": {
		role: "Ingénieur logiciel",
		employmentType: "Freelance",
		location: "À distance, sur site",
		description: "Application de respiration pour iOS et watchOS. Développement de l’app et de ses intégrations Apple Watch, Garmin et HealthKit, avec un biofeedback HR/HRV en temps réel. Stack : Swift, SwiftUI.",
	},
	"confidential-client-software-engineer": {
		company: "Client confidentiel",
		role: "Ingénieur logiciel",
		employmentType: "Freelance",
		location: "Télétravail intégral",
		description: "Plateforme distribuée d’arbitrage de cryptomonnaies, conçue et développée par mes soins. Stack : C#, ASP.NET Core, MAUI, Docker, Grafana, Prometheus.",
	},
	"new-tells-studio-frontend-developer": {
		role: "Développeur frontend",
		employmentType: "Freelance",
		location: "Télétravail intégral",
		description: "Portfolio d’une entreprise de motion design. Intégration responsive à partir des maquettes Figma, avec des animations Rive. Stack : Next.js, Rive.",
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
		role: "Parcours autodidacte",
		location: "Suisse",
		description: "Découverte de l’informatique dès 8 ans, puis apprentissage autodidacte : modding et création de jeux, fonctionnement des PC et des logiciels, premiers logiciels et contributions à des projets.",
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
	summary: "Je conçois et développe des backends C#/.NET, des apps Apple en Swift/SwiftUI et des interfaces web React/Next.js, avec Docker et la CI/CD.\nDéveloppeur couteau suisse avec plus de dix ans de pratique du développement, en indépendant depuis 2017.\nAutodidacte, formé par la pratique.",
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
