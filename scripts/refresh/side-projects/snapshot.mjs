import * as fs from "node:fs/promises";
import path from "node:path";

import { createPermanentError } from "./errors.mjs";
import {
	createGeneratedSideProject,
	isGitHubRepository,
	slugForSelection,
	validateConfiguration,
	validateSnapshot,
} from "./validation.mjs";

export async function readJsonFile(filePath, label, required) {
	let serialized;

	try {
		serialized = await fs.readFile(filePath, "utf8");
	} catch (error) {
		if (!required && error && typeof error === "object" && error.code === "ENOENT") {
			return null;
		}

		throw createPermanentError(`Unable to read ${label}: ${error.message}`);
	}

	try {
		return JSON.parse(serialized);
	} catch {
		throw createPermanentError(`${label} contains invalid JSON.`);
	}
}

export async function readConfiguration(filePath) {
	return validateConfiguration(await readJsonFile(filePath, "Side Projects configuration", true));
}

export async function readSnapshot(filePath) {
	const value = await readJsonFile(filePath, "Side Projects snapshot", false);
	return value === null ? null : validateSnapshot(value);
}

export function buildSnapshot(repositoriesByGitHubUser, configuration) {
	const repositoriesByUser = new Map(
		repositoriesByGitHubUser.map(({ githubUser, repositories }) => {
			const repositoryByName = new Map();

			for (const repository of repositories) {
				if (!isGitHubRepository(repository)) {
					throw createPermanentError(
						"GitHub returned an incompatible Side Projects response.",
					);
				}

				if (repository.fork || repository.archived || repository.disabled) {
					continue;
				}

				repositoryByName.set(repository.name, repository);
			}

			return [githubUser.toLowerCase(), repositoryByName];
		}),
	);

	return configuration.repositories.map((selection) => {
		const repository = repositoriesByUser
			.get(selection.githubUser.toLowerCase())
			?.get(selection.name);

		if (!repository) {
			throw createPermanentError(
				`Configured Side Project "${selection.name}" was not found.`,
			);
		}

		return createGeneratedSideProject(repository, selection);
	});
}

export async function writeSnapshot(outputPath, snapshot) {
	const temporaryPath = `${outputPath}.tmp`;
	const properties = [
		"slug",
		"name",
		"repositoryUrl",
		"homepageUrl",
		"githubDescription",
		"primaryLanguage",
		"createdAt",
		"topics",
	];
	const serializedSnapshot = `${[
		"[",
		snapshot
			.map((project) => {
				const serializedProperties = properties.map((property, index) => {
					const value =
						property === "topics"
							? `[${project[property]
									.map((topic) => JSON.stringify(topic))
									.join(", ")}]`
							: JSON.stringify(project[property]);

					return `\t\t"${property}": ${value}${index === properties.length - 1 ? "" : ","}`;
				});

				return ["\t{", ...serializedProperties, "\t}"].join("\n");
			})
			.join(",\n"),
		"]",
	].join("\n")}\n`;

	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(temporaryPath, serializedSnapshot, "utf8");
	await fs.rename(temporaryPath, outputPath);
}

export { slugForSelection };
