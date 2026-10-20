import type { ComponentType } from "react";

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

type LanguageCapability = keyof Language["capabilities"];

const capabilityDefinitions = [
	{ id: "listening", Icon: EarIcon },
	{ id: "speaking", Icon: PersonVoiceIcon },
	{ id: "writing", Icon: MessageIcon },
] as const satisfies readonly { id: LanguageCapability; Icon: ComponentType }[];

export function LanguagesSection({ languages, title }: Readonly<LanguagesSectionProps>) {
	if (languages.length === 0) return null;

	return (
		<Section labelledBy="languages-title">
			<SectionHeading id="languages-title">{title}</SectionHeading>

			<ul className="mt-2 list-disc space-y-0.5 pl-5">
				{languages.map((language, languageIndex) => (
					<li key={language.label}>
						{language.label}

						<div className="relative top-px ml-1 inline-flex items-center gap-1">
							<span aria-hidden="true">-</span>

							{capabilityDefinitions.map(({ Icon, id }) => {
								const capability = language.capabilities[id];
								if (!capability) return null;

								return (
									<div className="relative inline-flex" key={id}>
										<Tooltip
											id={`language-${languageIndex}-${id}`}
											trigger={<Icon />}
											triggerLabel={`${language.label}, ${capability}`}
										>
											<p>{capability}</p>
										</Tooltip>
									</div>
								);
							})}
						</div>
					</li>
				))}
			</ul>
		</Section>
	);
}
