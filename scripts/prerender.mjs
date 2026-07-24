import { mkdir, readdir, readFile, rm, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getIgnoredProjectFiles } from "./ignored-project-files.mjs";

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

async function validatePublicAssets() {
	const publicFiles = await listFiles(publicDirectory);
	const ignoredFiles = await getIgnoredProjectFiles(projectDirectory, publicFiles);

	if (ignoredFiles.length > 0) {
		throw new Error(
			`Public assets must not match .gitignore rules:\n${ignoredFiles.map((file) => `- ${file}`).join("\n")}`,
		);
	}
}

function escapeHtml(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function getJpegDimensions(source) {
	if (source.length < 4 || source[0] !== 0xff || source[1] !== 0xd8) {
		throw new Error("The social image must be a valid JPEG.");
	}

	let offset = 2;

	while (offset < source.length) {
		if (source[offset] !== 0xff) {
			throw new Error("The social image must be a valid JPEG.");
		}

		while (source[offset] === 0xff) {
			offset += 1;
		}

		const marker = source[offset];
		offset += 1;

		if (marker === undefined || marker === 0xd9 || marker === 0xda) {
			break;
		}

		if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
			continue;
		}

		if (offset + 2 > source.length) {
			break;
		}

		const segmentLength = source.readUInt16BE(offset);

		if (segmentLength < 2 || offset + segmentLength > source.length) {
			throw new Error("The social image must be a valid JPEG.");
		}

		const isStartOfFrame =
			(marker >= 0xc0 && marker <= 0xc3) ||
			(marker >= 0xc5 && marker <= 0xc7) ||
			(marker >= 0xc9 && marker <= 0xcb) ||
			(marker >= 0xcd && marker <= 0xcf);

		if (isStartOfFrame) {
			if (segmentLength < 8) {
				throw new Error("The social image must be a valid JPEG.");
			}

			return {
				height: source.readUInt16BE(offset + 3),
				width: source.readUInt16BE(offset + 5),
			};
		}

		offset += segmentLength;
	}

	throw new Error("The social image does not contain JPEG dimensions.");
}

function escapeRegularExpression(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getAttribute(element, attribute) {
	const attributePattern = new RegExp(
		`\\b${escapeRegularExpression(attribute)}=(["'])([\\s\\S]*?)\\1`,
		"i",
	);

	return element.match(attributePattern)?.[2] ?? null;
}

function hasAttribute(element, attribute) {
	return new RegExp(`\\b${escapeRegularExpression(attribute)}\\b`, "i").test(element);
}

function getScriptElements(html) {
	return html.match(/<script\b[\s\S]*?<\/script>/gi) ?? [];
}

function getMetaElements(html, name) {
	return (html.match(/<meta\b[^>]*>/gi) ?? []).filter(
		(element) => getAttribute(element, "name") === name,
	);
}

function getMetaHttpEquivElements(html, value) {
	return (html.match(/<meta\b[^>]*>/gi) ?? []).filter(
		(element) => getAttribute(element, "http-equiv")?.toLowerCase() === value.toLowerCase(),
	);
}

function getMetaPropertyElements(html, property) {
	return (html.match(/<meta\b[^>]*>/gi) ?? []).filter(
		(element) => getAttribute(element, "property") === property,
	);
}

function getLinkElements(html, rel) {
	return (html.match(/<link\b[^>]*>/gi) ?? []).filter(
		(element) => getAttribute(element, "rel") === rel,
	);
}

function getAnchorElements(html) {
	return html.match(/<a\b[^>]*>/gi) ?? [];
}

function isModuleScript(scriptElement) {
	return getAttribute(scriptElement, "type") === "module";
}

function isJsonLdScript(scriptElement) {
	return getAttribute(scriptElement, "type") === "application/ld+json";
}

function normalizePublicAssetPath(assetPath) {
	if (!assetPath.startsWith("/") || assetPath.startsWith("//")) {
		throw new Error(`The site controller has an invalid public path: ${assetPath}`);
	}

	return assetPath.slice(1);
}

function toDistPath(assetPath) {
	const outputPath = path.resolve(distDirectory, assetPath);
	const distPrefix = `${distDirectory}${path.sep}`;

	if (!outputPath.startsWith(distPrefix)) {
		throw new Error(`The site controller asset is outside dist: ${assetPath}`);
	}

	return outputPath;
}

function getSiteControllerScript(html) {
	const controllerScripts = getScriptElements(html).filter((scriptElement) =>
		hasAttribute(scriptElement, "data-site-controller"),
	);

	if (controllerScripts.length !== 1) {
		throw new Error("The production HTML must contain exactly one site controller script.");
	}

	const [controllerScript] = controllerScripts;
	const src = getAttribute(controllerScript, "src");

	if (!isModuleScript(controllerScript) || !src) {
		throw new Error("The site controller must be a module script with a src attribute.");
	}

	return { src };
}

function getLocaleRedirectScript(html) {
	const redirectScripts = getScriptElements(html).filter((scriptElement) =>
		hasAttribute(scriptElement, "data-locale-redirect"),
	);

	if (redirectScripts.length !== 1) {
		throw new Error("The root page must contain exactly one locale redirect script.");
	}

	const [redirectScript] = redirectScripts;

	if (getAttribute(redirectScript, "src")) {
		throw new Error("The locale redirect script must be inline.");
	}

	return redirectScript;
}

function getReactEntryScript(html) {
	const reactEntryScripts = getScriptElements(html).filter((scriptElement) =>
		hasAttribute(scriptElement, "data-react-entry"),
	);

	if (reactEntryScripts.length !== 1) {
		throw new Error("The production HTML must contain exactly one React development entry.");
	}

	const [reactEntryScript] = reactEntryScripts;

	if (!isModuleScript(reactEntryScript) || !getAttribute(reactEntryScript, "src")) {
		throw new Error(
			"The React development entry must be a module script with a src attribute.",
		);
	}
}

function readSiteControllerAssets(manifest, controllerSrc) {
	const controller = manifest[siteControllerEntry];

	if (!controller || typeof controller.file !== "string") {
		throw new Error("The Vite manifest does not contain the site controller entry.");
	}

	const controllerAssetPath = normalizePublicAssetPath(controllerSrc);

	if (controller.file !== controllerAssetPath) {
		throw new Error("The Vite manifest and the site controller script disagree.");
	}

	const assetPaths = new Set();
	const visitedEntries = new Set();

	function visit(entryName) {
		if (visitedEntries.has(entryName)) {
			return;
		}

		visitedEntries.add(entryName);

		const entry = manifest[entryName];

		if (!entry || typeof entry.file !== "string") {
			throw new Error(`The Vite manifest import is missing: ${entryName}`);
		}

		if (entry.file.endsWith(".js")) {
			assetPaths.add(entry.file);
		}

		for (const importedEntry of entry.imports ?? []) {
			visit(importedEntry);
		}

		for (const dynamicImport of entry.dynamicImports ?? []) {
			visit(dynamicImport);
		}
	}

	visit(siteControllerEntry);

	return new Set([...assetPaths].map(toDistPath));
}

function renderMetadata(page) {
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

function getAlternateLinks(route) {
	return route.kind === "locale" ? localizedAlternateLinks : [];
}

function getLanguageSwitcherLinks(route) {
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

function renderAlternateLinks(links) {
	return links
		.map((link) => `<link rel="alternate" hreflang="${link.hreflang}" href="${link.href}" />`)
		.join("\n        ");
}

function renderSitemap(renderedPages) {
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

function routeOutputPath(route) {
	if (route.kind === "root") {
		return indexPath;
	}

	return route.kind === "legal"
		? path.join(distDirectory, route.locale, route.page, "index.html")
		: path.join(distDirectory, route.locale, "index.html");
}

function removeReactAndUnusedModules(html) {
	let removedReactEntry = false;
	const cleanedHtml = html
		.replace(/\s*<script\b[\s\S]*?<\/script>/gi, (scriptElement) => {
			if (!isModuleScript(scriptElement)) {
				return scriptElement;
			}

			if (hasAttribute(scriptElement, "data-site-controller")) {
				return scriptElement;
			}

			if (hasAttribute(scriptElement, "data-react-entry")) {
				removedReactEntry = true;
			}

			return "";
		})
		.replace(/\s*<link\b(?=[^>]*\brel=["']modulepreload["'])[^>]*>/gi, "");

	if (!removedReactEntry) {
		throw new Error("The React development entry was not removed from the production HTML.");
	}

	if (hasAttribute(cleanedHtml, "data-react-entry")) {
		throw new Error("The React development entry is still present after cleanup.");
	}

	return cleanedHtml;
}

function removeLocaleRedirect(html) {
	const redirectScript = getLocaleRedirectScript(html);

	return html.replace(redirectScript, "");
}

function assertSingleMetadata(elements, content, description) {
	if (elements.length !== 1 || getAttribute(elements[0], "content") !== escapeHtml(content)) {
		throw new Error(`The production HTML has an invalid ${description}.`);
	}
}

function parseStructuredData(indexHtml, route) {
	const structuredDataScripts = getScriptElements(indexHtml).filter(isJsonLdScript);

	if (structuredDataScripts.length !== 1) {
		throw new Error(`The ${route.kind} page must contain exactly one JSON-LD script.`);
	}

	const [structuredDataScript] = structuredDataScripts;
	const content = structuredDataScript.slice(
		structuredDataScript.indexOf(">") + 1,
		structuredDataScript.lastIndexOf("</script>"),
	);

	try {
		return JSON.parse(content);
	} catch {
		throw new Error(`The ${route.kind} page contains invalid JSON-LD structured data.`);
	}
}

function validatePageHtml(
	page,
	route,
	indexHtml,
	siteControllerSrc,
	pageAlternateLinks,
	languageSwitcherLinks,
) {
	if (!indexHtml.includes("Max Remy")) {
		throw new Error(`The ${route.kind} page does not contain "Max Remy".`);
	}

	if (!/<main\b/i.test(indexHtml)) {
		throw new Error(`The ${route.kind} page does not contain a main element.`);
	}

	if (/\brel=["']modulepreload["']/i.test(indexHtml)) {
		throw new Error(`A module preload is still present on the ${route.kind} page.`);
	}

	if (hasAttribute(indexHtml, "data-react-entry")) {
		throw new Error(`The React development entry is still present on the ${route.kind} page.`);
	}

	const contentSecurityPolicies = getMetaHttpEquivElements(indexHtml, "Content-Security-Policy");

	if (contentSecurityPolicies.length !== 1) {
		throw new Error(
			`The ${route.kind} page must contain one Content Security Policy meta tag.`,
		);
	}

	const [contentSecurityPolicy] = contentSecurityPolicies;
	const contentSecurityPolicyContent = getAttribute(contentSecurityPolicy, "content");
	const requiredContentSecurityPolicyDirectives = [
		"default-src 'self'",
		"base-uri 'self'",
		"object-src 'none'",
		"frame-src 'none'",
		"img-src 'self'",
		"media-src 'self'",
		"font-src 'self'",
		"style-src 'self'",
		"connect-src 'self'",
		"form-action 'self'",
	];

	if (
		!contentSecurityPolicyContent ||
		!requiredContentSecurityPolicyDirectives.every((directive) =>
			contentSecurityPolicyContent.includes(directive),
		) ||
		!/(?:^|;\s*)script-src 'self'(?: 'sha256-[A-Za-z0-9+/]{43}=')+(?:;|$)/i.test(
			contentSecurityPolicyContent,
		) ||
		/unsafe-(?:inline|eval)/i.test(contentSecurityPolicyContent)
	) {
		throw new Error(`The ${route.kind} page has an invalid Content Security Policy.`);
	}

	const firstScriptIndex = indexHtml.search(/<script\b/i);

	if (firstScriptIndex < 0 || indexHtml.indexOf(contentSecurityPolicy) > firstScriptIndex) {
		throw new Error(`The ${route.kind} Content Security Policy must precede all scripts.`);
	}

	const scriptElements = getScriptElements(indexHtml);
	const themeBootstrapScripts = scriptElements.filter((scriptElement) =>
		hasAttribute(scriptElement, "data-theme-bootstrap"),
	);
	const localeRedirectScripts = scriptElements.filter((scriptElement) =>
		hasAttribute(scriptElement, "data-locale-redirect"),
	);
	const controller = getSiteControllerScript(indexHtml);

	if (
		scriptElements.some(
			(scriptElement) =>
				!isJsonLdScript(scriptElement) &&
				!hasAttribute(scriptElement, "data-theme-bootstrap") &&
				!hasAttribute(scriptElement, "data-site-controller") &&
				!(route.kind === "root" && hasAttribute(scriptElement, "data-locale-redirect")),
		)
	) {
		throw new Error(`An unexpected executable script is present on the ${route.kind} page.`);
	}

	if (
		themeBootstrapScripts.length !== 1 ||
		themeBootstrapScripts.some((scriptElement) => getAttribute(scriptElement, "src"))
	) {
		throw new Error(`The ${route.kind} page must contain one inline theme bootstrap script.`);
	}

	if (route.kind === "root") {
		if (
			localeRedirectScripts.length !== 1 ||
			localeRedirectScripts.some((scriptElement) => getAttribute(scriptElement, "src"))
		) {
			throw new Error("The root page must contain one inline locale redirect script.");
		}

		const [localeRedirectScript] = localeRedirectScripts;

		if (
			!/\bnavigator\.(?:language|languages)\b/i.test(localeRedirectScript) ||
			!/\bwindow\.location\.replace\s*\(/i.test(localeRedirectScript)
		) {
			throw new Error("The root locale redirect script is incomplete.");
		}
	} else if (
		localeRedirectScripts.length !== 0 ||
		/\bnavigator\.(?:language|languages)\b/i.test(indexHtml)
	) {
		throw new Error(`The ${route.kind} page must not contain browser language detection.`);
	}

	if (controller.src !== siteControllerSrc) {
		throw new Error(`The ${route.kind} page has an incorrect site controller source.`);
	}

	if (!indexHtml.includes(`<html lang="${page.lang}">`)) {
		throw new Error(`The ${route.kind} page has an incorrect document language.`);
	}

	if (!indexHtml.includes(`<link rel="canonical" href="${page.canonical}" />`)) {
		throw new Error(`The ${route.kind} page has an incorrect canonical URL.`);
	}

	if (getLinkElements(indexHtml, "canonical").length !== 1) {
		throw new Error(`The ${route.kind} page must contain exactly one canonical URL.`);
	}

	if (!indexHtml.includes(`<title>${escapeHtml(page.title)}</title>`)) {
		throw new Error(`The ${route.kind} page has an incorrect document title.`);
	}

	assertSingleMetadata(
		getMetaElements(indexHtml, "robots"),
		page.indexable ? "index,follow,max-image-preview:large" : "noindex,follow",
		"robots directive",
	);
	assertSingleMetadata(
		getMetaElements(indexHtml, "description"),
		page.description,
		"description metadata",
	);
	assertSingleMetadata(
		getMetaElements(indexHtml, "twitter:card"),
		"summary_large_image",
		"Twitter card metadata",
	);
	assertSingleMetadata(
		getMetaElements(indexHtml, "twitter:title"),
		page.title,
		"Twitter title metadata",
	);
	assertSingleMetadata(
		getMetaElements(indexHtml, "twitter:description"),
		page.ogDescription,
		"Twitter description metadata",
	);
	assertSingleMetadata(
		getMetaElements(indexHtml, "twitter:image"),
		page.socialImage.url,
		"Twitter image metadata",
	);
	assertSingleMetadata(
		getMetaElements(indexHtml, "twitter:image:alt"),
		page.socialImage.alt,
		"Twitter image alt metadata",
	);

	const expectedOpenGraphMetadata = [
		["og:type", page.ogType],
		["og:title", page.title],
		["og:description", page.ogDescription],
		["og:url", page.canonical],
		["og:site_name", siteName],
		["og:locale", page.ogLocale],
		["og:image", page.socialImage.url],
		["og:image:type", page.socialImage.type],
		["og:image:width", String(page.socialImage.width)],
		["og:image:height", String(page.socialImage.height)],
		["og:image:alt", page.socialImage.alt],
	];

	for (const [property, content] of expectedOpenGraphMetadata) {
		assertSingleMetadata(
			getMetaPropertyElements(indexHtml, property),
			content,
			`${property} metadata`,
		);
	}

	let socialImageUrl;

	try {
		socialImageUrl = new URL(page.socialImage.url);
	} catch {
		throw new Error(`The ${route.kind} page has a non-absolute social image URL.`);
	}

	if (socialImageUrl.protocol !== "https:") {
		throw new Error(`The ${route.kind} page has a non-HTTPS social image URL.`);
	}

	for (const link of pageAlternateLinks) {
		if (!indexHtml.includes(`hreflang="${link.hreflang}" href="${link.href}"`)) {
			throw new Error(`The ${route.kind} page is missing hreflang="${link.hreflang}".`);
		}
	}

	if (getLinkElements(indexHtml, "alternate").length !== pageAlternateLinks.length) {
		throw new Error(`The ${route.kind} page has an invalid hreflang cluster.`);
	}

	const structuredData = parseStructuredData(indexHtml, route);

	if (structuredData.inLanguage !== page.lang) {
		throw new Error(`The ${route.kind} page has incorrect JSON-LD language data.`);
	}

	if (
		page.ogType === "profile" &&
		(structuredData["@type"] !== "ProfilePage" ||
			structuredData.primaryImageOfPage?.url !== page.socialImage.url ||
			structuredData.primaryImageOfPage?.width !== page.socialImage.width ||
			structuredData.primaryImageOfPage?.height !== page.socialImage.height ||
			structuredData.mainEntity?.["@type"] !== "Person" ||
			structuredData.mainEntity?.["@id"] !== "https://maxremy.dev/#max-remy")
	) {
		throw new Error(`The ${route.kind} page has incomplete profile JSON-LD data.`);
	}

	if (/react-dom|react-jsx-runtime|createRoot|hydrateRoot/i.test(indexHtml)) {
		throw new Error(`The ${route.kind} page still contains React runtime code.`);
	}

	const themeColorMetaElements = getMetaElements(indexHtml, "theme-color");

	if (
		themeColorMetaElements.length !== 1 ||
		!hasAttribute(themeColorMetaElements[0], "data-theme-color")
	) {
		throw new Error(`The ${route.kind} page must contain one dynamic theme-color meta tag.`);
	}

	const colorSchemeMetaElements = getMetaElements(indexHtml, "color-scheme");

	if (
		colorSchemeMetaElements.length !== 1 ||
		getAttribute(colorSchemeMetaElements[0], "content") !== "light dark"
	) {
		throw new Error(`The ${route.kind} page must contain the color-scheme meta tag.`);
	}

	if (
		![pageMetadataMarker, alternateLinksMarker, structuredDataMarker, "<!--app-html-->"].every(
			(marker) => !indexHtml.includes(marker),
		)
	) {
		throw new Error(`The ${route.kind} page contains an unresolved HTML marker.`);
	}

	if (
		!languageSwitcherLinks.every((link) => {
			const href = new URL(link.href).pathname;

			return getAnchorElements(indexHtml).some(
				(anchor) =>
					getAttribute(anchor, "href") === href &&
					getAttribute(anchor, "hreflang") === link.hreflang,
			);
		})
	) {
		throw new Error(`The ${route.kind} page does not contain the language selector.`);
	}
}

async function removeUnusedJavaScriptFiles(allowedFiles) {
	const files = await listFiles(distDirectory);

	await Promise.all(
		files.map(async (filePath) => {
			if (filePath.endsWith(".js.map")) {
				await unlink(filePath);
				return;
			}

			if (filePath.endsWith(".js") && !allowedFiles.has(filePath)) {
				await unlink(filePath);
			}
		}),
	);
}

async function validateStaticOutput(renderedPages, files, sitemap, allowedJavaScriptFiles) {
	if (!files.includes(indexPath)) {
		throw new Error("The production index file was not generated.");
	}

	if (!files.includes(sitemapPath)) {
		throw new Error("The production sitemap file was not generated.");
	}

	if (!files.includes(hostingerConfigPath)) {
		throw new Error("The Hostinger .htaccess configuration was not generated.");
	}

	for (const {
		page,
		route,
		outputPath,
		html,
		siteControllerSrc,
		alternateLinks: pageAlternateLinks,
		languageSwitcherLinks,
	} of renderedPages) {
		if (!files.includes(outputPath)) {
			throw new Error(`The ${route.kind} output file was not generated.`);
		}

		validatePageHtml(
			page,
			route,
			html,
			siteControllerSrc,
			pageAlternateLinks,
			languageSwitcherLinks,
		);
	}

	if (!files.includes(socialImagePath)) {
		throw new Error("The social image was not generated.");
	}

	if ((await stat(socialImagePath)).size > 250_000) {
		throw new Error("The social image exceeds the 250 kB budget.");
	}

	const [{ page: firstPage }] = renderedPages;
	const socialImageDimensions = getJpegDimensions(await readFile(socialImagePath));

	if (
		socialImageDimensions.width !== firstPage.socialImage.width ||
		socialImageDimensions.height !== firstPage.socialImage.height
	) {
		throw new Error(
			`The social image must be ${firstPage.socialImage.width} × ${firstPage.socialImage.height}, received ${socialImageDimensions.width} × ${socialImageDimensions.height}.`,
		);
	}

	if (
		!files.some(
			(filePath) =>
				filePath.startsWith(`${assetsDirectory}${path.sep}`) && filePath.endsWith(".css"),
		)
	) {
		throw new Error("The generated CSS file was not found.");
	}

	const javascriptFiles = files.filter((filePath) => filePath.endsWith(".js"));

	if (
		javascriptFiles.length !== allowedJavaScriptFiles.size ||
		javascriptFiles.some((filePath) => !allowedJavaScriptFiles.has(filePath))
	) {
		throw new Error("The production build contains unexpected JavaScript assets.");
	}

	for (const filePath of javascriptFiles) {
		const source = await readFile(filePath, "utf8");

		if (/react-dom|react-jsx-runtime|createRoot|hydrateRoot/i.test(source)) {
			throw new Error(`The React runtime is still shipped in ${path.basename(filePath)}.`);
		}
	}

	const indexablePages = renderedPages.filter(({ page }) => page.indexable);
	const nonIndexablePages = renderedPages.filter(({ page }) => !page.indexable);

	if (!indexablePages.every(({ page }) => sitemap.includes(`<loc>${page.canonical}</loc>`))) {
		throw new Error("The generated sitemap does not contain every indexable URL.");
	}

	if (nonIndexablePages.some(({ page }) => sitemap.includes(`<loc>${page.canonical}</loc>`))) {
		throw new Error("The generated sitemap contains a non-indexable URL.");
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

const siteController = getSiteControllerScript(templateHtml);
getReactEntryScript(templateHtml);
getLocaleRedirectScript(templateHtml);

await validatePublicAssets();

let manifest;

try {
	manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch {
	throw new Error("The Vite manifest was not generated.");
}

const siteControllerAssets = readSiteControllerAssets(manifest, siteController.src);
const staticTemplateHtml = removeReactAndUnusedModules(templateHtml);

const renderedPages = await Promise.all(
	routes.map(async (route) => {
		const page = renderPage(route);
		const pageAlternateLinks = getAlternateLinks(route);
		const languageSwitcherLinks = getLanguageSwitcherLinks(route);

		if (typeof page.appHtml !== "string" || page.appHtml.length === 0) {
			throw new Error(`The ${route.kind} static renderer returned an empty document.`);
		}

		const structuredDataJson = JSON.stringify(page.structuredData).replaceAll("<", "\\u003c");
		const routeTemplateHtml =
			route.kind === "root" ? staticTemplateHtml : removeLocaleRedirect(staticTemplateHtml);
		const html = routeTemplateHtml
			.replace('<html lang="en">', `<html lang="${page.lang}">`)
			.replace(pageTitlePattern, `<title>${escapeHtml(page.title)}</title>`)
			.replace(rootPattern, `<div id="root">${page.appHtml}</div>`)
			.replace(pageMetadataMarker, renderMetadata(page))
			.replace(alternateLinksMarker, renderAlternateLinks(pageAlternateLinks))
			.replace(
				structuredDataMarker,
				`<script type="application/ld+json">${structuredDataJson}</script>`,
			);
		const outputPath = routeOutputPath(route);

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
await removeUnusedJavaScriptFiles(siteControllerAssets);

const outputFiles = await listFiles(distDirectory);
await validateStaticOutput(renderedPages, outputFiles, sitemap, siteControllerAssets);

console.log("Static HTML generated successfully.");
