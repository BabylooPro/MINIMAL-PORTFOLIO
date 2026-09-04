import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { performanceBudget } from "@/config/performance-budget.mts";
import { getBudgetIncreases, getCommittedBudgetIncreases, resolveBaselineRevisions } from "@/scripts/production-budget/baseline.mts";
import { extractInlineScript, gzipBytes, measureProductionOutput } from "@/scripts/production-budget/measure.mts";
import { renderMarkdownReport, writeMarkdownReport } from "@/scripts/production-budget/report.mts";
import { validatePerformanceBudget } from "@/scripts/production-budget/validate.mts";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

function html({ root = false, thirdPartyImage = false } = {}) {
	return `<!doctype html>
<html lang="en">
<head>
<link rel="canonical" href="https://example.test/" />
<link rel="stylesheet" href="/assets/site.css" />
<script data-theme-bootstrap>(() => {})()</script>
${root ? "<script data-locale-redirect>(() => {})()</script>" : ""}
</head>
<body>
<img src="${thirdPartyImage ? "https://cdn.example.test/preview.jpg" : "/preview.jpg"}" />
<a href="https://github.com/example/project">External link</a>
<script type="module" src="/assets/site-controller-test.js" data-site-controller></script>
</body>
</html>`;
}

async function writeFixtureFile(outputDirectory, relativePath, source) {
	const filePath = path.join(outputDirectory, relativePath);
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, source);
}

async function createCompleteOutput(t, options = {}) {
	const outputDirectory = await mkdtemp(path.join(tmpdir(), "test-production-budget-"));

	t.after(async () => {
		await rm(outputDirectory, { force: true, recursive: true });
	});

	for (const relativePath of performanceBudget.html.expectedOutputPaths) {
		await writeFixtureFile(
			outputDirectory,
			relativePath,
			html({ root: relativePath === "index.html", thirdPartyImage: options.thirdPartyImage && relativePath === "index.html" }),
		);
	}

	await Promise.all([
		writeFixtureFile(outputDirectory, "_headers", "/*\n  X-Frame-Options: DENY\n"),
		writeFixtureFile(outputDirectory, "sitemap.xml", "<urlset />"),
		writeFixtureFile(outputDirectory, "og-image.jpg", Buffer.alloc(1_000)),
		writeFixtureFile(outputDirectory, "assets/site-controller-test.js", options.controllerSource ?? "console.log('site controller');"),
		writeFixtureFile(outputDirectory, "assets/site.css", options.cssSource ?? "body { color: black; }"),
	]);

	for (let index = 1; index <= performanceBudget.media.expectedPreviewCount; index += 1) {
		await writeFixtureFile(outputDirectory, `videos/timelapse/previews/${index}.avif`, Buffer.alloc(options.previewBytes ?? 1_000));
	}

	if (options.extraJavaScript) await writeFixtureFile(outputDirectory, "assets/extra.js", "console.log('extra');");

	return { outputDirectory };
}

test("measures gzip data and extracts exact inline scripts", async (t) => {
	const source = "(() => { document.documentElement.dataset.theme = 'dark'; })();";
	const output = await createCompleteOutput(t);
	const measurement = await measureProductionOutput(output);

	assert.ok(gzipBytes(Buffer.from(source, "utf8")) > 0);
	assert.equal(extractInlineScript(`<script data-theme-bootstrap>${source}</script>`, "data-theme-bootstrap"), source);
	assert.equal(measurement.inlineScripts.themeBootstrap.rawBytes, Buffer.byteLength("(() => {})()"));
	assert.equal(measurement.inlineScripts.localeRedirect.gzipBytes, gzipBytes(Buffer.from("(() => {})()")));
});

test("calculates root and localized executable JavaScript separately", async (t) => {
	const output = await createCompleteOutput(t);
	const measurement = await measureProductionOutput(output);

	assert.equal(
		measurement.executableJavascript.rootGzipBytes,
		measurement.inlineScripts.themeBootstrap.gzipBytes + measurement.inlineScripts.localeRedirect.gzipBytes + measurement.javascript.controller.gzipBytes,
	);
	assert.equal(
		measurement.executableJavascript.localizedGzipBytes,
		measurement.inlineScripts.themeBootstrap.gzipBytes + measurement.javascript.controller.gzipBytes,
	);
	assert.ok(measurement.executableJavascript.rootGzipBytes > measurement.executableJavascript.localizedGzipBytes);
});

test("discovers every expected generated HTML page and applies its individual budget", async (t) => {
	const output = await createCompleteOutput(t);
	const measurement = await measureProductionOutput(output);
	const validation = validatePerformanceBudget(measurement);

	assert.equal(measurement.html.length, performanceBudget.html.expectedOutputPaths.length);
	assert.equal(validation.isComplete, true);
	assert.equal(
		validation.checks.filter((check) => check.section === "HTML" || check.section === "Secondary HTML").length,
		performanceBudget.html.expectedOutputPaths.length,
	);
});

test("fails a metric that exceeds its configured budget", async (t) => {
	const output = await createCompleteOutput(t);
	const measurement = await measureProductionOutput(output);
	const validation = validatePerformanceBudget(measurement, { ...performanceBudget, css: { ...performanceBudget.css, maximumGzipBytes: 0 } });

	assert.equal(validation.passed, false);
	assert.equal(validation.checks.find((check) => check.id === "css-gzip")?.status, "FAIL");
});

test("rejects an unexpected JavaScript file and a React runtime", async (t) => {
	const output = await createCompleteOutput(t, { controllerSource: "const runtime = 'react-dom';", extraJavaScript: true });
	const validation = validatePerformanceBudget(await measureProductionOutput(output));

	assert.equal(validation.checks.find((check) => check.id === "javascript-file-count")?.status, "FAIL");
	assert.equal(validation.checks.find((check) => check.id === "react-runtime")?.status, "FAIL");
});

test("rejects previews that exceed their individual limits", async (t) => {
	const output = await createCompleteOutput(t, { previewBytes: performanceBudget.media.maximumPreviewFileBytes + 1 });
	const validation = validatePerformanceBudget(await measureProductionOutput(output));

	assert.equal(validation.checks.find((check) => check.id === "preview-1.avif")?.status, "FAIL");
});

test("rejects MP4 files in the Cloudflare Pages output", async (t) => {
	const output = await createCompleteOutput(t);
	await writeFixtureFile(output.outputDirectory, "videos/timelapse/1.mp4", Buffer.alloc(1_000));

	const validation = validatePerformanceBudget(await measureProductionOutput(output));
	assert.equal(validation.integrityFailures.includes("Cloudflare Pages output must not contain MP4 files."), true);
});

test("detects third-party runtime resources but ignores external anchors", async (t) => {
	const localOutput = await createCompleteOutput(t);
	const localMeasurement = await measureProductionOutput(localOutput);

	assert.equal(localMeasurement.resources.thirdParty.length, 0);

	const thirdPartyOutput = await createCompleteOutput(t, { thirdPartyImage: true });
	const thirdPartyMeasurement = await measureProductionOutput(thirdPartyOutput);

	assert.equal(thirdPartyMeasurement.resources.thirdParty.length, 1);
	assert.equal(validatePerformanceBudget(thirdPartyMeasurement).checks.find((check) => check.id === "third-party-runtime-requests")?.status, "FAIL");
});

test("renders deterministic Markdown and writes it atomically", async (t) => {
	const output = await createCompleteOutput(t);
	const measurement = await measureProductionOutput(output);
	const validation = validatePerformanceBudget(measurement);
	const failingValidation = validatePerformanceBudget(measurement, { ...performanceBudget, css: { ...performanceBudget.css, maximumGzipBytes: 0 } });
	const firstRender = renderMarkdownReport(measurement, validation);
	const secondRender = renderMarkdownReport(measurement, validation);
	const failingReport = renderMarkdownReport(measurement, failingValidation);
	const reportDirectory = path.join(testDirectory, ".test-performance-report");
	const reportPath = path.join(reportDirectory, "PERFORMANCE.md");

	t.after(async () => await rm(reportDirectory, { force: true, recursive: true }));

	assert.equal(firstRender, secondRender);
	assert.match(failingReport, /\| CSS gzip \| .* \| ❌ FAIL \|/u);

	await writeMarkdownReport({ reportPath, content: "initial report" });
	await writeFile(reportPath, "stale report", "utf8");
	await writeMarkdownReport({ reportPath, content: failingReport });

	assert.equal(await readFile(reportPath, "utf8"), failingReport);

	await assert.rejects(stat(`${reportPath}.tmp`));
});

test("reports every relaxed budget value and ignores tightened ones", () => {
	const changedBudget = {
		...performanceBudget,
		javascript: { ...performanceBudget.javascript, maximumControllerGzipBytes: performanceBudget.javascript.maximumControllerGzipBytes - 1 },
		css: { ...performanceBudget.css, maximumGzipBytes: performanceBudget.css.maximumGzipBytes + 1 },
		html: { ...performanceBudget.html, expectedOutputPaths: [...performanceBudget.html.expectedOutputPaths.slice(1), "es/index.html"] },
		architecture: { ...performanceBudget.architecture, expectedClientHydration: true, allowedRuntimeOrigins: ["https://cdn.example.test"] },
	};

	assert.deepEqual(getBudgetIncreases(performanceBudget, performanceBudget), []);
	assert.deepEqual(getBudgetIncreases(performanceBudget, changedBudget), [
		{ path: "css.maximumGzipBytes", baseline: performanceBudget.css.maximumGzipBytes, current: performanceBudget.css.maximumGzipBytes + 1 },
		{ path: "architecture.expectedClientHydration", baseline: false, current: true },
		{ path: "architecture.allowedRuntimeOrigins", baseline: null, current: "https://cdn.example.test" },
	]);
});

test("forbids raising any budget value above the committed baseline", async (t) => {
	if (process.env.PERFORMANCE_BUDGET_ALLOW_INCREASE === "1") return t.skip("PERFORMANCE_BUDGET_ALLOW_INCREASE is set.");

	const increases = await getCommittedBudgetIncreases(performanceBudget);
	if (!increases) return t.skip("The performance budget is not committed on any baseline revision.");

	const raised = increases.map((increase) => (increase.baseline === null ? `${increase.path} + ${increase.current}` : `${increase.path} ${increase.baseline} -> ${increase.current}`)).join(", ");

	assert.deepEqual(increases, [], `The performance budget may only be lowered. Raised: ${raised}. Set PERFORMANCE_BUDGET_ALLOW_INCREASE=1 to record a deliberate increase.`);
});

test("keeps origin/main in the baseline set when a base revision is provided", (t) => {
	const originalBaseRef = process.env.PERFORMANCE_BUDGET_BASE_REF;

	t.after(() => {
		if (originalBaseRef === undefined) delete process.env.PERFORMANCE_BUDGET_BASE_REF;
		else process.env.PERFORMANCE_BUDGET_BASE_REF = originalBaseRef;
	});

	process.env.PERFORMANCE_BUDGET_BASE_REF = "";

	assert.deepEqual(resolveBaselineRevisions(), ["origin/main"]);

	process.env.PERFORMANCE_BUDGET_BASE_REF = "HEAD~1";

	assert.deepEqual(resolveBaselineRevisions(), ["HEAD~1", "origin/main"]);
});
