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
		experience: "Experience",
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
	theme: {
		legend: "Color theme",
		system: "System",
		light: "Light",
		dark: "Dark",
	},
} satisfies Messages;
