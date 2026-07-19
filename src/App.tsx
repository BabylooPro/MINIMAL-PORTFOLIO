import { Container } from "./components/Container";
import { portfolio } from "./data/portfolio";
import { ExperienceSection } from "./sections/ExperienceSection";
import { FooterSection } from "./sections/FooterSection";
import { HeaderSection } from "./sections/HeaderSection";
import { LanguagesSection } from "./sections/LanguagesSection";
import { ProfileSection } from "./sections/ProfileSection";
import { SkillsSection } from "./sections/SkillsSection";

function App() {
	return (
		<Container>
			<HeaderSection portfolio={portfolio} />

			<main className="space-y-7 pb-12">
				<ProfileSection profile={portfolio.profile} />
				<SkillsSection skillGroups={portfolio.skillGroups} />
				<LanguagesSection languages={portfolio.languages} />
				<ExperienceSection experiences={portfolio.experiences} />
			</main>

			<FooterSection company={portfolio.company} />
		</Container>
	);
}

export default App;
