import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const themeBootstrapPath = fileURLToPath(
	new URL("./src/client/theme-bootstrap.js", import.meta.url),
);
const localeRedirectPath = fileURLToPath(
	new URL("./src/client/locale-redirect.js", import.meta.url),
);
const indexHtmlPath = fileURLToPath(new URL("./index.html", import.meta.url));
const siteControllerPath = fileURLToPath(
	new URL("./src/client/site-controller.ts", import.meta.url),
);
const siteControllerMarker = "<!--site-controller-->";
const siteControllerScriptPattern =
	/<script\b(?=[^>]*\bdata-site-controller\b)[\s\S]*?<\/script>/gi;

function escapeRegularExpression(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type InlineScriptDefinition = {
	marker: string;
	attribute: string;
	path: string;
};

function inlineHeadScripts(definitions: readonly InlineScriptDefinition[]): Plugin {
	return {
		name: "inline-head-scripts",
		transformIndexHtml(html) {
			let transformedHtml = html;

			for (const definition of definitions) {
				if (!transformedHtml.includes(definition.marker)) {
					throw new Error(`Missing HTML marker: ${definition.marker}`);
				}

				const source = readFileSync(definition.path, "utf8").trim();

				if (!source) {
					throw new Error(`Inline script source is empty: ${definition.path}`);
				}

				transformedHtml = transformedHtml.replace(
					definition.marker,
					`<script ${definition.attribute}>${source}</script>`,
				);
			}

			return transformedHtml;
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
	},
]);

function separateSiteController(): Plugin {
	let isClientProductionBuild = false;

	return {
		name: "separate-site-controller",
		configResolved(config) {
			isClientProductionBuild = config.command === "build" && !config.build.ssr;
		},
		transformIndexHtml: {
			order: "pre",
			handler(html) {
				const controllerScripts = html.match(siteControllerScriptPattern) ?? [];

				if (controllerScripts.length !== 1) {
					throw new Error("The HTML must contain exactly one site controller script.");
				}

				if (!isClientProductionBuild) {
					return html;
				}

				return html.replace(siteControllerScriptPattern, siteControllerMarker);
			},
		},
	};
}

function injectSiteController(): Plugin {
	let isClientProductionBuild = false;

	return {
		name: "inject-site-controller",
		configResolved(config) {
			isClientProductionBuild = config.command === "build" && !config.build.ssr;
		},
		transformIndexHtml: {
			order: "post",
			handler(html, context) {
				if (!isClientProductionBuild) {
					return html;
				}

				const controller = Object.values(context.bundle ?? {}).find(
					(output) =>
						output.type === "chunk" && output.facadeModuleId === siteControllerPath,
				);
				const reactEntry = Object.values(context.bundle ?? {}).find(
					(output) => output.type === "chunk" && output.facadeModuleId === indexHtmlPath,
				);

				if (controller?.type !== "chunk") {
					throw new Error("The site controller entry was not generated.");
				}

				if (reactEntry?.type !== "chunk") {
					throw new Error("The React development entry was not generated.");
				}

				if (!html.includes(siteControllerMarker)) {
					throw new Error("The site controller HTML marker was not found.");
				}

				const reactEntryScriptPattern = new RegExp(
					`<script\\b(?=[^>]*\\bsrc=["']/${escapeRegularExpression(reactEntry.fileName)}["'])[^>]*><\\/script>`,
					"gi",
				);
				const reactEntryScripts = html.match(reactEntryScriptPattern) ?? [];

				if (reactEntryScripts.length !== 1) {
					throw new Error("The React development entry script was not found.");
				}

				return html
					.replace(reactEntryScriptPattern, (scriptTag) =>
						scriptTag.replace(">", " data-react-entry>"),
					)
					.replace(
						siteControllerMarker,
						`<script type="module" src="/${controller.fileName}" data-site-controller></script>`,
					);
			},
		},
	};
}

export default defineConfig({
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
		separateSiteController(),
		inlineScriptsPlugin,
		injectSiteController(),
		react(),
		tailwindcss(),
	],
});
