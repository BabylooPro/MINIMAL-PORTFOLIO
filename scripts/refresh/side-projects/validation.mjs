import { createPermanentError } from "./errors.mjs";

export const MAXIMUM_PROJECTS = 6;

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

export function slugForSelection(selection) {
	return `${selection.githubUser.toLowerCase()}/${selection.name.toLowerCase()}`;
}

function isHttpsUrl(value) {
	try {
		const url = new URL(value);
		return url.protocol === "https:";
	} catch {
		return false;
	}
}

function isGitHubRepositoryUrl(value) {
	return typeof value === "string" && value.startsWith("https://github.com/");
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

export function validateConfiguration(value) {
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

function normalizeHomepageUrl(value) {
	if (value === null || value.trim().length === 0) {
		return null;
	}

	if (!isHttpsUrl(value)) {
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
			(typeof value.homepageUrl === "string" && isHttpsUrl(value.homepageUrl))) &&
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

export function validateSnapshot(value) {
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

export function snapshotMatchesConfiguration(snapshot, configuration) {
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
