import type { Messages } from "./types";

export const deMessages = {
	meta: {
		title: "Max Remy - Entwickler",
		description: "Autodidaktischer Softwareentwickler mit 10 Jahren Erfahrung als Freelancer.",
		ogDescription:
			"Softwareentwickler mit Schwerpunkt auf Backend, Web, Mobile, Cloud und verteilten Anwendungen.",
	},
	sections: {
		profile: "Profil",
		skills: "Kompetenzen",
		languages: "Sprachen",
		codingManual: "Coding Manual",
		experience: "Berufserfahrung",
	},
	labels: {
		languageSwitcher: "Sprache",
		present: "Heute",
		email: "E-Mail",
		phone: "Telefon",
	},
	codingManual: {
		previousVideo: "Vorheriges Video",
		nextVideo: "Nächstes Video",
		video: "Zeitraffer",
		videoCounterTemplate: "Video {current} von {total}",
	},
	theme: {
		legend: "Farbschema",
		system: "System",
		light: "Hell",
		dark: "Dunkel",
	},
} satisfies Messages;
