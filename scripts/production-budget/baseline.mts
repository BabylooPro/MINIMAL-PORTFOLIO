import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

import { projectDirectory } from "@/scripts/production-budget/measure.mts";

const gitExecutablePaths = ["/usr/bin/git", "/usr/local/bin/git", "/opt/homebrew/bin/git"];
const gitExecutablePath = process.env.GIT_EXECUTABLE_PATH ?? (process.platform === "win32" ? "git" : gitExecutablePaths.find((candidate) => existsSync(candidate)));
const budgetFilePaths = ["config/performance-budget.mts", "config/performance-budget.mjs"];
const exemptKeyPaths = new Set(["html.expectedOutputPaths"]);

function runGit(gitArguments) {
	if (!gitExecutablePath) throw new Error("Unable to locate git to read the committed performance budget.");

	return execFileSync(gitExecutablePath, gitArguments, { cwd: projectDirectory, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

export function resolveBaselineRevisions() {
	const revisions = [];

	if (process.env.PERFORMANCE_BUDGET_BASE_REF) revisions.push(process.env.PERFORMANCE_BUDGET_BASE_REF);

	try {
		runGit(["rev-parse", "--verify", "--quiet", "origin/main"]);
		revisions.push("origin/main");
	} catch {
		if (revisions.length === 0) revisions.push("HEAD");
	}

	return [...new Set(revisions)];
}

export async function readBudgetAtRevision(revision) {
	for (const budgetFilePath of budgetFilePaths) {
		try {
			const source = runGit(["show", `${revision}:${budgetFilePath}`]);
			const { performanceBudget } = await import(`data:text/javascript;base64,${Buffer.from(source, "utf8").toString("base64")}`);
			return performanceBudget ?? null;
		} catch {}
	}

	return null;
}

function compareNumber(baselineValue, currentValue, keyPath, increases) {
	if (typeof currentValue === "number" && currentValue > baselineValue) increases.push({ path: keyPath, baseline: baselineValue, current: currentValue });
}

function compareBoolean(baselineValue, currentValue, keyPath, increases) {
	if (baselineValue === false && currentValue === true) increases.push({ path: keyPath, baseline: baselineValue, current: currentValue });
}

function compareArray(baselineValue, currentValue, keyPath, increases) {
	if (!Array.isArray(currentValue)) return;

	for (const entry of currentValue) {
		if (!baselineValue.includes(entry)) increases.push({ path: keyPath, baseline: null, current: entry });
	}
}

export function getBudgetIncreases(baselineBudget, currentBudget) {
	const increases = [];

	function compare(baselineValue, currentValue, keyPath) {
		if (exemptKeyPaths.has(keyPath)) return;

		if (typeof baselineValue === "number") {
			compareNumber(baselineValue, currentValue, keyPath, increases);
			return;
		}

		if (typeof baselineValue === "boolean") {
			compareBoolean(baselineValue, currentValue, keyPath, increases);
			return;
		}

		if (Array.isArray(baselineValue)) {
			compareArray(baselineValue, currentValue, keyPath, increases);
			return;
		}

		if (!baselineValue || typeof baselineValue !== "object") return;

		for (const [key, value] of Object.entries(baselineValue)) compare(value, currentValue?.[key], keyPath ? `${keyPath}.${key}` : key);
	}

	compare(baselineBudget, currentBudget, "");

	return increases;
}

export async function getCommittedBudgetIncreases(currentBudget) {
	const baselineBudgets = (await Promise.all(resolveBaselineRevisions().map(readBudgetAtRevision))).filter(Boolean);
	if (baselineBudgets.length === 0) return null;

	const increases = [];

	for (const baselineBudget of baselineBudgets) {
		for (const increase of getBudgetIncreases(baselineBudget, currentBudget)) {
			if (!increases.some((existing) => existing.path === increase.path && existing.current === increase.current)) increases.push(increase);
		}
	}

	return increases;
}
