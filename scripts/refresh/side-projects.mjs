import * as fs from "node:fs/promises";
import path from "node:path";

const MAXIMUM_PROJECTS = 6;
const REQUEST_TIMEOUT_MS = 10_000;

export class SideProjectsError extends Error {
	constructor(message, kind = "permanent") {
		super(message);
		this.kind = kind;
	}
}

function isRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}

function isNullableString(value) {
	return value === null || typeof value === "string";
}

function isGitHubUser(value) {
	return typeof value === "string" && /^[a-z\d](?:[a-z\d-]{0,37})$/i.test(value);
}

function isGitHubRepositoryName(value) {
	return typeof value === "string" && /^[a-z\d][a-z\d_.-]*$/i.test(value);
}

function slugForSelection(selection) {
	return `${selection.githubUser.toLowerCase()}/${selection.name.toLowerCase()}`;
}

function isHttpUrl(value) {
	try {
		const url = new URL(value);
		return url.protocol === "https:" || url.protocol === "http:";
	} catch {
		return false;
	}
}

function isGitHubRepositoryUrl(value) {
	return typeof value === "string" && value.startsWith("https://github.com/");
}

function isTemporaryStatus(response) {
	return (
		response.status === 408 ||
		response.status === 429 ||
		response.status >= 500 ||
		(response.status === 403 &&
			(response.headers.get("x-ratelimit-remaining") === "0" ||
				response.headers.has("retry-after")))
	);
}

function createTemporaryError(message) {
	return new SideProjectsError(message, "temporary");
}

function createPermanentError(message) {
	return new SideProjectsError(message, "permanent");
}

export function isGitHubRepository(value) {
	return (
		isRecord(value) &&
		isNonEmptyString(value.name) &&
		typeof value.html_url === "string" &&
		isNullableString(value.homepage) &&
		isNullableString(value.description) &&
		isNullableString(value.language) &&
		isNonEmptyString(value.created_at) &&
		Array.isArray(value.topics) &&
		value.topics.every((topic) => typeof topic === "string") &&
		typeof value.fork === "boolean" &&
		typeof value.archived === "boolean" &&
		typeof value.disabled === "boolean"
	);
}

function validateConfiguration(value) {
	if (!isRecord(value) || !Array.isArray(value.repositories)) {
		throw createPermanentError("Side Projects configuration has an invalid shape.");
	}

	if (value.repositories.length === 0 || value.repositories.length > MAXIMUM_PROJECTS) {
		throw createPermanentError(
			`Side Projects configuration must select between 1 and ${MAXIMUM_PROJECTS} repositories.`,
		);
	}

	const repositories = value.repositories.map((repository, index) => {
		if (
			!isRecord(repository) ||
			!isGitHubUser(repository.githubUser) ||
			!isGitHubRepositoryName(repository.name)
		) {
			throw createPermanentError(
				`Side Projects configuration repository at index ${index} has an invalid shape.`,
			);
		}

		return {
			githubUser: repository.githubUser,
			name: repository.name,
		};
	});

	const slugs = repositories.map(slugForSelection);

	if (new Set(slugs).size !== slugs.length) {
		throw createPermanentError(
			"Side Projects configuration contains duplicate repository names.",
		);
	}

	return { repositories };
}

async function readJsonFile(filePath, label, required) {
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

async function readConfiguration(filePath) {
	return validateConfiguration(await readJsonFile(filePath, "Side Projects configuration", true));
}

function normalizeHomepageUrl(value) {
	if (value === null || value.trim().length === 0) {
		return null;
	}

	if (!isHttpUrl(value)) {
		throw createPermanentError(`Homepage URL is invalid: ${value}`);
	}

	return value;
}

function validateCreatedAt(value) {
	if (!isNonEmptyString(value) || Number.isNaN(Date.parse(value))) {
		throw createPermanentError(`Repository created_at value is invalid: ${value}`);
	}

	return value;
}

export function createGeneratedSideProject(repository, selection) {
	if (!isGitHubRepository(repository)) {
		throw createPermanentError(
			`GitHub returned an incompatible repository for "${selection.name}".`,
		);
	}

	if (!isGitHubRepositoryUrl(repository.html_url)) {
		throw createPermanentError(`Repository URL is invalid: ${repository.html_url}`);
	}

	return {
		slug: slugForSelection(selection),
		name: repository.name,
		repositoryUrl: repository.html_url,
		homepageUrl: normalizeHomepageUrl(repository.homepage),
		githubDescription: repository.description,
		primaryLanguage: repository.language,
		createdAt: validateCreatedAt(repository.created_at),
		topics: [...repository.topics]
			.map((topic) => topic.trim())
			.filter(Boolean)
			.sort()
			.slice(0, 3),
	};
}

function validateSnapshotProject(value, index) {
	if (!isRecord(value)) {
		throw createPermanentError(`Side Projects snapshot entry at index ${index} is invalid.`);
	}

	const valid =
		isNonEmptyString(value.slug) &&
		isNonEmptyString(value.name) &&
		isGitHubRepositoryUrl(value.repositoryUrl) &&
		(value.homepageUrl === null ||
			(typeof value.homepageUrl === "string" && isHttpUrl(value.homepageUrl))) &&
		isNullableString(value.githubDescription) &&
		isNullableString(value.primaryLanguage) &&
		isNonEmptyString(value.createdAt) &&
		Array.isArray(value.topics) &&
		value.topics.length <= 3 &&
		value.topics.every(isNonEmptyString);

	if (!valid) {
		throw createPermanentError(`Side Projects snapshot entry at index ${index} is invalid.`);
	}

	validateCreatedAt(value.createdAt);

	return value;
}

function validateSnapshot(value) {
	if (!Array.isArray(value) || value.length === 0 || value.length > MAXIMUM_PROJECTS) {
		throw createPermanentError("Side Projects snapshot is invalid.");
	}

	const projects = value.map(validateSnapshotProject);
	const slugs = projects.map((project) => project.slug);

	if (new Set(slugs).size !== slugs.length) {
		throw createPermanentError("Side Projects snapshot contains duplicate slugs.");
	}

	return projects;
}

async function readSnapshot(filePath) {
	const value = await readJsonFile(filePath, "Side Projects snapshot", false);
	return value === null ? null : validateSnapshot(value);
}

function snapshotMatchesConfiguration(snapshot, configuration) {
	return (
		snapshot !== null &&
		snapshot.length === configuration.repositories.length &&
		snapshot.every((project, index) => {
			const selection = configuration.repositories[index];

			return (
				selection !== undefined &&
				project.slug === slugForSelection(selection) &&
				project.name === selection.name
			);
		})
	);
}

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

async function readCache(cacheDirectory, githubUser, selections, logger) {
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

async function writeCache(cacheDirectory, githubUser, etag, repositories, logger) {
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

async function fetchRepositories({ githubUser, cache, fetchImpl, timeoutMs }) {
	const headers = {
		Accept: "application/vnd.github+json",
		"User-Agent": "maxremy-portfolio-build",
	};

	if (process.env.GITHUB_TOKEN) {
		headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
	}

	if (cache) {
		headers["If-None-Match"] = cache.etag;
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => {
		controller.abort();
	}, timeoutMs);

	try {
		const response = await fetchImpl(
			`https://api.github.com/users/${encodeURIComponent(githubUser)}/repos?per_page=100&type=owner&sort=updated`,
			{ headers, signal: controller.signal },
		);

		if (response.status === 304) {
			if (!cache) {
				throw createPermanentError(
					"GitHub returned 304 without a usable Side Projects cache.",
				);
			}

			return { githubUser, repositories: cache.raw, etag: null, fromCache: true };
		}

		if (isTemporaryStatus(response)) {
			if (response.status === 429 || response.status === 403) {
				throw createTemporaryError(
					`GitHub temporarily limited the request (HTTP ${response.status}).`,
				);
			}

			throw createTemporaryError(
				`GitHub returned a temporary server error (HTTP ${response.status}).`,
			);
		}

		if (!response.ok) {
			throw createPermanentError(
				`GitHub request failed permanently (HTTP ${response.status}).`,
			);
		}

		let repositories;

		try {
			repositories = await response.json();
		} catch (error) {
			if (controller.signal.aborted || error?.name === "AbortError") {
				throw createTemporaryError(`GitHub request timed out after ${timeoutMs}ms.`);
			}

			throw createPermanentError("GitHub returned invalid JSON for Side Projects.");
		}

		if (!Array.isArray(repositories)) {
			throw createPermanentError("GitHub returned an incompatible Side Projects response.");
		}

		return {
			githubUser,
			repositories,
			etag: response.headers.get("etag"),
			fromCache: false,
		};
	} catch (error) {
		if (error instanceof SideProjectsError) {
			throw error;
		}

		if (controller.signal.aborted || error?.name === "AbortError") {
			throw createTemporaryError(`GitHub request timed out after ${timeoutMs}ms.`);
		}

		throw createTemporaryError(`GitHub request failed: ${error.message}`);
	} finally {
		clearTimeout(timeout);
	}
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

async function writeSnapshot(outputPath, snapshot) {
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

export async function refreshSideProjects({
	projectDirectory,
	fetchImpl = fetch,
	logger = console,
	timeoutMs = REQUEST_TIMEOUT_MS,
}) {
	const configurationPath = path.join(projectDirectory, "config", "side-projects.json");
	const outputPath = path.join(projectDirectory, "src", "generated", "side-projects.json");
	const cacheDirectory = path.join(projectDirectory, ".cache", "github");
	const configuration = await readConfiguration(configurationPath);
	const existingSnapshot = await readSnapshot(outputPath);
	const canUseExistingSnapshot = snapshotMatchesConfiguration(existingSnapshot, configuration);
	const githubUsers = [
		...new Map(
			configuration.repositories.map((repository) => [
				repository.githubUser.toLowerCase(),
				repository.githubUser,
			]),
		).values(),
	];
	const caches = new Map(
		await Promise.all(
			githubUsers.map(async (githubUser) => [
				githubUser.toLowerCase(),
				await readCache(
					cacheDirectory,
					githubUser,
					configuration.repositories.filter(
						(repository) =>
							repository.githubUser.toLowerCase() === githubUser.toLowerCase(),
					),
					logger,
				),
			]),
		),
	);

	try {
		const responses = await Promise.all(
			githubUsers.map((githubUser) =>
				fetchRepositories({
					githubUser,
					cache: caches.get(githubUser.toLowerCase()),
					fetchImpl,
					timeoutMs,
				}),
			),
		);
		const snapshot = buildSnapshot(responses, configuration);

		await writeSnapshot(outputPath, snapshot);

		await Promise.all(
			responses
				.filter((response) => !response.fromCache)
				.map((response) =>
					writeCache(
						cacheDirectory,
						response.githubUser,
						response.etag,
						response.repositories,
						logger,
					),
				),
		);

		return {
			source: responses.every((response) => response.fromCache) ? "cache" : "github",
			snapshot,
		};
	} catch (error) {
		if (
			error instanceof SideProjectsError &&
			error.kind === "temporary" &&
			canUseExistingSnapshot
		) {
			logger.warn(
				`Unable to refresh Side Projects (${error.message}). Keeping the existing snapshot.`,
			);
			return { source: "snapshot", snapshot: existingSnapshot };
		}

		if (error instanceof SideProjectsError && error.kind === "temporary") {
			throw new Error(
				`Unable to refresh Side Projects (${error.message}). No valid Side Projects snapshot is available at ${outputPath}.`,
			);
		}

		throw error;
	}
}

export const label = "Side Projects";

export function refresh({ projectDirectory }) {
	return refreshSideProjects({ projectDirectory });
}
