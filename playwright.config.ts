import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./__tests__/browser",
	timeout: 30_000,
	use: {
		baseURL: "http://127.0.0.1:4174",
		headless: true,
	},
	projects: [
		{
			name: "chromium",
			use: { browserName: "chromium", channel: "chromium" },
		},
		{
			name: "webkit-proof-work",
			grep: /updates the Proof Work carousel/,
			use: { browserName: "webkit" },
		},
	],
	webServer: {
		command: "pnpm build:static && pnpm preview --host 127.0.0.1 --port 4174",
		url: "http://127.0.0.1:4174",
		reuseExistingServer: false,
	},
});
