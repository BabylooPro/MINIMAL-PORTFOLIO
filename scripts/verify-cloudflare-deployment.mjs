import { readFile } from "node:fs/promises";
import path from "node:path";

import { performanceBudget } from "@/config/performance-budget.mjs";
import { rootUrl } from "@/config/site.mjs";
import { defaultOutputDirectory } from "@/scripts/production-budget/measure.mjs";

const [siteArgument, ...extraArguments] = process.argv.slice(2);
if (!siteArgument || extraArguments.length > 0) throw new Error(`Usage: pnpm verify:cloudflare <${rootUrl}>`);

const siteUrl = new URL(siteArgument);
if (siteUrl.protocol !== "https:" || siteUrl.pathname !== "/" || siteUrl.search || siteUrl.hash) throw new TypeError("The site URL must be an HTTPS origin without a path, query, or fragment.");

function requireHeader(response, name, expectedValue) {
	const value = response.headers.get(name);
	if (!value?.includes(expectedValue)) throw new Error(`Expected ${name}: ${expectedValue}. Received: ${value ?? "missing"}.`);
}

async function requireLocalizedNotFound(pathname, expectedText) {
	const response = await fetch(new URL(pathname, siteUrl), { redirect: "manual" });
	const body = await response.text();
	if (response.status !== 404) throw new Error(`Expected ${pathname} to return 404. Received: ${response.status}.`);
	if (!body.includes(expectedText)) throw new Error(`The ${pathname} response does not contain the expected localized 404 page.`);
}

const builtHomepage = await readFile(path.join(defaultOutputDirectory, "index.html"), "utf8");
const builtAssetPaths = [
	builtHomepage.match(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/u)?.[1],
	builtHomepage.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*\bdata-site-controller/u)?.[1],
].filter((assetPath) => assetPath !== undefined);
if (builtAssetPaths.length !== 2) throw new Error("The built homepage must reference a hashed stylesheet and a hashed site controller.");

async function fetchPublishedHomepage() {
	const attempts = 12;

	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		const response = await fetch(siteUrl, { redirect: "manual", cache: "no-store" });
		if (!response.ok) throw new Error(`Expected the homepage to return 2xx. Received: ${response.status}.`);

		const html = await response.text();
		if (builtAssetPaths.every((assetPath) => html.includes(assetPath))) return { response, html };
		if (attempt === attempts) throw new Error(`The deployment is not serving the build that was just published: ${builtAssetPaths.join(", ")} missing from the live homepage after ${attempts} attempts.`);

		await new Promise((resolve) => setTimeout(resolve, 5_000));
	}

	throw new Error("Unreachable.");
}

const { response: homepageResponse, html: homepageHtml } = await fetchPublishedHomepage();

requireHeader(homepageResponse, "content-security-policy", "frame-ancestors 'none'");
requireHeader(homepageResponse, "content-security-policy", "default-src 'self'");
requireHeader(homepageResponse, "strict-transport-security", "max-age=");
requireHeader(homepageResponse, "x-content-type-options", "nosniff");
requireHeader(homepageResponse, "x-frame-options", "DENY");
requireHeader(homepageResponse, "referrer-policy", "strict-origin-when-cross-origin");
requireHeader(homepageResponse, "permissions-policy", "camera=()");

const allowedScriptOrigins = new Set([siteUrl.origin, ...performanceBudget.architecture.allowedRuntimeOrigins]);
for (const [, scriptSource] of homepageHtml.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gu)) {
	const scriptOrigin = new URL(scriptSource, siteUrl).origin;
	if (!allowedScriptOrigins.has(scriptOrigin)) throw new Error(`The deployed homepage loads a script from an unexpected origin: ${scriptSource}.`);
}

for (const assetPath of builtAssetPaths) {
	const assetResponse = await fetch(new URL(assetPath, siteUrl), { redirect: "manual" });
	if (!assetResponse.ok) throw new Error(`Expected ${assetPath} to return 2xx. Received: ${assetResponse.status}.`);
	requireHeader(assetResponse, "cache-control", "immutable");
}
const mediaSourceMatch = homepageHtml.match(/<source src="([^"]+)" type="video\/mp4"/u);
if (!mediaSourceMatch?.[1]) throw new Error("The homepage does not contain a Proof Work MP4 source.");

const mediaUrl = new URL(mediaSourceMatch[1], siteUrl);
if (mediaUrl.protocol !== "https:" || mediaUrl.origin === siteUrl.origin) throw new Error("Proof Work MP4 files must be served from a separate HTTPS media origin.");

const mediaResponse = await fetch(mediaUrl, { headers: { Range: "bytes=0-1" }, redirect: "manual" });
if (mediaResponse.status !== 206 || !mediaResponse.headers.get("content-range")) throw new Error(`Expected a byte-range response from ${mediaUrl}. Received: ${mediaResponse.status}.`);

await requireLocalizedNotFound("/missing-cloudflare-check", "Page not found");
await requireLocalizedNotFound("/fr/missing-cloudflare-check", "Page introuvable");

console.log(`Cloudflare deployment verified: ${siteUrl.origin}`);
