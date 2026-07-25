/**
 * Removes the specific fictional smoke test artifacts created while verifying
 * the v1.0.0 release.
 *
 *   node scripts/cleanup-production-smoke-artifacts.mjs            # dry run
 *   node scripts/cleanup-production-smoke-artifacts.mjs --confirm  # delete
 *
 * Deliberately narrow. It matches two exact identifiers and nothing else:
 *
 *   Organization slug  smoke-test-co
 *   Lead email         smoke-test@signalandstate.invalid
 *
 * Design constraints, all of which exist because this runs against production:
 *
 *   - Exact match only. No LIKE, no prefix, no "contains". A partial match
 *     could catch a real customer whose name happens to include the word.
 *   - Refuses to run if a target organization holds data a real customer would
 *     have. A smoke artifact has no imported accounts; if one does, it is not
 *     what this script thinks it is and a human should look.
 *   - Never touches the demo organization or any organization not on the list.
 *   - Idempotent. Running it twice is running it once.
 *   - Dry run by default. Deletion requires --confirm.
 *   - Prints identifiers and counts, never emails in full or any secret.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** The only records this script will ever consider. */
const TARGET_ORGANIZATION_SLUGS = ["smoke-test-co"];
const TARGET_LEAD_EMAILS = ["smoke-test@signalandstate.invalid"];

const confirmed = process.argv.includes("--confirm");

/** Emails are masked in output so a log or screenshot never leaks one. */
function maskEmail(email) {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 2)}***@${domain}`;
}

async function main() {
  console.log(confirmed ? "\nMode: DELETE\n" : "\nMode: dry run. Pass --confirm to delete.\n");

  const organizations = await prisma.organization.findMany({
    where: { slug: { in: TARGET_ORGANIZATION_SLUGS } },
    select: { id: true, name: true, slug: true, isDemo: true },
  });

  const leads = await prisma.lead.findMany({
    where: { email: { in: TARGET_LEAD_EMAILS } },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (organizations.length === 0 && leads.length === 0) {
    console.log("No smoke test artifacts found. Nothing to do.\n");
    return;
  }

  let refuse = false;

  console.log(`Organizations matched: ${organizations.length}`);
  for (const org of organizations) {
    const [accounts, members, imports, audits] = await Promise.all([
      prisma.customerAccount.count({ where: { organizationId: org.id } }),
      prisma.membership.count({ where: { organizationId: org.id } }),
      prisma.importJob.count({ where: { organizationId: org.id } }),
      prisma.auditEvent.count({ where: { organizationId: org.id } }),
    ]);

    console.log(`  ${org.slug}  id=${org.id}`);
    console.log(`    accounts=${accounts} memberships=${members} imports=${imports} auditEvents=${audits}`);

    // A smoke artifact is an empty shell. Anything that looks like real usage
    // means the assumption behind this script is wrong for that row.
    if (org.isDemo) {
      console.log("    REFUSING: this organization is flagged as demo data.");
      refuse = true;
    }
    if (accounts > 0 || imports > 0) {
      console.log("    REFUSING: this organization holds imported customer data.");
      refuse = true;
    }
    if (members > 1) {
      console.log("    REFUSING: more than one member, which a smoke artifact never has.");
      refuse = true;
    }
  }

  console.log(`\nLeads matched: ${leads.length}`);
  for (const lead of leads) {
    console.log(`  ${maskEmail(lead.email)}  id=${lead.id}  created=${lead.createdAt.toISOString()}`);
  }

  // The users behind a smoke organization are removed with it, but only when
  // that user belongs to no other organization. A shared account is left alone.
  const usersToRemove = [];
  for (const org of organizations) {
    const memberships = await prisma.membership.findMany({
      where: { organizationId: org.id },
      select: { userId: true, user: { select: { email: true } } },
    });
    for (const membership of memberships) {
      const otherMemberships = await prisma.membership.count({
        where: { userId: membership.userId, organizationId: { not: org.id } },
      });
      if (otherMemberships === 0) {
        usersToRemove.push({ id: membership.userId, email: membership.user.email });
      } else {
        console.log(`  Keeping user ${maskEmail(membership.user.email)}: belongs to other organizations.`);
      }
    }
  }

  console.log(`\nUsers that would be removed with their organization: ${usersToRemove.length}`);
  for (const user of usersToRemove) console.log(`  ${maskEmail(user.email)}  id=${user.id}`);

  if (refuse) {
    console.error("\nRefusing to delete. One or more matches do not look like smoke artifacts.\n");
    process.exitCode = 1;
    return;
  }

  if (!confirmed) {
    console.log("\nDry run complete. Nothing was deleted. Pass --confirm to proceed.\n");
    return;
  }

  for (const org of organizations) {
    // Audit events carry a nullable actor and are retained for security
    // history; deleting the organization cascades its own rows only.
    await prisma.organization.delete({ where: { id: org.id } });
    console.log(`Deleted organization ${org.slug}.`);
  }

  for (const user of usersToRemove) {
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`Deleted user ${maskEmail(user.email)}.`);
  }

  if (leads.length > 0) {
    const result = await prisma.lead.deleteMany({ where: { email: { in: TARGET_LEAD_EMAILS } } });
    console.log(`Deleted ${result.count} lead(s).`);
  }

  // Verify rather than assume.
  const remainingOrgs = await prisma.organization.count({ where: { slug: { in: TARGET_ORGANIZATION_SLUGS } } });
  const remainingLeads = await prisma.lead.count({ where: { email: { in: TARGET_LEAD_EMAILS } } });

  if (remainingOrgs > 0 || remainingLeads > 0) {
    console.error(`\nVERIFICATION FAILED: ${remainingOrgs} organizations and ${remainingLeads} leads remain.\n`);
    process.exitCode = 1;
    return;
  }

  console.log("\nVerified: no smoke test artifacts remain.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
