import { readdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const distDirectory = path.join(projectDirectory, "dist");
const assetsDirectory = path.join(distDirectory, "assets");
const indexPath = path.join(distDirectory, "index.html");
const serverDirectory = path.join(distDirectory, "server");
const serverEntryPath = path.join(serverDirectory, "entry-server.js");
const structuredDataMarker = "<!--structured-data-->";

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

function validateStaticOutput(indexHtml, files) {
	if (!files.includes(indexPath)) {
		throw new Error("The production index file was not generated.");
	}

	if (!indexHtml.includes("Max Remy")) {
		throw new Error('The production HTML does not contain "Max Remy".');
	}

	if (!/<main\b/i.test(indexHtml)) {
		throw new Error("The production HTML does not contain a main element.");
	}

	if (/<script\b(?=[^>]*\btype=["']module["'])[^>]*>/i.test(indexHtml)) {
		throw new Error("A module script is still present after static rendering.");
	}

	if (/\brel=["']modulepreload["']/i.test(indexHtml)) {
		throw new Error("A module preload is still present after static rendering.");
	}

	if (indexHtml.includes(structuredDataMarker)) {
		throw new Error("The structured data marker was not replaced.");
	}

	const scriptTags = indexHtml.match(/<script\b[^>]*>/gi) ?? [];

	if (scriptTags.some((scriptTag) => !/\btype=["']application\/ld\+json["']/i.test(scriptTag))) {
		throw new Error("Only JSON-LD script tags are allowed in the production HTML.");
	}

	if (!/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>/i.test(indexHtml)) {
		throw new Error("The production HTML does not contain JSON-LD structured data.");
	}

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
}

const serverModuleUrl = pathToFileURL(serverEntryPath);
const { render, renderStructuredData } = await import(serverModuleUrl.href);

if (typeof render !== "function") {
	throw new TypeError('The static entry must export a "render" function.');
}

if (typeof renderStructuredData !== "function") {
	throw new TypeError('The static entry must export a "renderStructuredData" function.');
}

const appHtml = render();

if (typeof appHtml !== "string" || appHtml.length === 0) {
	throw new Error("The static renderer returned an empty document.");
}

const structuredDataJson = renderStructuredData();

if (typeof structuredDataJson !== "string" || structuredDataJson.length === 0) {
	throw new Error("The structured data renderer returned an empty document.");
}

let indexHtml;

try {
	indexHtml = await readFile(indexPath, "utf8");
} catch {
	throw new Error("The production index file was not generated.");
}

const rootPattern = /<div id="root">(?:<!--app-html-->)?<\/div>/;

if (!rootPattern.test(indexHtml)) {
	throw new Error('The "#root" element was not found in dist/index.html.');
}

if (!indexHtml.includes(structuredDataMarker)) {
	throw new Error("The structured data marker was not found in dist/index.html.");
}

indexHtml = indexHtml.replace(rootPattern, `<div id="root">${appHtml}</div>`);
indexHtml = indexHtml.replace(
	structuredDataMarker,
	`<script type="application/ld+json">${structuredDataJson}</script>`,
);

indexHtml = indexHtml.replace(
	/\s*<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=["'][^"']+\.js["'])[^>]*><\/script>/gi,
	"",
);

indexHtml = indexHtml.replace(/\s*<link\b(?=[^>]*\brel=["']modulepreload["'])[^>]*>/gi, "");

await writeFile(indexPath, indexHtml, "utf8");

await rm(serverDirectory, {
	recursive: true,
	force: true,
});

await removeJavaScriptFiles(distDirectory);

const outputFiles = await listFiles(distDirectory);
validateStaticOutput(indexHtml, outputFiles);

console.log("Static HTML generated successfully.");
