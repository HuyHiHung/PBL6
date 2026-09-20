import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/web",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [["list"]],
  outputDir: ".local/browser-results",
  use: {
    baseURL: "http://localhost:5173",
    browserName: "chromium",
    channel: "msedge",
    headless: true,
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "off",
  },
});
