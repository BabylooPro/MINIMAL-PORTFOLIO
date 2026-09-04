import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const viteArguments = process.argv.slice(2);
const typecheckStatusPattern = /^\d{1,2}:\d{2}:\d{2} (?:AM|PM) - (?:(?:Starting compilation in watch mode|File change detected\. Starting incremental compilation)\.\.\.|Found \d+ errors?\. Watching for file changes\.)$/;
const viteProcess = spawn(process.execPath, [fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)), ...viteArguments], { stdio: "inherit" });
const typecheckProcess = spawn(process.execPath, [fileURLToPath(new URL("../node_modules/typescript/bin/tsc", import.meta.url)), "-b", "--pretty", "false", "--watch", "--preserveWatchOutput"], { stdio: ["inherit", "pipe", "pipe"] });
const processes = [viteProcess, typecheckProcess];

let stopping = false;
let exitCode = 0;
let remainingProcesses = processes.length;

console.log("TypeScript: watching for errors.");

let typecheckOutput = "";
typecheckProcess.stdout.setEncoding("utf8");
typecheckProcess.stdout.on("data", (chunk) => {
	typecheckOutput += chunk;
	const lines = typecheckOutput.split("\n");
	typecheckOutput = lines.pop() ?? "";
	for (const line of lines) {
		if (line.trim().length > 0 && !typecheckStatusPattern.test(line.trim())) process.stdout.write(`${line}\n`);
	}
});
typecheckProcess.stderr.pipe(process.stderr);

function stop(signal) {
	if (stopping) return;
	stopping = true;
	for (const process of processes) process.kill(signal);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => stop(signal));
}

for (const childProcess of processes) {
	childProcess.on("error", (error) => {
		console.error(error);
		exitCode = 1;
		stop("SIGTERM");
	});

	childProcess.on("exit", (code) => {
		remainingProcesses -= 1;
		if (!stopping) {
			exitCode = code ?? 1;
			stop("SIGTERM");
		}
		if (remainingProcesses === 0) process.exit(exitCode);
	});
}
