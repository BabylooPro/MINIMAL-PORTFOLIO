import { createPermanentError, createTemporaryError, SideProjectsError } from "./errors.mjs";

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

export async function fetchRepositories({ githubUser, cache, fetchImpl, timeoutMs }) {
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
