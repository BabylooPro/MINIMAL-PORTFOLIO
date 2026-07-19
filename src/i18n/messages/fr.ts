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
		experience: "Expérience",
	},
	labels: {
		languageSwitcher: "Langue",
		present: "Aujourd’hui",
		email: "E-mail",
		phone: "Téléphone",
	},
	theme: {
		legend: "Thème de couleur",
		system: "Système",
		light: "Clair",
		dark: "Sombre",
	},
} satisfies Messages;
