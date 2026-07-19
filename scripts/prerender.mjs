import { mkdir, readdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const distDirectory = path.join(projectDirectory, "dist");
const assetsDirectory = path.join(distDirectory, "assets");
const indexPath = path.join(distDirectory, "index.html");
const sitemapPath = path.join(distDirectory, "sitemap.xml");
const serverDirectory = path.join(distDirectory, "server");
const serverEntryPath = path.join(serverDirectory, "entry-server.js");
const alternateLinksMarker = "<!--alternate-links-->";
const pageMetadataMarker = "<!--page-metadata-->";
const structuredDataMarker = "<!--structured-data-->";
const pageTitlePattern = /<title data-page-title>.*?<\/title>/;
const siteName = "Max Remy";
const routes = [
	{ kind: "root" },
	{ kind: "locale", locale: "en" },
	{ kind: "locale", locale: "fr" },
	{ kind: "locale", locale: "de" },
];

const alternateLinks = [
	{ hreflang: "en", href: "https://maxremy.dev/en/" },
	{ hreflang: "fr", href: "https://maxremy.dev/fr/" },
	{ hreflang: "de", href: "https://maxremy.dev/de/" },
	{ hreflang: "x-default", href: "https://maxremy.dev/" },
];

async function listFiles(directory) {
	const entries = await readdir(directory, {
		withFileTypes: true,
	});

	const files = await Promise.all(
		entries.map(async (entry) => {
			const entryPath = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				return listFiles(entryPath);
			}

			return [entryPath];
		}),
	);

	return files.flat();
}

async function removeJavaScriptFiles(directory) {
	const files = await listFiles(directory);

	await Promise.all(
		files.map(async (filePath) => {
			if (filePath.endsWith(".js") || filePath.endsWith(".js.map")) {
				await unlink(filePath);
			}
		}),
	);
}

function escapeHtml(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function renderMetadata(page) {
	const escapedTitle = escapeHtml(page.title);
	const escapedDescription = escapeHtml(page.description);
	const escapedOgDescription = escapeHtml(page.ogDescription);
	const escapedCanonical = escapeHtml(page.canonical);

	return [
		`<meta name="description" content="${escapedDescription}" />`,
		`<link rel="canonical" href="${escapedCanonical}" />`,
		`<meta property="og:type" content="${page.pathname === "/" ? "website" : "profile"}" />`,
		`<meta property="og:title" content="${escapedTitle}" />`,
		`<meta property="og:description" content="${escapedOgDescription}" />`,
		`<meta property="og:url" content="${escapedCanonical}" />`,
		`<meta property="og:site_name" content="${siteName}" />`,
		`<meta property="og:locale" content="${page.ogLocale}" />`,
		'<meta name="twitter:card" content="summary" />',
		`<meta name="twitter:title" content="${escapedTitle}" />`,
		`<meta name="twitter:description" content="${escapedOgDescription}" />`,
	].join("\n        ");
}

function renderAlternateLinks() {
	return alternateLinks
		.map((link) => `<link rel="alternate" hreflang="${link.hreflang}" href="${link.href}" />`)
		.join("\n        ");
}

function routeOutputPath(route) {
	return route.kind === "root" ? indexPath : path.join(distDirectory, route.locale, "index.html");
}

function validatePageHtml(page, route, indexHtml) {
	if (!indexHtml.includes("Max Remy")) {
		throw new Error(`The ${route.kind} page does not contain "Max Remy".`);
	}

	if (!/<main\b/i.test(indexHtml)) {
		throw new Error(`The ${route.kind} page does not contain a main element.`);
	}

	if (/<script\b(?=[^>]*\btype=["']module["'])[^>]*>/i.test(indexHtml)) {
		throw new Error(`A module script is still present on the ${route.kind} page.`);
	}

	if (/\brel=["']modulepreload["']/i.test(indexHtml)) {
		throw new Error(`A module preload is still present on the ${route.kind} page.`);
	}

	const scriptTags = indexHtml.match(/<script\b[^>]*>/gi) ?? [];
	const themeBootstrapScriptTags = scriptTags.filter((scriptTag) =>
		/\bdata-theme-bootstrap\b/i.test(scriptTag),
	);
	const localeRedirectScriptTags = scriptTags.filter((scriptTag) =>
		/\bdata-locale-redirect\b/i.test(scriptTag),
	);

	if (
		scriptTags.some(
			(scriptTag) =>
				!/\btype=["']application\/ld\+json["']/i.test(scriptTag) &&
				!/\bdata-theme-bootstrap\b/i.test(scriptTag) &&
				!/\bdata-locale-redirect\b/i.test(scriptTag),
		)
	) {
		throw new Error(`An executable script is still present on the ${route.kind} page.`);
	}

	if (
		themeBootstrapScriptTags.length !== 1 ||
		themeBootstrapScriptTags.some((scriptTag) => /\bsrc=/i.test(scriptTag))
	) {
		throw new Error(`The ${route.kind} page must contain one inline theme bootstrap script.`);
	}

	if (
		(route.kind === "root" && localeRedirectScriptTags.length !== 1) ||
		(route.kind !== "root" && localeRedirectScriptTags.length !== 0)
	) {
		throw new Error(`The ${route.kind} page has an invalid locale redirect script.`);
	}

	if (!indexHtml.includes(`<html lang="${page.lang}">`)) {
		throw new Error(`The ${route.kind} page has an incorrect document language.`);
	}

	if (!indexHtml.includes(`<link rel="canonical" href="${page.canonical}" />`)) {
		throw new Error(`The ${route.kind} page has an incorrect canonical URL.`);
	}

	if (!indexHtml.includes(`<title>${escapeHtml(page.title)}</title>`)) {
		throw new Error(`The ${route.kind} page has an incorrect document title.`);
	}

	alternateLinks.forEach((link) => {
		if (!indexHtml.includes(`hreflang="${link.hreflang}" href="${link.href}"`)) {
			throw new Error(`The ${route.kind} page is missing hreflang="${link.hreflang}".`);
		}
	});

	if (!/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>/i.test(indexHtml)) {
		throw new Error(`The ${route.kind} page does not contain JSON-LD structured data.`);
	}

	if (!indexHtml.includes(`"inLanguage":"${page.lang}"`)) {
		throw new Error(`The ${route.kind} page has incorrect JSON-LD language data.`);
	}

	if (
		![pageMetadataMarker, alternateLinksMarker, structuredDataMarker, "<!--app-html-->"].every(
			(marker) => !indexHtml.includes(marker),
		)
	) {
		throw new Error(`The ${route.kind} page contains an unresolved HTML marker.`);
	}

	if (
		!alternateLinks
			.slice(0, 3)
			.every((link) => indexHtml.includes(`href="${new URL(link.href).pathname}"`))
	) {
		throw new Error(`The ${route.kind} page does not contain the language selector.`);
	}
}

function validateStaticOutput(renderedPages, files, sitemap) {
	if (!files.includes(indexPath)) {
		throw new Error("The production index file was not generated.");
	}

	if (!files.includes(sitemapPath)) {
		throw new Error("The production sitemap file was not generated.");
	}

	renderedPages.forEach(({ page, route, outputPath, html }) => {
		if (!files.includes(outputPath)) {
			throw new Error(`The ${route.kind} output file was not generated.`);
		}

		validatePageHtml(page, route, html);
	});

	if (
		!files.some(
			(filePath) =>
				filePath.startsWith(`${assetsDirectory}${path.sep}`) && filePath.endsWith(".css"),
		)
	) {
		throw new Error("The generated CSS file was not found.");
	}

	if (files.some((filePath) => filePath.endsWith(".js") || filePath.endsWith(".js.map"))) {
		throw new Error("JavaScript files are still present in the production build.");
	}

	if (!alternateLinks.every((link) => sitemap.includes(`<loc>${link.href}</loc>`))) {
		throw new Error("The generated sitemap does not contain every localized URL.");
	}
}

const serverModuleUrl = pathToFileURL(serverEntryPath);
const { renderPage } = await import(serverModuleUrl.href);

if (typeof renderPage !== "function") {
	throw new TypeError('The static entry must export a "renderPage" function.');
}

let templateHtml;

try {
	templateHtml = await readFile(indexPath, "utf8");
} catch {
	throw new Error("The production index file was not generated.");
}

const rootPattern = /<div id="root">(?:<!--app-html-->)?<\/div>/;

if (!rootPattern.test(templateHtml)) {
	throw new Error('The "#root" element was not found in dist/index.html.');
}

if (!pageTitlePattern.test(templateHtml)) {
	throw new Error("The production HTML is missing a page title.");
}

if (
	![pageMetadataMarker, alternateLinksMarker, structuredDataMarker].every((marker) =>
		templateHtml.includes(marker),
	)
) {
	throw new Error("The production HTML is missing a metadata marker.");
}

const renderedPages = await Promise.all(
	routes.map(async (route) => {
		const page = renderPage(route);

		if (typeof page.appHtml !== "string" || page.appHtml.length === 0) {
			throw new Error(`The ${route.kind} static renderer returned an empty document.`);
		}

		const structuredDataJson = JSON.stringify(page.structuredData).replaceAll("<", "\\u003c");
		let html = templateHtml
			.replace('<html lang="en">', `<html lang="${page.lang}">`)
			.replace(pageTitlePattern, `<title>${escapeHtml(page.title)}</title>`)
			.replace(rootPattern, `<div id="root">${page.appHtml}</div>`)
			.replace(pageMetadataMarker, renderMetadata(page))
			.replace(alternateLinksMarker, renderAlternateLinks())
			.replace(
				structuredDataMarker,
				`<script type="application/ld+json">${structuredDataJson}</script>`,
			)
			.replace(
				/\s*<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=["'][^"']+\.js["'])[^>]*><\/script>/gi,
				"",
			)
			.replace(/\s*<link\b(?=[^>]*\brel=["']modulepreload["'])[^>]*>/gi, "");

		if (route.kind !== "root") {
			html = html.replace(
				/\s*<script\b(?=[^>]*\bdata-locale-redirect\b)[\s\S]*?<\/script>/i,
				"",
			);
		}
		const outputPath = routeOutputPath(route);

		await mkdir(path.dirname(outputPath), { recursive: true });
		await writeFile(outputPath, html, "utf8");

		return { page, route, outputPath, html };
	}),
);

let sitemap;

try {
	sitemap = await readFile(sitemapPath, "utf8");
} catch {
	throw new Error("The production sitemap file was not generated.");
}

await rm(serverDirectory, {
	recursive: true,
	force: true,
});

await removeJavaScriptFiles(distDirectory);

const outputFiles = await listFiles(distDirectory);
validateStaticOutput(renderedPages, outputFiles, sitemap);

console.log("Static HTML generated successfully.");
