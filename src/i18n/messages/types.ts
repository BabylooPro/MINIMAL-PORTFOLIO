export type Messages = {
	meta: {
		title: string;
		description: string;
		ogDescription: string;
		socialImageAlt: string;
	};
	sections: {
		profile: string;
		skills: string;
		languages: string;
		proofWork: string;
		experience: string;
		sideProjects: string;
	};
	labels: {
		downloadCv: string;
		languageSwitcher: string;
		present: string;
		email: string;
		phone: string;
		backToPortfolio: string;
	};
	footer: {
		navigationLabel: string;
		privacy: string;
		legal: string;
		backToTop: string;
	};
	legalPages: {
		lastUpdated: string;
		privacy: {
			title: string;
			description: string;
			intro: string;
			themeTitle: string;
			themeDescription: string;
			languageTitle: string;
			languageDescription: string;
			cvDownloadTitle: string;
			cvDownloadDescription: string;
			hostingTitle: string;
			hostingDescription: string;
			hostingPrivacyPolicyLabel: string;
			externalLinksTitle: string;
			externalLinksDescription: string;
			contactTitle: string;
			contactDescription: string;
			emailProviderPrivacyPolicyLabel: string;
			rightsTitle: string;
			rightsDescription: string;
			retentionTitle: string;
			retentionDescription: string;
			updatesTitle: string;
			updatesDescription: string;
		};
		legal: {
			title: string;
			description: string;
			publisherTitle: string;
			publisherDescription: string;
			businessInformation: {
				title: string;
				legalFormLabel: string;
				legalFormValue: string;
				ownerLabel: string;
				ownerValue: string;
				addressLabel: string;
				addressValue: string;
				uidLabel: string;
				uidValue: string;
				commercialRegisterLabel: string;
				commercialRegisterValue: string;
			};
			contactTitle: string;
			contactDescription: string;
			responsibilityTitle: string;
			responsibilityDescription: string;
			intellectualPropertyTitle: string;
			intellectualPropertyDescription: string;
			sourceCodeLicenseLabel: string;
			externalLinksTitle: string;
			externalLinksDescription: string;
		};
	};
	proofWork: {
		description: string;
		summary: string;
		postscript: string;
		tooltipLabel: string;
		previousVideo: string;
		nextVideo: string;
		video: string;
		videoCounterTemplate: string;
	};
	sideProjects: {
		repositoryLabel: string;
		liveDemoLabel: string;
		createdLabel: string;
		projects: {
			[repositorySlug: string]: {
				title: string;
				description: string;
			};
		};
	};
	theme: {
		legend: string;
		system: string;
		light: string;
		dark: string;
	};
};
