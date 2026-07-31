import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export function formatBytes(bytes) {
	if (bytes < 1_000) {
		return `${bytes.toLocaleString("en-US")} B`;
	}

	if (bytes < 1_000_000) {
		return `${(bytes / 1_000).toFixed(1)} kB`;
	}

	return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function formatExactBytes(bytes) {
	return `${bytes.toLocaleString("en-US")} B`;
}

function getCheck(validation, id) {
	const check = validation.checks.find((candidate) => candidate.id === id);

	if (!check) {
		throw new Error(`Missing performance check: ${id}`);
	}

	return check;
}

function formatValue(value, { asBytes = false } = {}) {
	if (value === null || value === undefined) {
		return "Not available";
	}

	if (typeof value === "boolean") {
		return value ? "Detected" : "None";
	}

	return asBytes ? formatExactBytes(value) : String(value);
}

function formatMaximum(value, { asBytes = false } = {}) {
	if (typeof value === "boolean") {
		return value ? "Detected" : "None";
	}

	return asBytes ? `≤ ${formatExactBytes(value)}` : String(value);
}

function statusForFiles(validation, prefix) {
	return validation.checks
		.filter((check) => check.id.startsWith(prefix))
		.every((check) => check.status === "PASS")
		? "PASS"
		: "FAIL";
}

function createTable(headers, rows) {
	const stringRows = rows.map((row) => row.map(String));
	const widths = headers.map((header, columnIndex) =>
		Math.max(header.length, ...stringRows.map((row) => row[columnIndex]?.length ?? 0)),
	);
	const renderRow = (row) =>
		row
			.map((value, index) => value.padEnd(widths[index] ?? 0))
			.join("  ")
			.trimEnd();

	return [
		renderRow(headers),
		renderRow(widths.map((width) => "─".repeat(width))),
		...stringRows.map(renderRow),
	].join("\n");
}

function getInitialRows(validation) {
	const byteCheckRows = [
		"theme-bootstrap-gzip",
		"locale-redirect-gzip",
		"site-controller-gzip",
		"root-executable-javascript-gzip",
		"localized-executable-javascript-gzip",
		"css-gzip",
	].map((id) => {
		const check = getCheck(validation, id);

		return [
			check.label,
			formatValue(check.current, { asBytes: true }),
			formatMaximum(check.maximum, { asBytes: true }),
			check.status,
		];
	});
	const react = getCheck(validation, "react-runtime");
	const hydration = getCheck(validation, "client-side-hydration");

	return [
		[
			react.label,
			formatValue(react.current, { asBytes: true }),
			formatMaximum(react.maximum, { asBytes: true }),
			react.status,
		],
		[
			hydration.label,
			formatValue(hydration.current),
			formatMaximum(hydration.maximum),
			hydration.status,
		],
		...byteCheckRows,
	];
}

function getHtmlRows(validation, section) {
	const primaryRouteOrder = ["/", "/en/", "/fr/", "/de/"];

	return validation.checks
		.filter((check) => check.section === section)
		.sort((first, second) => {
			if (section !== "HTML") {
				return first.label.localeCompare(second.label);
			}

			return primaryRouteOrder.indexOf(first.label) - primaryRouteOrder.indexOf(second.label);
		})
		.map((check) => [
			check.label,
			formatValue(check.current, { asBytes: true }),
			formatMaximum(check.maximum, { asBytes: true }),
			check.status,
		]);
}

function formatMediaMaximum(bytes) {
	return `≤ ${formatBytes(bytes)}`;
}

function formatMediaValue(bytes) {
	return typeof bytes === "number" ? formatBytes(bytes) : "Not available";
}

function getArchitectureRows(validation) {
	return ["client-i18n-runtime", "third-party-runtime-requests", "external-fonts"].map((id) => {
		const check = getCheck(validation, id);

		return [
			check.label,
			formatValue(check.current),
			formatMaximum(check.maximum),
			check.status,
		];
	});
}

function getMediaRows(measurement, validation) {
	const previewTotal = getCheck(validation, "preview-total");
	const videoTotal = getCheck(validation, "video-total");
	const socialImage = getCheck(validation, "social-image");
	const previewLargest = measurement.media.previews.largestFile;
	const videoLargest = measurement.media.videos.largestFile;
	const previewLargestCheck = previewLargest
		? getCheck(validation, `preview-${previewLargest.name}`)
		: null;
	const videoLargestCheck = videoLargest
		? getCheck(validation, `video-${videoLargest.name}`)
		: null;

	return [
		[
			"Timelapse video count",
			formatValue(getCheck(validation, "video-count").current),
			formatMaximum(getCheck(validation, "video-count").maximum),
			getCheck(validation, "video-count").status,
		],
		[
			"Timelapse videos",
			formatMediaValue(videoTotal.current),
			formatMediaMaximum(videoTotal.maximum),
			videoTotal.status,
		],
		[
			"Largest video",
			videoLargest
				? `${videoLargest.name} (${formatBytes(videoLargest.rawBytes)})`
				: "Not available",
			videoLargestCheck ? formatMediaMaximum(videoLargestCheck.maximum) : "Not available",
			statusForFiles(validation, "video-"),
		],
		[
			"Preview image count",
			formatValue(getCheck(validation, "preview-count").current),
			formatMaximum(getCheck(validation, "preview-count").maximum),
			getCheck(validation, "preview-count").status,
		],
		[
			"Preview images",
			formatMediaValue(previewTotal.current),
			formatMediaMaximum(previewTotal.maximum),
			previewTotal.status,
		],
		[
			"Largest preview",
			previewLargest
				? `${previewLargest.name} (${formatExactBytes(previewLargest.rawBytes)})`
				: "Not available",
			previewLargestCheck ? formatMediaMaximum(previewLargestCheck.maximum) : "Not available",
			statusForFiles(validation, "preview-"),
		],
		[
			"Social image",
			formatMediaValue(socialImage.current),
			formatMediaMaximum(socialImage.maximum),
			socialImage.status,
		],
	];
}

function getFileRows(validation, section) {
	return validation.checks
		.filter((check) => check.section === section)
		.map((check) => [
			check.label,
			formatBytes(check.current),
			formatMediaMaximum(check.maximum),
			check.status,
		]);
}

function getIntegrityLines(validation) {
	return validation.integrityFailures.map((failure) => `- ${failure}`);
}

export function renderTerminalReport(measurement, validation) {
	const initialRows = getInitialRows(validation);
	const htmlRows = getHtmlRows(validation, "HTML");
	const secondaryHtmlRows = getHtmlRows(validation, "Secondary HTML");
	const architectureRows = getArchitectureRows(validation);
	const mediaRows = getMediaRows(measurement, validation);
	const previewRows = getFileRows(validation, "Preview files");
	const videoRows = getFileRows(validation, "Video files");
	const lines = [
		"Performance budget",
		"─".repeat(72),
		"",
		"Initial page load",
		"",
		createTable(["Metric", "Current", "Budget", "Status"], initialRows),
		"",
		"HTML",
		"",
		createTable(["Route", "Current", "Budget", "Status"], htmlRows),
		"",
		"Secondary HTML",
		"",
		createTable(["Route", "Current", "Budget", "Status"], secondaryHtmlRows),
		"",
		"Architecture",
		"",
		createTable(["Metric", "Current", "Budget", "Status"], architectureRows),
		"",
		"Media during navigation",
		"",
		createTable(["Metric", "Current", "Budget", "Status"], mediaRows),
		"",
		"Preview files",
		"",
		createTable(["File", "Current", "Budget", "Status"], previewRows),
		"",
		"Video files",
		"",
		createTable(["File", "Current", "Budget", "Status"], videoRows),
		"",
		'The active poster may load immediately. Side previews use loading="lazy", but the browser decides when to fetch them.',
		'The active video uses preload="metadata". It may start a media request before playback, potentially partial, without guaranteeing a Range request.',
	];

	if (validation.integrityFailures.length > 0) {
		lines.push("", "Production output is incomplete:", ...getIntegrityLines(validation));
	}

	lines.push("", validation.passed ? "Production budget passed." : "Production budget failed.");

	return `${lines.join("\n")}\n`;
}

function markdownStatus(status) {
	return status === "PASS" ? "✅ PASS" : "❌ FAIL";
}

function renderMarkdownTable(headers, rows) {
	return [
		`| ${headers.join(" | ")} |`,
		`|${headers.map(() => "---").join("|")}|`,
		...rows.map((row) => `| ${row.map((cell) => cell.replaceAll("|", "\\|")).join(" | ")} |`),
	].join("\n");
}

function toMarkdownRows(rows) {
	return rows.map((row) => [...row.slice(0, -1), markdownStatus(row.at(-1))]);
}

export function renderMarkdownReport(measurement, validation) {
	const initialRows = toMarkdownRows(getInitialRows(validation));
	const htmlRows = toMarkdownRows(getHtmlRows(validation, "HTML"));
	const secondaryHtmlRows = toMarkdownRows(getHtmlRows(validation, "Secondary HTML"));
	const architectureRows = toMarkdownRows(getArchitectureRows(validation));
	const mediaRows = toMarkdownRows(getMediaRows(measurement, validation));
	const previewRows = toMarkdownRows(getFileRows(validation, "Preview files"));
	const videoRows = toMarkdownRows(getFileRows(validation, "Video files"));
	const sections = [
		"# Performance budget",
		"",
		"This portfolio is statically pre-rendered. React is used during the build only and is not shipped to the browser.",
		"",
		"## Initial page load",
		"",
		renderMarkdownTable(["Metric", "Current", "Budget", "Status"], initialRows),
		"",
		"## HTML",
		"",
		renderMarkdownTable(["Route", "Current", "Budget", "Status"], htmlRows),
		"",
		"## Secondary HTML",
		"",
		renderMarkdownTable(["Route", "Current", "Budget", "Status"], secondaryHtmlRows),
		"",
		"The HTML budget applies independently to every generated page, including legal and 404 pages.",
		"",
		"## Architecture",
		"",
		renderMarkdownTable(["Metric", "Current", "Budget", "Status"], architectureRows),
		"",
		"## Media during navigation",
		"",
		renderMarkdownTable(["Metric", "Current", "Budget", "Status"], mediaRows),
		"",
		'The active poster may load immediately. Side previews use `loading="lazy"`, but the browser decides when to fetch them. The active video uses `preload="metadata"`, so it may start a media request before playback; that request can be partial, but a `Range` request is not guaranteed.',
		"",
		"### Preview files",
		"",
		renderMarkdownTable(["File", "Current", "Budget", "Status"], previewRows),
		"",
		"### Video files",
		"",
		renderMarkdownTable(["File", "Current", "Budget", "Status"], videoRows),
	];

	if (validation.integrityFailures.length > 0) {
		sections.push("", "## Incomplete production output", "", ...getIntegrityLines(validation));
	}

	sections.push(
		"",
		validation.passed ? "Production budget passed." : "Production budget failed.",
		"",
	);

	return sections.join("\n");
}

export async function writeMarkdownReport({ reportPath, content }) {
	const temporaryPath = `${reportPath}.tmp`;

	await mkdir(path.dirname(reportPath), { recursive: true });
	await writeFile(temporaryPath, content, "utf8");
	await rename(temporaryPath, reportPath);

	return path.resolve(reportPath);
}
