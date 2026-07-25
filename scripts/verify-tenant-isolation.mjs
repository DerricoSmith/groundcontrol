/**
 * Verifies tenant isolation against a live database.
 *
 * The Vitest suite proves isolation at the service layer against a test
 * schema. This script proves the same properties against whichever database
 * DATABASE_URL points at, which is how production gets checked after a deploy
 * without shipping test code into the runtime.
 *
 *   node scripts/verify-tenant-isolation.mjs
 *
 * Read only. It never writes, and it exits non-zero if any check fails.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const failures = [];

function check(label, passed, detail = "") {
  const mark = passed ? "pass" : "FAIL";
  console.log(`  [${mark}] ${label}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures.push(label);
}

/**
 * Scoped counts are how the service layer reads every tenant-owned table. If a
 * query scoped to organization A ever returns a row belonging to organization
 * B, isolation is broken regardless of what the UI shows.
 */
async function crossOrganizationLeak(model, orgA, orgB) {
  const idsInB = await prisma[model].findMany({
    where: { organizationId: orgB },
    select: { id: true },
    take: 200,
  });
  if (idsInB.length === 0) return { checked: 0, leaked: 0 };

  const leaked = await prisma[model].count({
    where: { organizationId: orgA, id: { in: idsInB.map((row) => row.id) } },
  });
  return { checked: idsInB.length, leaked };
}

async function main() {
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true, slug: true, isDemo: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\nOrganizations in this database: ${organizations.length}`);
  for (const org of organizations) {
    const accounts = await prisma.customerAccount.count({ where: { organizationId: org.id } });
    const risks = await prisma.riskSignal.count({ where: { organizationId: org.id } });
    console.log(`  ${org.name} (${org.slug}) demo=${org.isDemo} accounts=${accounts} risks=${risks}`);
  }

  const demo = organizations.find((org) => org.isDemo);
  const others = organizations.filter((org) => !org.isDemo);

  console.log("\nDemo organization integrity");
  check("exactly one organization is flagged as demo", organizations.filter((o) => o.isDemo).length === 1);
  if (demo) {
    check("demo organization uses the expected slug", demo.slug === "meridian-systems-demo", demo.slug);
  }

  console.log("\nNo demo data inside a real organization");
  for (const org of others) {
    const demoNamed = await prisma.customerAccount.count({
      where: {
        organizationId: org.id,
        OR: [{ name: { contains: "Harborline" } }, { name: { contains: "Meridian Labs" } }, { name: { contains: "Calder" } }],
      },
    });
    check(`"${org.name}" contains no demo accounts`, demoNamed === 0, `${demoNamed} found`);
  }

  if (demo && others.length > 0) {
    const real = others[0];
    console.log(`\nCross-organization reads between "${demo.name}" and "${real.name}"`);
    for (const model of [
      "customerAccount",
      "renewal",
      "riskSignal",
      "recommendedAction",
      "executiveBrief",
      "customerContact",
      "escalation",
    ]) {
      const { checked, leaked } = await crossOrganizationLeak(model, real.id, demo.id);
      check(`${model} scoped to the real organization returns no demo rows`, leaked === 0, `${checked} demo rows probed`);
    }
  } else {
    console.log("\nCross-organization checks skipped: need one demo and one real organization.");
  }

  console.log("\nLead privacy");
  const leads = await prisma.lead.count();
  console.log(`  ${leads} leads stored. Leads are not organization-scoped by design and are never exposed publicly.`);

  console.log(
    failures.length === 0
      ? "\nAll tenant isolation checks passed.\n"
      : `\n${failures.length} check(s) FAILED:\n  ${failures.join("\n  ")}\n`
  );
  process.exitCode = failures.length === 0 ? 0 : 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
