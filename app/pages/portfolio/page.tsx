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
	const sectionLinks = [
		{ id: "proof-work-title", label: messages.sections.proofWork },
		{ id: "skills-title", label: messages.sections.skills },
		{ id: "languages-title", label: messages.sections.languages },
		...(showSideProjects ? [{ id: "side-projects-title", label: messages.sections.sideProjects }] : []),
		{ id: "experience-title", label: messages.sections.experience },
		...(email ? [{ id: "contact-title", label: messages.sections.contact }] : []),
	];

	return (
		<RootLayout dictionary={dictionary} locale={locale}>
			<main className="mt-6 scroll-mt-52 space-y-7 pb-44 outline-none sm:mt-0 sm:pb-44" id="main" tabIndex={-1}>
				<ProfileSection
					summary={portfolio.summary}
					title={messages.sections.profile}
				/>

				<nav aria-label={messages.labels.sectionNavigation} className="no-print">
					<ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
						{sectionLinks.map(({ id, label }) => (
							<li key={id}>
								<a className="underline underline-offset-2 hover:text-(--muted-color)" href={`#${id}`}>
									{label}
								</a>
							</li>
						))}
					</ul>
				</nav>

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
