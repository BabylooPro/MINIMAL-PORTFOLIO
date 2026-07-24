import { spawn } from "node:child_process";
import path from "node:path";

function toProjectRelativePath(projectDirectory, filePath) {
	const relativePath = path.relative(projectDirectory, filePath);

	if (
		!relativePath ||
		relativePath.startsWith(`..${path.sep}`) ||
		path.isAbsolute(relativePath)
	) {
		throw new Error(`Path is outside the project directory: ${filePath}`);
	}

	return relativePath;
}

export function getIgnoredProjectFiles(projectDirectory, filePaths) {
	if (filePaths.length === 0) {
		return Promise.resolve([]);
	}

	const relativePaths = filePaths.map((filePath) =>
		toProjectRelativePath(projectDirectory, filePath),
	);

	return new Promise((resolve, reject) => {
		const git = spawn("git", ["check-ignore", "--no-index", "--stdin", "-z"], {
			cwd: projectDirectory,
			stdio: ["pipe", "pipe", "pipe"],
		});
		let output = "";
		let errorOutput = "";

		git.stdout.setEncoding("utf8");
		git.stderr.setEncoding("utf8");
		git.stdout.on("data", (chunk) => {
			output += chunk;
		});
		git.stderr.on("data", (chunk) => {
			errorOutput += chunk;
		});
		git.on("error", (error) => {
			reject(new Error(`Unable to evaluate .gitignore rules: ${error.message}`));
		});
		git.on("close", (code) => {
			if (code === 0) {
				resolve(output.split("\0").filter(Boolean).sort());
				return;
			}

			if (code === 1) {
				resolve([]);
				return;
			}

			reject(
				new Error(
					`Unable to evaluate .gitignore rules: ${errorOutput.trim() || `git exited with ${code}`}`,
				),
			);
		});

		git.stdin.end(`${relativePaths.join("\0")}\0`);
	});
}
