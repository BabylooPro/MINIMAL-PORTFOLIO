import assert from "node:assert/strict";
import test from "node:test";

import { formatSideProjectDate } from "../../src/i18n/format.ts";
import { validateSideProjectTranslations } from "../../src/i18n/side-projects-validation.ts";

const projects = [{ slug: "project-one" }, { slug: "project-two" }];

test("Side Project dates use UTC", () => {
	assert.equal(formatSideProjectDate("en", "2023-11-28T00:39:16Z"), "Nov 28, 2023");
});

test("Side Project translations reject a missing localized project", () => {
	assert.throws(
		() =>
			validateSideProjectTranslations(projects, {
				en: {
					"project-one": { title: "Project one", description: "Description" },
				},
			}),
		/Missing Side Project translation for "project-two" in en\./,
	);
});

test("Side Project translations require the configured project set only", () => {
	assert.throws(
		() =>
			validateSideProjectTranslations(projects, {
				en: {
					"project-one": { title: "Project one", description: "Description" },
					"project-two": { title: "Project two", description: "Description" },
					"project-three": { title: "Project three", description: "Description" },
				},
			}),
		/Unexpected Side Project translation in en: project-three\./,
	);
});
