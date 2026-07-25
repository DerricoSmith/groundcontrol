/**
 * Truncates every table in a dedicated test schema.
 *
 *   node scripts/reset-test-schema.mjs E2E_DATABASE_URL
 *
 * Playwright needs a clean database between runs. When both suites ran on
 * SQLite this was `db push --force-reset`, which drops and recreates the file.
 * On Postgres that would drop the schema and force a re-push on every run, so
 * this truncates instead: same guarantee, far faster, and no migration churn.
 *
 * Two guards, because the failure mode is destroying real data:
 *   - The source variable must name a gc_test or gc_e2e schema.
 *   - Tables are discovered from that schema only, and the schema name is
 *     validated against a strict pattern before it reaches any SQL.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sourceVar = process.argv[2] ?? "TEST_DATABASE_URL";

try {
  const contents = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equals = trimmed.indexOf("=");
    if (equals === -1) continue;
    process.env[trimmed.slice(0, equals).trim()] ??= trimmed
      .slice(equals + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
} catch {
  // Already exported is fine.
}

const url = process.env[sourceVar];
if (!url) {
  console.error(`${sourceVar} is not set.`);
  process.exit(1);
}

const schemaMatch = /[?&]schema=(gc_(?:test|e2e))\b/.exec(url);
if (!schemaMatch) {
  console.error(`${sourceVar} does not target a gc_test or gc_e2e schema. Refusing to truncate.`);
  process.exit(1);
}
const schema = schemaMatch[1];

const prisma = new PrismaClient({ datasourceUrl: url });

const rows = await prisma.$queryRawUnsafe(
  `SELECT tablename FROM pg_tables WHERE schemaname = '${schema}' AND tablename <> '_prisma_migrations'`
);

if (rows.length === 0) {
  console.log(`No tables found in ${schema}. Nothing to truncate.`);
} else {
  const quoted = rows.map((row) => `"${schema}"."${row.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
  console.log(`Truncated ${rows.length} tables in ${schema}.`);
}

await prisma.$disconnect();
