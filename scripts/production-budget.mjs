import path from "node:path";
import { performanceBudget } from "../config/performance-budget.mjs";
import {
	defaultOutputDirectory,
	measureProductionOutput,
	projectDirectory,
} from "./production-budget/measure.mjs";
import {
	renderMarkdownReport,
	renderTerminalReport,
	writeMarkdownReport,
} from "./production-budget/report.mjs";
import { validatePerformanceBudget } from "./production-budget/validate.mjs";

const arguments_ = process.argv.slice(2);
const writeReport = arguments_.includes("--write-report");
const unsupportedArguments = arguments_.filter((argument) => argument !== "--write-report");

if (unsupportedArguments.length > 0) {
	throw new Error(`Unsupported production budget arguments: ${unsupportedArguments.join(", ")}`);
}

const measurement = await measureProductionOutput({ outputDirectory: defaultOutputDirectory });
const validation = validatePerformanceBudget(measurement, performanceBudget);

process.stdout.write(renderTerminalReport(measurement, validation));

if (writeReport) {
	if (!validation.isComplete) {
		process.stderr.write("PERFORMANCE.md was not written because dist/ is incomplete.\n");
	} else {
		const reportPath = await writeMarkdownReport({
			reportPath: path.join(projectDirectory, "PERFORMANCE.md"),
			content: renderMarkdownReport(measurement, validation),
		});

		process.stdout.write(`Wrote ${reportPath}.\n`);
	}
}

if (!validation.passed) {
	process.exitCode = 1;
}
