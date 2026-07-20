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
const manifestDirectory = path.join(distDirectory, ".vite");
const manifestPath = path.join(manifestDirectory, "manifest.json");
const alternateLinksMarker = "<!--alternate-links-->";
const pageMetadataMarker = "<!--page-metadata-->";
const structuredDataMarker = "<!--structured-data-->";
const pageTitlePattern = /<title data-page-title>.*?<\/title>/;
const themeControllerEntry = "src/client/theme-controller.ts";
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

function escapeHtml(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function escapeRegularExpression(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getAttribute(element, attribute) {
	const attributePattern = new RegExp(
		`\\b${escapeRegularExpression(attribute)}=["']([^"']*)["']`,
		"i",
	);

	return element.match(attributePattern)?.[1] ?? null;
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

function isModuleScript(scriptElement) {
	return getAttribute(scriptElement, "type") === "module";
}

function isJsonLdScript(scriptElement) {
	return getAttribute(scriptElement, "type") === "application/ld+json";
}

function normalizePublicAssetPath(assetPath) {
	if (!assetPath.startsWith("/") || assetPath.startsWith("//")) {
		throw new Error(`The theme controller has an invalid public path: ${assetPath}`);
	}

	return assetPath.slice(1);
}

function toDistPath(assetPath) {
	const outputPath = path.resolve(distDirectory, assetPath);
	const distPrefix = `${distDirectory}${path.sep}`;

	if (!outputPath.startsWith(distPrefix)) {
		throw new Error(`The theme controller asset is outside dist: ${assetPath}`);
	}

	return outputPath;
}

function getThemeControllerScript(html) {
	const controllerScripts = getScriptElements(html).filter((scriptElement) =>
		hasAttribute(scriptElement, "data-theme-controller"),
	);

	if (controllerScripts.length !== 1) {
		throw new Error("The production HTML must contain exactly one theme controller script.");
	}

	const [controllerScript] = controllerScripts;
	const src = getAttribute(controllerScript, "src");

	if (!isModuleScript(controllerScript) || !src) {
		throw new Error("The theme controller must be a module script with a src attribute.");
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

function readThemeControllerAssets(manifest, controllerSrc) {
	const controller = manifest[themeControllerEntry];

	if (!controller || typeof controller.file !== "string") {
		throw new Error("The Vite manifest does not contain the theme controller entry.");
	}

	const controllerAssetPath = normalizePublicAssetPath(controllerSrc);

	if (controller.file !== controllerAssetPath) {
		throw new Error("The Vite manifest and the theme controller script disagree.");
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

	visit(themeControllerEntry);

	return new Set([...assetPaths].map(toDistPath));
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

function removeReactAndUnusedModules(html) {
	let removedReactEntry = false;
	const cleanedHtml = html
		.replace(/\s*<script\b[\s\S]*?<\/script>/gi, (scriptElement) => {
			if (!isModuleScript(scriptElement)) {
				return scriptElement;
			}

			if (hasAttribute(scriptElement, "data-theme-controller")) {
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

function validatePageHtml(page, route, indexHtml, themeControllerSrc) {
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

	const scriptElements = getScriptElements(indexHtml);
	const themeBootstrapScripts = scriptElements.filter((scriptElement) =>
		hasAttribute(scriptElement, "data-theme-bootstrap"),
	);
	const localeRedirectScripts = scriptElements.filter((scriptElement) =>
		hasAttribute(scriptElement, "data-locale-redirect"),
	);
	const controller = getThemeControllerScript(indexHtml);

	if (
		scriptElements.some(
			(scriptElement) =>
				!isJsonLdScript(scriptElement) &&
				!hasAttribute(scriptElement, "data-theme-bootstrap") &&
				!hasAttribute(scriptElement, "data-theme-controller") &&
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

	if (controller.src !== themeControllerSrc) {
		throw new Error(`The ${route.kind} page has an incorrect theme controller source.`);
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

	for (const link of alternateLinks) {
		if (!indexHtml.includes(`hreflang="${link.hreflang}" href="${link.href}"`)) {
			throw new Error(`The ${route.kind} page is missing hreflang="${link.hreflang}".`);
		}
	}

	if (!/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>/i.test(indexHtml)) {
		throw new Error(`The ${route.kind} page does not contain JSON-LD structured data.`);
	}

	if (!indexHtml.includes(`"inLanguage":"${page.lang}"`)) {
		throw new Error(`The ${route.kind} page has incorrect JSON-LD language data.`);
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
		!alternateLinks
			.slice(0, 3)
			.every((link) => indexHtml.includes(`href="${new URL(link.href).pathname}"`))
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

	for (const { page, route, outputPath, html, themeControllerSrc } of renderedPages) {
		if (!files.includes(outputPath)) {
			throw new Error(`The ${route.kind} output file was not generated.`);
		}

		validatePageHtml(page, route, html, themeControllerSrc);
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

const themeController = getThemeControllerScript(templateHtml);
getReactEntryScript(templateHtml);
getLocaleRedirectScript(templateHtml);

let manifest;

try {
	manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch {
	throw new Error("The Vite manifest was not generated.");
}

const themeControllerAssets = readThemeControllerAssets(manifest, themeController.src);
const staticTemplateHtml = removeReactAndUnusedModules(templateHtml);

const renderedPages = await Promise.all(
	routes.map(async (route) => {
		const page = renderPage(route);

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
			.replace(alternateLinksMarker, renderAlternateLinks())
			.replace(
				structuredDataMarker,
				`<script type="application/ld+json">${structuredDataJson}</script>`,
			);
		const outputPath = routeOutputPath(route);

		await mkdir(path.dirname(outputPath), { recursive: true });
		await writeFile(outputPath, html, "utf8");

		return { page, route, outputPath, html, themeControllerSrc: themeController.src };
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
await rm(manifestDirectory, {
	recursive: true,
	force: true,
});
await removeUnusedJavaScriptFiles(themeControllerAssets);

const outputFiles = await listFiles(distDirectory);
await validateStaticOutput(renderedPages, outputFiles, sitemap, themeControllerAssets);

console.log("Static HTML generated successfully.");
