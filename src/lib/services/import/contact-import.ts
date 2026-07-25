import "server-only";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AccountMatcher } from "./account-matcher";
import { runImport, type ImportSummary } from "./import-runner";
import {
  readCsvTable,
  readRequiredString,
  readDate,
  readEnum,
  readBoolean,
  RowCollector,
  type RowError,
} from "./csv-core";

export const CONTACT_ROLES = [
  "EXECUTIVE_SPONSOR",
  "CHAMPION",
  "DECISION_MAKER",
  "ECONOMIC_BUYER",
  "ADMINISTRATOR",
  "PRODUCT_USER",
  "TECHNICAL_CONTACT",
  "BILLING_CONTACT",
  "PROCUREMENT",
  "LEGAL",
  "OTHER",
] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];

const INFLUENCE_LEVELS = ["HIGH", "MEDIUM", "LOW"] as const;
const RELATIONSHIP_STRENGTHS = ["STRONG", "ADEQUATE", "WEAK", "UNKNOWN"] as const;

export interface ParsedContactRow {
  rowNumber: number;
  accountName?: string;
  externalAccountId?: string;
  name: string;
  email?: string;
  title?: string;
  department?: string;
  phone?: string;
  roles: ContactRole[];
  influenceLevel?: string;
  relationshipStrength?: string;
  lastInteractionAt?: Date;
  externalId?: string;
  sourceSystem?: string;
  departedAt?: Date;
}

export interface ContactParseResult {
  headers: string[];
  validRows: ParsedContactRow[];
  errors: RowError[];
}

/**
 * A contact commonly holds several roles at once. Roles arrive either as a
 * semicolon or pipe separated `roles` column, or as individual boolean
 * flag columns (`is_champion`, `is_executive_sponsor`, ...) — both are
 * supported because real CRM exports use both shapes.
 */
function collectRoles(get: (c: string) => string | undefined, collector: RowCollector): ContactRole[] {
  const roles = new Set<ContactRole>();

  const rolesRaw = get("roles") ?? get("role");
  if (rolesRaw) {
    for (const piece of rolesRaw.split(/[;|,]/)) {
      const trimmed = piece.trim();
      if (!trimmed) continue;
      const result = readEnum(trimmed, "contact role", CONTACT_ROLES);
      if (!result.ok) {
        collector.reject(result.message);
        return [];
      }
      if (result.value) roles.add(result.value);
    }
  }

  const flagColumns: Array<[string, ContactRole]> = [
    ["is_executive_sponsor", "EXECUTIVE_SPONSOR"],
    ["is_champion", "CHAMPION"],
    ["is_decision_maker", "DECISION_MAKER"],
    ["is_economic_buyer", "ECONOMIC_BUYER"],
    ["is_technical_contact", "TECHNICAL_CONTACT"],
    ["is_billing_contact", "BILLING_CONTACT"],
  ];
  for (const [column, role] of flagColumns) {
    if (readBoolean(get(column)) === true) roles.add(role);
  }

  return Array.from(roles);
}

export function parseContactCsv(csvText: string): ContactParseResult {
  const { headers, rows } = readCsvTable(csvText, []);

  const hasAccountRef = headers.includes("account_name") || headers.includes("external_account_id");
  if (!hasAccountRef) {
    throw new Error('The file must have an "account_name" or "external_account_id" column.');
  }
  if (!headers.includes("name")) {
    throw new Error('The file must have a "name" column.');
  }

  const validRows: ParsedContactRow[] = [];
  const errors: RowError[] = [];

  for (const { rowNumber, get } of rows) {
    const collector = new RowCollector();

    const name = collector.take(readRequiredString(get("name"), "name"));
    const roles = collectRoles(get, collector);
    const influenceLevel = collector.take(readEnum(get("influence_level"), "influence level", INFLUENCE_LEVELS));
    const relationshipStrength = collector.take(
      readEnum(get("relationship_strength"), "relationship strength", RELATIONSHIP_STRENGTHS)
    );
    const lastInteractionAt = collector.take(readDate(get("last_interaction_date"), "last interaction date"));
    const departedAt = collector.take(readDate(get("departed_date"), "departed date"));

    const failure = collector.failure;
    if (failure || !name) {
      errors.push({ rowNumber, message: failure ?? "Missing required field: name." });
      continue;
    }

    validRows.push({
      rowNumber,
      accountName: get("account_name"),
      externalAccountId: get("external_account_id"),
      name,
      email: get("email")?.toLowerCase(),
      title: get("title"),
      department: get("department"),
      phone: get("phone"),
      roles,
      influenceLevel: influenceLevel?.toLowerCase(),
      relationshipStrength: relationshipStrength?.toLowerCase(),
      lastInteractionAt,
      externalId: get("external_id"),
      sourceSystem: get("source_system"),
      departedAt,
    });
  }

  return { headers, validRows, errors };
}

/**
 * Commits parsed contacts.
 *
 * Duplicate handling is a merge, not a skip: a contact matched by email
 * within the same account has its non-empty imported fields applied and its
 * roles unioned. This is the behavior the founder asked for ("contact
 * merge") and differs deliberately from the Customer Account importer,
 * where overwriting an account from a CSV would be far more destructive.
 */
export async function importContacts(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
  fileName: string;
  parseResult: ContactParseResult;
}): Promise<ImportSummary> {
  const matcher = await AccountMatcher.forOrganization(params.organizationId);

  return runImport({
    organizationId: params.organizationId,
    actingUserId: params.actingUserId,
    actingRole: params.actingRole,
    entityType: "customer_contact",
    fileName: params.fileName,
    parseErrors: params.parseResult.errors,
    parsedRowCount: params.parseResult.validRows.length,
    persist: async () => {
      const errors: RowError[] = [];
      let created = 0;
      let duplicates = 0;

      const existing = await prisma.customerContact.findMany({
        where: { organizationId: params.organizationId },
        select: { id: true, customerAccountId: true, email: true, roles: true },
      });
      const existingByKey = new Map(
        existing.filter((c) => c.email).map((c) => [`${c.customerAccountId}:${c.email}`, c])
      );

      for (const row of params.parseResult.validRows) {
        const match = matcher.match({ accountName: row.accountName, externalAccountId: row.externalAccountId });
        if (!match.ok) {
          errors.push({ rowNumber: row.rowNumber, message: match.message });
          continue;
        }

        const key = row.email ? `${match.accountId}:${row.email}` : null;
        const existingContact = key ? existingByKey.get(key) : undefined;

        if (existingContact) {
          const mergedRoles = Array.from(
            new Set([...((existingContact.roles as string[] | null) ?? []), ...row.roles])
          );
          await prisma.customerContact.update({
            where: { id: existingContact.id },
            data: {
              name: row.name,
              title: row.title ?? undefined,
              department: row.department ?? undefined,
              phone: row.phone ?? undefined,
              roles: mergedRoles,
              influenceLevel: row.influenceLevel ?? undefined,
              relationshipStrength: row.relationshipStrength ?? undefined,
              lastInteractionAt: row.lastInteractionAt ?? undefined,
              externalId: row.externalId ?? undefined,
              sourceSystem: row.sourceSystem ?? undefined,
              departedAt: row.departedAt ?? undefined,
              isActive: row.departedAt ? false : undefined,
            },
          });
          duplicates++;
          continue;
        }

        const contact = await prisma.customerContact.create({
          data: {
            organizationId: params.organizationId,
            customerAccountId: match.accountId,
            name: row.name,
            email: row.email,
            title: row.title,
            department: row.department,
            phone: row.phone,
            roles: row.roles,
            influenceLevel: row.influenceLevel,
            relationshipStrength: row.relationshipStrength,
            lastInteractionAt: row.lastInteractionAt,
            externalId: row.externalId,
            sourceSystem: row.sourceSystem,
            departedAt: row.departedAt,
            isActive: !row.departedAt,
          },
        });
        if (row.email) existingByKey.set(`${match.accountId}:${row.email}`, { ...contact, roles: contact.roles });
        created++;
      }

      return { created, duplicates, errors };
    },
  });
}

export function generateContactSampleCsv(): string {
  return [
    "account_name,name,email,title,roles,influence_level,relationship_strength,last_interaction_date",
    "Acme Logistics,Dana Whitfield,dana@acme.test,VP Operations,EXECUTIVE_SPONSOR;DECISION_MAKER,HIGH,STRONG,2026-07-10",
    "Acme Logistics,Marco Reyes,marco@acme.test,Operations Manager,CHAMPION,MEDIUM,ADEQUATE,2026-07-18",
    "Brightline Health,Priya Raman,priya@brightline.test,Director of IT,TECHNICAL_CONTACT,MEDIUM,ADEQUATE,",
  ].join("\n");
}
