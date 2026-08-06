import { EarIcon } from "@/src/components/icons/EarIcon";
import { MessageIcon } from "@/src/components/icons/MessageIcon";
import { PersonVoiceIcon } from "@/src/components/icons/PersonVoiceIcon";
import { Section, SectionHeading } from "@/src/components/ui/Section";
import { Tooltip } from "@/src/components/ui/Tooltip";

import type { Language } from "@/src/types/portfolio";

type LanguagesSectionProps = {
	moreInformationLabel: string;
	title: string;
	languages: readonly Language[];
};

export function LanguagesSection({ languages, moreInformationLabel, title }: LanguagesSectionProps) {
	if (languages.length === 0) return null;

	return (
		<Section labelledBy="languages-title">
			<SectionHeading id="languages-title">
				{title}
			</SectionHeading>

			<ul className="mt-2 list-disc space-y-0.5 pl-5">
				{languages.map((language, languageIndex) => (
					<li key={language.label}>
						{language.label}

						<div className="relative top-px ml-1 inline-flex items-center gap-1">
							<span aria-hidden="true">
								-
							</span>

							{language.capabilities.listening ? (
								<div className="relative inline-flex">
									<Tooltip
										id={`language-${languageIndex}-listening`}
										trigger={<EarIcon />}
										triggerLabel={moreInformationLabel}
									>
										<p>{language.capabilities.listening}</p>
									</Tooltip>
								</div>
							) : null}

							{language.capabilities.speaking ? (
								<div className="relative inline-flex">
									<Tooltip
										id={`language-${languageIndex}-speaking`}
										trigger={<PersonVoiceIcon />}
										triggerLabel={moreInformationLabel}
									>
										<p>{language.capabilities.speaking}</p>
									</Tooltip>
								</div>
							) : null}

							{language.capabilities.writing ? (
								<div className="relative inline-flex">
									<Tooltip
										id={`language-${languageIndex}-writing`}
										trigger={<MessageIcon />}
										triggerLabel={moreInformationLabel}
									>
										<p>{language.capabilities.writing}</p>
									</Tooltip>
								</div>
							) : null}
						</div>
					</li>
				))}
			</ul>
		</Section>
	);
}
