export type Messages = {
	meta: {
		title: string;
		description: string;
		ogDescription: string;
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
	};
	proofWork: {
		description: string;
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
