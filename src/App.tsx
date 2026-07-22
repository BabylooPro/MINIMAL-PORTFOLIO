import { Container } from "./components/Container";

import type { Locale } from "./i18n/config";
import type { Dictionary } from "./i18n/dictionaries";

import { CodingManualSection } from "./sections/CodingManualSection";
import { ExperienceSection } from "./sections/ExperienceSection";
import { FooterSection } from "./sections/FooterSection";
import { HeaderSection } from "./sections/HeaderSection";
import { LanguagesSection } from "./sections/LanguagesSection";
import { ProfileSection } from "./sections/ProfileSection";
import { SideProjectsSection } from "./sections/SideProjectsSection";
import { SkillsSection } from "./sections/SkillsSection";

type AppProps = {
	locale: Locale;
	dictionary: Dictionary;
	showSideProjects: boolean;
};

function App({ locale, dictionary, showSideProjects }: AppProps) {
	const { messages, portfolio } = dictionary;

	return (
		<Container>
			<HeaderSection
				currentLocale={locale}
				emailLabel={messages.labels.email}
				languageSwitcherLabel={messages.labels.languageSwitcher}
				phoneLabel={messages.labels.phone}
				portfolio={portfolio}
			/>

			<main className="space-y-7 pb-12">
				<ProfileSection summary={portfolio.summary} title={messages.sections.profile} />

				<CodingManualSection
					description={messages.codingManual.description}
					links={portfolio.links}
					nextVideoLabel={messages.codingManual.nextVideo}
					postscript={messages.codingManual.postscript}
					previousVideoLabel={messages.codingManual.previousVideo}
					title={messages.sections.codingManual}
					tooltipLabel={messages.codingManual.tooltipLabel}
					videoCounterTemplate={messages.codingManual.videoCounterTemplate}
					videoLabel={messages.codingManual.video}
				/>

				<SkillsSection
					skillGroups={portfolio.skillGroups}
					title={messages.sections.skills}
				/>

				<LanguagesSection
					languages={portfolio.languages}
					title={messages.sections.languages}
				/>

				{showSideProjects ? (
					<SideProjectsSection
						content={messages.sideProjects}
						locale={locale}
						title={messages.sections.sideProjects}
					/>
				) : null}

				<ExperienceSection
					experiences={portfolio.experiences}
					locale={locale}
					presentLabel={messages.labels.present}
					title={messages.sections.experience}
				/>
			</main>

			<FooterSection company={portfolio.company} theme={messages.theme} />
		</Container>
	);
}

export default App;
