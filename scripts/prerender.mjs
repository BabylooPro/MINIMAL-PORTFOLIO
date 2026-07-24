import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { escapeHtml } from "./prerender/html.mjs";
import { getSiteControllerScript } from "./prerender/page-validation.mjs";
import {
	getAlternateLinks,
	getLanguageSwitcherLinks,
	renderAlternateLinks,
	renderMetadata,
	renderSitemap,
	routeOutputPath,
} from "./prerender/seo.mjs";
import {
	getLocaleRedirectScript,
	getReactEntryScript,
	listFiles,
	readSiteControllerAssets,
	removeLocaleRedirect,
	removeReactAndUnusedModules,
	removeUnusedJavaScriptFiles,
	validatePublicAssets,
	validateStaticOutput,
} from "./prerender/validation.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const publicDirectory = path.join(projectDirectory, "public");
const distDirectory = path.join(projectDirectory, "dist");
const assetsDirectory = path.join(distDirectory, "assets");
const indexPath = path.join(distDirectory, "index.html");
const sitemapPath = path.join(distDirectory, "sitemap.xml");
const socialImagePath = path.join(distDirectory, "og-image.jpg");
const hostingerConfigPath = path.join(distDirectory, ".htaccess");
const serverDirectory = path.join(distDirectory, "server");
const serverEntryPath = path.join(serverDirectory, "entry-server.js");
const manifestDirectory = path.join(distDirectory, ".vite");
const manifestPath = path.join(manifestDirectory, "manifest.json");
const alternateLinksMarker = "<!--alternate-links-->";
const pageMetadataMarker = "<!--page-metadata-->";
const structuredDataMarker = "<!--structured-data-->";
const pageTitlePattern = /<title data-page-title>.*?<\/title>/;
const siteControllerEntry = "src/client/site-controller.ts";

const siteName = "Max Remy";

const routes = [
	{ kind: "root" },
	{ kind: "locale", locale: "en" },
	{ kind: "locale", locale: "fr" },
	{ kind: "locale", locale: "de" },
	{ kind: "legal", locale: "en", page: "privacy" },
	{ kind: "legal", locale: "fr", page: "privacy" },
	{ kind: "legal", locale: "de", page: "privacy" },
	{ kind: "legal", locale: "en", page: "legal" },
	{ kind: "legal", locale: "fr", page: "legal" },
	{ kind: "legal", locale: "de", page: "legal" },
];

const localizedAlternateLinks = [
	{ hreflang: "en-CH", href: "https://maxremy.dev/en/" },
	{ hreflang: "fr-CH", href: "https://maxremy.dev/fr/" },
	{ hreflang: "de-CH", href: "https://maxremy.dev/de/" },
	{ hreflang: "x-default", href: "https://maxremy.dev/" },
];

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

const siteController = getSiteControllerScript(templateHtml);
getReactEntryScript(templateHtml);
getLocaleRedirectScript(templateHtml);

await validatePublicAssets({ projectDirectory, publicDirectory });

let manifest;

try {
	manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch {
	throw new Error("The Vite manifest was not generated.");
}

const siteControllerAssets = readSiteControllerAssets({
	manifest,
	controllerSrc: siteController.src,
	siteControllerEntry,
	distDirectory,
});
const staticTemplateHtml = removeReactAndUnusedModules(templateHtml);
const localizedTemplateHtml = removeLocaleRedirect(staticTemplateHtml);

const renderedPages = await Promise.all(
	routes.map(async (route) => {
		const page = renderPage(route);
		const pageAlternateLinks = getAlternateLinks(route, localizedAlternateLinks);
		const languageSwitcherLinks = getLanguageSwitcherLinks(route);

		if (typeof page.appHtml !== "string" || page.appHtml.length === 0) {
			throw new Error(`The ${route.kind} static renderer returned an empty document.`);
		}

		const structuredDataJson = JSON.stringify(page.structuredData).replaceAll("<", "\\u003c");
		const routeTemplateHtml =
			route.kind === "root" ? staticTemplateHtml : localizedTemplateHtml;
		const html = routeTemplateHtml
			.replace('<html lang="en">', `<html lang="${page.lang}">`)
			.replace(pageTitlePattern, `<title>${escapeHtml(page.title)}</title>`)
			.replace(rootPattern, `<div id="root">${page.appHtml}</div>`)
			.replace(pageMetadataMarker, renderMetadata(page, siteName))
			.replace(alternateLinksMarker, renderAlternateLinks(pageAlternateLinks))
			.replace(
				structuredDataMarker,
				`<script type="application/ld+json">${structuredDataJson}</script>`,
			);
		const outputPath = routeOutputPath(route, { distDirectory, indexPath });

		await mkdir(path.dirname(outputPath), { recursive: true });
		await writeFile(outputPath, html, "utf8");

		return {
			page,
			route,
			outputPath,
			html,
			siteControllerSrc: siteController.src,
			alternateLinks: pageAlternateLinks,
			languageSwitcherLinks,
		};
	}),
);

const sitemap = renderSitemap(renderedPages);
await writeFile(sitemapPath, sitemap, "utf8");

await rm(serverDirectory, {
	recursive: true,
	force: true,
});
await rm(manifestDirectory, {
	recursive: true,
	force: true,
});
await removeUnusedJavaScriptFiles({
	distDirectory,
	allowedFiles: siteControllerAssets,
});

const outputFiles = await listFiles(distDirectory);
await validateStaticOutput({
	renderedPages,
	files: outputFiles,
	sitemap,
	allowedJavaScriptFiles: siteControllerAssets,
	paths: {
		assetsDirectory,
		hostingerConfigPath,
		indexPath,
		sitemapPath,
		socialImagePath,
	},
	markers: {
		alternateLinksMarker,
		pageMetadataMarker,
		structuredDataMarker,
	},
	siteName,
});

console.log("Static HTML generated successfully.");
