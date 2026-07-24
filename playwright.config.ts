import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./__tests__/browser",
	timeout: 30_000,
	use: {
		baseURL: "http://127.0.0.1:4174",
		channel: "chromium",
		headless: true,
	},
	webServer: {
		command: "pnpm build:static && pnpm preview --host 127.0.0.1 --port 4174",
		url: "http://127.0.0.1:4174",
		reuseExistingServer: false,
	},
});
