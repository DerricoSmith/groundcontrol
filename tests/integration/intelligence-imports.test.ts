import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";
import { parseContactCsv, importContacts } from "@/lib/services/import/contact-import";
import { parseRenewalCsv, importRenewals } from "@/lib/services/import/renewal-import";
import { parseProductUsageCsv, importProductUsage } from "@/lib/services/import/product-usage-import";
import { parseSupportTicketCsv, importSupportTickets } from "@/lib/services/import/support-ticket-import";
import { parseInteractionCsv, importInteractions } from "@/lib/services/import/interaction-import";

describe("Customer Intelligence Core importers", () => {
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

  async function seedOrgWithAccount(accountName = "Acme Logistics", externalId?: string) {
    const owner = await testDb.user.create({ data: { name: "Owner", email: `o-${Math.random()}@imp.local`, passwordHash: "x" } });
    const org = await testDb.organization.create({
      data: { name: "Import Co", slug: `import-${Math.random()}`, memberships: { create: { userId: owner.id, role: "OWNER" } } },
    });
    const account = await testDb.customerAccount.create({
      data: { organizationId: org.id, name: accountName, arr: 50000, externalId },
    });
    orgId = org.id;
    ownerId = owner.id;
    return account;
  }

  const importArgs = (fileName: string) => ({
    organizationId: orgId,
    actingUserId: ownerId,
    actingRole: "OWNER" as const,
    fileName,
  });

  describe("contacts", () => {
    it("imports a contact with multiple roles", async () => {
      await seedOrgWithAccount();
      const parsed = parseContactCsv(
        "account_name,name,email,roles\nAcme Logistics,Dana W,dana@acme.test,EXECUTIVE_SPONSOR;DECISION_MAKER\n"
      );
      const summary = await importContacts({ ...importArgs("contacts.csv"), parseResult: parsed });

      expect(summary.successRows).toBe(1);
      const contact = await testDb.customerContact.findFirstOrThrow({ where: { organizationId: orgId } });
      expect(contact.roles).toEqual(["EXECUTIVE_SPONSOR", "DECISION_MAKER"]);
    });

    it("supports boolean role flag columns as well as a roles list", async () => {
      await seedOrgWithAccount();
      const parsed = parseContactCsv(
        "account_name,name,email,is_champion,is_billing_contact\nAcme Logistics,Marco R,marco@acme.test,true,yes\n"
      );
      await importContacts({ ...importArgs("contacts.csv"), parseResult: parsed });

      const contact = await testDb.customerContact.findFirstOrThrow({ where: { organizationId: orgId } });
      expect(contact.roles).toEqual(expect.arrayContaining(["CHAMPION", "BILLING_CONTACT"]));
    });

    it("merges a repeat import by email, unioning roles rather than duplicating the contact", async () => {
      await seedOrgWithAccount();
      await importContacts({
        ...importArgs("a.csv"),
        parseResult: parseContactCsv("account_name,name,email,roles\nAcme Logistics,Dana W,dana@acme.test,CHAMPION\n"),
      });
      const second = await importContacts({
        ...importArgs("b.csv"),
        parseResult: parseContactCsv("account_name,name,email,roles,title\nAcme Logistics,Dana Whitfield,dana@acme.test,EXECUTIVE_SPONSOR,VP Ops\n"),
      });

      expect(second.duplicateRows).toBe(1);
      const contacts = await testDb.customerContact.findMany({ where: { organizationId: orgId } });
      expect(contacts).toHaveLength(1);
      expect(contacts[0].roles).toEqual(expect.arrayContaining(["CHAMPION", "EXECUTIVE_SPONSOR"]));
      expect(contacts[0].title).toBe("VP Ops");
    });

    it("reports an unmatched account as a row error instead of silently dropping it", async () => {
      await seedOrgWithAccount();
      const parsed = parseContactCsv("account_name,name,email\nNonexistent Co,Someone,someone@test.local\n");
      const summary = await importContacts({ ...importArgs("contacts.csv"), parseResult: parsed });

      expect(summary.successRows).toBe(0);
      expect(summary.errors[0].message).toMatch(/No customer account named/);
    });

    it("never matches an account in another organization", async () => {
      await seedOrgWithAccount("Our Account");
      const otherOwner = await testDb.user.create({ data: { name: "Other", email: "other@imp.local", passwordHash: "x" } });
      const otherOrg = await testDb.organization.create({
        data: { name: "Other", slug: "other-imp", memberships: { create: { userId: otherOwner.id, role: "OWNER" } } },
      });
      await testDb.customerAccount.create({ data: { organizationId: otherOrg.id, name: "Their Account", arr: 1 } });

      const parsed = parseContactCsv("account_name,name,email\nTheir Account,Spy,spy@test.local\n");
      const summary = await importContacts({ ...importArgs("contacts.csv"), parseResult: parsed });

      expect(summary.successRows).toBe(0);
      expect(await testDb.customerContact.count()).toBe(0);
    });

    it("rejects an invalid role value with a clear message", async () => {
      await seedOrgWithAccount();
      const parsed = parseContactCsv("account_name,name,roles\nAcme Logistics,Dana,SUPREME_LEADER\n");
      expect(parsed.errors[0].message).toMatch(/Invalid contact role/);
    });

    it("marks a contact inactive when a departure date is supplied", async () => {
      await seedOrgWithAccount();
      const parsed = parseContactCsv("account_name,name,email,roles,departed_date\nAcme Logistics,Gone,gone@acme.test,CHAMPION,2026-06-01\n");
      await importContacts({ ...importArgs("contacts.csv"), parseResult: parsed });

      const contact = await testDb.customerContact.findFirstOrThrow({ where: { organizationId: orgId } });
      expect(contact.isActive).toBe(false);
      expect(contact.departedAt).not.toBeNull();
    });

    it("records an import job and audit event", async () => {
      await seedOrgWithAccount();
      const parsed = parseContactCsv("account_name,name,email\nAcme Logistics,Dana,dana@acme.test\n");
      await importContacts({ ...importArgs("contacts.csv"), parseResult: parsed });

      const job = await testDb.importJob.findFirstOrThrow({ where: { organizationId: orgId, entityType: "customer_contact" } });
      expect(job.successRows).toBe(1);
      const audit = await testDb.auditEvent.findFirst({ where: { organizationId: orgId, eventType: "data_imported" } });
      expect(audit).not.toBeNull();
    });
  });

  describe("renewals", () => {
    it("imports a renewal and aligns the account's renewal date", async () => {
      const account = await seedOrgWithAccount();
      const parsed = parseRenewalCsv("account_name,renewal_date,arr,currency\nAcme Logistics,2026-11-15,84000,USD\n");
      const summary = await importRenewals({ ...importArgs("renewals.csv"), parseResult: parsed });

      expect(summary.successRows).toBe(1);
      const renewal = await testDb.renewal.findFirstOrThrow({ where: { organizationId: orgId } });
      expect(renewal.arr).toBe(84000);

      const updated = await testDb.customerAccount.findUniqueOrThrow({ where: { id: account.id } });
      expect(updated.renewalDate?.toISOString().slice(0, 10)).toBe("2026-11-15");
    });

    it("never overwrites a historical renewal — a repeat is a duplicate", async () => {
      await seedOrgWithAccount();
      const csv = "account_name,renewal_date,arr\nAcme Logistics,2026-11-15,84000\n";
      await importRenewals({ ...importArgs("a.csv"), parseResult: parseRenewalCsv(csv) });
      const second = await importRenewals({ ...importArgs("b.csv"), parseResult: parseRenewalCsv(csv) });

      expect(second.duplicateRows).toBe(1);
      expect(await testDb.renewal.count({ where: { organizationId: orgId } })).toBe(1);
    });

    it("rejects an unsupported currency", async () => {
      await seedOrgWithAccount();
      const parsed = parseRenewalCsv("account_name,renewal_date,currency\nAcme Logistics,2026-11-15,CAD\n");
      expect(parsed.errors[0].message).toMatch(/Unsupported currency/);
    });

    it("rejects an invalid forecast category", async () => {
      await seedOrgWithAccount();
      const parsed = parseRenewalCsv("account_name,renewal_date,forecast_category\nAcme Logistics,2026-11-15,MAYBE\n");
      expect(parsed.errors[0].message).toMatch(/Invalid forecast category/);
    });

    it("matches by external account id when supplied", async () => {
      await seedOrgWithAccount("Acme Logistics", "CRM-001");
      const parsed = parseRenewalCsv("external_account_id,renewal_date,arr\nCRM-001,2026-11-15,84000\n");
      const summary = await importRenewals({ ...importArgs("renewals.csv"), parseResult: parsed });
      expect(summary.successRows).toBe(1);
    });
  });

  describe("product usage", () => {
    it("imports multiple periods for one account", async () => {
      await seedOrgWithAccount();
      const parsed = parseProductUsageCsv(
        "account_name,period_start,period_end,active_users\nAcme Logistics,2026-05-01,2026-05-31,50\nAcme Logistics,2026-06-01,2026-06-30,30\n"
      );
      const summary = await importProductUsage({ ...importArgs("usage.csv"), parseResult: parsed });

      expect(summary.successRows).toBe(2);
      expect(await testDb.productUsageSummary.count({ where: { organizationId: orgId } })).toBe(2);
    });

    it("does not overwrite an existing period on re-import", async () => {
      await seedOrgWithAccount();
      const csv = "account_name,period_start,period_end,active_users\nAcme Logistics,2026-06-01,2026-06-30,30\n";
      await importProductUsage({ ...importArgs("a.csv"), parseResult: parseProductUsageCsv(csv) });
      const second = await importProductUsage({ ...importArgs("b.csv"), parseResult: parseProductUsageCsv(csv) });

      expect(second.duplicateRows).toBe(1);
      expect(await testDb.productUsageSummary.count({ where: { organizationId: orgId } })).toBe(1);
    });

    it("rejects an end date before the start date", async () => {
      const parsed = parseProductUsageCsv("account_name,period_start,period_end\nAcme Logistics,2026-06-30,2026-06-01\n");
      expect(parsed.errors[0].message).toMatch(/period end is before period start/);
    });

    it("rejects an adoption percentage outside zero to one hundred", async () => {
      const parsed = parseProductUsageCsv("account_name,period_start,period_end,adoption_percentage\nAcme,2026-06-01,2026-06-30,140\n");
      expect(parsed.errors[0].message).toMatch(/adoption percentage/);
    });

    it("rejects a negative active user count", async () => {
      const parsed = parseProductUsageCsv("account_name,period_start,period_end,active_users\nAcme,2026-06-01,2026-06-30,-5\n");
      expect(parsed.errors[0].message).toMatch(/active users/);
    });
  });

  describe("support tickets", () => {
    it("imports a ticket and dedups by external ticket id", async () => {
      await seedOrgWithAccount();
      const csv = "account_name,ticket_id,created_date,status,priority\nAcme Logistics,TCK-1,2026-06-02,OPEN,URGENT\n";
      const first = await importSupportTickets({ ...importArgs("a.csv"), parseResult: parseSupportTicketCsv(csv) });
      expect(first.successRows).toBe(1);

      const updatedCsv = "account_name,ticket_id,created_date,status,priority\nAcme Logistics,TCK-1,2026-06-02,CLOSED,URGENT\n";
      const second = await importSupportTickets({ ...importArgs("b.csv"), parseResult: parseSupportTicketCsv(updatedCsv) });
      expect(second.duplicateRows).toBe(1);

      // A ticket genuinely changes state in the source system, so the
      // re-import updates it rather than leaving stale status behind.
      const ticket = await testDb.supportTicket.findFirstOrThrow({ where: { organizationId: orgId } });
      expect(ticket.status).toBe("CLOSED");
      expect(await testDb.supportTicket.count({ where: { organizationId: orgId } })).toBe(1);
    });

    it("rejects an invalid ticket status", async () => {
      const parsed = parseSupportTicketCsv("account_name,ticket_id,created_date,status\nAcme,T-1,2026-06-02,EXPLODED\n");
      expect(parsed.errors[0].message).toMatch(/Invalid ticket status/);
    });

    it("rejects a closed date before the created date", async () => {
      const parsed = parseSupportTicketCsv("account_name,ticket_id,created_date,closed_date\nAcme,T-1,2026-06-10,2026-06-01\n");
      expect(parsed.errors[0].message).toMatch(/closed date is before created date/);
    });
  });

  describe("interactions", () => {
    it("imports an interaction and links it to a matching contact", async () => {
      await seedOrgWithAccount();
      await importContacts({
        ...importArgs("contacts.csv"),
        parseResult: parseContactCsv("account_name,name,email\nAcme Logistics,Dana,dana@acme.test\n"),
      });

      const parsed = parseInteractionCsv(
        "account_name,interaction_date,interaction_type,contact_email,sentiment\nAcme Logistics,2026-06-20,CUSTOMER_MEETING,dana@acme.test,POSITIVE\n"
      );
      const summary = await importInteractions({ ...importArgs("interactions.csv"), parseResult: parsed });

      expect(summary.successRows).toBe(1);
      const interaction = await testDb.customerInteraction.findFirstOrThrow({ where: { organizationId: orgId } });
      expect(interaction.contactId).not.toBeNull();
      expect(interaction.sentiment).toBe("POSITIVE");
    });

    it("defaults sentiment to UNKNOWN rather than inferring it", async () => {
      await seedOrgWithAccount();
      const parsed = parseInteractionCsv(
        "account_name,interaction_date,interaction_type,summary\nAcme Logistics,2026-06-20,CUSTOMER_MEETING,Everything is going terribly wrong\n"
      );
      await importInteractions({ ...importArgs("interactions.csv"), parseResult: parsed });

      const interaction = await testDb.customerInteraction.findFirstOrThrow({ where: { organizationId: orgId } });
      // The summary text is plainly negative, but nothing infers sentiment.
      expect(interaction.sentiment).toBe("UNKNOWN");
    });

    it("rejects an invalid interaction type", async () => {
      const parsed = parseInteractionCsv("account_name,interaction_date,interaction_type\nAcme,2026-06-20,TELEPATHY\n");
      expect(parsed.errors[0].message).toMatch(/Invalid interaction type/);
    });

    it("dedups by external id", async () => {
      await seedOrgWithAccount();
      const csv = "account_name,interaction_date,interaction_type,external_id\nAcme Logistics,2026-06-20,CUSTOMER_MEETING,EXT-1\n";
      await importInteractions({ ...importArgs("a.csv"), parseResult: parseInteractionCsv(csv) });
      const second = await importInteractions({ ...importArgs("b.csv"), parseResult: parseInteractionCsv(csv) });

      expect(second.duplicateRows).toBe(1);
      expect(await testDb.customerInteraction.count({ where: { organizationId: orgId } })).toBe(1);
    });
  });

  it("a viewer cannot run any import", async () => {
    await seedOrgWithAccount();
    const parsed = parseContactCsv("account_name,name\nAcme Logistics,Dana\n");
    await expect(
      importContacts({ organizationId: orgId, actingUserId: ownerId, actingRole: "VIEWER", fileName: "c.csv", parseResult: parsed })
    ).rejects.toThrow(/not permitted/);
  });
});
