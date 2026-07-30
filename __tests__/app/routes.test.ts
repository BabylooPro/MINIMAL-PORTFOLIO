import assert from "node:assert/strict";
import test from "node:test";
import { getRouteFromPathname } from "../../app/routing/routes.ts";

test("resolves the root portfolio route", () => {
	assert.deepEqual(getRouteFromPathname("/"), { kind: "root" });
});

test("resolves localized portfolio routes", () => {
	assert.deepEqual(getRouteFromPathname("/fr/"), { kind: "locale", locale: "fr" });
});

test("resolves localized legal routes", () => {
	assert.deepEqual(getRouteFromPathname("/de/legal/"), {
		kind: "legal",
		locale: "de",
		page: "legal",
	});
});

test("rejects unknown paths", () => {
	assert.deepEqual(getRouteFromPathname("/unknown/"), {
		kind: "not-found",
		locale: "en",
	});
	assert.deepEqual(getRouteFromPathname("/fr/unknown/"), {
		kind: "not-found",
		locale: "fr",
	});
});
