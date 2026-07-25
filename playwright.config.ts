import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Dedicated e2e port and database schema — never the interactive dev server
// (3000) or its gc_dev schema, and never the Vitest gc_test schema.
// See e2e/README.md.
const E2E_PORT = 3101;
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

/**
 * The e2e connection string is a secret and lives in .env, so it is read here
 * rather than written into the config. Reading it at config time means the
 * dev server Playwright starts talks to the same schema the reset script just
 * truncated, which is what stops the suite from running against whatever
 * DATABASE_URL happened to be exported in the shell.
 */
function readEnvValue(key: string): string {
  if (process.env[key]) return process.env[key]!;
  try {
    const contents = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const equals = trimmed.indexOf("=");
      if (equals === -1) continue;
      if (trimmed.slice(0, equals).trim() === key) {
        return trimmed.slice(equals + 1).trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Fall through to the explicit error below.
  }
  throw new Error(`${key} is not set. Add it to .env before running the end-to-end suite.`);
}

const E2E_DATABASE_URL = readEnvValue("E2E_DATABASE_URL");

if (!/schema=gc_e2e\b/.test(E2E_DATABASE_URL)) {
  throw new Error("E2E_DATABASE_URL does not target the gc_e2e schema. Refusing to run.");
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `cross-env AUTH_SECRET=test-only-e2e-secret-not-for-real-use NEXT_PUBLIC_APP_URL=${E2E_BASE_URL} PORT=${E2E_PORT} next dev`,
    url: E2E_BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      // Passed through the env option rather than the command string so the
      // connection string never appears in a process listing.
      DATABASE_URL: E2E_DATABASE_URL,
      // Lets the screenshot generator populate derived intelligence (health,
      // risks, actions, brief) in the end-to-end database before capturing.
      // The security suite still asserts the route rejects a wrong secret.
      SEED_SECRET: "e2e-only-seed-secret",
    },
  },
  projects: [
    { name: "chromium", testIgnore: /accessibility\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "accessibility", testMatch: /accessibility\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
});
