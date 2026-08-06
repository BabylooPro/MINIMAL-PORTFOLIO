import RootLayout from "@/app/layout";

import { ExperienceSection } from "@/src/features/landing/ExperienceSection";
import { LanguagesSection } from "@/src/features/landing/LanguagesSection";
import { ProfileSection } from "@/src/features/landing/ProfileSection";
import { ProofWorkSection } from "@/src/features/landing/ProofWorkSection";
import { SideProjectsSection } from "@/src/features/landing/SideProjectsSection";
import { SkillsSection } from "@/src/features/landing/SkillsSection";

import type { Locale } from "@/src/lib/i18n/config";
import type { Dictionary } from "@/src/lib/i18n/dictionaries";

type PortfolioPageProps = {
	locale: Locale;
	dictionary: Dictionary;
	showSideProjects: boolean;
};

function PortfolioPage({ locale, dictionary, showSideProjects }: PortfolioPageProps) {
	const { messages, portfolio } = dictionary;

	return (
		<RootLayout dictionary={dictionary} locale={locale}>
			<main className="mt-6 space-y-7 pb-44 sm:mt-0 sm:pb-44">
				<ProfileSection
					summary={portfolio.summary}
					title={messages.sections.profile}
				/>

				<ProofWorkSection
					content={messages.proofWork}
					links={portfolio.links}
					locale={locale}
					title={messages.sections.proofWork}
				/>

				<SkillsSection
					skillGroups={portfolio.skillGroups}
					title={messages.sections.skills}
				/>

				<LanguagesSection
					languages={portfolio.languages}
					moreInformationLabel={messages.labels.moreInformation}
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
		</RootLayout>
	);
}

export default PortfolioPage;
