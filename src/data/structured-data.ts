import { portfolio } from "./portfolio";

export const structuredData = {
	"@context": "https://schema.org",
	"@type": "ProfilePage",
	mainEntity: {
		"@type": "Person",
		name: "Max Remy",
		jobTitle: "Software Engineer",
		url: "https://maxremy.dev/",
		email: "mailto:maxremy.dev@gmail.com",
		address: {
			"@type": "PostalAddress",
			addressLocality: "Moudon",
			addressRegion: "Vaud",
			addressCountry: "CH",
		},
		sameAs: portfolio.links
			.filter((link) => link.href.startsWith("https://"))
			.map((link) => link.href),
	},
} as const;
