import { mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { rootUrl } from "@/config/site.mjs";

import { escapeHtml } from "@/scripts/prerender/html.mjs";
import { getSiteControllerScript } from "@/scripts/prerender/page-validation.mjs";
import { getAlternateLinks, getLanguageSwitcherLinks, renderAlternateLinks,
	renderMetadata, renderSitemap, routeOutputPath
} from "@/scripts/prerender/seo.mjs";
import { getLocaleRedirectScript, getReactEntryScript, listFiles, readSiteControllerAssets,
	removeLocaleRedirect, removeReactAndUnusedModules, removeUnusedJavaScriptFiles,
	validatePublicAssets, validateStaticOutput
} from "@/scripts/prerender/validation.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");

const publicDirectory = path.join(projectDirectory, "public");
const distDirectory = path.join(projectDirectory, "dist");
const assetsDirectory = path.join(distDirectory, "assets");
const indexPath = path.join(distDirectory, "index.html");
const sitemapPath = path.join(distDirectory, "sitemap.xml");
const socialImagePath = path.join(distDirectory, "og-image.jpg");
const cloudflareHeadersPath = path.join(distDirectory, "_headers");
const serverDirectory = path.join(distDirectory, "server");
const serverEntryPath = path.join(serverDirectory, "entry.js");
const manifestDirectory = path.join(distDirectory, ".vite");
const manifestPath = path.join(manifestDirectory, "manifest.json");

const alternateLinksMarker = "<!--alternate-links-->";
const pageMetadataMarker = "<!--page-metadata-->";
const structuredDataMarker = "<!--structured-data-->";
const siteControllerEntry = "app/client/site-controller.ts";

const pageTitlePattern = /<title data-page-title>.*?<\/title>/;

const siteName = "Max Remy";

const routes = [
	{ kind: "root" },

	{ kind: "not-found", locale: "en", rootFallback: true },
	{ kind: "not-found", locale: "en" },
	{ kind: "not-found", locale: "fr" },
	{ kind: "not-found", locale: "de" },

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
	{ hreflang: "en-CH", href: new URL("/en/", rootUrl).href },
	{ hreflang: "fr-CH", href: new URL("/fr/", rootUrl).href },
	{ hreflang: "de-CH", href: new URL("/de/", rootUrl).href },
	{ hreflang: "x-default", href: rootUrl },
];

const serverModuleUrl = pathToFileURL(serverEntryPath);
const { renderPage } = await import(serverModuleUrl.href);
if (typeof renderPage !== "function") throw new TypeError('The static entry must export a "renderPage" function.');

let templateHtml;
try {
	templateHtml = await readFile(indexPath, "utf8");
} catch {
	throw new Error("The production index file was not generated.");
}

const rootPattern = /<div id="root">(?:<!--app-html-->)?<\/div>/;
if (!rootPattern.test(templateHtml)) throw new Error('The "#root" element was not found in dist/index.html.');
if (!pageTitlePattern.test(templateHtml)) throw new Error("The production HTML is missing a page title.");
if (![pageMetadataMarker, alternateLinksMarker, structuredDataMarker].every((marker) => templateHtml.includes(marker))) throw new Error("The production HTML is missing a metadata marker.");

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

const siteControllerAssets = readSiteControllerAssets({ manifest, controllerSrc: siteController.src, siteControllerEntry, distDirectory });
const staticTemplateHtml = removeReactAndUnusedModules(templateHtml);
const localizedTemplateHtml = removeLocaleRedirect(staticTemplateHtml);

const renderedPages = await Promise.all(
	routes.map(async (route) => {
		const page = renderPage(route);
		const pageAlternateLinks = getAlternateLinks(route, localizedAlternateLinks);
		const languageSwitcherLinks = getLanguageSwitcherLinks(route);
		if (typeof page.appHtml !== "string" || page.appHtml.length === 0) throw new Error(`The ${route.kind} static renderer returned an empty document.`);

		const structuredDataJson = JSON.stringify(page.structuredData).replaceAll("<", String.raw`\u003c`);
		const routeTemplateHtml = route.kind === "root" ? staticTemplateHtml : localizedTemplateHtml;
		const html = routeTemplateHtml
			.replace('<html lang="en">', `<html lang="${page.lang}">`)
			.replace(pageTitlePattern, `<title>${escapeHtml(page.title)}</title>`)
			.replace(rootPattern, `<div id="root">${page.appHtml}</div>`)
			.replace(pageMetadataMarker, renderMetadata(page, siteName))
			.replace(alternateLinksMarker, renderAlternateLinks(pageAlternateLinks))
			.replace(structuredDataMarker, `<script type="application/ld+json">${structuredDataJson}</script>`);

		const outputPath = routeOutputPath(route, { distDirectory, indexPath });
		await mkdir(path.dirname(outputPath), { recursive: true });
		await writeFile(outputPath, html, "utf8");

		return { page, route, outputPath, html, siteControllerSrc: siteController.src, alternateLinks: pageAlternateLinks, languageSwitcherLinks };
	}),
);

const sitemap = renderSitemap(renderedPages);
await writeFile(sitemapPath, sitemap, "utf8");

const contentSecurityPolicy = templateHtml.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/u)?.[1];
if (!contentSecurityPolicy) throw new Error("The built template does not declare a Content-Security-Policy meta tag.");

const cloudflareHeaders = await readFile(cloudflareHeadersPath, "utf8");
const frameAncestorsDirective = "  Content-Security-Policy: frame-ancestors 'none'\n";
if (!cloudflareHeaders.includes(frameAncestorsDirective)) throw new Error("The Cloudflare Pages _headers file no longer declares the frame-ancestors policy to extend.");

await writeFile(
	cloudflareHeadersPath,
	cloudflareHeaders.replace(frameAncestorsDirective, `  Content-Security-Policy: ${contentSecurityPolicy}; frame-ancestors 'none'\n`),
	"utf8",
);

await rm(serverDirectory, { recursive: true, force: true });
await rm(manifestDirectory, { recursive: true, force: true });
await removeUnusedJavaScriptFiles({ distDirectory, allowedFiles: siteControllerAssets });

const externalVideoFiles = (await listFiles(path.join(distDirectory, "videos", "timelapse"))).filter((filePath) => filePath.endsWith(".mp4"));
await Promise.all(externalVideoFiles.map((filePath) => unlink(filePath)));

const outputFiles = await listFiles(distDirectory);
await validateStaticOutput({
	renderedPages,
	files: outputFiles,
	sitemap,
	allowedJavaScriptFiles: siteControllerAssets,
	paths: {
		assetsDirectory,
		cloudflareHeadersPath,
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
