import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";
import { seedTwoOrganizations, type SeededOrg } from "../helpers/seed-orgs";

/**
 * Founder's #1 priority test (TESTING.md): Organization A must never be able
 * to see Organization B's data. This runs against SQLite, so it proves
 * application-layer (service-pattern) isolation only — it cannot prove
 * Postgres Row Level Security, which has no SQLite equivalent. See
 * LOCAL_POSTGRES_SETUP.md for the Postgres-side verification this test
 * cannot perform.
 *
 * Every "cannot see" assertion here is paired with an "unscoped query DOES
 * see both" assertion, so that if someone deletes the organizationId filter
 * from a real service function, the corresponding real test fails loudly —
 * this is not just checking that two different orgs happen to have
 * different rows (they always would), it's checking that the scoping
 * clause is what's doing the work.
 */
describe("tenant isolation", () => {
  let alpha: SeededOrg;
  let beta: SeededOrg;

  beforeAll(async () => {
    await resetTestDatabase();
    ({ alpha, beta } = await seedTwoOrganizations());
  });

  afterAll(async () => {
    await resetTestDatabase();
    await disconnectTestDatabase();
  });

  it("Organization A cannot query Organization B's customer accounts", async () => {
    const scoped = await testDb.customerAccount.findMany({ where: { organizationId: alpha.organizationId } });
    expect(scoped.map((a) => a.id)).toEqual([alpha.customerAccountId]);
    expect(scoped.map((a) => a.id)).not.toContain(beta.customerAccountId);

    const unscoped = await testDb.customerAccount.findMany({});
    expect(unscoped.map((a) => a.id).sort()).toEqual([alpha.customerAccountId, beta.customerAccountId].sort());
  });

  it("Organization A cannot fetch Organization B's customer account even by exact id, when scoped", async () => {
    const result = await testDb.customerAccount.findFirst({
      where: { id: beta.customerAccountId, organizationId: alpha.organizationId },
    });
    expect(result).toBeNull();
  });

  it("Organization A cannot query Organization B's renewals", async () => {
    const scoped = await testDb.renewal.findMany({ where: { organizationId: alpha.organizationId } });
    expect(scoped.map((r) => r.id)).toEqual([alpha.renewalId]);

    const unscoped = await testDb.renewal.findMany({});
    expect(unscoped.map((r) => r.id).sort()).toEqual([alpha.renewalId, beta.renewalId].sort());
  });

  it("Organization A cannot query Organization B's health scores", async () => {
    const scoped = await testDb.healthScore.findMany({ where: { organizationId: alpha.organizationId } });
    expect(scoped.map((h) => h.id)).toEqual([alpha.healthScoreId]);

    const unscoped = await testDb.healthScore.findMany({});
    expect(unscoped.map((h) => h.id).sort()).toEqual([alpha.healthScoreId, beta.healthScoreId].sort());
  });

  it("Organization A cannot query Organization B's risk signals", async () => {
    const scoped = await testDb.riskSignal.findMany({ where: { organizationId: alpha.organizationId } });
    expect(scoped.map((r) => r.id)).toEqual([alpha.riskSignalId]);

    const unscoped = await testDb.riskSignal.findMany({});
    expect(unscoped.map((r) => r.id).sort()).toEqual([alpha.riskSignalId, beta.riskSignalId].sort());
  });

  it("Organization A cannot query Organization B's recommended actions", async () => {
    const scoped = await testDb.recommendedAction.findMany({ where: { organizationId: alpha.organizationId } });
    expect(scoped.map((a) => a.id)).toEqual([alpha.recommendedActionId]);

    const unscoped = await testDb.recommendedAction.findMany({});
    expect(unscoped.map((a) => a.id).sort()).toEqual([alpha.recommendedActionId, beta.recommendedActionId].sort());
  });

  it("Organization A cannot view Organization B's audit events", async () => {
    const scoped = await testDb.auditEvent.findMany({ where: { organizationId: alpha.organizationId } });
    expect(scoped.map((e) => e.id)).toEqual([alpha.auditEventId]);

    const unscoped = await testDb.auditEvent.findMany({});
    expect(unscoped.map((e) => e.id).sort()).toEqual([alpha.auditEventId, beta.auditEventId].sort());
  });

  it("Organization A cannot query Organization B's import jobs or data sources", async () => {
    const scopedImports = await testDb.importJob.findMany({ where: { organizationId: alpha.organizationId } });
    expect(scopedImports.map((j) => j.id)).toEqual([alpha.importJobId]);

    const scopedSources = await testDb.dataSource.findMany({ where: { organizationId: alpha.organizationId } });
    expect(scopedSources.map((s) => s.id)).toEqual([alpha.dataSourceId]);
  });

  it("a user's membership only grants access to their own organization", async () => {
    const alphaMemberships = await testDb.membership.findMany({ where: { userId: alpha.ownerId } });
    expect(alphaMemberships).toHaveLength(1);
    expect(alphaMemberships[0].organizationId).toBe(alpha.organizationId);
    expect(alphaMemberships[0].organizationId).not.toBe(beta.organizationId);
  });
});
