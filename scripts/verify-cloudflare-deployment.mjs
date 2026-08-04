import { rootUrl } from "@/config/site.mjs";

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

const homepageResponse = await fetch(siteUrl, { redirect: "manual" });
if (!homepageResponse.ok) throw new Error(`Expected the homepage to return 2xx. Received: ${homepageResponse.status}.`);

requireHeader(homepageResponse, "content-security-policy", "frame-ancestors 'none'");
requireHeader(homepageResponse, "x-content-type-options", "nosniff");
requireHeader(homepageResponse, "x-frame-options", "DENY");

const homepageHtml = await homepageResponse.text();
const mediaSourceMatch = homepageHtml.match(/<source src="([^"]+)" type="video\/mp4"/u);
if (!mediaSourceMatch?.[1]) throw new Error("The homepage does not contain a Proof Work MP4 source.");

const mediaUrl = new URL(mediaSourceMatch[1], siteUrl);
if (mediaUrl.protocol !== "https:" || mediaUrl.origin === siteUrl.origin) throw new Error("Proof Work MP4 files must be served from a separate HTTPS media origin.");

const mediaResponse = await fetch(mediaUrl, { headers: { Range: "bytes=0-1" }, redirect: "manual" });
if (mediaResponse.status !== 206 || !mediaResponse.headers.get("content-range")) throw new Error(`Expected a byte-range response from ${mediaUrl}. Received: ${mediaResponse.status}.`);

await requireLocalizedNotFound("/missing-cloudflare-check", "Page not found");
await requireLocalizedNotFound("/fr/missing-cloudflare-check", "Page introuvable");

console.log(`Cloudflare deployment verified: ${siteUrl.origin}`);
