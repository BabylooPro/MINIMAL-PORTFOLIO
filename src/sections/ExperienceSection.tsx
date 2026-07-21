import { SectionHeading } from "../components/SectionHeading";
import type { Locale } from "../i18n/config";
import { formatPortfolioDate } from "../i18n/format";
import type { Experience } from "../types/portfolio";

type ExperienceSectionProps = {
	locale: Locale;
	title: string;
	presentLabel: string;
	experiences: readonly Experience[];
};

function formatWorkContext(experience: Experience) {
	return [experience.employmentType, experience.location].filter(Boolean).join(" - ");
}

export function ExperienceSection({
	experiences,
	locale,
	presentLabel,
	title,
}: ExperienceSectionProps) {
	if (experiences.length === 0) {
		return null;
	}

	return (
		<section aria-labelledby="experience-title">
			<SectionHeading id="experience-title">{title}</SectionHeading>

			<ol className="mt-4 space-y-6">
				{experiences.map((experience) => {
					const workContext = formatWorkContext(experience);
					const startDate = formatPortfolioDate(
						locale,
						experience.startDate,
						experience.datePrecision,
					);
					const endDate = experience.endDate
						? formatPortfolioDate(locale, experience.endDate, experience.datePrecision)
						: presentLabel;

					return (
						<li key={experience.id}>
							<article>
								<header className="grid gap-x-6 gap-y-1 border-t border-(--border-color) pt-2 sm:grid-cols-[minmax(0,1fr)_auto]">
									<div>
										<h3 className="font-semibold text-(--foreground-color)">
											{experience.role}
										</h3>
										<p className="italic">{experience.company}</p>
									</div>

									<div className="sm:text-right">
										<p className="font-semibold text-(--foreground-color)">
											<time dateTime={experience.startDate}>{startDate}</time>

											<span aria-hidden="true"> – </span>

											{experience.endDate ? (
												<time dateTime={experience.endDate}>{endDate}</time>
											) : (
												<span>{presentLabel}</span>
											)}
										</p>

										{workContext ? (
											<p className="italic">{workContext}</p>
										) : null}
									</div>
								</header>

								<p className="mt-1 leading-6">{experience.description}</p>
							</article>
						</li>
					);
				})}
			</ol>
		</section>
	);
}
