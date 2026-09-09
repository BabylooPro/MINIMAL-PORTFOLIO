import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { getIgnoredProjectFiles } from "@/scripts/ignored-project-files.mts";
import { removeFinderMetadata } from "@/scripts/prerender/validation.mts";

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("identifies ignored public files from the project's .gitignore rules", async () => {
	const ignoredFiles = await getIgnoredProjectFiles(projectDirectory, [
		path.join(projectDirectory, "default.profraw"),
		path.join(projectDirectory, "public/.DS_Store"),
		path.join(projectDirectory, "public/default.profraw"),
		path.join(projectDirectory, "public/favicon.png"),
	]);

	assert.deepEqual(ignoredFiles, ["default.profraw", "public/.DS_Store", "public/default.profraw"]);
});

test("removes Finder metadata without removing public assets", async (t) => {
	const directory = await mkdtemp(path.join(tmpdir(), "remove-finder-metadata-"));
	t.after(async () => await rm(directory, { force: true, recursive: true }));

	const assetPath = path.join(directory, "favicon.png");
	const metadataPath = path.join(directory, ".DS_Store");
	await Promise.all([
		writeFile(assetPath, "asset"),
		writeFile(metadataPath, "metadata"),
	]);

	await removeFinderMetadata(directory);

	assert.equal(await readFile(assetPath, "utf8"), "asset");
	await assert.rejects(readFile(metadataPath, "utf8"));
});
