import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { assertCan } from "@/lib/auth/permissions";
import type { Role } from "@prisma/client";
import type { RowError } from "./csv-core";

export interface ImportSummary {
  importJobId: string;
  entityType: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  duplicateRows: number;
  errors: RowError[];
}

export interface PersistResult {
  created: number;
  duplicates: number;
  /** Errors discovered during persistence (e.g. unmatched account), added to parse-time errors. */
  errors?: RowError[];
}

/**
 * Shared commit wrapper: creates the DataSource, runs the importer's own
 * persistence step, records the ImportJob with real counts and a structured
 * error report, and writes the audit event.
 *
 * Known limitation carried forward from the original importer and recorded
 * in CSV_IMPORT_ARCHITECTURE.md: this is not wrapped in a single database
 * transaction. Acceptable for local single-user use; must be addressed
 * before commercial launch.
 */
export async function runImport(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
  entityType: string;
  fileName: string;
  parseErrors: RowError[];
  parsedRowCount: number;
  persist: (dataSourceId: string) => Promise<PersistResult>;
}): Promise<ImportSummary> {
  assertCan(params.actingRole, "edit_account_data");

  const dataSource = await prisma.dataSource.create({
    data: {
      organizationId: params.organizationId,
      label: `CSV import — ${params.fileName}`,
      kind: "csv",
    },
  });

  const result = await params.persist(dataSource.id);
  const allErrors = [...params.parseErrors, ...(result.errors ?? [])].sort((a, b) => a.rowNumber - b.rowNumber);
  const totalRows = params.parsedRowCount + params.parseErrors.length;

  const importJob = await prisma.importJob.create({
    data: {
      organizationId: params.organizationId,
      createdById: params.actingUserId,
      entityType: params.entityType,
      fileName: params.fileName,
      status: allErrors.length === 0 ? "committed" : "partial",
      totalRows,
      successRows: result.created,
      errorRows: allErrors.length,
      errorReport: allErrors.length > 0 ? (allErrors as unknown as Prisma.InputJsonValue) : undefined,
      completedAt: new Date(),
    },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "data_imported",
    targetType: "ImportJob",
    targetId: importJob.id,
    metadata: {
      entityType: params.entityType,
      successRows: result.created,
      errorRows: allErrors.length,
      duplicateRows: result.duplicates,
    },
  });

  return {
    importJobId: importJob.id,
    entityType: params.entityType,
    totalRows,
    successRows: result.created,
    errorRows: allErrors.length,
    duplicateRows: result.duplicates,
    errors: allErrors,
  };
}
