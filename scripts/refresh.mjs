import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectDirectory = path.resolve(path.dirname(scriptPath), "..");
const refreshDirectory = path.join(path.dirname(scriptPath), "refresh");

try {
	const taskPaths = (await readdir(refreshDirectory, { withFileTypes: true }))
		.filter((entry) => entry.isFile() && entry.name.endsWith(".mjs"))
		.map((entry) => path.join(refreshDirectory, entry.name))
		.sort();

	if (taskPaths.length === 0) {
		throw new Error("No refresh tasks were found.");
	}

	for (const taskPath of taskPaths) {
		const task = await import(pathToFileURL(taskPath).href);

		if (typeof task.label !== "string" || typeof task.refresh !== "function") {
			throw new TypeError(
				`Refresh task ${path.basename(taskPath)} must export a label and refresh function.`,
			);
		}

		const result = await task.refresh({ projectDirectory });
		const source =
			result &&
			typeof result === "object" &&
			"source" in result &&
			typeof result.source === "string"
				? ` from ${result.source}`
				: "";

		console.log(`${task.label} refreshed${source}.`);
	}
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
