/**
 * Fails when Preview and Production resolve to the same database.
 *
 *   node scripts/verify-database-separation.mjs
 *
 * The v1.0.0 release shipped with Preview sharing the Production database,
 * which meant a preview branch build could write to live data. This check
 * exists so that regression cannot happen silently again.
 *
 * It compares redacted targets only. Connection strings are never printed,
 * logged, or written to a file, because this runs in contexts whose output
 * gets pasted into issues and reports.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

/**
 * Reduces a connection string to the parts that determine which data it
 * reaches: host, database, and schema. Credentials are dropped entirely.
 */
function describeTarget(url) {
  try {
    const parsed = new URL(url);
    const schema = parsed.searchParams.get("schema") ?? "public";
    return {
      host: parsed.hostname,
      database: parsed.pathname.replace(/^\//, ""),
      schema,
      fingerprint: `${parsed.hostname}/${parsed.pathname.replace(/^\//, "")}#${schema}`,
    };
  } catch {
    return null;
  }
}

const targets = [
  ["Production", process.env.PRODUCTION_DATABASE_URL ?? process.env.DATABASE_URL],
  ["Preview", process.env.PREVIEW_DATABASE_URL],
  ["Test", process.env.TEST_DATABASE_URL],
  ["End-to-end", process.env.E2E_DATABASE_URL],
];

const described = [];
const failures = [];

console.log("\nDatabase targets (credentials omitted)\n");

for (const [name, url] of targets) {
  if (!url) {
    console.log(`  ${name.padEnd(12)} not configured`);
    continue;
  }
  const target = describeTarget(url);
  if (!target) {
    console.log(`  ${name.padEnd(12)} UNPARSEABLE`);
    failures.push(`${name} connection string could not be parsed`);
    continue;
  }
  console.log(`  ${name.padEnd(12)} ${target.host} / ${target.database} / schema=${target.schema}`);
  described.push({ name, ...target });
}

console.log("\nSeparation checks\n");

function check(label, passed, detail = "") {
  console.log(`  [${passed ? "pass" : "FAIL"}] ${label}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures.push(label);
}

// Every configured environment must land somewhere different. Two environments
// sharing a fingerprint means they share tables.
const seen = new Map();
for (const target of described) {
  const existing = seen.get(target.fingerprint);
  check(
    `${target.name} has its own database target`,
    existing === undefined,
    existing ? `collides with ${existing}` : target.fingerprint
  );
  if (existing === undefined) seen.set(target.fingerprint, target.name);
}

// The one that matters most, stated explicitly so it appears in any log.
const production = described.find((t) => t.name === "Production");
const preview = described.find((t) => t.name === "Preview");
if (production && preview) {
  check(
    "Preview and Production do not share a database target",
    production.fingerprint !== preview.fingerprint
  );
  check(
    "Production uses a schema Preview does not",
    production.schema !== preview.schema,
    `production=${production.schema} preview=${preview.schema}`
  );
}

// A test suite pointed at production would truncate it on the first reset.
for (const target of described.filter((t) => t.name === "Test" || t.name === "End-to-end")) {
  check(
    `${target.name} targets a dedicated test schema`,
    /^gc_(test|e2e)$/.test(target.schema),
    target.schema
  );
}

if (failures.length > 0) {
  console.error(`\n${failures.length} separation check(s) FAILED.\n`);
  process.exitCode = 1;
} else {
  console.log("\nAll database separation checks passed.\n");
}
