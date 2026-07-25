import "server-only";
import type { InteractionSentiment, InteractionType, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AccountMatcher } from "./account-matcher";
import { runImport, type ImportSummary } from "./import-runner";
import {
  readCsvTable,
  readRequiredDate,
  readDate,
  readEnum,
  readBoolean,
  RowCollector,
  type RowError,
} from "./csv-core";

const INTERACTION_TYPES = [
  "CUSTOMER_MEETING",
  "EXECUTIVE_MEETING",
  "BUSINESS_REVIEW",
  "EMAIL",
  "SUPPORT_INTERACTION",
  "TRAINING",
  "IMPLEMENTATION_SESSION",
  "RENEWAL_CONVERSATION",
  "EXPANSION_CONVERSATION",
  "ESCALATION_CONVERSATION",
  "SURVEY_FOLLOW_UP",
  "INTERNAL_REVIEW",
  "OTHER",
] as const;

const SENTIMENTS = ["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED", "UNKNOWN"] as const;

/**
 * "Meaningful interaction" definition, used by every relationship
 * calculation and by the no_recent_interaction risk rule.
 *
 * A meaningful interaction is a two-way exchange with the customer. Two
 * categories are deliberately excluded:
 *  - INTERNAL_REVIEW: an internal meeting about the customer is not
 *    contact with the customer, and counting it would let a team look
 *    engaged while the customer hears nothing.
 *  - EMAIL: a single email is too weak a signal to reset a
 *    "we haven't spoken to this customer" clock on its own.
 *
 * Documented in CUSTOMER_INTERACTION_IMPORT_GUIDE.md.
 */
export const MEANINGFUL_INTERACTION_TYPES: InteractionType[] = [
  "CUSTOMER_MEETING",
  "EXECUTIVE_MEETING",
  "BUSINESS_REVIEW",
  "TRAINING",
  "IMPLEMENTATION_SESSION",
  "RENEWAL_CONVERSATION",
  "EXPANSION_CONVERSATION",
  "ESCALATION_CONVERSATION",
  "SURVEY_FOLLOW_UP",
];

export const EXECUTIVE_INTERACTION_TYPES: InteractionType[] = ["EXECUTIVE_MEETING", "BUSINESS_REVIEW"];

export interface ParsedInteractionRow {
  rowNumber: number;
  accountName?: string;
  externalAccountId?: string;
  interactionDate: Date;
  type: InteractionType;
  contactEmail?: string;
  contactName?: string;
  summary?: string;
  sentiment?: InteractionSentiment;
  outcome?: string;
  nextStep?: string;
  nextStepDueDate?: Date;
  executiveParticipated?: boolean;
  championParticipated?: boolean;
  renewalRelated?: boolean;
  escalationRelated?: boolean;
  externalId?: string;
  sourceSystem?: string;
}

export interface InteractionParseResult {
  headers: string[];
  validRows: ParsedInteractionRow[];
  errors: RowError[];
}

export function parseInteractionCsv(csvText: string): InteractionParseResult {
  const { headers, rows } = readCsvTable(csvText, ["interaction_date"]);

  if (!headers.includes("account_name") && !headers.includes("external_account_id")) {
    throw new Error('The file must have an "account_name" or "external_account_id" column.');
  }
  if (!headers.includes("interaction_type") && !headers.includes("type")) {
    throw new Error('The file must have an "interaction_type" column.');
  }

  const validRows: ParsedInteractionRow[] = [];
  const errors: RowError[] = [];

  for (const { rowNumber, get } of rows) {
    const collector = new RowCollector();

    const interactionDate = collector.take(readRequiredDate(get("interaction_date"), "interaction date"));
    const typeRaw = get("interaction_type") ?? get("type");
    const type = collector.take(readEnum(typeRaw, "interaction type", INTERACTION_TYPES));
    // Sentiment is only ever imported, never inferred — see the guide.
    const sentiment = collector.take(readEnum(get("sentiment"), "sentiment", SENTIMENTS));
    const nextStepDueDate = collector.take(readDate(get("next_step_due_date"), "next step due date"));

    if (!collector.failure && !type) {
      collector.reject("Missing required field: interaction type.");
    }

    const failure = collector.failure;
    if (failure || !interactionDate || !type) {
      errors.push({ rowNumber, message: failure ?? "Missing required interaction fields." });
      continue;
    }

    validRows.push({
      rowNumber,
      accountName: get("account_name"),
      externalAccountId: get("external_account_id"),
      interactionDate,
      type,
      contactEmail: get("contact_email")?.toLowerCase(),
      contactName: get("contact_name"),
      summary: get("summary"),
      sentiment,
      outcome: get("outcome"),
      nextStep: get("next_step"),
      nextStepDueDate,
      executiveParticipated: readBoolean(get("executive_participated")),
      championParticipated: readBoolean(get("champion_participated")),
      renewalRelated: readBoolean(get("renewal_related")),
      escalationRelated: readBoolean(get("escalation_related")),
      externalId: get("external_id"),
      sourceSystem: get("source_system"),
    });
  }

  return { headers, validRows, errors };
}

export async function importInteractions(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
  fileName: string;
  parseResult: InteractionParseResult;
}): Promise<ImportSummary> {
  const matcher = await AccountMatcher.forOrganization(params.organizationId);

  return runImport({
    organizationId: params.organizationId,
    actingUserId: params.actingUserId,
    actingRole: params.actingRole,
    entityType: "customer_interaction",
    fileName: params.fileName,
    parseErrors: params.parseResult.errors,
    parsedRowCount: params.parseResult.validRows.length,
    persist: async () => {
      const errors: RowError[] = [];
      let created = 0;
      let duplicates = 0;

      const [existing, contacts] = await Promise.all([
        prisma.customerInteraction.findMany({
          where: { organizationId: params.organizationId, externalId: { not: null } },
          select: { externalId: true },
        }),
        prisma.customerContact.findMany({
          where: { organizationId: params.organizationId },
          select: { id: true, customerAccountId: true, email: true },
        }),
      ]);
      const existingExternalIds = new Set(existing.map((i) => i.externalId!.toLowerCase()));
      const contactByKey = new Map(
        contacts.filter((c) => c.email).map((c) => [`${c.customerAccountId}:${c.email}`, c.id])
      );

      for (const row of params.parseResult.validRows) {
        const match = matcher.match({ accountName: row.accountName, externalAccountId: row.externalAccountId });
        if (!match.ok) {
          errors.push({ rowNumber: row.rowNumber, message: match.message });
          continue;
        }

        if (row.externalId && existingExternalIds.has(row.externalId.toLowerCase())) {
          duplicates++;
          continue;
        }
        if (row.externalId) existingExternalIds.add(row.externalId.toLowerCase());

        const contactId = row.contactEmail ? contactByKey.get(`${match.accountId}:${row.contactEmail}`) : undefined;

        await prisma.customerInteraction.create({
          data: {
            organizationId: params.organizationId,
            customerAccountId: match.accountId,
            interactionDate: row.interactionDate,
            type: row.type,
            contactId,
            contactEmail: row.contactEmail,
            contactName: row.contactName,
            summary: row.summary,
            sentiment: row.sentiment ?? "UNKNOWN",
            outcome: row.outcome,
            nextStep: row.nextStep,
            nextStepDueDate: row.nextStepDueDate,
            executiveParticipated: row.executiveParticipated ?? row.type === "EXECUTIVE_MEETING",
            championParticipated: row.championParticipated ?? false,
            renewalRelated: row.renewalRelated ?? row.type === "RENEWAL_CONVERSATION",
            escalationRelated: row.escalationRelated ?? row.type === "ESCALATION_CONVERSATION",
            externalId: row.externalId,
            sourceSystem: row.sourceSystem,
          },
        });
        created++;
      }

      return { created, duplicates, errors };
    },
  });
}

export function generateInteractionSampleCsv(): string {
  return [
    "account_name,interaction_date,interaction_type,contact_email,sentiment,summary,executive_participated",
    "Acme Logistics,2026-06-12,BUSINESS_REVIEW,dana@acme.test,POSITIVE,Quarterly business review,true",
    "Acme Logistics,2026-07-18,CUSTOMER_MEETING,marco@acme.test,NEUTRAL,Adoption check-in,false",
    "Brightline Health,2026-07-02,CUSTOMER_MEETING,priya@brightline.test,MIXED,Implementation status,false",
  ].join("\n");
}
