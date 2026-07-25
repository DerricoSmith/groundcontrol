"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth/session";
import { CsvImportError, validateFile, type RowError } from "@/lib/services/import/csv-core";
import { parseContactCsv, importContacts } from "@/lib/services/import/contact-import";
import { parseRenewalCsv, importRenewals } from "@/lib/services/import/renewal-import";
import { parseProductUsageCsv, importProductUsage } from "@/lib/services/import/product-usage-import";
import { parseSupportTicketCsv, importSupportTickets } from "@/lib/services/import/support-ticket-import";
import { parseInteractionCsv, importInteractions } from "@/lib/services/import/interaction-import";
import { recalculateOrganizationHealth } from "@/lib/services/health-calculation-service";
import { detectDataQualityIssues } from "@/lib/services/data-quality-service";

export type ImportKind = "contact" | "renewal" | "product_usage" | "support_ticket" | "interaction";

export interface ImportPreview {
  error?: string;
  kind?: ImportKind;
  fileName?: string;
  csvText?: string;
  validRowCount?: number;
  errorCount?: number;
  errors?: RowError[];
}

export interface ImportResult {
  error?: string;
  successRows?: number;
  errorRows?: number;
  duplicateRows?: number;
  errors?: RowError[];
}

function parseFor(kind: ImportKind, csvText: string) {
  switch (kind) {
    case "contact":
      return parseContactCsv(csvText);
    case "renewal":
      return parseRenewalCsv(csvText);
    case "product_usage":
      return parseProductUsageCsv(csvText);
    case "support_ticket":
      return parseSupportTicketCsv(csvText);
    case "interaction":
      return parseInteractionCsv(csvText);
  }
}

export async function previewIntelligenceImport(formData: FormData): Promise<ImportPreview> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const kind = String(formData.get("kind") ?? "") as ImportKind;
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Choose a CSV file." };

  try {
    validateFile({ fileName: file.name, sizeBytes: file.size });
    const csvText = await file.text();
    const parsed = parseFor(kind, csvText);
    return {
      kind,
      fileName: file.name,
      csvText,
      validRowCount: parsed.validRows.length,
      errorCount: parsed.errors.length,
      errors: parsed.errors.slice(0, 25),
    };
  } catch (error) {
    if (error instanceof CsvImportError || error instanceof Error) return { error: error.message };
    throw error;
  }
}

/**
 * Commits an import, then recalculates health and data quality. Recalculating
 * immediately is the point: new data that does not change what the product
 * says would be pointless data.
 */
export async function commitIntelligenceImport(kind: ImportKind, fileName: string, csvText: string): Promise<ImportResult> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    const parseResult = parseFor(kind, csvText);
    const args = {
      organizationId: membership.organizationId,
      actingUserId: membership.userId,
      actingRole: membership.role,
      fileName,
    };

    const summary = await (async () => {
      switch (kind) {
        case "contact":
          return importContacts({ ...args, parseResult: parseResult as never });
        case "renewal":
          return importRenewals({ ...args, parseResult: parseResult as never });
        case "product_usage":
          return importProductUsage({ ...args, parseResult: parseResult as never });
        case "support_ticket":
          return importSupportTickets({ ...args, parseResult: parseResult as never });
        case "interaction":
          return importInteractions({ ...args, parseResult: parseResult as never });
      }
    })();

    await recalculateOrganizationHealth(membership.organizationId);
    await detectDataQualityIssues({
      organizationId: membership.organizationId,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });

    revalidatePath("/imports");
    revalidatePath("/customers");
    revalidatePath("/mission-control");
    revalidatePath("/data-quality");

    return {
      successRows: summary.successRows,
      errorRows: summary.errorRows,
      duplicateRows: summary.duplicateRows,
      errors: summary.errors.slice(0, 25),
    };
  } catch (error) {
    if (error instanceof CsvImportError || error instanceof Error) return { error: error.message };
    throw error;
  }
}
