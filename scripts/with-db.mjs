/**
 * Runs a command with DATABASE_URL set from another environment variable.
 *
 *   node scripts/with-db.mjs TEST_DATABASE_URL prisma db push --skip-generate
 *
 * Exists because shell variable expansion differs between PowerShell, cmd, and
 * POSIX shells, and the test scripts have to work identically on all three.
 * It also refuses to point a test command at a non-test schema, which is the
 * failure that would truncate real tables.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const [sourceVar, ...command] = process.argv.slice(2);

if (!sourceVar || command.length === 0) {
  console.error("Usage: node scripts/with-db.mjs <SOURCE_ENV_VAR> <command...>");
  process.exit(1);
}

// Load .env so the wrapper works without the caller having exported anything.
try {
  const contents = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equals = trimmed.indexOf("=");
    if (equals === -1) continue;
    const key = trimmed.slice(0, equals).trim();
    const value = trimmed.slice(equals + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
} catch {
  // Absent .env is fine when the variables are already exported.
}

const url = process.env[sourceVar];
if (!url) {
  console.error(`${sourceVar} is not set. Add it to .env or export it.`);
  process.exit(1);
}

// Guard: a command routed through a *_TEST/E2E variable must land on a test
// schema. Without this, a mistyped .env would send TRUNCATE at production.
if (/^(TEST|E2E)_/.test(sourceVar) && !/schema=gc_(test|e2e)\b/.test(url)) {
  console.error(`${sourceVar} does not target a gc_test or gc_e2e schema. Refusing to run.`);
  process.exit(1);
}

const child = spawn(command[0], command.slice(1), {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: url },
});

child.on("exit", (code) => process.exit(code ?? 1));
