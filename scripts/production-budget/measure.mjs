import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { performanceBudget } from "../../config/performance-budget.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

export const projectDirectory = path.resolve(scriptDirectory, "../..");
export const defaultOutputDirectory = path.join(projectDirectory, "dist");
export const defaultMediaSourceDirectory = path.join(
	projectDirectory,
	"public",
	"videos",
	"timelapse",
);

const reactRuntimePattern = /react-dom|react-jsx-runtime|createRoot|hydrateRoot/i;
const hydrationPattern = /createRoot|hydrateRoot/i;
const clientI18nPattern = /getDictionary|dictionaries|clientI18n|i18nRuntime/i;

async function pathExists(filePath) {
	try {
		await stat(filePath);
		return true;
	} catch {
		return false;
	}
}

export async function listFiles(directory) {
	if (!(await pathExists(directory))) {
		return [];
	}

	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const entryPath = path.join(directory, entry.name);

			return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
		}),
	);

	return files.flat();
}

export function gzipBytes(source) {
	return gzipSync(source, { level: 9 }).byteLength;
}

async function measureFile(filePath) {
	const source = await readFile(filePath);

	return {
		filePath,
		name: path.basename(filePath),
		rawBytes: source.byteLength,
		gzipBytes: gzipBytes(source),
		source,
	};
}

function getAttribute(element, attribute) {
	const escapedAttribute = attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = element.match(new RegExp(`\\b${escapedAttribute}=(['"])([\\s\\S]*?)\\1`, "i"));

	return match?.[2] ?? null;
}

function hasAttribute(element, attribute) {
	const escapedAttribute = attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	return new RegExp(`\\b${escapedAttribute}\\b`, "i").test(element);
}

function getElements(html, tagName) {
	return html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
}

function getScriptElements(html) {
	return html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) ?? [];
}

export function extractInlineScript(html, attribute) {
	const scripts = getScriptElements(html).filter(
		(script) => hasAttribute(script, attribute) && !getAttribute(script, "src"),
	);

	if (scripts.length !== 1) {
		return null;
	}

	const [script] = scripts;
	const contentStart = script.indexOf(">");
	const contentEnd = script.toLowerCase().lastIndexOf("</script>");

	if (contentStart < 0 || contentEnd < contentStart) {
		return null;
	}

	return script.slice(contentStart + 1, contentEnd);
}

function getCanonicalOrigin(html) {
	const canonical = getElements(html, "link").find((element) =>
		getAttribute(element, "rel")?.split(/\s+/).includes("canonical"),
	);
	const href = canonical ? getAttribute(canonical, "href") : null;

	if (!href) {
		return null;
	}

	try {
		return new URL(href).origin;
	} catch {
		return null;
	}
}

function getHtmlResourceReferences(html) {
	const references = [];

	for (const element of getElements(html, "script")) {
		const src = getAttribute(element, "src");

		if (src) {
			references.push({ kind: "script", url: src, isFont: false });
		}
	}

	for (const element of getElements(html, "link")) {
		const rel = getAttribute(element, "rel")?.toLowerCase().split(/\s+/) ?? [];
		const href = getAttribute(element, "href");

		if (href && (rel.includes("stylesheet") || rel.includes("preload"))) {
			references.push({
				kind: `link ${rel.join(" ")}`,
				url: href,
				isFont: getAttribute(element, "as")?.toLowerCase() === "font",
			});
		}
	}

	for (const tagName of ["img", "video", "source"]) {
		for (const element of getElements(html, tagName)) {
			const src = getAttribute(element, "src");

			if (src) {
				references.push({ kind: tagName, url: src, isFont: false });
			}

			if (tagName === "video") {
				const poster = getAttribute(element, "poster");

				if (poster) {
					references.push({ kind: "video poster", url: poster, isFont: false });
				}
			}
		}
	}

	return references;
}

export function getCssResourceReferences(source) {
	const references = [];
	const pattern = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gi;

	for (const match of source.matchAll(pattern)) {
		const url = match[1] ?? match[2] ?? match[3];

		if (url) {
			references.push({
				kind: "css url",
				url,
				isFont: /@font-face[\s\S]*$/i.test(source.slice(0, match.index)),
			});
		}
	}

	return references;
}

export function getJavaScriptResourceReferences(source) {
	const references = [];
	const pattern =
		/\b(?:fetch|importScripts|Worker|EventSource|WebSocket)\s*\(\s*(['"])([^'"]+)\1|\b(?:src|href)\s*=\s*(['"])([^'"]+)\3/gi;

	for (const match of source.matchAll(pattern)) {
		const url = match[2] ?? match[4];

		if (url) {
			references.push({ kind: "javascript", url, isFont: false });
		}
	}

	return references;
}

export function classifyResourceReference(reference, siteOrigin, allowedOrigins = []) {
	const { url } = reference;

	if (url.startsWith("data:")) {
		return { ...reference, scope: "data", isThirdParty: false };
	}

	if (url.startsWith("#") || (!url.includes(":") && !url.startsWith("//"))) {
		return { ...reference, scope: "relative", isThirdParty: false };
	}

	try {
		const origin = new URL(url, siteOrigin ?? "https://invalid.local").origin;
		const isAllowedOrigin = origin === siteOrigin || allowedOrigins.includes(origin);

		return {
			...reference,
			scope:
				origin === siteOrigin
					? "same-origin"
					: isAllowedOrigin
						? "first-party"
						: "third-party",
			isThirdParty: !isAllowedOrigin,
		};
	} catch {
		return { ...reference, scope: "unsupported", isThirdParty: true };
	}
}

function routeFromOutputPath(relativePath) {
	if (relativePath === "index.html") {
		return "/";
	}

	if (relativePath.endsWith("/index.html")) {
		return `/${relativePath.slice(0, -"index.html".length)}`;
	}

	return `/${relativePath}`;
}

function isPrimaryRoute(route) {
	return ["/", "/en/", "/fr/", "/de/"].includes(route);
}

function getLargestFile(files) {
	return files.reduce(
		(largestFile, file) =>
			!largestFile || file.rawBytes > largestFile.rawBytes ? file : largestFile,
		null,
	);
}

function getTotalBytes(files) {
	return files.reduce((total, file) => total + file.rawBytes, 0);
}

function getInlineMeasurement(source) {
	if (source === null) {
		return null;
	}

	const bytes = Buffer.from(source, "utf8");

	return { rawBytes: bytes.byteLength, gzipBytes: gzipBytes(bytes), source };
}

export async function measureProductionOutput({
	outputDirectory = defaultOutputDirectory,
	mediaSourceDirectory = path.resolve(outputDirectory) === defaultOutputDirectory
		? defaultMediaSourceDirectory
		: outputDirectory,
	allowedRuntimeOrigins = performanceBudget.architecture.allowedRuntimeOrigins,
} = {}) {
	const resolvedOutputDirectory = path.resolve(outputDirectory);
	const resolvedMediaSourceDirectory = path.resolve(mediaSourceDirectory);
	const outputExists = await pathExists(resolvedOutputDirectory);
	const files = await listFiles(resolvedOutputDirectory);
	const mediaSourceFiles = await listFiles(resolvedMediaSourceDirectory);
	const relativeFiles = files.map((filePath) => path.relative(resolvedOutputDirectory, filePath));
	const javascriptFiles = files.filter((filePath) => filePath.endsWith(".js"));
	const cssFiles = files.filter((filePath) => filePath.endsWith(".css"));
	const htmlPaths = files.filter((filePath) => filePath.endsWith(".html")).sort();
	const previewPaths = files
		.filter((filePath) => /\/videos\/timelapse\/previews\/[^/]+\.jpg$/u.test(filePath))
		.sort();
	const videoPaths = mediaSourceFiles
		.filter((filePath) => /\/videos\/timelapse\/[^/]+\.mp4$/u.test(filePath))
		.sort();
	const socialImagePath = path.join(resolvedOutputDirectory, "og-image.jpg");

	const [javascript, css, previews, videos, html] = await Promise.all([
		Promise.all(javascriptFiles.map(measureFile)),
		Promise.all(cssFiles.map(measureFile)),
		Promise.all(previewPaths.map(measureFile)),
		Promise.all(videoPaths.map(measureFile)),
		Promise.all(
			htmlPaths.map(async (filePath) => {
				const source = await readFile(filePath, "utf8");
				const relativePath = path.relative(resolvedOutputDirectory, filePath);
				const themeBootstrap = extractInlineScript(source, "data-theme-bootstrap");
				const localeRedirect = extractInlineScript(source, "data-locale-redirect");

				return {
					filePath,
					relativePath,
					route: routeFromOutputPath(relativePath),
					group: isPrimaryRoute(routeFromOutputPath(relativePath))
						? "primary"
						: "secondary",
					rawBytes: Buffer.byteLength(source, "utf8"),
					gzipBytes: gzipBytes(Buffer.from(source, "utf8")),
					source,
					inlineScripts: { themeBootstrap, localeRedirect },
					resourceReferences: getHtmlResourceReferences(source),
				};
			}),
		),
	]);

	const rootPage = html.find((page) => page.relativePath === "index.html");
	const themeBootstrap = getInlineMeasurement(rootPage?.inlineScripts.themeBootstrap ?? null);
	const localeRedirect = getInlineMeasurement(rootPage?.inlineScripts.localeRedirect ?? null);
	const controller = javascript.find((file) => file.name.startsWith("site-controller-")) ?? null;
	const socialImage = (await pathExists(socialImagePath))
		? await measureFile(socialImagePath)
		: null;
	const siteOrigin = rootPage ? getCanonicalOrigin(rootPage.source) : null;

	const resourceReferences = [
		...html.flatMap((page) => page.resourceReferences),
		...css.flatMap((file) => getCssResourceReferences(file.source.toString("utf8"))),
		...javascript.flatMap((file) =>
			getJavaScriptResourceReferences(file.source.toString("utf8")),
		),
	].map((reference) => classifyResourceReference(reference, siteOrigin, allowedRuntimeOrigins));

	const reactRuntimeFiles = javascript.filter((file) => reactRuntimePattern.test(file.source));
	const hydrationFiles = javascript.filter((file) => hydrationPattern.test(file.source));
	const clientI18nFiles = javascript.filter((file) => clientI18nPattern.test(file.source));

	return {
		outputDirectory: resolvedOutputDirectory,
		outputExists,
		files: relativeFiles,
		javascript: { files: javascript, controller },
		css: { files: css },
		html,
		inlineScripts: { themeBootstrap, localeRedirect },
		executableJavascript: {
			rootGzipBytes:
				(themeBootstrap?.gzipBytes ?? 0) +
				(localeRedirect?.gzipBytes ?? 0) +
				(controller?.gzipBytes ?? 0),
			localizedGzipBytes: (themeBootstrap?.gzipBytes ?? 0) + (controller?.gzipBytes ?? 0),
		},
		media: {
			previews: {
				files: previews,
				count: previews.length,
				totalBytes: getTotalBytes(previews),
				largestFile: getLargestFile(previews),
			},
			videos: {
				files: videos,
				count: videos.length,
				totalBytes: getTotalBytes(videos),
				largestFile: getLargestFile(videos),
			},
			socialImage,
		},
		architecture: {
			reactRuntimeBytes:
				reactRuntimeFiles.length === 0 ? 0 : getTotalBytes(reactRuntimeFiles),
			reactRuntimeFiles,
			clientSideHydration: hydrationFiles.length > 0,
			hydrationFiles,
			clientI18nRuntime: clientI18nFiles.length > 0,
			clientI18nFiles,
		},
		resources: {
			siteOrigin,
			references: resourceReferences,
			thirdParty: resourceReferences.filter((reference) => reference.isThirdParty),
			externalFonts: resourceReferences.filter(
				(reference) => reference.isThirdParty && reference.isFont,
			),
		},
	};
}
