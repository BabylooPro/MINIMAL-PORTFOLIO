type SideProject = {
	slug: string;
};

type SideProjectTranslations = Record<
	string,
	{
		title: string;
		description: string;
	}
>;

export function validateSideProjectTranslations(
	projects: readonly SideProject[],
	translationsByLocale: Readonly<Record<string, SideProjectTranslations>>,
): void {
	const slugs = projects.map((project) => project.slug);

	if (new Set(slugs).size !== slugs.length) {
		throw new Error("Side Projects snapshot contains duplicate slugs.");
	}

	for (const [locale, translations] of Object.entries(translationsByLocale)) {
		for (const slug of slugs) {
			const translation = translations[slug];

			if (!translation) {
				throw new Error(`Missing Side Project translation for "${slug}" in ${locale}.`);
			}

			if (
				translation.title.trim().length === 0 ||
				translation.description.trim().length === 0
			) {
				throw new Error(`Empty Side Project translation for "${slug}" in ${locale}.`);
			}
		}

		const unexpectedSlugs = Object.keys(translations).filter((slug) => !slugs.includes(slug));

		if (unexpectedSlugs.length > 0) {
			throw new Error(
				`Unexpected Side Project translation in ${locale}: ${unexpectedSlugs.join(", ")}.`,
			);
		}
	}
}
