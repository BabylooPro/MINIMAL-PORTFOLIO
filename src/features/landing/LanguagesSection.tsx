import { EarIcon } from "@/src/components/icons/EarIcon";
import { MessageIcon } from "@/src/components/icons/MessageIcon";
import { PersonVoiceIcon } from "@/src/components/icons/PersonVoiceIcon";
import { Section, SectionHeading } from "@/src/components/ui/Section";
import { Tooltip } from "@/src/components/ui/Tooltip";

import type { Language } from "@/src/types/portfolio";

type LanguagesSectionProps = {
	title: string;
	languages: readonly Language[];
};

export function LanguagesSection({ languages, title }: LanguagesSectionProps) {
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
										label={language.capabilities.listening}
										mobilePlacement="anchored"
										trigger={<EarIcon />}
									>
										<p>{language.capabilities.listening}</p>
									</Tooltip>
								</div>
							) : null}

							{language.capabilities.speaking ? (
								<div className="relative inline-flex">
									<Tooltip
										id={`language-${languageIndex}-speaking`}
										label={language.capabilities.speaking}
										mobilePlacement="anchored"
										trigger={<PersonVoiceIcon />}
									>
										<p>{language.capabilities.speaking}</p>
									</Tooltip>
								</div>
							) : null}

							{language.capabilities.writing ? (
								<div className="relative inline-flex">
									<Tooltip
										id={`language-${languageIndex}-writing`}
										label={language.capabilities.writing}
										mobilePlacement="anchored"
										trigger={<MessageIcon />}
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
