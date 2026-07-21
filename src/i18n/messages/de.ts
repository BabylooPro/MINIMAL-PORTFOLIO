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
		experience: "Berufliche Erfahrung",
		sideProjects: "Öffentliche Nebenprojekte",
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
	sideProjects: {
		repositoryLabel: "Repository",
		liveDemoLabel: "Live-Demo",
		createdLabel: "Erstellt",
		projects: {
			"babyloopro/contactform.csharp": {
				title: "ContactForm.csharp",
				description:
					"Eine .NET-8-Backend-API für Kontaktformular-Anfragen und die Zustellung von E-Mails.",
			},
			"babyloopro/open-autotools": {
				title: "Open AutoTools",
				description:
					"Ein Python-Kommandozeilenwerkzeug für wiederkehrende alltägliche Entwicklungsaufgaben.",
			},
			"maxremydev/dont-commit-just-save": {
				title: "DONT COMMIT JUST SAVE",
				description:
					"Eine VS-Code-Erweiterung, die Git-Pushes nach einem DONT-COMMIT-JUST-SAVE-Commit blockiert.",
			},
			"babyloopro/showgooglereviews.jsx": {
				title: "ShowGoogleReviews.jsx",
				description:
					"Eine React-Komponente zum Anzeigen von Google-Bewertungen in Weboberflächen.",
			},
		},
	},
	theme: {
		legend: "Farbschema",
		system: "System",
		light: "Hell",
		dark: "Dunkel",
	},
} satisfies Messages;
