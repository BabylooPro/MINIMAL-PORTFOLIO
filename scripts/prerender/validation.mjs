import { readdir, readFile, stat, unlink } from "node:fs/promises";
import path from "node:path";

import { getIgnoredProjectFiles } from "../ignored-project-files.mjs";
import {
	getAttribute,
	getJpegDimensions,
	getScriptElements,
	hasAttribute,
	isModuleScript,
} from "./html.mjs";
import { validatePageHtml } from "./page-validation.mjs";

export async function listFiles(directory) {
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

export async function validatePublicAssets({ projectDirectory, publicDirectory }) {
	const publicFiles = await listFiles(publicDirectory);
	const ignoredFiles = await getIgnoredProjectFiles(projectDirectory, publicFiles);

	if (ignoredFiles.length > 0) {
		throw new Error(
			`Public assets must not match .gitignore rules:\n${ignoredFiles.map((file) => `- ${file}`).join("\n")}`,
		);
	}
}

function normalizePublicAssetPath(assetPath) {
	if (!assetPath.startsWith("/") || assetPath.startsWith("//")) {
		throw new Error(`The site controller has an invalid public path: ${assetPath}`);
	}

	return assetPath.slice(1);
}

function toDistPath(assetPath, distDirectory) {
	const outputPath = path.resolve(distDirectory, assetPath);
	const distPrefix = `${distDirectory}${path.sep}`;

	if (!outputPath.startsWith(distPrefix)) {
		throw new Error(`The site controller asset is outside dist: ${assetPath}`);
	}

	return outputPath;
}

export function getLocaleRedirectScript(html) {
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

export function getReactEntryScript(html) {
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

export function readSiteControllerAssets({
	manifest,
	controllerSrc,
	siteControllerEntry,
	distDirectory,
}) {
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

	return new Set([...assetPaths].map((assetPath) => toDistPath(assetPath, distDirectory)));
}

export function removeReactAndUnusedModules(html) {
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

export function removeLocaleRedirect(html) {
	const redirectScript = getLocaleRedirectScript(html);
	return html.replace(redirectScript, "");
}

export async function removeUnusedJavaScriptFiles({ distDirectory, allowedFiles }) {
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

export async function validateStaticOutput({
	renderedPages,
	files,
	sitemap,
	allowedJavaScriptFiles,
	paths,
	markers,
	siteName,
}) {
	const { assetsDirectory, hostingerConfigPath, indexPath, sitemapPath, socialImagePath } = paths;

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

		validatePageHtml({
			page,
			route,
			indexHtml: html,
			siteControllerSrc,
			pageAlternateLinks,
			languageSwitcherLinks,
			siteName,
			...markers,
		});
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
