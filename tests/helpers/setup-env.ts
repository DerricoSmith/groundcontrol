// Runs before every test file.
//
// Points Prisma at a dedicated Postgres schema — never the development schema
// and never production. The connection string itself is a secret and lives in
// .env.local (gitignored), so it is read from the environment here rather than
// written into the repository.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(relativePath: string): void {
  let contents: string;
  try {
    contents = readFileSync(resolve(process.cwd(), relativePath), "utf8");
  } catch {
    return; // Absent is fine; CI supplies these directly.
  }

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equals = trimmed.indexOf("=");
    if (equals === -1) continue;
    const key = trimmed.slice(0, equals).trim();
    const value = trimmed.slice(equals + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  throw new Error(
    "TEST_DATABASE_URL is not set. Add it to .env.local pointing at a dedicated Postgres schema " +
      "(for example ...?sslmode=require&schema=gc_test). It must never be the production or development schema."
  );
}

// A guard rather than a convenience: running the suite against a schema that
// is not clearly a test schema would truncate real tables on the first reset.
if (!/schema=gc_(test|e2e)\b/.test(testUrl)) {
  throw new Error(
    "TEST_DATABASE_URL does not target a gc_test or gc_e2e schema. Refusing to run, because " +
      "resetTestDatabase() truncates every table it can reach."
  );
}

process.env.DATABASE_URL = testUrl;
process.env.AUTH_SECRET ??= "test-only-secret-not-for-any-real-use";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
