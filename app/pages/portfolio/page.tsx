import RootLayout from "@/app/layout";

import { Section, SectionHeading } from "@/src/components/ui/Section";
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

function PortfolioPage({ locale, dictionary, showSideProjects }: Readonly<PortfolioPageProps>) {
	const { messages, portfolio } = dictionary;
	const email = portfolio.links.find((link) => link.href.startsWith("mailto:"));

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

				{email ? (
					<Section className="no-print" labelledBy="contact-title">
						<SectionHeading id="contact-title">{messages.sections.contact}</SectionHeading>

						<p className="mt-2">{messages.labels.contactPrompt}</p>

						<a
							className={[
								// BASE
								"mt-4 inline-flex rounded-md px-4 py-2 border border-(--border-color) bg-(--background-color)",
								// TYPOGRAPHY
								"text-sm font-medium text-(--foreground-color)",
								// EFFECTS
								"transition-[background-color,color,transform] hover:bg-(--foreground-color) hover:text-(--background-color) active:translate-y-px",
								// FOCUS
								"focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:outline-offset-2",
							].join(" ")}
							href={email.href}
						>
							{email.label}
						</a>
					</Section>
				) : null}
			</main>
		</RootLayout>
	);
}

export default PortfolioPage;
