import type { Messages } from "./types";

export const enMessages = {
	meta: {
		title: "Max Remy - Developer",
		description: "Self-taught developer with 10 years of freelance experience.",
		ogDescription:
			"Self-taught freelance developer based in Vaud, Switzerland, with 10 years of experience.",
		socialImageAlt: "Portrait of Max Remy wearing swim goggles and giving a thumbs-up.",
	},
	sections: {
		profile: "Profile",
		skills: "Skills",
		languages: "Languages",
		proofWork: "Proof of Work",
		experience: "Professional Experience",
		sideProjects: "Public Side Projects",
	},
	labels: {
		downloadCv: "Download CV",
		languageSwitcher: "Language",
		present: "Present",
		email: "Email",
		phone: "Phone",
		backToPortfolio: "Back to portfolio",
	},
	footer: {
		navigationLabel: "Footer navigation",
		privacy: "Privacy",
		legal: "Legal notice",
		backToTop: "Back to top",
	},
	legalPages: {
		lastUpdated: "Last updated: 23 July 2026",
		privacy: {
			title: "Privacy",
			description: "How this portfolio handles technical preferences and contact details.",
			intro: "This portfolio has no account, contact form, audience measurement tool, or advertising tracker.",
			themeTitle: "Theme preference",
			themeDescription:
				"Choosing System, Light, or Dark stores only that preference in your browser's local storage. The site does not send that preference to Max Remy Dev.",
			languageTitle: "Language",
			languageDescription:
				"The site reads your browser language to redirect French and German browsers to their localized URLs. English and unsupported languages stay on the English root page. That detection happens locally, is not stored, and is not sent to Max Remy Dev. Choosing a language manually uses a link to the corresponding URL and is not stored either.",
			cvDownloadTitle: "CV download",
			cvDownloadDescription:
				"The Download CV link provides a static PDF file. This portfolio uses no form or analytics tool to identify downloads.",
			hostingTitle: "Hosting",
			hostingDescription:
				"This site and its static files, including the CV, are hosted by Hostinger, which acts as the hosting data processor. As part of the hosting service, Hostinger may process technical connection data, including the IP address, browser information, the date and time of the request, and the requested resource. Hostinger states that this data may be processed in the United Kingdom, the Netherlands, Lithuania, and Cyprus, as well as in other jurisdictions depending on the service.",
			hostingPrivacyPolicyLabel: "Hostinger privacy policy",
			externalLinksTitle: "External links",
			externalLinksDescription:
				"Links to external services open only when you select them. Those services process data under their own privacy policies.",
			contactTitle: "Contact",
			contactDescription:
				"Max Remy Dev, a sole proprietorship owned by Max Remy and based at Avenue de Cerjat 9, 1510 Moudon, Switzerland, is the data controller. When you send an email, your message is received by Max Remy Dev through Gmail (Google), the email provider used. Your own email provider also takes part in its delivery.",
			emailProviderPrivacyPolicyLabel: "Google privacy policy",
			rightsTitle: "Your rights",
			rightsDescription:
				"You may request access to, correction, or deletion of your personal data, or object to its processing, by writing to the email address above.",
			retentionTitle: "Retention period",
			retentionDescription:
				"Email messages and contact details are deleted no later than 24 months after the last exchange, unless retention is necessary to perform a contractual relationship, defend legal claims, or comply with a legal obligation. Accounting records are retained for ten years from the end of the relevant financial year. Technical connection data processed by Hostinger follows the retention period defined in its privacy policy.",
			updatesTitle: "Updates",
			updatesDescription:
				"This page will be updated before a new feature introduces additional personal-data processing or a third-party service.",
		},
		legal: {
			title: "Legal notice",
			description: "Publisher, contact, and content information for maxremy.dev.",
			publisherTitle: "Publisher",
			publisherDescription:
				"This portfolio is published by Max Remy Dev, a Swiss sole proprietorship owned by Max Remy.",
			businessInformation: {
				title: "Business information",
				legalFormLabel: "Legal form",
				legalFormValue: "Sole proprietorship",
				ownerLabel: "Owner",
				ownerValue: "Max Remy",
				addressLabel: "Business address",
				addressValue: "Avenue de Cerjat 9, 1510 Moudon, Switzerland",
				uidLabel: "Swiss business identification number (UID)",
				uidValue: "CHE-334.481.047",
				commercialRegisterLabel: "Commercial Register",
				commercialRegisterValue: "Canton of Vaud · CH-550.1.232.514-2",
			},
			contactTitle: "Contact",
			contactDescription: "For questions about this site, contact:",
			responsibilityTitle: "Content responsibility",
			responsibilityDescription:
				"Max Remy is responsible for the content published on this portfolio.",
			intellectualPropertyTitle: "Intellectual property",
			intellectualPropertyDescription:
				"This portfolio's source code is available under the MIT License. Unless stated otherwise, the text, design, photographs, CV, and other visual assets are not covered by that license and may not be reused without prior permission.",
			sourceCodeLicenseLabel: "Source code: MIT License",
			externalLinksTitle: "External links",
			externalLinksDescription:
				"Max Remy Dev has no control over the content or data processing of linked third-party websites.",
		},
	},
	proofWork: {
		description:
			"Real development sessions where I write the code myself, condensed into ultra-fast timelapses. I use little to no AI in them, just to relive the good old days :)\n\nSlower versions are available on my YouTube channel.",
		summary: "Timelapses of real development sessions.",
		postscript:
			"P.S. Outside these videos, I do use agentic AI to move faster, but never to “vibe code”. I stay in charge of the thinking, architecture, code, and technical decisions.",
		tooltipLabel: "About Proof of Work",
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
