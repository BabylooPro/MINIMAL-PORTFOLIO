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
		codingManual: "Arbeitsproben",
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
		description:
			"Echte Entwicklungssessions, in denen ich den Code selbst schreibe, verdichtet zu ultraschnellen Zeitraffern. Ich nutze darin wenig bis keine KI, einfach, um das gute alte Gefühl wiederzufinden :)\n\nLangsamere Versionen gibt es auf meinem YouTube-Kanal.",
		postscript:
			"P.S. Außerhalb dieser Videos nutze ich agentische KI, um schneller voranzukommen, aber niemals für „Vibe Coding“. Denken, Architektur, Code und technische Entscheidungen bleiben bei mir.",
		tooltipLabel: "Über die Arbeitsproben",
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
