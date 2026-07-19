import { Container } from "./components/Container";

import type { Locale } from "./i18n/config";
import type { Dictionary } from "./i18n/dictionaries";

import { ExperienceSection } from "./sections/ExperienceSection";
import { FooterSection } from "./sections/FooterSection";
import { HeaderSection } from "./sections/HeaderSection";
import { LanguagesSection } from "./sections/LanguagesSection";
import { ProfileSection } from "./sections/ProfileSection";
import { SkillsSection } from "./sections/SkillsSection";

type AppProps = {
	locale: Locale;
	dictionary: Dictionary;
};

function App({ locale, dictionary }: AppProps) {
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
				<SkillsSection
					skillGroups={portfolio.skillGroups}
					title={messages.sections.skills}
				/>
				<LanguagesSection
					languages={portfolio.languages}
					title={messages.sections.languages}
				/>
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
