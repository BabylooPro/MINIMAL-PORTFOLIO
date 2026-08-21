import { performanceBudget } from "@/config/performance-budget.mjs";

function createCheck({ id, section, label, current, maximum, passed, detail = null }) {
	return { id, section, label, current, maximum, status: passed ? "PASS" : "FAIL", detail };
}

function maximumCheck({ id, section, label, current, maximum, detail = null }) {
	return createCheck({ id, section, label, current, maximum, passed: typeof current === "number" && current <= maximum, detail });
}

function equalCheck({ id, section, label, current, expected, detail = null }) {
	return createCheck({ id, section, label, current, maximum: expected, passed: current === expected, detail });
}

function booleanCheck({ id, section, label, current, expected, detail = null }) {
	return createCheck({ id, section, label, current, maximum: expected, passed: current === expected, detail });
}

function getOutputIntegrityFailures(measurement, budget) {
	const failures = [];

	if (!measurement.outputExists) {
		failures.push("dist/ does not exist. Run a production build first.");
		return failures;
	}

	const actualHtmlPaths = measurement.html.map((page) => page.relativePath).sort();
	const expectedHtmlPaths = [...budget.html.expectedOutputPaths].sort((first, second) => Number(first > second) - Number(first < second));
	const missingHtmlPaths = expectedHtmlPaths.filter((filePath) => !actualHtmlPaths.includes(filePath));
	const unexpectedHtmlPaths = actualHtmlPaths.filter((filePath) => !expectedHtmlPaths.includes(filePath));

	if (missingHtmlPaths.length > 0) failures.push(`Missing generated HTML pages: ${missingHtmlPaths.join(", ")}.`);
	if (unexpectedHtmlPaths.length > 0) failures.push(`Unexpected generated HTML pages: ${unexpectedHtmlPaths.join(", ")}.`);

	for (const requiredPath of ["_headers", "sitemap.xml", "og-image.jpg"]) {
		if (!measurement.files.includes(requiredPath)) failures.push(`Missing required production output: ${requiredPath}.`);
	}

	if (measurement.files.some((filePath) => filePath.endsWith(".mp4"))) failures.push("Cloudflare Pages output must not contain MP4 files.");

	for (const artifactDirectory of [".vite/", "server/"]) {
		if (measurement.files.some((filePath) => filePath.startsWith(artifactDirectory))) failures.push(`Unpruned build artifact found: ${artifactDirectory}`);
	}

	return failures;
}

export function validatePerformanceBudget(measurement, budget = performanceBudget) {
	const checks = [];
	const integrityFailures = getOutputIntegrityFailures(measurement, budget);
	const rootPage = measurement.html.find((page) => page.relativePath === "index.html");
	const nonRootPages = measurement.html.filter((page) => page.relativePath !== "index.html");
	const controllerGzipBytes = measurement.javascript.controller?.gzipBytes ?? null;
	const cssGzipBytes = measurement.css.files[0]?.gzipBytes ?? null;

	checks.push(
		equalCheck({
			id: "javascript-file-count",
			section: "Initial page load",
			label: "JavaScript files",
			current: measurement.javascript.files.length,
			expected: budget.javascript.expectedFileCount,
		}),
		equalCheck({
			id: "site-controller-presence",
			section: "Initial page load",
			label: "Site controller bundle",
			current: Boolean(measurement.javascript.controller),
			expected: true,
		}),
		equalCheck({
			id: "css-file-count",
			section: "Initial page load",
			label: "CSS files",
			current: measurement.css.files.length,
			expected: budget.css.expectedFileCount,
		}),
		maximumCheck({
			id: "theme-bootstrap-gzip",
			section: "Initial page load",
			label: "Theme bootstrap gzip",
			current: measurement.inlineScripts.themeBootstrap?.gzipBytes ?? null,
			maximum: budget.inlineScripts.maximumThemeBootstrapGzipBytes,
		}),
		maximumCheck({
			id: "locale-redirect-gzip",
			section: "Initial page load",
			label: "Locale redirect gzip",
			current: measurement.inlineScripts.localeRedirect?.gzipBytes ?? null,
			maximum: budget.inlineScripts.maximumLocaleRedirectGzipBytes,
		}),
		maximumCheck({
			id: "site-controller-gzip",
			section: "Initial page load",
			label: "Site controller gzip",
			current: controllerGzipBytes,
			maximum: budget.javascript.maximumControllerGzipBytes,
		}),
		maximumCheck({
			id: "root-executable-javascript-gzip",
			section: "Initial page load",
			label: "Root executable JavaScript gzip",
			current: measurement.executableJavascript.rootGzipBytes,
			maximum: budget.javascript.maximumRootExecutableGzipBytes,
		}),
		maximumCheck({
			id: "localized-executable-javascript-gzip",
			section: "Initial page load",
			label: "Localized executable JavaScript gzip",
			current: measurement.executableJavascript.localizedGzipBytes,
			maximum: budget.javascript.maximumLocalizedExecutableGzipBytes,
		}),
		maximumCheck({
			id: "css-gzip",
			section: "Initial page load",
			label: "CSS gzip",
			current: cssGzipBytes,
			maximum: budget.css.maximumGzipBytes,
		}),

		booleanCheck({
			id: "root-theme-bootstrap",
			section: "Architecture",
			label: "Root theme bootstrap",
			current: Boolean(rootPage?.inlineScripts.themeBootstrap),
			expected: true,
		}),
		booleanCheck({
			id: "root-locale-redirect",
			section: "Architecture",
			label: "Root locale redirect",
			current: Boolean(rootPage?.inlineScripts.localeRedirect),
			expected: true,
		}),
		booleanCheck({
			id: "localized-inline-scripts",
			section: "Architecture",
			label: "Localized inline script contract",
			current: nonRootPages.every(
				(page) =>
					page.inlineScripts.themeBootstrap === rootPage?.inlineScripts.themeBootstrap &&
					page.inlineScripts.localeRedirect === null,
			),
			expected: true,
		}),
		maximumCheck({
			id: "react-runtime",
			section: "Architecture",
			label: "React shipped to browser",
			current: measurement.architecture.reactRuntimeBytes,
			maximum: budget.architecture.expectedReactRuntimeBytes,
		}),
		booleanCheck({
			id: "client-side-hydration",
			section: "Architecture",
			label: "Client-side hydration",
			current: measurement.architecture.clientSideHydration,
			expected: budget.architecture.expectedClientHydration,
		}),
		booleanCheck({
			id: "client-i18n-runtime",
			section: "Architecture",
			label: "Client-side i18n runtime",
			current: measurement.architecture.clientI18nRuntime,
			expected: budget.architecture.expectedClientI18nRuntime,
		}),
		maximumCheck({
			id: "third-party-runtime-requests",
			section: "Architecture",
			label: "Third-party runtime requests",
			current: measurement.resources.thirdParty.length,
			maximum: budget.architecture.expectedThirdPartyRuntimeRequests,
		}),
		maximumCheck({
			id: "external-fonts",
			section: "Architecture",
			label: "External fonts",
			current: measurement.resources.externalFonts.length,
			maximum: budget.architecture.expectedExternalFonts,
		}),
	);

	for (const page of measurement.html) {
		checks.push(
			maximumCheck({
				id: `html-${page.relativePath}`,
				section: page.group === "primary" ? "HTML" : "Secondary HTML",
				label: page.route,
				current: page.gzipBytes,
				maximum: budget.html.maximumGzipBytesPerPage,
			}),
		);
	}

	checks.push(
		equalCheck({
			id: "preview-count",
			section: "Media",
			label: "Preview image count",
			current: measurement.media.previews.count,
			expected: budget.media.expectedPreviewCount,
		}),
		maximumCheck({
			id: "preview-total",
			section: "Media",
			label: "Preview images",
			current: measurement.media.previews.totalBytes,
			maximum: budget.media.maximumPreviewTotalBytes,
		}),
		maximumCheck({
			id: "social-image",
			section: "Media",
			label: "Social image",
			current: measurement.media.socialImage?.rawBytes ?? null,
			maximum: budget.media.maximumSocialImageBytes,
		}),
	);

	for (const preview of measurement.media.previews.files) {
		checks.push(
			maximumCheck({
				id: `preview-${preview.name}`,
				section: "Preview files",
				label: preview.name,
				current: preview.rawBytes,
				maximum: budget.media.maximumPreviewFileBytes,
			}),
		);
	}

	const failedChecks = checks.filter((check) => check.status === "FAIL");

	return {
		checks,
		failedChecks,
		integrityFailures,
		isComplete: integrityFailures.length === 0,
		passed: integrityFailures.length === 0 && failedChecks.length === 0,
	};
}
