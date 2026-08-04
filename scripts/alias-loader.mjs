import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { aliasDefinitions } from "#config/aliases.mjs";

const projectDirectoryUrl = new URL("..", import.meta.url);
const aliases = aliasDefinitions.map(({ prefix, target }) => ({
	prefix,
	directory: fileURLToPath(new URL(target, projectDirectoryUrl)),
}));
const extensions = ["", ".ts", ".tsx", ".js", ".mjs", ".json"];

function resolveAlias(specifier) {
	const alias = aliases.find(({ prefix }) => specifier.startsWith(prefix));
	if (!alias) return null;

	const target = path.resolve(alias.directory, specifier.slice(alias.prefix.length));

	for (const extension of extensions) {
		const candidate = target + extension;
		if (existsSync(candidate)) return candidate;
	}

	return target;
}

export async function resolve(specifier, context, nextResolve) {
	const target = resolveAlias(specifier);
	if (!target) return nextResolve(specifier, context);
	return { shortCircuit: true, url: pathToFileURL(target).href };
}
