import { Container } from "./components/ui/Container";

import type { Locale } from "./i18n/config";
import type { Dictionary } from "./i18n/dictionaries";

import { ExperienceSection } from "./sections/ExperienceSection";
import { FooterSection } from "./sections/FooterSection";
import { HeaderSection } from "./sections/HeaderSection";
import { LanguagesSection } from "./sections/LanguagesSection";
import { ProfileSection } from "./sections/ProfileSection";
import { ProofWorkSection } from "./sections/ProofWorkSection";
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
		<>
			<HeaderSection
				currentLocale={locale}
				downloadCvLabel={messages.labels.downloadCv}
				emailLabel={messages.labels.email}
				languageSwitcherLabel={messages.labels.languageSwitcher}
				phoneLabel={messages.labels.phone}
				portfolio={portfolio}
			/>

			<Container>
				<main className="mt-6 space-y-7 pb-44 sm:mt-0 sm:pb-44">
					<ProfileSection summary={portfolio.summary} title={messages.sections.profile} />

					<ProofWorkSection
						description={messages.proofWork.description}
						links={portfolio.links}
						nextVideoLabel={messages.proofWork.nextVideo}
						postscript={messages.proofWork.postscript}
						previousVideoLabel={messages.proofWork.previousVideo}
						title={messages.sections.proofWork}
						summary={messages.proofWork.summary}
						tooltipLabel={messages.proofWork.tooltipLabel}
						videoCounterTemplate={messages.proofWork.videoCounterTemplate}
						videoLabel={messages.proofWork.video}
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
			</Container>

			<FooterSection
				company={portfolio.company}
				currentLocale={locale}
				footer={messages.footer}
				theme={messages.theme}
			/>
		</>
	);
}

export default App;
