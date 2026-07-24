import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { getIgnoredProjectFiles } from "../../scripts/ignored-project-files.mjs";

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("identifies ignored public files from the project's .gitignore rules", async () => {
	const ignoredFiles = await getIgnoredProjectFiles(projectDirectory, [
		path.join(projectDirectory, "public/.DS_Store"),
		path.join(projectDirectory, "public/default.profraw"),
		path.join(projectDirectory, "public/favicon.png"),
	]);

	assert.deepEqual(ignoredFiles, ["public/.DS_Store", "public/default.profraw"]);
});
