import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

export async function listFiles(directory: string): Promise<string[]> {
	const entries: Dirent[] = await readdir(directory, { withFileTypes: true });

	const files = await Promise.all(entries.map(async (entry) => {
		const entryPath = path.join(directory, entry.name);
		return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
	}));

	return files.flat();
}
