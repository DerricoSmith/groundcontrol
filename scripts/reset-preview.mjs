/**
 * Drops and recreates the preview schema, then leaves it ready for migrations.
 *
 *   node scripts/reset-preview.mjs --confirm
 *
 * Preview is disposable by design. Production is not, so this refuses to run
 * against anything that is not explicitly the preview schema: the connection
 * string must carry `schema=gc_preview`, and the DROP is scoped to that schema
 * by name. There is no code path here that can reach the production `public`
 * schema.
 *
 * After running this, apply migrations and reseed:
 *
 *   node scripts/with-db.mjs PREVIEW_DATABASE_URL prisma migrate deploy
 *   node scripts/with-db.mjs PREVIEW_DATABASE_URL node scripts/seed-demo-org.mjs
 */
import { PrismaClient } from "@prisma/client";
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

const PREVIEW_SCHEMA = "gc_preview";
const url = process.env.PREVIEW_DATABASE_URL ?? process.env.DATABASE_URL;

if (!url) {
  console.error("Set PREVIEW_DATABASE_URL (or DATABASE_URL) to the preview connection string.");
  process.exit(1);
}

if (!new RegExp(`[?&]schema=${PREVIEW_SCHEMA}\\b`).test(url)) {
  console.error(`Refusing to run: the connection string does not target the ${PREVIEW_SCHEMA} schema.`);
  process.exit(1);
}

if (!process.argv.includes("--confirm")) {
  console.log(`Dry run. This would DROP and recreate the "${PREVIEW_SCHEMA}" schema.`);
  console.log("Pass --confirm to proceed. Production is never a valid target for this script.");
  process.exit(0);
}

const prisma = new PrismaClient({ datasourceUrl: url });

try {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${PREVIEW_SCHEMA}" CASCADE`);
  await prisma.$executeRawUnsafe(`CREATE SCHEMA "${PREVIEW_SCHEMA}"`);
  console.log(`Recreated the "${PREVIEW_SCHEMA}" schema. Apply migrations next.`);
} finally {
  await prisma.$disconnect();
}
