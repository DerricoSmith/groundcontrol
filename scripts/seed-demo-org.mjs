/**
 * Idempotent demo organization seed. Safe to run against production.
 *
 * Creates one clearly labeled fictional organization so the public demo, the
 * showcase screenshots, and local development all work without any real
 * customer's data. Every record is invented.
 *
 *   npm run seed:demo
 *
 * Safety properties, all of which are relied on by PRODUCTION_SEED.md:
 *
 *  - Idempotent. Every record is upserted on a stable identifier, so running
 *    it twice changes nothing and creates no duplicates.
 *  - Scoped. It only ever touches the organization whose slug is DEMO_SLUG,
 *    and that organization carries isDemo = true.
 *  - Non-destructive. It never drops, resets, or truncates anything, and it
 *    never touches an organization it did not create.
 *  - No privileged credential. The public demo is read-only and server
 *    rendered, so no shared demo password exists to leak.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const DEMO_SLUG = "meridian-systems-demo";
const DEMO_OWNER_EMAIL = "operator@meridian-systems.demo";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const daysAgo = (days) => new Date(now - days * DAY);
const daysAhead = (days) => new Date(now + days * DAY);

/**
 * Fourteen accounts, each of which exists to carry one of the required
 * demonstration scenarios. Nothing here is filler: if an account is in this
 * list, a visitor should be able to open it and learn something specific.
 */
const ACCOUNTS = [
  {
    key: "harborline",
    name: "Harborline Freight",
    scenario: "High revenue, usage collapsing, urgent tickets open, renewal approaching",
    segment: "Mid-market",
    tier: "Tier 1",
    lifecycleStage: "renewal",
    arr: 240000,
    renewalInDays: 54,
    owned: true,
    usage: [
      { start: 60, end: 31, activeUsers: 180, licensed: 220, lastActive: 34 },
      { start: 30, end: 1, activeUsers: 96, licensed: 220, lastActive: 4 },
    ],
    tickets: [
      { subject: "Nightly sync failing", priority: "URGENT", status: "OPEN", opened: 12, reopens: 2 },
      { subject: "Export timing out", priority: "HIGH", status: "OPEN", opened: 7 },
      { subject: "Permission error on new seats", priority: "NORMAL", status: "SOLVED", opened: 40, resolution: 2400 },
    ],
    interactions: [
      { type: "BUSINESS_REVIEW", ago: 132, sentiment: "NEUTRAL", exec: true, summary: "Quarterly business review with the operations VP." },
      { type: "SUPPORT_INTERACTION", ago: 9, sentiment: "NEGATIVE", summary: "Escalation call about the failing nightly sync." },
    ],
    contacts: [
      { name: "Dana Whitfield", title: "VP Operations", roles: ["EXECUTIVE_SPONSOR"] },
      { name: "Miguel Torres", title: "Operations Manager", roles: ["CHAMPION", "DAY_TO_DAY_CONTACT"] },
    ],
    escalation: {
      title: "Nightly data sync has failed for twelve days",
      category: "PRODUCT",
      severity: "HIGH",
      description:
        "Scheduled overnight syncs have failed since the June platform release. The dispatch team is reconciling manually every morning.",
      impact: "Two hours of manual reconciliation per day for the dispatch team.",
    },
  },
  {
    key: "calder",
    name: "Calder Manufacturing",
    scenario: "Healthy, increasing adoption, expansion potential",
    segment: "Enterprise",
    tier: "Tier 1",
    lifecycleStage: "adopted",
    arr: 410000,
    renewalInDays: 210,
    owned: true,
    usage: [
      { start: 60, end: 31, activeUsers: 320, licensed: 400, lastActive: 33 },
      { start: 30, end: 1, activeUsers: 372, licensed: 400, lastActive: 1 },
    ],
    tickets: [{ subject: "Feature question on batch imports", priority: "LOW", status: "SOLVED", opened: 22, resolution: 300, csat: 5 }],
    interactions: [
      { type: "EXECUTIVE_MEETING", ago: 21, sentiment: "POSITIVE", exec: true, summary: "Roadmap session with the COO." },
      { type: "CUSTOMER_MEETING", ago: 6, sentiment: "POSITIVE", champion: true, summary: "Working session on the new plant rollout." },
    ],
    contacts: [
      { name: "Ruth Okonkwo", title: "COO", roles: ["EXECUTIVE_SPONSOR"] },
      { name: "Ben Marsh", title: "Plant Systems Lead", roles: ["CHAMPION"] },
    ],
  },
  {
    key: "solace",
    name: "Solace Health Group",
    scenario: "Champion departed, no replacement identified",
    segment: "Enterprise",
    tier: "Tier 1",
    lifecycleStage: "adopted",
    arr: 305000,
    renewalInDays: 120,
    owned: true,
    usage: [
      { start: 60, end: 31, activeUsers: 210, licensed: 260, lastActive: 32 },
      { start: 30, end: 1, activeUsers: 188, licensed: 260, lastActive: 3 },
    ],
    tickets: [{ subject: "Access review for departing staff", priority: "NORMAL", status: "SOLVED", opened: 20, resolution: 900 }],
    interactions: [
      { type: "CUSTOMER_MEETING", ago: 52, sentiment: "NEUTRAL", summary: "Handover discussion after the champion's departure." },
    ],
    contacts: [
      { name: "Alan Reyes", title: "Director of Clinical Ops", roles: ["CHAMPION"], departedDaysAgo: 18 },
      { name: "Nina Castellanos", title: "Systems Analyst", roles: ["DAY_TO_DAY_CONTACT"] },
    ],
  },
  {
    key: "vantage",
    name: "Vantage Logistics",
    scenario: "Strong usage, weak executive sponsor engagement",
    segment: "Mid-market",
    tier: "Tier 2",
    lifecycleStage: "adopted",
    arr: 158000,
    renewalInDays: 165,
    owned: true,
    usage: [
      { start: 60, end: 31, activeUsers: 140, licensed: 160, lastActive: 31 },
      { start: 30, end: 1, activeUsers: 149, licensed: 160, lastActive: 2 },
    ],
    tickets: [],
    interactions: [
      { type: "CUSTOMER_MEETING", ago: 14, sentiment: "POSITIVE", champion: true, summary: "Weekly working session with the ops team." },
      { type: "EXECUTIVE_MEETING", ago: 205, sentiment: "NEUTRAL", exec: true, summary: "Annual planning session with the CFO." },
    ],
    contacts: [
      { name: "Priya Raman", title: "Head of Logistics", roles: ["CHAMPION", "DAY_TO_DAY_CONTACT"] },
      { name: "Thomas Reid", title: "CFO", roles: ["EXECUTIVE_SPONSOR"] },
    ],
  },
  {
    key: "brightpath",
    name: "Brightpath Education",
    scenario: "Recovering account, previously at risk",
    segment: "Mid-market",
    tier: "Tier 2",
    lifecycleStage: "adopted",
    arr: 121000,
    renewalInDays: 240,
    owned: true,
    usage: [
      { start: 60, end: 31, activeUsers: 62, licensed: 150, lastActive: 33 },
      { start: 30, end: 1, activeUsers: 108, licensed: 150, lastActive: 1 },
    ],
    tickets: [
      { subject: "Onboarding gaps in reporting", priority: "HIGH", status: "SOLVED", opened: 65, resolution: 4800, csat: 4 },
      { subject: "Training request for new cohort", priority: "LOW", status: "SOLVED", opened: 15, resolution: 600, csat: 5 },
    ],
    interactions: [
      { type: "BUSINESS_REVIEW", ago: 30, sentiment: "POSITIVE", exec: true, summary: "Recovery review. Adoption plan is working." },
      { type: "TRAINING", ago: 12, sentiment: "POSITIVE", champion: true, summary: "Enablement session for the autumn cohort." },
    ],
    contacts: [
      { name: "Grace Adeyemi", title: "VP Student Systems", roles: ["EXECUTIVE_SPONSOR"] },
      { name: "Owen Fletcher", title: "Programme Manager", roles: ["CHAMPION"] },
    ],
  },
  {
    key: "northgate",
    name: "Northgate Legal",
    scenario: "Concentrated product feedback affecting meaningful revenue",
    segment: "SMB",
    tier: "Tier 3",
    lifecycleStage: "adopted",
    arr: 42000,
    renewalInDays: 300,
    owned: true,
    usage: [
      { start: 60, end: 31, activeUsers: 28, licensed: 35, lastActive: 32 },
      { start: 30, end: 1, activeUsers: 27, licensed: 35, lastActive: 2 },
    ],
    tickets: [
      { subject: "Document versioning is confusing", priority: "NORMAL", status: "OPEN", opened: 18 },
      { subject: "Request: bulk redaction", priority: "LOW", status: "OPEN", opened: 30 },
    ],
    interactions: [{ type: "CUSTOMER_MEETING", ago: 30, sentiment: "MIXED", champion: true, summary: "Monthly check-in. Repeated feedback on document versioning." }],
    contacts: [{ name: "Helen Voss", title: "Practice Manager", roles: ["CHAMPION", "DAY_TO_DAY_CONTACT"] }],
  },
  {
    key: "atlas",
    name: "Atlas Financial Partners",
    scenario: "Highly satisfied reference candidate",
    segment: "Enterprise",
    tier: "Tier 1",
    lifecycleStage: "advocate",
    arr: 368000,
    renewalInDays: 275,
    owned: true,
    usage: [
      { start: 60, end: 31, activeUsers: 290, licensed: 320, lastActive: 32 },
      { start: 30, end: 1, activeUsers: 311, licensed: 320, lastActive: 1 },
    ],
    tickets: [{ subject: "Quarterly audit export", priority: "NORMAL", status: "SOLVED", opened: 25, resolution: 420, csat: 5 }],
    interactions: [
      { type: "EXECUTIVE_MEETING", ago: 18, sentiment: "POSITIVE", exec: true, summary: "Executive review. Offered to act as a reference." },
      { type: "BUSINESS_REVIEW", ago: 45, sentiment: "POSITIVE", champion: true, summary: "Strong quarterly results presented back." },
    ],
    contacts: [
      { name: "Marcus Hale", title: "Managing Director", roles: ["EXECUTIVE_SPONSOR"] },
      { name: "Simone Beck", title: "Operations Lead", roles: ["CHAMPION"] },
    ],
  },
  {
    key: "trellis",
    name: "Trellis Health",
    scenario: "Renewal close, nobody engaged, no champion recorded",
    segment: "Mid-market",
    tier: "Tier 2",
    lifecycleStage: "onboarding",
    arr: 96000,
    renewalInDays: 22,
    owned: true,
    usage: [{ start: 30, end: 1, activeUsers: 12, licensed: 60, lastActive: 3 }],
    tickets: [{ subject: "Onboarding data mapping help", priority: "NORMAL", status: "OPEN", opened: 18 }],
    interactions: [{ type: "IMPLEMENTATION_SESSION", ago: 96, sentiment: "NEUTRAL", summary: "Initial configuration workshop." }],
    contacts: [{ name: "Alicia Fenn", title: "Clinical Systems Analyst", roles: ["DAY_TO_DAY_CONTACT"] }],
  },
  {
    key: "bastion",
    name: "Bastion Retail Group",
    scenario: "Missing renewal information and incomplete record",
    segment: "Enterprise",
    tier: "Tier 2",
    lifecycleStage: null,
    arr: 0,
    renewalInDays: null,
    owned: false,
    usage: [],
    tickets: [],
    interactions: [],
    contacts: [],
  },
  {
    key: "kestrel",
    name: "Kestrel Media",
    scenario: "Stale customer information, nothing recorded for months",
    segment: "Mid-market",
    tier: "Tier 3",
    lifecycleStage: "adopted",
    arr: 74000,
    renewalInDays: 88,
    owned: false,
    usage: [{ start: 150, end: 121, activeUsers: 44, licensed: 80, lastActive: 128 }],
    tickets: [],
    interactions: [{ type: "CUSTOMER_MEETING", ago: 210, sentiment: "NEUTRAL", summary: "Last recorded conversation with the account." }],
    contacts: [{ name: "Julian Ortiz", title: "Head of Digital", roles: ["DAY_TO_DAY_CONTACT"] }],
  },
  {
    key: "meridian-labs",
    name: "Meridian Labs",
    scenario: "Renewal plan exists but implementation risk is unresolved",
    segment: "Enterprise",
    tier: "Tier 1",
    lifecycleStage: "implementation",
    arr: 264000,
    renewalInDays: 76,
    owned: true,
    usage: [
      { start: 60, end: 31, activeUsers: 88, licensed: 240, lastActive: 33 },
      { start: 30, end: 1, activeUsers: 94, licensed: 240, lastActive: 2 },
    ],
    tickets: [
      { subject: "Data migration blocked on schema mapping", priority: "HIGH", status: "OPEN", opened: 34, reopens: 1 },
      { subject: "Sandbox environment unavailable", priority: "NORMAL", status: "PENDING", opened: 21 },
    ],
    interactions: [
      { type: "IMPLEMENTATION_SESSION", ago: 8, sentiment: "MIXED", summary: "Migration checkpoint. Schema mapping still unresolved." },
      { type: "RENEWAL_CONVERSATION", ago: 26, sentiment: "NEUTRAL", exec: true, summary: "Early renewal framing with the sponsor." },
    ],
    contacts: [
      { name: "Sofia Almeida", title: "VP Research Ops", roles: ["EXECUTIVE_SPONSOR"] },
      { name: "Dmitri Sokolov", title: "Data Engineering Lead", roles: ["CHAMPION"] },
    ],
    escalation: {
      title: "Data migration blocked five weeks into implementation",
      category: "IMPLEMENTATION",
      severity: "MODERATE",
      description:
        "Schema mapping for the legacy research system is unresolved, which is holding the migration and pushing the go-live date.",
      impact: "Go-live has slipped twice. The sponsor has asked for a revised plan.",
    },
    renewalPlan: true,
  },
  {
    key: "orchard",
    name: "Orchard Home Services",
    scenario: "Several overdue actions with no owner follow-through",
    segment: "SMB",
    tier: "Tier 3",
    lifecycleStage: "adopted",
    arr: 58000,
    renewalInDays: 140,
    owned: true,
    usage: [
      { start: 60, end: 31, activeUsers: 33, licensed: 50, lastActive: 32 },
      { start: 30, end: 1, activeUsers: 25, licensed: 50, lastActive: 6 },
    ],
    tickets: [{ subject: "Scheduling module questions", priority: "NORMAL", status: "OPEN", opened: 26 }],
    interactions: [{ type: "CUSTOMER_MEETING", ago: 62, sentiment: "MIXED", summary: "Adoption concerns raised by the operations lead." }],
    contacts: [{ name: "Rosa Lindqvist", title: "Operations Lead", roles: ["CHAMPION", "DAY_TO_DAY_CONTACT"] }],
    overdueActions: [
      { title: "Run an adoption review with the scheduling team.", type: "adoption_plan", dueDaysAgo: 21 },
      { title: "Confirm the executive sponsor for the coming renewal.", type: "stakeholder_mapping", dueDaysAgo: 12 },
      { title: "Close out the open scheduling questions with support.", type: "support_escalation", dueDaysAgo: 5 },
    ],
  },
  {
    key: "quarry",
    name: "Quarry Industrial",
    scenario: "Commercial concern, contraction signalled at renewal",
    segment: "Mid-market",
    tier: "Tier 2",
    lifecycleStage: "renewal",
    arr: 133000,
    renewalInDays: 41,
    owned: true,
    usage: [
      { start: 60, end: 31, activeUsers: 95, licensed: 140, lastActive: 32 },
      { start: 30, end: 1, activeUsers: 71, licensed: 140, lastActive: 4 },
    ],
    tickets: [{ subject: "Licence count reconciliation", priority: "NORMAL", status: "OPEN", opened: 16 }],
    interactions: [
      { type: "RENEWAL_CONVERSATION", ago: 11, sentiment: "MIXED", exec: true, summary: "Sponsor signalled budget pressure and possible seat reduction." },
    ],
    contacts: [
      { name: "Ian Beckett", title: "Finance Director", roles: ["EXECUTIVE_SPONSOR"] },
      { name: "Carla Mendes", title: "Site Systems Manager", roles: ["CHAMPION"] },
    ],
  },
  {
    key: "linden",
    name: "Linden Hospitality",
    scenario: "Steady mid-size account with no open concerns",
    segment: "Mid-market",
    tier: "Tier 2",
    lifecycleStage: "adopted",
    arr: 89000,
    renewalInDays: 190,
    owned: true,
    usage: [
      { start: 60, end: 31, activeUsers: 61, licensed: 75, lastActive: 32 },
      { start: 30, end: 1, activeUsers: 64, licensed: 75, lastActive: 2 },
    ],
    tickets: [{ subject: "Report formatting question", priority: "LOW", status: "SOLVED", opened: 28, resolution: 240, csat: 4 }],
    interactions: [
      { type: "CUSTOMER_MEETING", ago: 24, sentiment: "POSITIVE", champion: true, summary: "Routine check-in. Nothing outstanding." },
      { type: "BUSINESS_REVIEW", ago: 70, sentiment: "POSITIVE", exec: true, summary: "Half-year review with the GM." },
    ],
    contacts: [
      { name: "Aiko Tanaka", title: "General Manager", roles: ["EXECUTIVE_SPONSOR"] },
      { name: "Peter Nowak", title: "Revenue Systems Lead", roles: ["CHAMPION"] },
    ],
  },
];

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: DEMO_SLUG },
    update: { isDemo: true },
    create: {
      name: "Meridian Systems (Demo)",
      slug: DEMO_SLUG,
      isDemo: true,
    },
  });

  // The owner exists so accounts can carry an owner name in the UI. Its
  // password is random and discarded: the public demo never signs in, so there
  // is deliberately no shared credential to leak.
  const owner = await prisma.user.upsert({
    where: { email: DEMO_OWNER_EMAIL },
    update: {},
    create: {
      name: "Alex Morgan",
      email: DEMO_OWNER_EMAIL,
      passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
    },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: owner.id, organizationId: organization.id } },
    update: {},
    create: { userId: owner.id, organizationId: organization.id, role: "OWNER" },
  });

  await prisma.onboardingSession.upsert({
    where: { organizationId: organization.id },
    update: { status: "COMPLETED", completedAt: new Date() },
    create: {
      organizationId: organization.id,
      path: "QUICK_START",
      status: "COMPLETED",
      completedSteps: [],
      skippedSteps: [],
      goals: [],
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  let dataSource = await prisma.dataSource.findFirst({
    where: { organizationId: organization.id, label: "Demo data set" },
  });
  if (!dataSource) {
    dataSource = await prisma.dataSource.create({
      data: { organizationId: organization.id, kind: "CSV_IMPORT", label: "Demo data set" },
    });
  }

  for (const spec of ACCOUNTS) {
    // externalId is the stable identity that makes this whole script idempotent.
    const account = await prisma.customerAccount.upsert({
      where: { organizationId_externalId: { organizationId: organization.id, externalId: spec.key } },
      update: {
        name: spec.name,
        segment: spec.segment,
        tier: spec.tier,
        lifecycleStage: spec.lifecycleStage,
        arr: spec.arr,
        renewalDate: spec.renewalInDays === null ? null : daysAhead(spec.renewalInDays),
        ownerId: spec.owned ? owner.id : null,
      },
      create: {
        organizationId: organization.id,
        externalId: spec.key,
        name: spec.name,
        segment: spec.segment,
        tier: spec.tier,
        lifecycleStage: spec.lifecycleStage,
        arr: spec.arr,
        renewalDate: spec.renewalInDays === null ? null : daysAhead(spec.renewalInDays),
        ownerId: spec.owned ? owner.id : null,
        dataSourceId: dataSource.id,
      },
    });

    for (const [index, period] of spec.usage.entries()) {
      const periodStart = daysAgo(period.start);
      const periodEnd = daysAgo(period.end);
      const existing = await prisma.productUsageSummary.findFirst({
        where: { customerAccountId: account.id, externalId: `${spec.key}-u${index}` },
      });
      if (existing) continue;
      await prisma.productUsageSummary.create({
        data: {
          organizationId: organization.id,
          customerAccountId: account.id,
          externalId: `${spec.key}-u${index}`,
          periodStart,
          periodEnd,
          activeUsers: period.activeUsers,
          licensedUsers: period.licensed,
          seatUtilizationPercentage: Math.round((period.activeUsers / period.licensed) * 100),
          lastActiveAt: daysAgo(period.lastActive),
          sourceSystem: "demo",
        },
      });
    }

    for (const [index, ticket] of spec.tickets.entries()) {
      await prisma.supportTicket.upsert({
        where: { organizationId_externalTicketId: { organizationId: organization.id, externalTicketId: `${spec.key}-t${index}` } },
        update: {},
        create: {
          organizationId: organization.id,
          customerAccountId: account.id,
          externalTicketId: `${spec.key}-t${index}`,
          createdDate: daysAgo(ticket.opened),
          status: ticket.status,
          priority: ticket.priority,
          subject: ticket.subject,
          reopenCount: ticket.reopens ?? 0,
          resolutionMinutes: ticket.resolution ?? null,
          satisfactionScore: ticket.csat ?? null,
          sourceSystem: "demo",
        },
      });
    }

    for (const [index, contact] of spec.contacts.entries()) {
      const email = `${contact.name.toLowerCase().replace(/[^a-z]+/g, ".")}@${spec.key}.demo`;
      const existing = await prisma.customerContact.findFirst({
        where: { customerAccountId: account.id, email },
      });
      const data = {
        name: contact.name,
        title: contact.title,
        roles: contact.roles,
        isActive: !contact.departedDaysAgo,
        departedAt: contact.departedDaysAgo ? daysAgo(contact.departedDaysAgo) : null,
      };
      if (existing) {
        await prisma.customerContact.update({ where: { id: existing.id }, data });
      } else {
        await prisma.customerContact.create({
          data: { organizationId: organization.id, customerAccountId: account.id, email, ...data },
        });
      }
      void index;
    }

    for (const [index, interaction] of spec.interactions.entries()) {
      await prisma.customerInteraction.upsert({
        where: { organizationId_externalId: { organizationId: organization.id, externalId: `${spec.key}-i${index}` } },
        update: {},
        create: {
          organizationId: organization.id,
          customerAccountId: account.id,
          externalId: `${spec.key}-i${index}`,
          interactionDate: daysAgo(interaction.ago),
          type: interaction.type,
          sentiment: interaction.sentiment,
          summary: interaction.summary,
          executiveParticipated: Boolean(interaction.exec),
          championParticipated: Boolean(interaction.champion),
          sourceSystem: "demo",
        },
      });
    }

    if (spec.renewalInDays !== null) {
      const existingRenewal = await prisma.renewal.findFirst({
        where: { customerAccountId: account.id, externalId: `${spec.key}-r` },
      });
      const renewal =
        existingRenewal ??
        (await prisma.renewal.create({
          data: {
            organizationId: organization.id,
            customerAccountId: account.id,
            externalId: `${spec.key}-r`,
            periodStart: daysAhead(spec.renewalInDays - 365),
            periodEnd: daysAhead(spec.renewalInDays),
            arr: spec.arr,
            forecastCategory: "UNCERTAIN",
            status: "NOT_STARTED",
          },
        }));

      if (spec.renewalPlan) {
        const existingPlan = await prisma.renewalPlan.findFirst({ where: { renewalId: renewal.id } });
        if (!existingPlan) {
          await prisma.renewalPlan.create({
            data: {
              organizationId: organization.id,
              renewalId: renewal.id,
              milestones: {
                create: [
                  { organizationId: organization.id, key: "decision_makers_confirmed", label: "Confirm decision makers", order: 0, completed: true, completedAt: daysAgo(30) },
                  { organizationId: organization.id, key: "internal_strategy_agreed", label: "Internal renewal strategy agreed", order: 1, completed: true, completedAt: daysAgo(18) },
                  { organizationId: organization.id, key: "value_review_delivered", label: "Value review delivered to sponsor", order: 2, completed: false },
                  { organizationId: organization.id, key: "commercial_terms_confirmed", label: "Commercial terms confirmed", order: 3, completed: false },
                ],
              },
            },
          });
          await prisma.renewal.update({ where: { id: renewal.id }, data: { status: "IN_PLANNING" } });
        }
      }
    }

    if (spec.escalation) {
      const existing = await prisma.escalation.findFirst({
        where: { customerAccountId: account.id, title: spec.escalation.title },
      });
      if (!existing) {
        await prisma.escalation.create({
          data: {
            organizationId: organization.id,
            customerAccountId: account.id,
            title: spec.escalation.title,
            category: spec.escalation.category,
            severity: spec.escalation.severity,
            status: "INVESTIGATING",
            description: spec.escalation.description,
            customerImpact: spec.escalation.impact,
            revenueExposure: spec.arr,
            ownerId: owner.id,
            openedAt: daysAgo(10),
            targetResolutionDate: daysAhead(5),
            customerCommunicationState: "acknowledged",
          },
        });
      }
    }

    for (const [index, action] of (spec.overdueActions ?? []).entries()) {
      const suggestionKey = `demo:${spec.key}:${index}`;
      const existing = await prisma.recommendedAction.findFirst({
        where: { customerAccountId: account.id, suggestionKey },
      });
      if (existing) continue;
      await prisma.recommendedAction.create({
        data: {
          organizationId: organization.id,
          customerAccountId: account.id,
          suggestionKey,
          title: action.title,
          actionType: action.type,
          reason: "Created during the last account review and not yet closed.",
          evidence: [],
          priority: "high",
          status: "OPEN",
          source: "manual",
          ownerId: owner.id,
          dueDate: daysAgo(action.dueDaysAgo),
        },
      });
    }
  }

  console.log(`Demo organization "${organization.name}" is seeded with ${ACCOUNTS.length} accounts.`);
  console.log("Next: run the risk evaluation, health recalculation, and data quality detection to populate intelligence.");
  return organization.id;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
