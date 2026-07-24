import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectDirectory, "dist");
const assetsDirectory = path.join(outputDirectory, "assets");
const previewDirectory = path.join(outputDirectory, "videos", "timelapse", "previews");

const budgets = {
	maximumControllerGzipBytes: 3_500,
	maximumCssGzipBytes: 8_000,
	expectedJavascriptFileCount: 1,
	expectedPreviewCount: 6,
	maximumPreviewFileBytes: 25_000,
	maximumPreviewBytes: 120_000,
};

async function listFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const entryPath = path.join(directory, entry.name);

			return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
		}),
	);

	return files.flat();
}

function assertWithinBudget(description, actual, maximum) {
	if (actual > maximum) {
		throw new Error(`${description}: ${actual} exceeds the ${maximum} byte budget.`);
	}
}

function assertEqual(description, actual, expected) {
	if (actual !== expected) {
		throw new Error(`${description}: expected ${expected}, received ${actual}.`);
	}
}

async function gzipSize(file) {
	return gzipSync(await readFile(file), { level: 9 }).byteLength;
}

async function totalSize(files) {
	const sizes = await Promise.all(files.map(async (file) => (await stat(file)).size));

	return sizes.reduce((total, size) => total + size, 0);
}

const assetFiles = await listFiles(assetsDirectory);
const javascriptFiles = assetFiles.filter((file) => file.endsWith(".js"));
const cssFiles = assetFiles.filter((file) => file.endsWith(".css"));
const previewFiles = (await listFiles(previewDirectory)).filter((file) => file.endsWith(".jpg"));

assertEqual("JavaScript file count", javascriptFiles.length, budgets.expectedJavascriptFileCount);
assertEqual("CSS file count", cssFiles.length, 1);
assertEqual("Preview image count", previewFiles.length, budgets.expectedPreviewCount);

const controllerFile = javascriptFiles.find((file) =>
	path.basename(file).startsWith("site-controller-"),
);

if (!controllerFile) {
	throw new Error("Missing site controller bundle.");
}

const controllerGzipBytes = await gzipSize(controllerFile);
const cssGzipBytes = await gzipSize(cssFiles[0]);
const previewBytes = await totalSize(previewFiles);

assertWithinBudget(
	"Site controller gzip size",
	controllerGzipBytes,
	budgets.maximumControllerGzipBytes,
);
assertWithinBudget("CSS gzip size", cssGzipBytes, budgets.maximumCssGzipBytes);

for (const previewFile of previewFiles) {
	const previewBytes = (await stat(previewFile)).size;

	assertWithinBudget(
		`Preview image ${path.basename(previewFile)} size`,
		previewBytes,
		budgets.maximumPreviewFileBytes,
	);
}

assertWithinBudget("Preview image size", previewBytes, budgets.maximumPreviewBytes);

console.log(
	`Production budget passed: controller ${controllerGzipBytes} B gzip, CSS ${cssGzipBytes} B gzip, ${previewFiles.length} previews ${previewBytes} B.`,
);
