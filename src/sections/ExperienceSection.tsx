import { SectionHeading } from "../components/SectionHeading";
import type { Experience } from "../types/portfolio";

type ExperienceSectionProps = {
	experiences: readonly Experience[];
};

function formatDate(date: string) {
	if (/^\d{4}$/.test(date)) {
		return date;
	}

	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		timeZone: "UTC",
		year: "numeric",
	}).format(new Date(`${date}-01T00:00:00Z`));
}

function formatWorkContext(experience: Experience) {
	return [experience.employmentType, experience.location].filter(Boolean).join(" - ");
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
	if (experiences.length === 0) {
		return null;
	}

	return (
		<section aria-labelledby="experience-title">
			<SectionHeading id="experience-title">Experience</SectionHeading>

			<ol className="mt-4 space-y-6">
				{experiences.map((experience) => {
					const workContext = formatWorkContext(experience);

					return (
						<li key={experience.id}>
							<article>
								<header className="grid gap-x-6 gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto] border-neutral-400 border-t mt-2">
									<div>
										<h3 className="font-semibold">{experience.role}</h3>
										<p className="italic">{experience.company}</p>
									</div>

									<div className="sm:text-right">
										<p className="font-semibold">
											<time dateTime={experience.startDate}>
												{formatDate(experience.startDate)}
											</time>

											<span aria-hidden="true"> - </span>

											{experience.endDate ? (
												<time dateTime={experience.endDate}>
													{formatDate(experience.endDate)}
												</time>
											) : (
												"Present"
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
