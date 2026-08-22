import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { type Alias, defineConfig, type Plugin } from "vite";
import { aliasDefinitions } from "#config/aliases.mjs";
import { mediaOrigin } from "#src/lib/media-origin.js";
import { getIgnoredProjectFiles } from "./scripts/ignored-project-files.mjs";

const aliases: Alias[] = aliasDefinitions.map(({ prefix, target }) => ({
	find: prefix.slice(0, -1),
	replacement: fileURLToPath(new URL(target, import.meta.url)),
}));

const themeBootstrapPath = fileURLToPath(new URL("./src/features/themes/theme-bootstrap.js", import.meta.url));
const localeRedirectPath = fileURLToPath(new URL("./src/features/locale/locale-redirect.js", import.meta.url));

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url));

const packageVersion: string = JSON.parse(readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf8")).version;

const indexHtmlPath = fileURLToPath(new URL("./index.html", import.meta.url));

const siteControllerPath = fileURLToPath(new URL("./app/client/site-controller.ts", import.meta.url));
const siteControllerMarker = "<!--site-controller-->";
const siteControllerScriptPattern = /<script\b(?=[^>]*\bdata-site-controller\b)[\s\S]*?<\/script>/gi;

const contentSecurityPolicyMarker = "<!--content-security-policy-->";

function escapeRegularExpression(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

type InlineScriptDefinition = {
	marker: string;
	attribute: string;
	path: string;
};

function logging(): Plugin {
	const gitignoreMatches = new Map<string, boolean>();

	return {
		name: "logging",
		apply: "serve",
		configureServer(server) {
			server.middlewares.use((request, response, next) => {
				const accepts = request.headers.accept;
				const isDocumentRequest = (request.method === "GET" || request.method === "HEAD") && typeof accepts === "string" && accepts.includes("text/html");
				if (!isDocumentRequest) return next();

				const requestUrl = request.url ?? "/";
				const startedAt = performance.now();
				response.once("finish", () => {
					const duration = Math.round(performance.now() - startedAt);
					server.config.logger.info(`${request.method} ${requestUrl} ${response.statusCode} in ${duration}ms`);
				});

				next();
			});
		},
		async hotUpdate({ type, file, server, timestamp }) {
			if (this.environment.name !== "client") return;
			if (file === gitignorePath) { gitignoreMatches.clear(); return; }

			const matchesGitignore = gitignoreMatches.get(file) ?? (await getIgnoredProjectFiles(server.config.root, [file])).length > 0;
			gitignoreMatches.set(file, matchesGitignore);
			if (matchesGitignore) return;

			const changedFile = file.slice(server.config.root.length + 1);
			const duration = Math.max(0, Date.now() - timestamp);
			server.config.logger.info(`HMR ${type}: ${changedFile} in ${duration}ms`);
		},
	};
}

function createContentSecurityPolicy(inlineScriptSources: readonly string[], mediaOrigin: string): string {
	const scriptHashes = inlineScriptSources.map((source) => `'sha256-${createHash("sha256").update(source).digest("base64")}'`);

	return [
		"default-src 'self'",
		"base-uri 'self'",
		"object-src 'none'",
		"frame-src 'none'",
		"img-src 'self'",
		`media-src 'self' ${mediaOrigin}`,
		"font-src 'self'",
		"style-src 'self'",
		`script-src 'self' ${scriptHashes.join(" ")}`,
		"connect-src 'self'",
		"form-action 'self'",
	].join("; ");
}

function inlineHeadScripts(definitions: readonly InlineScriptDefinition[], mediaOrigin: string): Plugin {
	let isClientProductionBuild = false;

	return {
		name: "inline-head-scripts",
		configResolved(config) { isClientProductionBuild = config.command === "build" && !config.build.ssr },
		transformIndexHtml(html) {
			let transformedHtml = html;
			const scripts = definitions.map((definition) => {
				const source = readFileSync(definition.path, "utf8").trim();
				if (!source) throw new Error(`Inline script source is empty: ${definition.path}`);
				return { definition, source };
			});

			if (!transformedHtml.includes(contentSecurityPolicyMarker)) throw new Error(`Missing HTML marker: ${contentSecurityPolicyMarker}`);

			transformedHtml = transformedHtml.replace(
				contentSecurityPolicyMarker,
				isClientProductionBuild
					? `<meta http-equiv="Content-Security-Policy" content="${createContentSecurityPolicy(
						scripts.map(({ source }) => source),
						mediaOrigin,
					)}" />`
					: "",
			);

			for (const { definition, source } of scripts) {
				if (!transformedHtml.includes(definition.marker)) throw new Error(`Missing HTML marker: ${definition.marker}`);
				transformedHtml = transformedHtml.replace(definition.marker, `<script ${definition.attribute}>${source}</script>`);
			}

			return transformedHtml;
		},
	};
}

function separateSiteController(): Plugin {
	let isClientProductionBuild = false;

	return {
		name: "separate-site-controller",
		configResolved(config) { isClientProductionBuild = config.command === "build" && !config.build.ssr },
		transformIndexHtml: {
			order: "pre",
			handler(html) {
				const controllerScripts = html.match(siteControllerScriptPattern) ?? [];
				if (controllerScripts.length !== 1) throw new Error("The HTML must contain exactly one site controller script.");
				if (!isClientProductionBuild) return html;
				return html.replace(siteControllerScriptPattern, siteControllerMarker);
			},
		},
	};
}

function injectSiteController(): Plugin {
	let isClientProductionBuild = false;

	return {
		name: "inject-site-controller",
		configResolved(config) { isClientProductionBuild = config.command === "build" && !config.build.ssr },
		transformIndexHtml: {
			order: "post",
			handler(html, context) {
				if (!isClientProductionBuild) return html;

				const controller = Object.values(context.bundle ?? {}).find((output) => output.type === "chunk" && output.facadeModuleId === siteControllerPath);
				const reactEntry = Object.values(context.bundle ?? {}).find((output) => output.type === "chunk" && output.facadeModuleId === indexHtmlPath);

				if (controller?.type !== "chunk") throw new Error("The site controller entry was not generated.");
				if (reactEntry?.type !== "chunk") throw new Error("The React development entry was not generated.");
				if (!html.includes(siteControllerMarker)) throw new Error("The site controller HTML marker was not found.");

				const reactEntryScriptPattern = new RegExp(String.raw`<script\b(?=[^>]*\bsrc=["']/${escapeRegularExpression(reactEntry.fileName)}["'])[^>]*><\/script>`, "gi");
				const reactEntryScripts = html.match(reactEntryScriptPattern) ?? [];
				if (reactEntryScripts.length !== 1) throw new Error("The React development entry script was not found.");

				return html
					.replace(reactEntryScriptPattern, (scriptTag) => scriptTag.replace(">", " data-react-entry>"))
					.replace(siteControllerMarker, `<script type="module" src="/${controller.fileName}" data-site-controller></script>`);
			},
		},
	};
}

const inlineScriptsPlugin = inlineHeadScripts([
	{
		marker: "<!--theme-bootstrap-->",
		attribute: "data-theme-bootstrap",
		path: themeBootstrapPath,
	},
	{
		marker: "<!--locale-redirect-->",
		attribute: "data-locale-redirect",
		path: localeRedirectPath,
	}
], mediaOrigin);

export default defineConfig({
	define: {
		"import.meta.env.VITE_APP_VERSION": JSON.stringify(packageVersion),
	},
	resolve: {
		alias: aliases,
	},
	server: {
		strictPort: true,
		forwardConsole: {
			unhandledErrors: true,
			logLevels: ["warn", "error"],
		},
		warmup: {
			clientFiles: ["./app/client/entry.tsx", "./app/client/site-controller.ts"],
		},
		watch: {
			ignored: ["**/.test-production-budget-*/**", "**/.test-production-budget-media-*/**"],
		},
	},
	build: {
		manifest: true,
		rollupOptions: {
			input: {
				index: indexHtmlPath,
				"site-controller": siteControllerPath,
			},
		},
	},
	plugins: [
		logging(),
		separateSiteController(),
		inlineScriptsPlugin,
		injectSiteController(),
		react(),
		tailwindcss(),
	],
});
