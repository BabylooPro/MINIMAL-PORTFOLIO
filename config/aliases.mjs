import { readFileSync } from "node:fs";

const projectDirectoryUrl = new URL("..", import.meta.url);
const aliasConfigUrl = new URL("tsconfig.aliases.json", projectDirectoryUrl);

function readAliasDefinitions() {
	const configuration = JSON.parse(readFileSync(aliasConfigUrl, "utf8"));
	const paths = configuration.compilerOptions?.paths;

	if (!paths || typeof paths !== "object") throw new Error("Missing compilerOptions.paths in tsconfig.aliases.json.");

	return Object.entries(paths).map(([pattern, targets]) => {
		const [target] = Array.isArray(targets) ? targets : [];
		if (!pattern.endsWith("/*") || typeof target !== "string" || !target.startsWith("./") || !target.endsWith("/*"))
			throw new Error(`Unsupported alias mapping: ${pattern}`);

		return { prefix: pattern.slice(0, -1), target: target.slice(0, -1) };
	});
}

export const aliasDefinitions = readAliasDefinitions();
