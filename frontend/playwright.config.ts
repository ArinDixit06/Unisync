import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 30_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01
    }
  },
  use: {
    baseURL: "http://127.0.0.1:6006",
    viewport: { width: 1440, height: 1024 }
  },
  webServer: {
    command: "npm run build-storybook && python3 -m http.server 6006 --directory storybook-static",
    url: "http://127.0.0.1:6006",
    reuseExistingServer: true,
    timeout: 120_000
  }
})
