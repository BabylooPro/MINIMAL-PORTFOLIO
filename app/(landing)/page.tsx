import { Container } from "@/components/ui/Container";
import { Header } from "@/components/ui/Header";
import { ExperienceSection } from "@/features/landing/ExperienceSection";
import { Footer } from "@/features/landing/Footer";
import { LanguagesSection } from "@/features/landing/LanguagesSection";
import { ProfileSection } from "@/features/landing/ProfileSection";
import { ProofWorkSection } from "@/features/landing/ProofWorkSection";
import { SideProjectsSection } from "@/features/landing/SideProjectsSection";
import { SkillsSection } from "@/features/landing/SkillsSection";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type PortfolioPageProps = {
	locale: Locale;
	dictionary: Dictionary;
	showSideProjects: boolean;
};

function PortfolioPage({ locale, dictionary, showSideProjects }: PortfolioPageProps) {
	const { messages, portfolio } = dictionary;

	return (
		<>
			<Header
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

			<Footer
				company={portfolio.company}
				currentLocale={locale}
				footer={messages.footer}
				theme={messages.theme}
			/>
		</>
	);
}

export default PortfolioPage;
