import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";
import { importCustomerAccounts, parseCustomerAccountCsv } from "@/lib/services/csv-import-service";

describe("importCustomerAccounts", () => {
  let orgId: string;
  let ownerId: string;

  beforeAll(async () => {
    await resetTestDatabase();
  });
  afterEach(async () => {
    await resetTestDatabase();
  });
  afterAll(async () => {
    await disconnectTestDatabase();
  });

  async function seedOrg() {
    const owner = await testDb.user.create({ data: { name: "Owner", email: "owner@csv-test.local", passwordHash: "x" } });
    const org = await testDb.organization.create({
      data: { name: "CSV Test Co", slug: "csv-test-co", memberships: { create: { userId: owner.id, role: "OWNER" } } },
    });
    orgId = org.id;
    ownerId = owner.id;
  }

  it("imports valid rows, creates a DataSource, and records an audit event", async () => {
    await seedOrg();
    const parsed = parseCustomerAccountCsv("name,arr\nAcme Co,50000\nBeta Co,10000\n");

    const summary = await importCustomerAccounts({ organizationId: orgId, actingUserId: ownerId, fileName: "test.csv", parseResult: parsed });

    expect(summary.successRows).toBe(2);
    expect(summary.duplicateRows).toBe(0);

    const accounts = await testDb.customerAccount.findMany({ where: { organizationId: orgId } });
    expect(accounts.map((a) => a.name).sort()).toEqual(["Acme Co", "Beta Co"]);
    expect(accounts.every((a) => a.dataSourceId !== null)).toBe(true);

    const events = await testDb.auditEvent.findMany({ where: { organizationId: orgId, eventType: "data_imported" } });
    expect(events).toHaveLength(1);
  });

  it("skips rows that duplicate an existing account name (case-insensitive), without overwriting", async () => {
    await seedOrg();
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Acme Co", arr: 999 } });

    const parsed = parseCustomerAccountCsv("name,arr\nACME CO,50000\nNew Co,10000\n");
    const summary = await importCustomerAccounts({ organizationId: orgId, actingUserId: ownerId, fileName: "test.csv", parseResult: parsed });

    expect(summary.duplicateRows).toBe(1);
    expect(summary.successRows).toBe(1);

    const existing = await testDb.customerAccount.findFirst({ where: { organizationId: orgId, name: "Acme Co" } });
    expect(existing?.arr).toBe(999); // untouched, not overwritten
  });

  it("skips duplicate names within the same file", async () => {
    await seedOrg();
    const parsed = parseCustomerAccountCsv("name\nAcme Co\nAcme Co\n");
    const summary = await importCustomerAccounts({ organizationId: orgId, actingUserId: ownerId, fileName: "test.csv", parseResult: parsed });

    expect(summary.successRows).toBe(1);
    expect(summary.duplicateRows).toBe(1);
  });

  it("matches owner_email against an existing organization member", async () => {
    await seedOrg();
    const parsed = parseCustomerAccountCsv(`name,owner_email\nAcme Co,owner@csv-test.local\n`);
    await importCustomerAccounts({ organizationId: orgId, actingUserId: ownerId, fileName: "test.csv", parseResult: parsed });

    const account = await testDb.customerAccount.findFirstOrThrow({ where: { organizationId: orgId } });
    expect(account.ownerId).toBe(ownerId);
  });

  it("leaves ownerId unset when owner_email does not match any member", async () => {
    await seedOrg();
    const parsed = parseCustomerAccountCsv(`name,owner_email\nAcme Co,unknown@nowhere.test\n`);
    await importCustomerAccounts({ organizationId: orgId, actingUserId: ownerId, fileName: "test.csv", parseResult: parsed });

    const account = await testDb.customerAccount.findFirstOrThrow({ where: { organizationId: orgId } });
    expect(account.ownerId).toBeNull();
  });

  it("a second organization's existing accounts never block or get affected by another org's import", async () => {
    await seedOrg();
    const otherOwner = await testDb.user.create({ data: { name: "Other", email: "other@csv-test.local", passwordHash: "x" } });
    const otherOrg = await testDb.organization.create({
      data: { name: "Other Org", slug: "other-csv-org", memberships: { create: { userId: otherOwner.id, role: "OWNER" } } },
    });
    await testDb.customerAccount.create({ data: { organizationId: otherOrg.id, name: "Acme Co", arr: 1 } });

    const parsed = parseCustomerAccountCsv("name\nAcme Co\n");
    const summary = await importCustomerAccounts({ organizationId: orgId, actingUserId: ownerId, fileName: "test.csv", parseResult: parsed });

    expect(summary.duplicateRows).toBe(0); // "Acme Co" existing in the OTHER org must not count as a duplicate here
    expect(summary.successRows).toBe(1);
  });

  it("gives higher data confidence to rows with both revenue and a renewal date", async () => {
    await seedOrg();
    const parsed = parseCustomerAccountCsv("name,arr,renewal_date\nComplete Co,50000,2026-12-01\nSparse Co,,\n");
    await importCustomerAccounts({ organizationId: orgId, actingUserId: ownerId, fileName: "test.csv", parseResult: parsed });

    const complete = await testDb.customerAccount.findFirstOrThrow({ where: { organizationId: orgId, name: "Complete Co" } });
    const sparse = await testDb.customerAccount.findFirstOrThrow({ where: { organizationId: orgId, name: "Sparse Co" } });
    expect(complete.dataConfidence).toBeGreaterThan(sparse.dataConfidence);
  });
});
