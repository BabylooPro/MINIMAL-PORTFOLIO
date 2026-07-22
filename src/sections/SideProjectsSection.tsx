import { SectionHeading } from "../components/SectionHeading";
import sideProjects from "../generated/side-projects.json";
import type { Locale } from "../i18n/config";
import { formatSideProjectDate } from "../i18n/format";
import type { Messages } from "../i18n/messages/types";
import type { GeneratedSideProject } from "../types/side-projects";

type SideProjectsSectionProps = {
	locale: Locale;
	content: Messages["sideProjects"];
	title: Messages["sections"]["sideProjects"];
};

const generatedProjects: readonly GeneratedSideProject[] = sideProjects;

type ProjectExternalLinkProps = {
	href: string;
	label: string;
};

function ProjectExternalLink({ href, label }: ProjectExternalLinkProps) {
	return (
		<a
			className="hover:underline focus-visible:underline"
			href={href}
			rel="noopener noreferrer"
			target="_blank"
		>
			{label}
			<span aria-hidden="true"> ↗</span>
		</a>
	);
}

export function SideProjectsSection({ content, locale, title }: SideProjectsSectionProps) {
	if (generatedProjects.length === 0) {
		return null;
	}

	return (
		<section aria-labelledby="side-projects-title">
			<SectionHeading id="side-projects-title">{title}</SectionHeading>

			<ul className="mt-4 grid grid-cols-1 gap-x-3 sm:grid-cols-2">
				{generatedProjects.map((project) => {
					const localizedProject = content.projects[project.slug];
					const description = localizedProject?.description ?? project.githubDescription;
					const hasTechnologies =
						project.primaryLanguage !== null || project.topics.length > 0;
					const createdAt = formatSideProjectDate(locale, project.createdAt);

					return (
						<li key={project.slug} className="row-span-5 grid grid-rows-subgrid">
							<article className="row-span-5 grid grid-rows-subgrid">
								<h3 className="border-t border-(--border-color) pt-2 font-semibold text-(--foreground-color)">
									{localizedProject?.title ?? project.name}
								</h3>

								{description ? (
									<p className="mt-1 leading-6">{description}</p>
								) : (
									<div aria-hidden="true" />
								)}

								{hasTechnologies ? (
									<p className="mt-2 text-sm text-(--muted-color)">
										{project.primaryLanguage ? (
											<span className="font-medium text-(--text-color)">
												{project.primaryLanguage}
											</span>
										) : null}
										{project.primaryLanguage && project.topics.length > 0 ? (
											<>
												<span className="sr-only">, </span>
												<span aria-hidden="true"> · </span>
											</>
										) : null}
										{project.topics.join(" · ")}
									</p>
								) : (
									<div aria-hidden="true" />
								)}

								<p className="mt-2 text-sm text-(--muted-color)">
									{content.createdLabel} {createdAt}
								</p>

								<p className="mt-3 pb-5 text-sm font-medium text-(--foreground-color)">
									<ProjectExternalLink
										href={project.repositoryUrl}
										label={content.repositoryLabel}
									/>

									{project.homepageUrl ? (
										<>
											<span
												aria-hidden="true"
												className="text-(--muted-color)"
											>
												{" · "}
											</span>
											<ProjectExternalLink
												href={project.homepageUrl}
												label={content.liveDemoLabel}
											/>
										</>
									) : null}
								</p>
							</article>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
