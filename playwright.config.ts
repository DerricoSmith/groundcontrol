import { defineConfig, devices } from "@playwright/test";

// Dedicated e2e port and database — never the interactive dev server (3000)
// or its dev.db, and never the Vitest test.db. See e2e/README.md.
const E2E_PORT = 3101;
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `cross-env DATABASE_URL=file:./e2e.db AUTH_SECRET=test-only-e2e-secret-not-for-real-use NEXT_PUBLIC_APP_URL=${E2E_BASE_URL} PORT=${E2E_PORT} next dev`,
    url: E2E_BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
