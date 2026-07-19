import type { Portfolio } from "../../../types/portfolio";

export const sharedPortfolioDetails = {
	name: "Max Remy",
	company: "Max Remy Dev",
	links: [
		{ label: "+41 79 873 06 05", href: "tel:+41798730605" },
		{ label: "maxremy.dev@gmail.com", href: "mailto:maxremy.dev@gmail.com" },
		{ label: "LinkedIn", href: "https://www.linkedin.com/in/maxremydev" },
		{ label: "GitHub", href: "https://github.com/babyloopro" },
		{ label: "YouTube", href: "https://www.youtube.com/@MaxRemyDev" },
		{ label: "Twitter", href: "https://x.com/babyloopro" },
	],
} satisfies Pick<Portfolio, "name" | "company" | "links">;
