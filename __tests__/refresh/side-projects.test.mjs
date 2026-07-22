import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
	createGeneratedSideProject,
	refreshSideProjects,
} from "../../scripts/refresh/side-projects.mjs";

const configuration = {
	repositories: [
		{
			githubUser: "example-user",
			name: "project-one",
		},
		{
			githubUser: "example-user",
			name: "project-two",
		},
	],
};

function repository(name, { githubUser = "example-user", ...overrides } = {}) {
	return {
		name,
		html_url: `https://github.com/${githubUser}/${name}`,
		homepage: null,
		description: `${name} description`,
		language: "TypeScript",
		created_at: "2026-01-01T12:00:00Z",
		topics: ["portfolio", "typescript", "static", "unused"],
		fork: false,
		archived: false,
		disabled: false,
		...overrides,
	};
}

function snapshot() {
	return configuration.repositories.map((selection) => ({
		slug: `${selection.githubUser}/${selection.name}`,
		name: selection.name,
		repositoryUrl: `https://github.com/${selection.githubUser}/${selection.name}`,
		homepageUrl: null,
		githubDescription: `${selection.name} description`,
		primaryLanguage: "TypeScript",
		createdAt: "2026-01-01T12:00:00Z",
		topics: ["portfolio", "static", "typescript"],
	}));
}

async function fixture({ config = configuration, existingSnapshot } = {}) {
	const projectDirectory = await mkdtemp(path.join(tmpdir(), "side-projects-"));

	await mkdir(path.join(projectDirectory, "config"), { recursive: true });
	await writeFile(
		path.join(projectDirectory, "config", "side-projects.json"),
		`${JSON.stringify(config)}\n`,
		"utf8",
	);

	if (existingSnapshot !== undefined) {
		await mkdir(path.join(projectDirectory, "src", "generated"), { recursive: true });
		await writeFile(
			path.join(projectDirectory, "src", "generated", "side-projects.json"),
			`${JSON.stringify(existingSnapshot)}\n`,
			"utf8",
		);
	}

	return projectDirectory;
}

function response(body, status = 200, headers = {}) {
	return new Response(JSON.stringify(body), { status, headers });
}

async function withFixture(options, callback) {
	const projectDirectory = await fixture(options);

	try {
		await callback(projectDirectory);
	} finally {
		await rm(projectDirectory, { recursive: true, force: true });
	}
}

function refresh(projectDirectory, fetchImpl, warnings = []) {
	return refreshSideProjects({
		projectDirectory,
		fetchImpl,
		logger: { warn: (message) => warnings.push(message) },
		timeoutMs: 5,
	});
}

test("writes a valid response in the configuration order", async () => {
	await withFixture({}, async (projectDirectory) => {
		let requestCount = 0;
		const result = await refresh(projectDirectory, async (url, init) => {
			requestCount += 1;

			assert.match(url, /per_page=100/);
			assert.equal(init.headers.Accept, "application/vnd.github+json");
			return response([repository("project-two"), repository("project-one")], 200, {
				etag: '"example"',
			});
		});

		assert.equal(result.source, "github");
		assert.equal(requestCount, 1);
		assert.deepEqual(
			result.snapshot.map((project) => project.slug),
			["example-user/project-one", "example-user/project-two"],
		);
		assert.deepEqual(result.snapshot[0]?.topics, ["portfolio", "static", "typescript"]);

		const generated = JSON.parse(
			await readFile(
				path.join(projectDirectory, "src", "generated", "side-projects.json"),
				"utf8",
			),
		);
		assert.deepEqual(generated, result.snapshot);
	});
});

test("sorts topics deterministically by code point", () => {
	const [selection] = configuration.repositories;
	const project = createGeneratedSideProject(
		repository("project-one", {
			topics: ["zebra", "éclair", "alpha", "unused"],
		}),
		selection,
	);

	assert.deepEqual(project.topics, ["alpha", "unused", "zebra"]);
});

test("refreshes every configured GitHub owner once", async () => {
	const multiOwnerConfiguration = {
		repositories: [
			{
				githubUser: "example-user",
				name: "project-one",
			},
			{
				githubUser: "other-owner",
				name: "project-two",
			},
		],
	};

	await withFixture({ config: multiOwnerConfiguration }, async (projectDirectory) => {
		const requestedUsers = [];
		const result = await refresh(projectDirectory, async (url) => {
			const githubUser = new URL(url).pathname.split("/")[2];
			requestedUsers.push(githubUser);

			return response(
				githubUser === "other-owner"
					? [repository("project-two", { githubUser })]
					: [repository("project-one", { githubUser })],
			);
		});

		assert.deepEqual(requestedUsers.sort(), ["example-user", "other-owner"]);
		assert.deepEqual(
			result.snapshot.map((project) => project.slug),
			["example-user/project-one", "other-owner/project-two"],
		);
	});
});

test("uses the optional ETag cache after GitHub returns 304", async () => {
	await withFixture({}, async (projectDirectory) => {
		await refresh(projectDirectory, async () =>
			response([repository("project-one"), repository("project-two")], 200, {
				etag: '"example"',
			}),
		);

		const result = await refresh(projectDirectory, async (_url, init) => {
			assert.equal(init.headers["If-None-Match"], '"example"');
			return new Response(null, { status: 304 });
		});

		assert.equal(result.source, "cache");
	});
});

test("rejects an empty GitHub response", async () => {
	await withFixture({}, async (projectDirectory) => {
		await assert.rejects(
			refresh(projectDirectory, async () => response([])),
			/Configured Side Project "project-one" was not found\./,
		);
	});
});

test("rejects a configured repository that is absent from GitHub", async () => {
	await withFixture({}, async (projectDirectory) => {
		await assert.rejects(
			refresh(projectDirectory, async () => response([repository("unconfigured-project")])),
			/Configured Side Project "project-one" was not found\./,
		);
	});
});

test("keeps a valid snapshot after a timeout", async () => {
	await withFixture({ existingSnapshot: snapshot() }, async (projectDirectory) => {
		const warnings = [];
		const result = await refresh(
			projectDirectory,
			(_url, { signal }) =>
				new Promise((_, reject) => {
					signal.addEventListener("abort", () => {
						const error = new Error("aborted");
						error.name = "AbortError";
						reject(error);
					});
				}),
			warnings,
		);

		assert.equal(result.source, "snapshot");
		assert.match(warnings[0] ?? "", /timed out/);
	});
});

test("keeps a valid snapshot when the GitHub response body times out", async () => {
	await withFixture({ existingSnapshot: snapshot() }, async (projectDirectory) => {
		const warnings = [];
		const result = await refresh(
			projectDirectory,
			async (_url, { signal }) => ({
				status: 200,
				ok: true,
				headers: new Headers(),
				json: () =>
					new Promise((_, reject) => {
						signal.addEventListener("abort", () => {
							const error = new Error("aborted");
							error.name = "AbortError";
							reject(error);
						});
					}),
			}),
			warnings,
		);

		assert.equal(result.source, "snapshot");
		assert.match(warnings[0] ?? "", /timed out/);
	});
});

test("keeps a valid snapshot after a network error", async () => {
	await withFixture({ existingSnapshot: snapshot() }, async (projectDirectory) => {
		const result = await refresh(projectDirectory, async () => {
			throw new Error("offline");
		});

		assert.equal(result.source, "snapshot");
	});
});

test("keeps a valid snapshot after temporary GitHub limiting", async () => {
	await withFixture({ existingSnapshot: snapshot() }, async (projectDirectory) => {
		const result = await refresh(projectDirectory, async () => response({}, 429));

		assert.equal(result.source, "snapshot");
	});
});

test("keeps a valid snapshot after a secondary GitHub rate limit", async () => {
	await withFixture({ existingSnapshot: snapshot() }, async (projectDirectory) => {
		const result = await refresh(projectDirectory, async () =>
			response({}, 403, { "retry-after": "60" }),
		);

		assert.equal(result.source, "snapshot");
	});
});

test("keeps a valid snapshot after a temporary GitHub server error", async () => {
	await withFixture({ existingSnapshot: snapshot() }, async (projectDirectory) => {
		const result = await refresh(projectDirectory, async () => response({}, 503));

		assert.equal(result.source, "snapshot");
	});
});

test("rejects invalid configuration JSON", async () => {
	await withFixture({}, async (projectDirectory) => {
		await writeFile(
			path.join(projectDirectory, "config", "side-projects.json"),
			"{ invalid json",
			"utf8",
		);

		await assert.rejects(
			refresh(projectDirectory, async () => response([])),
			/Side Projects configuration contains invalid JSON\./,
		);
	});
});

test("fails when a temporary error has no snapshot fallback", async () => {
	await withFixture({}, async (projectDirectory) => {
		await assert.rejects(
			refresh(projectDirectory, async () => {
				throw new Error("offline");
			}),
			/No valid Side Projects snapshot is available/,
		);
	});
});

test("rejects an invalid snapshot before requesting GitHub", async () => {
	await withFixture({ existingSnapshot: [{ slug: "project-one" }] }, async (projectDirectory) => {
		let requested = false;

		await assert.rejects(
			refresh(projectDirectory, async () => {
				requested = true;
				return response([]);
			}),
			/Side Projects snapshot entry at index 0 is invalid\./,
		);
		assert.equal(requested, false);
	});
});

test("rejects an invalid repository URL", async () => {
	await withFixture({}, async (projectDirectory) => {
		await assert.rejects(
			refresh(projectDirectory, async () =>
				response([
					repository("project-one", { html_url: "https://example.com/project-one" }),
					repository("project-two"),
				]),
			),
			/Repository URL is invalid: https:\/\/example\.com\/project-one/,
		);
	});
});

test("rejects a non-HTTPS homepage URL", async () => {
	await withFixture({}, async (projectDirectory) => {
		await assert.rejects(
			refresh(projectDirectory, async () =>
				response([
					repository("project-one", { homepage: "http://example.com" }),
					repository("project-two"),
				]),
			),
			/Homepage URL is invalid: http:\/\/example\.com/,
		);
	});
});

test("rejects invalid GitHub JSON", async () => {
	await withFixture({}, async (projectDirectory) => {
		await assert.rejects(
			refresh(projectDirectory, async () => new Response("{", { status: 200 })),
			/GitHub returned invalid JSON for Side Projects\./,
		);
	});
});

test("ignores an incompatible optional cache", async () => {
	await withFixture({}, async (projectDirectory) => {
		const cacheDirectory = path.join(projectDirectory, ".cache", "github");

		await mkdir(cacheDirectory, { recursive: true });
		await writeFile(
			path.join(cacheDirectory, "side-projects-example-user.etag"),
			'"example"\n',
			"utf8",
		);
		await writeFile(
			path.join(cacheDirectory, "side-projects-example-user.raw.json"),
			"[]\n",
			"utf8",
		);

		const result = await refresh(projectDirectory, async (_url, init) => {
			assert.equal(init.headers["If-None-Match"], undefined);
			return response([repository("project-one"), repository("project-two")]);
		});

		assert.equal(result.source, "github");
	});
});

test("ignores a cache with an invalid selected repository", async () => {
	await withFixture({}, async (projectDirectory) => {
		const cacheDirectory = path.join(projectDirectory, ".cache", "github");

		await mkdir(cacheDirectory, { recursive: true });
		await writeFile(
			path.join(cacheDirectory, "side-projects-example-user.etag"),
			'"example"\n',
			"utf8",
		);
		await writeFile(
			path.join(cacheDirectory, "side-projects-example-user.raw.json"),
			`${JSON.stringify([
				repository("project-one", { html_url: "https://example.com/project-one" }),
				repository("project-two"),
			])}\n`,
			"utf8",
		);

		const result = await refresh(projectDirectory, async (_url, init) => {
			assert.equal(init.headers["If-None-Match"], undefined);
			return response([repository("project-one"), repository("project-two")]);
		});

		assert.equal(result.source, "github");
	});
});
