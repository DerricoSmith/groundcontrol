import "server-only";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/services/audit-service";
import type { HealthCategory, Prisma } from "@prisma/client";

export class CsvImportError extends Error {}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB — generous for a CSV of customer accounts, small enough to process synchronously
const MAX_ROWS = 5000;
const HEALTH_CATEGORIES: HealthCategory[] = ["STRONG", "STABLE", "WATCH", "AT_RISK", "CRITICAL"];

/** Minimal, dependency-free CSV parser: handles quoted fields, escaped quotes ("") inside quotes, and commas inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

export interface ParsedCustomerAccountRow {
  rowNumber: number; // 1-indexed, header excluded
  name: string;
  ownerEmail?: string;
  arr?: number;
  currency?: string;
  renewalDate?: Date;
  segment?: string;
  tier?: string;
  health?: HealthCategory;
}

export interface RowError {
  rowNumber: number;
  message: string;
}

export interface ParseResult {
  headers: string[];
  validRows: ParsedCustomerAccountRow[];
  errors: RowError[];
}

const KNOWN_COLUMNS = ["name", "owner_email", "arr", "currency", "renewal_date", "segment", "tier", "health"] as const;

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

export function validateFile(params: { fileName: string; sizeBytes: number }): void {
  if (!params.fileName.toLowerCase().endsWith(".csv")) {
    throw new CsvImportError("Only .csv files are supported.");
  }
  if (/[\\/]|\.\./.test(params.fileName)) {
    throw new CsvImportError("Invalid file name.");
  }
  if (params.sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new CsvImportError(`File is too large — the limit is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
  }
}

/** Parses and validates Customer Account CSV content. Only "name" is required — every other column is optional, matching the founder's instruction not to require ARR or renewal date for the first import. */
export function parseCustomerAccountCsv(csvText: string): ParseResult {
  const rows = parseCsv(csvText);
  if (rows.length === 0) throw new CsvImportError("The file is empty.");
  if (rows.length - 1 > MAX_ROWS) throw new CsvImportError(`Too many rows — the limit is ${MAX_ROWS}.`);

  const rawHeaders = rows[0].map(normalizeHeader);
  const nameIndex = rawHeaders.indexOf("name");
  if (nameIndex === -1) {
    throw new CsvImportError('The file must have a "name" column.');
  }

  const columnIndex: Partial<Record<(typeof KNOWN_COLUMNS)[number], number>> = {};
  for (const col of KNOWN_COLUMNS) {
    const idx = rawHeaders.indexOf(col);
    if (idx !== -1) columnIndex[col] = idx;
  }

  const validRows: ParsedCustomerAccountRow[] = [];
  const errors: RowError[] = [];

  for (let i = 1; i < rows.length; i++) {
    const rowNumber = i; // header excluded from numbering
    const raw = rows[i];
    const get = (col: (typeof KNOWN_COLUMNS)[number]) => {
      const idx = columnIndex[col];
      return idx === undefined ? undefined : raw[idx]?.trim();
    };

    const name = get("name");
    if (!name) {
      errors.push({ rowNumber, message: "Missing required field: name." });
      continue;
    }

    let arr: number | undefined;
    const arrRaw = get("arr");
    if (arrRaw) {
      const parsed = Number(arrRaw.replace(/[,$]/g, ""));
      if (Number.isNaN(parsed) || parsed < 0) {
        errors.push({ rowNumber, message: `Invalid revenue value: "${arrRaw}".` });
        continue;
      }
      arr = parsed;
    }

    const currency = get("currency");
    if (currency && !["USD", "EUR", "GBP", "JPY"].includes(currency.toUpperCase())) {
      errors.push({ rowNumber, message: `Unsupported currency: "${currency}". Supported: USD, EUR, GBP, JPY.` });
      continue;
    }

    let renewalDate: Date | undefined;
    const renewalRaw = get("renewal_date");
    if (renewalRaw) {
      const parsed = new Date(renewalRaw);
      if (Number.isNaN(parsed.getTime())) {
        errors.push({ rowNumber, message: `Invalid renewal date: "${renewalRaw}". Use YYYY-MM-DD.` });
        continue;
      }
      renewalDate = parsed;
    }

    let health: HealthCategory | undefined;
    const healthRaw = get("health");
    if (healthRaw) {
      const normalized = healthRaw.toUpperCase().replace(/\s+/g, "_") as HealthCategory;
      if (!HEALTH_CATEGORIES.includes(normalized)) {
        errors.push({ rowNumber, message: `Invalid health value: "${healthRaw}". Expected one of ${HEALTH_CATEGORIES.join(", ")}.` });
        continue;
      }
      health = normalized;
    }

    validRows.push({
      rowNumber,
      name,
      ownerEmail: get("owner_email") || undefined,
      arr,
      currency: currency?.toUpperCase(),
      renewalDate,
      segment: get("segment") || undefined,
      tier: get("tier") || undefined,
      health,
    });
  }

  return { headers: rawHeaders, validRows, errors };
}

export interface ImportSummary {
  importJobId: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  duplicateRows: number;
  errors: RowError[];
}

/**
 * Commits a parsed, already-validated set of rows. Duplicate detection is
 * by exact (case-insensitive) name within the organization — a duplicate
 * is reported in the summary and skipped, never overwritten, so a repeated
 * import of the same file is always safe to re-run.
 */
export async function importCustomerAccounts(params: {
  organizationId: string;
  actingUserId: string;
  fileName: string;
  parseResult: ParseResult;
}): Promise<ImportSummary> {
  const { organizationId, actingUserId, fileName, parseResult } = params;

  const existing = await prisma.customerAccount.findMany({
    where: { organizationId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((a) => a.name.toLowerCase()));

  const memberships = await prisma.membership.findMany({
    where: { organizationId },
    include: { user: true },
  });
  const emailToUserId = new Map(memberships.map((m) => [m.user.email.toLowerCase(), m.userId]));

  const dataSource = await prisma.dataSource.create({
    data: { organizationId, label: `CSV import — ${fileName}`, kind: "csv" },
  });

  const seenInFile = new Set<string>();
  let duplicateRows = 0;
  const toCreate: Array<{
    name: string;
    ownerId?: string;
    arr: number;
    currency: string;
    renewalDate?: Date;
    segment?: string;
    tier?: string;
    healthCategory?: HealthCategory;
  }> = [];

  for (const row of parseResult.validRows) {
    const key = row.name.toLowerCase();
    if (existingNames.has(key) || seenInFile.has(key)) {
      duplicateRows++;
      continue;
    }
    seenInFile.add(key);
    toCreate.push({
      name: row.name,
      ownerId: row.ownerEmail ? emailToUserId.get(row.ownerEmail.toLowerCase()) : undefined,
      arr: row.arr ?? 0,
      currency: row.currency ?? "USD",
      renewalDate: row.renewalDate,
      segment: row.segment,
      tier: row.tier,
      healthCategory: row.health,
    });
  }

  const importJob = await prisma.importJob.create({
    data: {
      organizationId,
      createdById: actingUserId,
      entityType: "customer_account",
      fileName,
      status: "committed",
      totalRows: parseResult.validRows.length + parseResult.errors.length,
      successRows: toCreate.length,
      errorRows: parseResult.errors.length,
      errorReport: parseResult.errors.length > 0 ? (parseResult.errors as unknown as Prisma.InputJsonValue) : undefined,
      completedAt: new Date(),
    },
  });

  if (toCreate.length > 0) {
    await prisma.customerAccount.createMany({
      data: toCreate.map((row) => ({
        organizationId,
        dataSourceId: dataSource.id,
        name: row.name,
        ownerId: row.ownerId,
        arr: row.arr,
        currency: row.currency,
        renewalDate: row.renewalDate,
        segment: row.segment,
        tier: row.tier,
        healthCategory: row.healthCategory ?? "STABLE",
        dataConfidence: row.arr && row.renewalDate ? 0.7 : 0.35,
      })),
    });
  }

  await recordAuditEvent({
    organizationId,
    actorUserId: actingUserId,
    eventType: "data_imported",
    targetType: "ImportJob",
    targetId: importJob.id,
    metadata: { entityType: "customer_account", successRows: toCreate.length, errorRows: parseResult.errors.length, duplicateRows },
  });

  return {
    importJobId: importJob.id,
    totalRows: parseResult.validRows.length + parseResult.errors.length,
    successRows: toCreate.length,
    errorRows: parseResult.errors.length,
    duplicateRows,
    errors: parseResult.errors,
  };
}

