import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectDirectory = fileURLToPath(new URL("..", import.meta.url));
const aliases = [
	{ prefix: "@/app/", directory: "app" },
	{ prefix: "@/src/", directory: "src" },
	{ prefix: "@/config/", directory: "config" },
	{ prefix: "@/scripts/", directory: "scripts" },
	{ prefix: "@/tests/", directory: "__tests__" },
];
const extensions = ["", ".ts", ".tsx", ".js", ".mjs", ".json"];

function resolveAlias(specifier) {
	const alias = aliases.find(({ prefix }) => specifier.startsWith(prefix));
	if (!alias) return null;

	const target = path.resolve(projectDirectory, alias.directory, specifier.slice(alias.prefix.length));

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
