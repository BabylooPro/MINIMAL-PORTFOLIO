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
		codingManual: string;
		experience: string;
		sideProjects: string;
	};
	labels: {
		languageSwitcher: string;
		present: string;
		email: string;
		phone: string;
	};
	codingManual: {
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
