import path from "node:path";

import { escapeHtml } from "./html.mjs";

export function renderMetadata(page, siteName) {
	const escapedTitle = escapeHtml(page.title);
	const escapedDescription = escapeHtml(page.description);
	const escapedOgDescription = escapeHtml(page.ogDescription);
	const escapedCanonical = escapeHtml(page.canonical);
	const escapedSocialImageUrl = escapeHtml(page.socialImage.url);
	const escapedSocialImageAlt = escapeHtml(page.socialImage.alt);

	const robots = page.indexable ? "index,follow,max-image-preview:large" : "noindex,follow";

	return [
		`<meta name="robots" content="${robots}" />`,
		`<meta name="description" content="${escapedDescription}" />`,
		`<link rel="canonical" href="${escapedCanonical}" />`,
		`<meta property="og:type" content="${page.ogType}" />`,
		`<meta property="og:title" content="${escapedTitle}" />`,
		`<meta property="og:description" content="${escapedOgDescription}" />`,
		`<meta property="og:url" content="${escapedCanonical}" />`,
		`<meta property="og:site_name" content="${siteName}" />`,
		`<meta property="og:locale" content="${page.ogLocale}" />`,
		`<meta property="og:image" content="${escapedSocialImageUrl}" />`,
		`<meta property="og:image:type" content="${page.socialImage.type}" />`,
		`<meta property="og:image:width" content="${page.socialImage.width}" />`,
		`<meta property="og:image:height" content="${page.socialImage.height}" />`,
		`<meta property="og:image:alt" content="${escapedSocialImageAlt}" />`,
		'<meta name="twitter:card" content="summary_large_image" />',
		`<meta name="twitter:title" content="${escapedTitle}" />`,
		`<meta name="twitter:description" content="${escapedOgDescription}" />`,
		`<meta name="twitter:image" content="${escapedSocialImageUrl}" />`,
		`<meta name="twitter:image:alt" content="${escapedSocialImageAlt}" />`,
	].join("\n        ");
}

export function getAlternateLinks(route, localizedAlternateLinks) {
	return route.kind === "locale" ? localizedAlternateLinks : [];
}

export function getLanguageSwitcherLinks(route) {
	if (route.kind !== "legal") {
		return [
			{ hreflang: "en", href: "https://maxremy.dev/en/" },
			{ hreflang: "fr", href: "https://maxremy.dev/fr/" },
			{ hreflang: "de", href: "https://maxremy.dev/de/" },
		];
	}

	return [
		{ hreflang: "en", href: `https://maxremy.dev/en/${route.page}/` },
		{ hreflang: "fr", href: `https://maxremy.dev/fr/${route.page}/` },
		{ hreflang: "de", href: `https://maxremy.dev/de/${route.page}/` },
	];
}

export function renderAlternateLinks(links) {
	return links
		.map((link) => `<link rel="alternate" hreflang="${link.hreflang}" href="${link.href}" />`)
		.join("\n        ");
}

export function renderSitemap(renderedPages) {
	const indexablePages = renderedPages.filter(({ page }) => page.indexable);
	const entries = indexablePages
		.map(({ page, alternateLinks }) => {
			const alternates = alternateLinks
				.map(
					(link) =>
						`\t\t<xhtml:link rel="alternate" hreflang="${link.hreflang}" href="${link.href}" />`,
				)
				.join("\n");

			return ["\t<url>", `\t\t<loc>${page.canonical}</loc>`, alternates, "\t</url>"].join(
				"\n",
			);
		})
		.join("\n");

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		entries,
		"</urlset>",
		"",
	].join("\n");
}

export function routeOutputPath(route, { distDirectory, indexPath }) {
	if (route.kind === "root") {
		return indexPath;
	}

	return route.kind === "legal"
		? path.join(distDirectory, route.locale, route.page, "index.html")
		: path.join(distDirectory, route.locale, "index.html");
}
