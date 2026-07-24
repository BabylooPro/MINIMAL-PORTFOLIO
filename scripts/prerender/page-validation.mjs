import {
	escapeHtml,
	getAnchorElements,
	getAttribute,
	getLinkElements,
	getMetaElements,
	getMetaHttpEquivElements,
	getMetaPropertyElements,
	getScriptElements,
	hasAttribute,
	isJsonLdScript,
	isModuleScript,
} from "./html.mjs";

export function getSiteControllerScript(html) {
	const controllerScripts = getScriptElements(html).filter((scriptElement) =>
		hasAttribute(scriptElement, "data-site-controller"),
	);

	if (controllerScripts.length !== 1) {
		throw new Error("The production HTML must contain exactly one site controller script.");
	}

	const [controllerScript] = controllerScripts;
	const src = getAttribute(controllerScript, "src");

	if (!isModuleScript(controllerScript) || !src) {
		throw new Error("The site controller must be a module script with a src attribute.");
	}

	return { src };
}

function assertSingleMetadata(elements, content, description) {
	if (elements.length !== 1 || getAttribute(elements[0], "content") !== escapeHtml(content)) {
		throw new Error(`The production HTML has an invalid ${description}.`);
	}
}

function parseStructuredData(indexHtml, route) {
	const structuredDataScripts = getScriptElements(indexHtml).filter(isJsonLdScript);

	if (structuredDataScripts.length !== 1) {
		throw new Error(`The ${route.kind} page must contain exactly one JSON-LD script.`);
	}

	const [structuredDataScript] = structuredDataScripts;
	const content = structuredDataScript.slice(
		structuredDataScript.indexOf(">") + 1,
		structuredDataScript.lastIndexOf("</script>"),
	);

	try {
		return JSON.parse(content);
	} catch {
		throw new Error(`The ${route.kind} page contains invalid JSON-LD structured data.`);
	}
}

export function validatePageHtml({
	page,
	route,
	indexHtml,
	siteControllerSrc,
	pageAlternateLinks,
	languageSwitcherLinks,
	siteName,
	alternateLinksMarker,
	pageMetadataMarker,
	structuredDataMarker,
}) {
	if (!indexHtml.includes("Max Remy")) {
		throw new Error(`The ${route.kind} page does not contain "Max Remy".`);
	}

	if (!/<main\b/i.test(indexHtml)) {
		throw new Error(`The ${route.kind} page does not contain a main element.`);
	}

	if (/\brel=["']modulepreload["']/i.test(indexHtml)) {
		throw new Error(`A module preload is still present on the ${route.kind} page.`);
	}

	if (hasAttribute(indexHtml, "data-react-entry")) {
		throw new Error(`The React development entry is still present on the ${route.kind} page.`);
	}

	const contentSecurityPolicies = getMetaHttpEquivElements(indexHtml, "Content-Security-Policy");

	if (contentSecurityPolicies.length !== 1) {
		throw new Error(
			`The ${route.kind} page must contain one Content Security Policy meta tag.`,
		);
	}

	const [contentSecurityPolicy] = contentSecurityPolicies;
	const contentSecurityPolicyContent = getAttribute(contentSecurityPolicy, "content");
	const requiredContentSecurityPolicyDirectives = [
		"default-src 'self'",
		"base-uri 'self'",
		"object-src 'none'",
		"frame-src 'none'",
		"img-src 'self'",
		"media-src 'self'",
		"font-src 'self'",
		"style-src 'self'",
		"connect-src 'self'",
		"form-action 'self'",
	];

	if (
		!contentSecurityPolicyContent ||
		!requiredContentSecurityPolicyDirectives.every((directive) =>
			contentSecurityPolicyContent.includes(directive),
		) ||
		!/(?:^|;\s*)script-src 'self'(?: 'sha256-[A-Za-z0-9+/]{43}=')+(?:;|$)/i.test(
			contentSecurityPolicyContent,
		) ||
		/unsafe-(?:inline|eval)/i.test(contentSecurityPolicyContent)
	) {
		throw new Error(`The ${route.kind} page has an invalid Content Security Policy.`);
	}

	if (/\sstyle\s*=/i.test(indexHtml)) {
		throw new Error(`The ${route.kind} page must not contain inline styles.`);
	}

	const firstScriptIndex = indexHtml.search(/<script\b/i);

	if (firstScriptIndex < 0 || indexHtml.indexOf(contentSecurityPolicy) > firstScriptIndex) {
		throw new Error(`The ${route.kind} Content Security Policy must precede all scripts.`);
	}

	const scriptElements = getScriptElements(indexHtml);
	const themeBootstrapScripts = scriptElements.filter((scriptElement) =>
		hasAttribute(scriptElement, "data-theme-bootstrap"),
	);
	const localeRedirectScripts = scriptElements.filter((scriptElement) =>
		hasAttribute(scriptElement, "data-locale-redirect"),
	);
	const controller = getSiteControllerScript(indexHtml);

	if (
		scriptElements.some(
			(scriptElement) =>
				!isJsonLdScript(scriptElement) &&
				!hasAttribute(scriptElement, "data-theme-bootstrap") &&
				!hasAttribute(scriptElement, "data-site-controller") &&
				!(route.kind === "root" && hasAttribute(scriptElement, "data-locale-redirect")),
		)
	) {
		throw new Error(`An unexpected executable script is present on the ${route.kind} page.`);
	}

	if (
		themeBootstrapScripts.length !== 1 ||
		themeBootstrapScripts.some((scriptElement) => getAttribute(scriptElement, "src"))
	) {
		throw new Error(`The ${route.kind} page must contain one inline theme bootstrap script.`);
	}

	if (route.kind === "root") {
		if (
			localeRedirectScripts.length !== 1 ||
			localeRedirectScripts.some((scriptElement) => getAttribute(scriptElement, "src"))
		) {
			throw new Error("The root page must contain one inline locale redirect script.");
		}

		const [localeRedirectScript] = localeRedirectScripts;

		if (
			!/\bnavigator\.(?:language|languages)\b/i.test(localeRedirectScript) ||
			!/\bwindow\.location\.replace\s*\(/i.test(localeRedirectScript)
		) {
			throw new Error("The root locale redirect script is incomplete.");
		}
	} else if (
		localeRedirectScripts.length !== 0 ||
		/\bnavigator\.(?:language|languages)\b/i.test(indexHtml)
	) {
		throw new Error(`The ${route.kind} page must not contain browser language detection.`);
	}

	if (controller.src !== siteControllerSrc) {
		throw new Error(`The ${route.kind} page has an incorrect site controller source.`);
	}

	if (!indexHtml.includes(`<html lang="${page.lang}">`)) {
		throw new Error(`The ${route.kind} page has an incorrect document language.`);
	}

	if (!indexHtml.includes(`<link rel="canonical" href="${page.canonical}" />`)) {
		throw new Error(`The ${route.kind} page has an incorrect canonical URL.`);
	}

	if (getLinkElements(indexHtml, "canonical").length !== 1) {
		throw new Error(`The ${route.kind} page must contain exactly one canonical URL.`);
	}

	if (!indexHtml.includes(`<title>${escapeHtml(page.title)}</title>`)) {
		throw new Error(`The ${route.kind} page has an incorrect document title.`);
	}

	assertSingleMetadata(
		getMetaElements(indexHtml, "robots"),
		page.indexable ? "index,follow,max-image-preview:large" : "noindex,follow",
		"robots directive",
	);
	assertSingleMetadata(
		getMetaElements(indexHtml, "description"),
		page.description,
		"description metadata",
	);
	assertSingleMetadata(
		getMetaElements(indexHtml, "twitter:card"),
		"summary_large_image",
		"Twitter card metadata",
	);
	assertSingleMetadata(
		getMetaElements(indexHtml, "twitter:title"),
		page.title,
		"Twitter title metadata",
	);
	assertSingleMetadata(
		getMetaElements(indexHtml, "twitter:description"),
		page.ogDescription,
		"Twitter description metadata",
	);
	assertSingleMetadata(
		getMetaElements(indexHtml, "twitter:image"),
		page.socialImage.url,
		"Twitter image metadata",
	);
	assertSingleMetadata(
		getMetaElements(indexHtml, "twitter:image:alt"),
		page.socialImage.alt,
		"Twitter image alt metadata",
	);

	const expectedOpenGraphMetadata = [
		["og:type", page.ogType],
		["og:title", page.title],
		["og:description", page.ogDescription],
		["og:url", page.canonical],
		["og:site_name", siteName],
		["og:locale", page.ogLocale],
		["og:image", page.socialImage.url],
		["og:image:type", page.socialImage.type],
		["og:image:width", String(page.socialImage.width)],
		["og:image:height", String(page.socialImage.height)],
		["og:image:alt", page.socialImage.alt],
	];

	for (const [property, content] of expectedOpenGraphMetadata) {
		assertSingleMetadata(
			getMetaPropertyElements(indexHtml, property),
			content,
			`${property} metadata`,
		);
	}

	let socialImageUrl;

	try {
		socialImageUrl = new URL(page.socialImage.url);
	} catch {
		throw new Error(`The ${route.kind} page has a non-absolute social image URL.`);
	}

	if (socialImageUrl.protocol !== "https:") {
		throw new Error(`The ${route.kind} page has a non-HTTPS social image URL.`);
	}

	for (const link of pageAlternateLinks) {
		if (!indexHtml.includes(`hreflang="${link.hreflang}" href="${link.href}"`)) {
			throw new Error(`The ${route.kind} page is missing hreflang="${link.hreflang}".`);
		}
	}

	if (getLinkElements(indexHtml, "alternate").length !== pageAlternateLinks.length) {
		throw new Error(`The ${route.kind} page has an invalid hreflang cluster.`);
	}

	const structuredData = parseStructuredData(indexHtml, route);

	if (structuredData.inLanguage !== page.lang) {
		throw new Error(`The ${route.kind} page has incorrect JSON-LD language data.`);
	}

	if (
		page.ogType === "profile" &&
		(structuredData["@type"] !== "ProfilePage" ||
			structuredData.primaryImageOfPage?.url !== page.socialImage.url ||
			structuredData.primaryImageOfPage?.width !== page.socialImage.width ||
			structuredData.primaryImageOfPage?.height !== page.socialImage.height ||
			structuredData.mainEntity?.["@type"] !== "Person" ||
			structuredData.mainEntity?.["@id"] !== "https://maxremy.dev/#max-remy")
	) {
		throw new Error(`The ${route.kind} page has incomplete profile JSON-LD data.`);
	}

	if (/react-dom|react-jsx-runtime|createRoot|hydrateRoot/i.test(indexHtml)) {
		throw new Error(`The ${route.kind} page still contains React runtime code.`);
	}

	const themeColorMetaElements = getMetaElements(indexHtml, "theme-color");

	if (
		themeColorMetaElements.length !== 1 ||
		!hasAttribute(themeColorMetaElements[0], "data-theme-color")
	) {
		throw new Error(`The ${route.kind} page must contain one dynamic theme-color meta tag.`);
	}

	const colorSchemeMetaElements = getMetaElements(indexHtml, "color-scheme");

	if (
		colorSchemeMetaElements.length !== 1 ||
		getAttribute(colorSchemeMetaElements[0], "content") !== "light dark"
	) {
		throw new Error(`The ${route.kind} page must contain the color-scheme meta tag.`);
	}

	if (
		![pageMetadataMarker, alternateLinksMarker, structuredDataMarker, "<!--app-html-->"].every(
			(marker) => !indexHtml.includes(marker),
		)
	) {
		throw new Error(`The ${route.kind} page contains an unresolved HTML marker.`);
	}

	if (
		!languageSwitcherLinks.every((link) => {
			const href = new URL(link.href).pathname;

			return getAnchorElements(indexHtml).some(
				(anchor) =>
					getAttribute(anchor, "href") === href &&
					getAttribute(anchor, "hreflang") === link.hreflang,
			);
		})
	) {
		throw new Error(`The ${route.kind} page does not contain the language selector.`);
	}
}
