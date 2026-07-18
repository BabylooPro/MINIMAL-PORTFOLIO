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

async function removeJavaScriptAssets(directory) {
	const entries = await readdir(directory, {
		withFileTypes: true,
	});

	await Promise.all(
		entries.map(async (entry) => {
			const entryPath = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				await removeJavaScriptAssets(entryPath);
				return;
			}

			if (entry.name.endsWith(".js") || entry.name.endsWith(".js.map")) {
				await unlink(entryPath);
			}
		}),
	);
}

const serverModuleUrl = pathToFileURL(serverEntryPath);
const { render } = await import(serverModuleUrl.href);

if (typeof render !== "function") {
	throw new TypeError('The static entry must export a "render" function.');
}

const appHtml = render();

if (typeof appHtml !== "string" || appHtml.length === 0) {
	throw new Error("The static renderer returned an empty document.");
}

let indexHtml = await readFile(indexPath, "utf8");

const rootPattern = /<div id="root">(?:<!--app-html-->)?<\/div>/;

if (!rootPattern.test(indexHtml)) {
	throw new Error('The "#root" element was not found in dist/index.html.');
}

indexHtml = indexHtml.replace(rootPattern, `<div id="root">${appHtml}</div>`);

indexHtml = indexHtml.replace(
	/\s*<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=["'][^"']+\.js["'])[^>]*><\/script>/gi,
	"",
);

indexHtml = indexHtml.replace(/\s*<link\b(?=[^>]*\brel=["']modulepreload["'])[^>]*>/gi, "");

if (/<script\b(?=[^>]*\btype=["']module["'])[^>]*>/i.test(indexHtml)) {
	throw new Error("A module script is still present after static rendering.");
}

await writeFile(indexPath, indexHtml, "utf8");

await removeJavaScriptAssets(assetsDirectory);

await rm(serverDirectory, {
	recursive: true,
	force: true,
});

console.log("Static HTML generated successfully.");
