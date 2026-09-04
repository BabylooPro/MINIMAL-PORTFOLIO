import path from "node:path";

import { readCache, writeCache } from "@/scripts/refresh/side-projects/cache.mts";
import { SideProjectsError } from "@/scripts/refresh/side-projects/errors.mts";
import { fetchRepositories } from "@/scripts/refresh/side-projects/github-client.mts";
import { buildSnapshot, readConfiguration, readSnapshot, writeSnapshot } from "@/scripts/refresh/side-projects/snapshot.mts";
import { snapshotMatchesConfiguration } from "@/scripts/refresh/side-projects/validation.mts";

const REQUEST_TIMEOUT_MS = 10_000;

export { SideProjectsError } from "@/scripts/refresh/side-projects/errors.mts";
export { buildSnapshot } from "@/scripts/refresh/side-projects/snapshot.mts";
export { createGeneratedSideProject, isGitHubRepository } from "@/scripts/refresh/side-projects/validation.mts";

function githubUsersFor(configuration) {
	return [...new Map(configuration.repositories.map((repository) => [repository.githubUser.toLowerCase(), repository.githubUser])).values()];
}

export async function refreshSideProjects({ projectDirectory, fetchImpl = fetch, logger = console, timeoutMs = REQUEST_TIMEOUT_MS }) {
	const configurationPath = path.join(projectDirectory, "config", "side-projects.json");
	const outputPath = path.join(projectDirectory, "src", "features", "landing", "generated", "side-projects.json");
	const cacheDirectory = path.join(projectDirectory, ".cache", "github");
	const configuration = await readConfiguration(configurationPath);
	const existingSnapshot = await readSnapshot(outputPath);
	const canUseExistingSnapshot = snapshotMatchesConfiguration(existingSnapshot, configuration);
	const githubUsers = githubUsersFor(configuration);

	const caches = new Map(await Promise.all(githubUsers.map(async (githubUser) => [
		githubUser.toLowerCase(),
		await readCache(
			cacheDirectory,
			githubUser,
			configuration.repositories.filter((repository) => repository.githubUser.toLowerCase() === githubUser.toLowerCase()),
			logger,
		),
	])));

	try {
		const responses = await Promise.all(githubUsers.map((githubUser) => fetchRepositories({
			githubUser,
			cache: caches.get(githubUser.toLowerCase()),
			fetchImpl,
			timeoutMs,
		})));

		const snapshot = buildSnapshot(responses, configuration);
		await writeSnapshot(outputPath, snapshot);

		await Promise.all(responses.filter((response) => !response.fromCache).map((response) => writeCache(
			cacheDirectory,
			response.githubUser,
			response.etag,
			response.repositories,
			logger,
		)));

		return { source: responses.every((response) => response.fromCache) ? "cache" : "github", snapshot };
	} catch (error) {
		if (error instanceof SideProjectsError && error.kind === "temporary" && canUseExistingSnapshot) {
			logger.warn(`Unable to refresh Side Projects (${error.message}). Keeping the existing snapshot.`);
			return { source: "snapshot", snapshot: existingSnapshot };
		}

		if (error instanceof SideProjectsError && error.kind === "temporary") throw new Error(`Unable to refresh Side Projects (${error.message}). No valid Side Projects snapshot is available at ${outputPath}.`);
		throw error;
	}
}

export const label = "Side Projects";

export function refresh({ projectDirectory }) {
	return refreshSideProjects({ projectDirectory });
}
