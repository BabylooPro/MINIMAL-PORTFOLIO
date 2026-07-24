import * as fs from "node:fs/promises";
import path from "node:path";

import { readJsonFile } from "./snapshot.mjs";
import { createGeneratedSideProject, isGitHubRepository } from "./validation.mjs";

async function readOptionalText(filePath) {
	try {
		return (await fs.readFile(filePath, "utf8")).trim() || null;
	} catch (error) {
		if (error && typeof error === "object" && error.code === "ENOENT") {
			return null;
		}

		throw error;
	}
}

function cachePaths(cacheDirectory, githubUser) {
	const prefix = `side-projects-${githubUser.toLowerCase()}`;

	return {
		etagPath: path.join(cacheDirectory, `${prefix}.etag`),
		rawPath: path.join(cacheDirectory, `${prefix}.raw.json`),
	};
}

function cacheMatchesSelections(raw, selections) {
	const repositoriesByName = new Map(
		raw
			.filter(
				(repository) => !repository.fork && !repository.archived && !repository.disabled,
			)
			.map((repository) => [repository.name, repository]),
	);

	return selections.every((selection) => {
		const repository = repositoriesByName.get(selection.name);

		if (!repository) {
			return false;
		}

		try {
			createGeneratedSideProject(repository, selection);
			return true;
		} catch {
			return false;
		}
	});
}

export async function readCache(cacheDirectory, githubUser, selections, logger) {
	const { etagPath, rawPath } = cachePaths(cacheDirectory, githubUser);

	try {
		const [etag, raw] = await Promise.all([
			readOptionalText(etagPath),
			readJsonFile(rawPath, "Side Projects GitHub cache", false),
		]);

		if (
			!etag ||
			raw === null ||
			!Array.isArray(raw) ||
			raw.length === 0 ||
			!raw.every(isGitHubRepository) ||
			!cacheMatchesSelections(raw, selections)
		) {
			if (etag || raw !== null) {
				logger.warn("Ignoring an incompatible optional Side Projects cache.");
			}

			return null;
		}

		return { etag, raw };
	} catch (error) {
		logger.warn(`Ignoring the optional Side Projects cache: ${error.message}`);
		return null;
	}
}

export async function writeCache(cacheDirectory, githubUser, etag, repositories, logger) {
	if (!etag) {
		return;
	}

	try {
		const { etagPath, rawPath } = cachePaths(cacheDirectory, githubUser);
		const temporaryRawPath = `${rawPath}.tmp`;
		const temporaryEtagPath = `${etagPath}.tmp`;

		await fs.mkdir(cacheDirectory, { recursive: true });
		await fs.writeFile(temporaryRawPath, `${JSON.stringify(repositories)}\n`, "utf8");
		await fs.rename(temporaryRawPath, rawPath);
		await fs.writeFile(temporaryEtagPath, `${etag}\n`, "utf8");
		await fs.rename(temporaryEtagPath, etagPath);
	} catch (error) {
		logger.warn(`Unable to update the optional Side Projects cache: ${error.message}`);
	}
}
