import type { Messages } from "./types";

export const enMessages = {
	meta: {
		title: "Max Remy - Developer",
		description: "Self-taught software engineer with 10 years of freelance experience.",
		ogDescription:
			"Software engineer specialized in backend, web, mobile, cloud, and distributed applications.",
	},
	sections: {
		profile: "Profile",
		skills: "Skills",
		languages: "Languages",
		codingManual: "Coding Manual",
		experience: "Professional Experience",
		sideProjects: "Public Side Projects",
	},
	labels: {
		languageSwitcher: "Language",
		present: "Present",
		email: "Email",
		phone: "Phone",
	},
	codingManual: {
		previousVideo: "Previous video",
		nextVideo: "Next video",
		video: "Timelapse",
		videoCounterTemplate: "Video {current} of {total}",
	},
	sideProjects: {
		repositoryLabel: "Repository",
		liveDemoLabel: "Live demo",
		createdLabel: "Created",
		projects: {
			"babyloopro/contactform.csharp": {
				title: "ContactForm.csharp",
				description:
					"A .NET 8 backend API for secure contact-form submissions and email delivery.",
			},
			"babyloopro/open-autotools": {
				title: "Open AutoTools",
				description:
					"A Python command-line toolkit for recurring everyday developer tasks.",
			},
			"maxremydev/dont-commit-just-save": {
				title: "DONT COMMIT JUST SAVE",
				description:
					"A VS Code extension that blocks Git pushes after a DONT COMMIT JUST SAVE commit message.",
			},
			"babyloopro/showgooglereviews.jsx": {
				title: "ShowGoogleReviews.jsx",
				description: "A React component for displaying Google reviews in web interfaces.",
			},
		},
	},
	theme: {
		legend: "Color theme",
		system: "System",
		light: "Light",
		dark: "Dark",
	},
} satisfies Messages;
