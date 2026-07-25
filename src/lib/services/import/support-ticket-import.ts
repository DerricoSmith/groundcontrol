import "server-only";
import type { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AccountMatcher } from "./account-matcher";
import { runImport, type ImportSummary } from "./import-runner";
import {
  readCsvTable,
  readRequiredString,
  readRequiredDate,
  readDate,
  readInteger,
  readNumber,
  readEnum,
  readBoolean,
  RowCollector,
  type RowError,
} from "./csv-core";

const TICKET_STATUSES = ["NEW", "OPEN", "PENDING", "ON_HOLD", "SOLVED", "CLOSED"] as const;
const TICKET_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export interface ParsedTicketRow {
  rowNumber: number;
  accountName?: string;
  externalAccountId?: string;
  externalTicketId: string;
  createdDate: Date;
  updatedDate?: Date;
  closedDate?: Date;
  status?: TicketStatus;
  priority?: TicketPriority;
  severity?: string;
  category?: string;
  subject?: string;
  descriptionSummary?: string;
  satisfactionScore?: number;
  firstResponseMinutes?: number;
  resolutionMinutes?: number;
  reopenCount?: number;
  escalated?: boolean;
  productArea?: string;
  requesterEmail?: string;
  assignedTeam?: string;
  sourceSystem?: string;
}

export interface TicketParseResult {
  headers: string[];
  validRows: ParsedTicketRow[];
  errors: RowError[];
}

export function parseSupportTicketCsv(csvText: string): TicketParseResult {
  const { headers, rows } = readCsvTable(csvText, ["created_date"]);

  if (!headers.includes("account_name") && !headers.includes("external_account_id")) {
    throw new Error('The file must have an "account_name" or "external_account_id" column.');
  }
  if (!headers.includes("ticket_id") && !headers.includes("external_ticket_id")) {
    throw new Error('The file must have a "ticket_id" column.');
  }

  const validRows: ParsedTicketRow[] = [];
  const errors: RowError[] = [];

  for (const { rowNumber, get } of rows) {
    const collector = new RowCollector();

    const externalTicketId = collector.take(
      readRequiredString(get("ticket_id") ?? get("external_ticket_id"), "ticket id")
    );
    const createdDate = collector.take(readRequiredDate(get("created_date"), "created date"));
    const updatedDate = collector.take(readDate(get("updated_date"), "updated date"));
    const closedDate = collector.take(readDate(get("closed_date"), "closed date"));
    const status = collector.take(readEnum(get("status"), "ticket status", TICKET_STATUSES));
    const priority = collector.take(readEnum(get("priority"), "ticket priority", TICKET_PRIORITIES));
    const satisfactionScore = collector.take(readNumber(get("satisfaction_score"), "satisfaction score", { min: 0 }));
    const firstResponseMinutes = collector.take(readInteger(get("first_response_minutes"), "first response time", { min: 0 }));
    const resolutionMinutes = collector.take(readInteger(get("resolution_minutes"), "resolution time", { min: 0 }));
    const reopenCount = collector.take(readInteger(get("reopen_count"), "reopen count", { min: 0 }));

    if (!collector.failure && createdDate && closedDate && closedDate < createdDate) {
      collector.reject("Invalid date range: closed date is before created date.");
    }

    const failure = collector.failure;
    if (failure || !externalTicketId || !createdDate) {
      errors.push({ rowNumber, message: failure ?? "Missing required ticket fields." });
      continue;
    }

    validRows.push({
      rowNumber,
      accountName: get("account_name"),
      externalAccountId: get("external_account_id"),
      externalTicketId,
      createdDate,
      updatedDate,
      closedDate,
      status,
      priority,
      severity: get("severity"),
      category: get("category"),
      subject: get("subject"),
      descriptionSummary: get("description_summary"),
      satisfactionScore,
      firstResponseMinutes,
      resolutionMinutes,
      reopenCount,
      escalated: readBoolean(get("escalated")),
      productArea: get("product_area"),
      requesterEmail: get("requester_email")?.toLowerCase(),
      assignedTeam: get("assigned_team"),
      sourceSystem: get("source_system"),
    });
  }

  return { headers, validRows, errors };
}

/**
 * Commits support tickets, deduplicated by external ticket id within the
 * organization. A re-import of the same ticket updates its mutable state
 * (status, closed date, resolution time) — unlike renewals, a ticket
 * genuinely does change over time in the source system, and stale ticket
 * status would produce false support risk.
 *
 * Ticket text is stored locally only. Nothing here sends subject or
 * description anywhere.
 */
export async function importSupportTickets(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
  fileName: string;
  parseResult: TicketParseResult;
}): Promise<ImportSummary> {
  const matcher = await AccountMatcher.forOrganization(params.organizationId);

  return runImport({
    organizationId: params.organizationId,
    actingUserId: params.actingUserId,
    actingRole: params.actingRole,
    entityType: "support_ticket",
    fileName: params.fileName,
    parseErrors: params.parseResult.errors,
    parsedRowCount: params.parseResult.validRows.length,
    persist: async () => {
      const errors: RowError[] = [];
      let created = 0;
      let duplicates = 0;

      const existing = await prisma.supportTicket.findMany({
        where: { organizationId: params.organizationId },
        select: { id: true, externalTicketId: true },
      });
      const existingByTicketId = new Map(existing.map((t) => [t.externalTicketId.toLowerCase(), t.id]));

      for (const row of params.parseResult.validRows) {
        const match = matcher.match({ accountName: row.accountName, externalAccountId: row.externalAccountId });
        if (!match.ok) {
          errors.push({ rowNumber: row.rowNumber, message: match.message });
          continue;
        }

        const existingId = existingByTicketId.get(row.externalTicketId.toLowerCase());
        const data = {
          customerAccountId: match.accountId,
          createdDate: row.createdDate,
          updatedDate: row.updatedDate,
          closedDate: row.closedDate,
          status: row.status ?? ("OPEN" as TicketStatus),
          priority: row.priority ?? ("NORMAL" as TicketPriority),
          severity: row.severity,
          category: row.category,
          subject: row.subject,
          descriptionSummary: row.descriptionSummary,
          satisfactionScore: row.satisfactionScore,
          firstResponseMinutes: row.firstResponseMinutes,
          resolutionMinutes: row.resolutionMinutes,
          reopenCount: row.reopenCount ?? 0,
          escalated: row.escalated ?? false,
          productArea: row.productArea,
          requesterEmail: row.requesterEmail,
          assignedTeam: row.assignedTeam,
          sourceSystem: row.sourceSystem,
        };

        if (existingId) {
          await prisma.supportTicket.update({ where: { id: existingId }, data });
          duplicates++;
          continue;
        }

        const ticket = await prisma.supportTicket.create({
          data: { ...data, organizationId: params.organizationId, externalTicketId: row.externalTicketId },
        });
        existingByTicketId.set(row.externalTicketId.toLowerCase(), ticket.id);
        created++;
      }

      return { created, duplicates, errors };
    },
  });
}

export function generateSupportTicketSampleCsv(): string {
  return [
    "account_name,ticket_id,created_date,closed_date,status,priority,resolution_minutes,satisfaction_score,escalated",
    "Acme Logistics,TCK-1041,2026-06-02,2026-06-04,CLOSED,NORMAL,2880,4.5,false",
    "Acme Logistics,TCK-1108,2026-06-24,,OPEN,URGENT,,,true",
    "Brightline Health,TCK-1112,2026-06-26,2026-06-27,SOLVED,LOW,1440,5,false",
  ].join("\n");
}
