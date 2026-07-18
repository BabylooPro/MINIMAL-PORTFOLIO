import type { Portfolio } from "../types/portfolio";

type HeaderSectionProps = {
	portfolio: Pick<Portfolio, "name" | "role" | "location" | "links">;
};

function opensInNewTab(href: string) {
	return href.startsWith("https://") || href.startsWith("http://");
}

export function HeaderSection({ portfolio }: HeaderSectionProps) {
	const contactLinks = portfolio.links.filter((link) => !opensInNewTab(link.href));
	const profileLinks = portfolio.links.filter((link) => opensInNewTab(link.href));

	return (
		<header className="pb-9 pt-10 text-left">
			<h1 className="text-3xl font-semibold tracking-tight">{portfolio.name}</h1>
			<p className="mt-2 font-medium">{portfolio.role}</p>
			<p>{portfolio.location}</p>

			{portfolio.links.length > 0 ? (
				<nav className="mt-4" aria-label="Contact links">
					{contactLinks.length > 0 ? (
						<p>
							{contactLinks.map((link, index) => (
								<span key={link.href}>
									{index > 0 ? " - " : ""}
									<a href={link.href}>{link.label}</a>
								</span>
							))}
						</p>
					) : null}

					{profileLinks.length > 0 ? (
						<p>
							{profileLinks.map((link, index) => (
								<span key={link.href}>
									{index > 0 ? " - " : ""}

									<a href={link.href} target="_blank" rel="noreferrer">
										{link.label}
									</a>
								</span>
							))}
						</p>
					) : null}
				</nav>
			) : null}
		</header>
	);
}
