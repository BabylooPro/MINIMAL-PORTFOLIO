import { Container } from "@/src/components/ui/Container";
import { LanguageSwitcher } from "@/src/components/ui/LanguageSwitcher";

import { getLocalePath, type LegalPageId, type Locale } from "@/src/lib/i18n/config";
import type { Messages } from "@/src/lib/i18n/messages/types";
import { getMediaUrl } from "@/src/lib/media-origin";
import type { Portfolio } from "@/src/types/portfolio";

import { isExternalHttpLink } from "@/src/utils/isExternalHttpLink";

type HeaderProps = {
	currentLocale: Locale;
	labels: Pick<Messages["labels"], "downloadCv" | "email" | "languageSwitcher" | "phone">;
	page?: LegalPageId;
	portfolio: Pick<Portfolio, "name" | "role" | "location" | "links">;
	usePageHeading?: boolean;
};

function getContactLinkLabel(link: Portfolio["links"][number], labels: HeaderProps["labels"]) {
	if (link.href.startsWith("mailto:")) return `${labels.email}: ${link.label}`;
	if (link.href.startsWith("tel:")) return `${labels.phone}: ${link.label}`;
	return undefined;
}

export function Header({ currentLocale, labels, page, portfolio, usePageHeading = true }: HeaderProps) {
	const IdentityHeading = usePageHeading ? "h1" : "p";
	const contactLinks = portfolio.links.filter((link) => !isExternalHttpLink(link.href));
	const mobileRoles = portfolio.role.split("|").map((role) => role.trim()).filter(Boolean);
	const profileLinks = portfolio.links.filter((link) => isExternalHttpLink(link.href));

	return (
		<>
			<span aria-hidden="true" className="block h-0" id="top" />

			<header className="sticky top-0 z-40 bg-(--background-color) pt-[env(safe-area-inset-top)]" data-page-top data-page-header-shell tabIndex={-1}>
				<Container>
					<div
						className={[
							// HEADER SPACING AND BORDER
							"group/header border-b border-(--header-border-color) [--header-border-color:transparent] pb-9 pt-10 text-left",
							// SCROLL STATE TRANSITION
							"transition-colors duration-150 ease-[ease] data-scrolled:[--header-border-color:var(--border-color)]",
							// MOBILE SPACING
							"max-sm:pb-3 max-sm:pt-3",
						].join(" ")}
						data-page-header
					>
						<div className="flex items-start justify-between gap-4">
							<div
								className={[
									// FLEXIBLE HEADER IDENTITY
									"min-w-0 flex-1",
									// DESKTOP COLLAPSE FRAME
									"sm:relative sm:overflow-hidden sm:will-change-[height]",
								].join(" ")}
								data-header-identity-transition
							>
								<div
									className={[
										// MOBILE IDENTITY GRID
										"max-sm:grid max-sm:min-h-10 max-sm:grid-cols-[auto_minmax(0,1fr)] max-sm:grid-rows-[auto_auto] max-sm:gap-x-3",
										// DESKTOP IDENTITY TRANSITION
										"sm:will-change-[opacity,transform]",
									].join(" ")}
									data-header-identity
								>
									<IdentityHeading
										className={[
											// DESKTOP TITLE LAYOUT
											"flex items-center gap-3 text-3xl font-semibold tracking-tight text-(--foreground-color)",
											// MOBILE GRID PARTICIPATION
											"max-sm:contents",
										].join(" ")}
									>
										<a href={getLocalePath(currentLocale)} className="size-10 rounded-md max-sm:col-start-1 max-sm:row-span-2">
											<span className="sr-only">{portfolio.name}</span>

											<img
												src="/myface.jpg"
												alt=""
												aria-hidden="true"
												className="size-full rounded-md object-cover"
											/>
										</a>

										<span className="max-sm:col-start-2 max-sm:row-start-1 max-sm:self-start max-sm:text-xl max-sm:leading-none">
											{portfolio.name}
										</span>
									</IdentityHeading>

									<p
										className={[
											// MOBILE IDENTITY GRID
											"max-sm:col-start-2 max-sm:row-start-2 max-sm:mt-0 max-sm:self-end max-sm:text-xs max-sm:leading-[1.2]",
											// MOBILE ROLE TRANSITION
											"max-sm:transition-opacity max-sm:duration-500 max-sm:ease-in-out max-sm:data-role-fading:opacity-0 max-sm:motion-reduce:transition-none",
											// DESKTOP VISIBILITY
											"sm:hidden",
										].join(" ")}
										data-mobile-role-rotator
									>
										<span className="sr-only">
											{portfolio.role}
										</span>

										{mobileRoles.map((role, index) => (
											<span aria-hidden="true" data-mobile-role hidden={index > 0} key={role}>
												{role}
											</span>
										))}
									</p>

									<p
										className={[
											// DEFAULT ROLE STYLE
											"mt-2 hidden font-medium text-(--foreground-color)",
											// DESKTOP COMPACT TRANSITION
											"sm:block sm:pb-1 sm:group-data-fully-compact/header:pb-0",
										].join(" ")}
									>
										{portfolio.role}
									</p>
								</div>

								<div
									aria-hidden="true"
									className={[
										// MOBILE VISIBILITY
										"hidden",
										// DESKTOP COMPACT IDENTITY LAYOUT
										"sm:absolute sm:left-0 sm:top-0 sm:grid sm:h-12 sm:w-full sm:grid-cols-[auto_minmax(0,1fr)] sm:grid-rows-2 sm:gap-x-3 sm:pb-2",
										// DESKTOP TRANSITION STATE
										"sm:translate-y-2 sm:pointer-events-none sm:opacity-0 sm:will-change-[opacity,transform]",
									].join(" ")}
									data-header-compact-identity
								>
									<div className="size-10 rounded-md sm:col-start-1 sm:row-span-2">
										<img
											src="/myface.jpg"
											alt=""
											aria-hidden="true"
											className="size-full rounded-md object-cover"
										/>
									</div>

									<div className="sm:col-start-2 sm:row-span-2 sm:grid sm:min-w-0 sm:grid-rows-2">
										<p className="text-(--foreground-color) sm:self-start sm:text-xl sm:font-semibold sm:tracking-tight sm:leading-none">
											{portfolio.name}
										</p>

										<p className="text-(--foreground-color) sm:self-end sm:truncate sm:text-sm sm:font-medium sm:leading-none">
											{portfolio.role}
										</p>
									</div>
								</div>
							</div>

							<LanguageSwitcher
								currentLocale={currentLocale}
								label={labels.languageSwitcher}
								{...(page ? { page } : {})}
							/>
						</div>

						<div className="relative">
							<div
								className={[
									// COLLAPSIBLE CONTAINER
									"overflow-hidden contain-[layout_paint] will-change-[height,opacity]",
									// MOBILE MEASURED HEIGHT AND MOTION
									"max-sm:data-ready:max-h-(--header-details-height) max-sm:data-ready:[transition:max-height_380ms_ease,opacity_320ms_linear,transform_380ms_ease] max-sm:data-ready:will-change-[opacity,transform] max-sm:motion-reduce:transition-none",
									// MOBILE COLLAPSED STATE
									"max-sm:data-ready:data-collapsed:max-h-0 max-sm:data-collapsed:-translate-y-2 max-sm:data-collapsed:opacity-0",
									// DESKTOP BOTTOM-ANCHORED CONTENT
									"sm:flex sm:flex-col sm:justify-end",
								].join(" ")}
								data-header-scroll-hidden
							>
								<div className="max-sm:pt-4 sm:flex-none" data-header-scroll-content>
									<p>{portfolio.location}</p>

									{portfolio.links.length > 0 ? (
										<div className="mt-4">
											{contactLinks.length > 0 ? (
												<p>
													{contactLinks.map((link, index) => (
														<span key={link.href}>
															{index > 0 ? " - " : ""}

															<a
																aria-label={getContactLinkLabel(link, labels)}
																href={link.href}
																className="underline underline-offset-2 hover:text-(--muted-color)"
															>
																{link.label}
															</a>
														</span>
													))}
												</p>
											) : null}

											{profileLinks.length > 0 ? (
												<p>
													{profileLinks.map((link, index) => (
														<span key={link.href}>
															{index > 0 ? " - " : ""}

															<a
																className="underline underline-offset-2 hover:text-(--muted-color)"
																href={link.href}
																rel="noreferrer"
																target="_blank"
															>
																{link.label}
															</a>
														</span>
													))}
												</p>
											) : null}
										</div>
									) : null}

									<a
										className="mt-1 inline-flex underline underline-offset-2 hover:text-(--muted-color)"
										href={getMediaUrl("/CV_Developer_Max_Remy.pdf")}
									>
										{labels.downloadCv}
									</a>
								</div>
							</div>

							<div
								aria-hidden="true"
								className={[
									// BACKDROP OVER HEADER DETAILS ONLY
									"pointer-events-none absolute hidden backdrop-blur-sm",
									// BLEED FOR BLUR
									"-inset-x-6 top-0 -bottom-3 sm:-inset-x-8 sm:-bottom-4",
									// SHOWN WHEN BLUR
									"[html[data-overlay-blur]_&]:block",
								].join(" ")}
								data-header-details-backdrop
							/>
						</div>
					</div>
				</Container>
			</header >
		</>
	);
}
