import type { Messages } from "./types";

export const frMessages = {
	meta: {
		title: "Max Remy - Développeur",
		description: "Ingénieur logiciel autodidacte avec 10 ans d’expérience en freelance.",
		ogDescription:
			"Ingénieur logiciel spécialisé dans le backend, le web, le mobile, le cloud et les applications distribuées.",
	},
	sections: {
		profile: "Profil",
		skills: "Compétences",
		languages: "Langues",
		proofWork: "Démonstration de savoir-faire",
		experience: "Expérience professionnelle",
		sideProjects: "Projets personnels publics",
	},
	labels: {
		downloadCv: "Télécharger le CV",
		languageSwitcher: "Langue",
		present: "Aujourd’hui",
		email: "E-mail",
		phone: "Téléphone",
	},
	proofWork: {
		description:
			"De véritables sessions de développement où j’écris le code moi-même, condensées en timelapses ultra-rapides. J’y utilise peu, voire pas, d’IA, juste pour retrouver les sensations de la bonne époque :)\n\nDes versions plus lentes sont disponibles sur ma chaîne YouTube.",
		summary: "Des timelapses de véritables sessions de développement.",
		postscript:
			"P.-S. : Hors vidéo, j’utilise bien les IA agentiques pour aller plus vite, mais jamais pour « vibe coder ». Je garde la main sur la réflexion, l’architecture, le code et les décisions techniques.",
		tooltipLabel: "À propos de la démonstration de savoir-faire",
		previousVideo: "Vidéo précédente",
		nextVideo: "Vidéo suivante",
		video: "Timelapse",
		videoCounterTemplate: "Vidéo {current} sur {total}",
	},
	sideProjects: {
		repositoryLabel: "Dépôt",
		liveDemoLabel: "Démo en ligne",
		createdLabel: "Créé le",
		projects: {
			"babyloopro/contactform.csharp": {
				title: "ContactForm.csharp",
				description:
					"Une API backend .NET 8 pour les envois de formulaires de contact et la livraison d’e-mails.",
			},
			"babyloopro/open-autotools": {
				title: "Open AutoTools",
				description:
					"Une boîte à outils Python en ligne de commande pour les tâches récurrentes du développeur.",
			},
			"maxremydev/dont-commit-just-save": {
				title: "DONT COMMIT JUST SAVE",
				description:
					"Une extension VS Code qui bloque les push Git après un commit DONT COMMIT JUST SAVE.",
			},
			"babyloopro/showgooglereviews.jsx": {
				title: "ShowGoogleReviews.jsx",
				description:
					"Un composant React pour afficher des avis Google dans des interfaces web.",
			},
		},
	},
	theme: {
		legend: "Thème de couleur",
		system: "Système",
		light: "Clair",
		dark: "Sombre",
	},
} satisfies Messages;
