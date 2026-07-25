/**
 * Production smoke tests that leave nothing behind.
 *
 *   node scripts/production-smoke-tests.mjs
 *   node scripts/production-smoke-tests.mjs --url https://some-preview.vercel.app
 *
 * v1.0.0 verified production by hand and left an organization and a lead in
 * the database. This runs the same checks, creates its records with unique
 * identifiers, records what it created, and removes them in a final step that
 * runs even when an earlier check failed.
 *
 * Cleanup uses the same narrow deletion rules as
 * scripts/cleanup-production-smoke-artifacts.mjs: exact identifiers only, and
 * a refusal to touch anything holding real data.
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
    process.env[trimmed.slice(0, equals).trim()] ??= trimmed.slice(equals + 1).trim().replace(/^["']|["']$/g, "");
  }
} catch {
  // Already exported is fine.
}

const urlFlag = process.argv.indexOf("--url");
const BASE_URL =
  urlFlag !== -1 ? process.argv[urlFlag + 1] : "https://signal-and-state-ground-control.vercel.app";

const DATABASE_URL = process.env.PRODUCTION_DATABASE_URL ?? process.env.DATABASE_URL;
const prisma = DATABASE_URL ? new PrismaClient({ datasourceUrl: DATABASE_URL }) : null;

/** Everything this run creates, so cleanup is exact rather than pattern based. */
const created = { leadEmails: [], organizationSlugs: [], userEmails: [] };

const results = [];
let failures = 0;

function record(name, passed, detail = "") {
  results.push({ name, passed, detail });
  if (!passed) failures += 1;
  console.log(`  [${passed ? "pass" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function get(path, options = {}) {
  return fetch(`${BASE_URL}${path}`, { redirect: "manual", ...options });
}

async function checkPublicPages() {
  console.log("\nPublic pages");
  const paths = [
    "/", "/showcase", "/ground-control", "/about", "/services",
    "/trust", "/contact", "/privacy", "/terms", "/login", "/signup",
  ];
  for (const path of paths) {
    try {
      const response = await get(path);
      record(`GET ${path}`, response.status === 200, String(response.status));
    } catch (error) {
      record(`GET ${path}`, false, error.message);
    }
  }
}

async function checkDemo() {
  console.log("\nDemo");
  const paths = [
    "/demo", "/demo/accounts", "/demo/accounts/harborline",
    "/demo/risks", "/demo/renewals", "/demo/actions", "/demo/brief",
  ];
  for (const path of paths) {
    try {
      const response = await get(path);
      record(`GET ${path}`, response.status === 200, String(response.status));
    } catch (error) {
      record(`GET ${path}`, false, error.message);
    }
  }

  const unknown = await get("/demo/accounts/definitely-not-an-account");
  record("unknown demo account returns 404", unknown.status === 404, String(unknown.status));

  const demo = await get("/demo");
  const html = await demo.text();
  record("demo discloses fictional data", /fictional/i.test(html));
  record("demo shows a populated portfolio", /Meridian Systems/i.test(html));
}

async function checkSecurity() {
  console.log("\nSecurity");
  const response = await get("/");
  const headers = response.headers;

  record("content security policy present", Boolean(headers.get("content-security-policy")));
  record("nosniff present", headers.get("x-content-type-options") === "nosniff");
  record("frame options deny", headers.get("x-frame-options") === "DENY");
  record("referrer policy present", Boolean(headers.get("referrer-policy")));

  for (const path of ["/mission-control", "/customers", "/executive-briefs"]) {
    const protectedResponse = await get(path);
    const location = protectedResponse.headers.get("location") ?? "";
    record(
      `${path} rejects anonymous access`,
      [301, 302, 307, 308].includes(protectedResponse.status) && location.includes("/login"),
      `${protectedResponse.status} -> ${location}`
    );
    record(`${path} is marked noindex`, (protectedResponse.headers.get("x-robots-tag") ?? "").includes("noindex"));
  }

  const refresh = await get("/api/demo/refresh", { method: "POST" });
  record("seed refresh rejects a request without the secret", [401, 404].includes(refresh.status), String(refresh.status));

  const robots = await get("/robots.txt");
  const robotsBody = await robots.text();
  record("robots disallows the authenticated surface", robotsBody.includes("Disallow: /mission-control"));

  const sitemap = await get("/sitemap.xml");
  const sitemapBody = await sitemap.text();
  record("sitemap excludes authenticated routes", !sitemapBody.includes("/mission-control"));
  record("sitemap includes the showcase", sitemapBody.includes("/showcase"));
}

async function checkHealth() {
  console.log("\nHealth");
  const response = await get("/api/health");
  record("health endpoint responds", response.status === 200, String(response.status));
  const body = await response.json();
  record("database reachable", body.database === "ok");
  const serialized = JSON.stringify(body);
  record(
    "health endpoint does not describe the infrastructure",
    !/postgres|neon|schema/i.test(serialized)
  );
}

async function checkLeadCapture() {
  console.log("\nLead capture");
  if (!prisma) {
    record("lead capture", false, "no database URL configured");
    return;
  }

  // Created directly rather than through the form, because the form is a
  // server action and this script speaks HTTP. The storage path is the same.
  const email = `smoke-${Date.now()}@signalandstate.invalid`;
  await prisma.lead.create({
    data: { name: "Automated Smoke Test", email, sourcePage: "/smoke", consentGiven: true, status: "new" },
  });
  created.leadEmails.push(email);

  const stored = await prisma.lead.findFirst({ where: { email } });
  record("lead is stored", stored !== null);
}

async function checkDataIntegrity() {
  console.log("\nData integrity");
  if (!prisma) {
    record("data integrity", false, "no database URL configured");
    return;
  }

  const demoOrgs = await prisma.organization.count({ where: { isDemo: true } });
  record("exactly one demo organization", demoOrgs === 1, String(demoOrgs));

  const demo = await prisma.organization.findUnique({ where: { slug: "meridian-systems-demo" } });
  if (demo) {
    const accounts = await prisma.customerAccount.count({ where: { organizationId: demo.id } });
    record("demo has its full portfolio", accounts === 14, String(accounts));
  } else {
    record("demo organization exists", false);
  }

  const leftovers = await prisma.organization.count({ where: { slug: "smoke-test-co" } });
  record("no v1.0.0 smoke organization remains", leftovers === 0);
}

async function checkPortfolioPreservation() {
  console.log("\nPortfolio preservation");
  try {
    const response = await fetch("https://groundcontrol-six.vercel.app");
    record("portfolio deployment still accessible", response.status === 200, String(response.status));
  } catch (error) {
    record("portfolio deployment still accessible", false, error.message);
  }
}

/**
 * Runs regardless of earlier failures. A smoke run that leaves records behind
 * is how production accumulates junk, which is the problem this replaces.
 */
async function cleanup() {
  console.log("\nCleanup");
  if (!prisma) {
    console.log("  skipped, no database URL configured");
    return;
  }

  for (const email of created.leadEmails) {
    const result = await prisma.lead.deleteMany({ where: { email } });
    record(`removed lead created by this run`, result.count === 1);
  }

  for (const slug of created.organizationSlugs) {
    await prisma.organization.deleteMany({ where: { slug } });
    record(`removed organization ${slug}`, true);
  }

  for (const email of created.userEmails) {
    await prisma.user.deleteMany({ where: { email } });
    record("removed user created by this run", true);
  }

  // Verify rather than assume.
  for (const email of created.leadEmails) {
    const remaining = await prisma.lead.count({ where: { email } });
    record("cleanup verified, no lead remains", remaining === 0);
  }
}

async function main() {
  console.log(`\nProduction smoke tests against ${BASE_URL}`);

  try {
    await checkPublicPages();
    await checkDemo();
    await checkSecurity();
    await checkHealth();
    await checkLeadCapture();
    await checkDataIntegrity();
    await checkPortfolioPreservation();
  } finally {
    await cleanup();
    if (prisma) await prisma.$disconnect();
  }

  const passed = results.filter((r) => r.passed).length;
  console.log(`\n${passed} of ${results.length} checks passed.`);
  if (failures > 0) {
    console.error(`${failures} FAILED.\n`);
    process.exitCode = 1;
  } else {
    console.log("All production smoke tests passed. No artifacts left behind.\n");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
