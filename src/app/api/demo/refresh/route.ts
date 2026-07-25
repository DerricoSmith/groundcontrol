import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalculateOrganizationHealth } from "@/lib/services/health-calculation-service";
import { evaluateOrganizationRisks } from "@/lib/services/risk-engine";
import { detectDataQualityIssues } from "@/lib/services/data-quality-service";
import { generateSuggestedActions } from "@/lib/services/action-service";
import { generatePreviewBrief } from "@/lib/services/executive-brief-service";
import { DEMO_ORGANIZATION_SLUG } from "@/lib/demo/demo-config";

export const dynamic = "force-dynamic";

/**
 * Runs the deterministic intelligence pipeline over the demo organization.
 *
 * The seed script writes raw records; this turns them into health scores,
 * risks, actions, data quality issues, and a brief. It exists as a route
 * rather than a script because those are TypeScript services that expect the
 * application's module graph.
 *
 * Three constraints make this safe to expose:
 *  - It requires SEED_SECRET, which only the deploy operator holds.
 *  - It refuses to run against any organization that is not the demo
 *    organization, so it can never recalculate a real customer's data.
 *  - Everything it does is idempotent and derived, so running it twice is
 *    indistinguishable from running it once.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Seeding is not enabled in this environment." }, { status: 404 });
  }

  const provided = request.headers.get("x-seed-secret");
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: DEMO_ORGANIZATION_SLUG },
    select: { id: true, isDemo: true },
  });

  if (!organization) {
    return NextResponse.json({ error: "Demo organization not found. Run the seed first." }, { status: 404 });
  }

  // Belt and braces: the slug lookup already scopes this, but an organization
  // that is not flagged as demo must never be recalculated by a public route.
  if (!organization.isDemo) {
    return NextResponse.json({ error: "Refusing to operate on a non-demo organization." }, { status: 400 });
  }

  const owner = await prisma.membership.findFirst({
    where: { organizationId: organization.id, role: "OWNER" },
    select: { userId: true },
  });
  if (!owner) {
    return NextResponse.json({ error: "Demo organization has no owner." }, { status: 500 });
  }

  const accountsScored = await recalculateOrganizationHealth(organization.id);

  const risks = await evaluateOrganizationRisks({
    organizationId: organization.id,
    actingUserId: owner.userId,
    actingRole: "OWNER",
  });

  const dataQuality = await detectDataQualityIssues({
    organizationId: organization.id,
    actingUserId: owner.userId,
    actingRole: "OWNER",
  });

  const actions = await generateSuggestedActions({
    organizationId: organization.id,
    actingUserId: owner.userId,
    actingRole: "OWNER",
  });

  // One brief, replaced rather than appended, so the demo always shows a
  // current brief instead of accumulating one per deploy.
  await prisma.executiveBrief.deleteMany({ where: { organizationId: organization.id } });
  const brief = await generatePreviewBrief({
    organizationId: organization.id,
    actingUserId: owner.userId,
    actingRole: "OWNER",
    periodLabel: "Current",
  });

  return NextResponse.json({
    ok: true,
    accountsScored,
    risksCreated: risks.risksCreated,
    risksUpdated: risks.risksUpdated,
    dataQualityIssues: dataQuality.detected,
    suggestedActions: actions.created,
    briefSections: brief.sections.length,
  });
}
