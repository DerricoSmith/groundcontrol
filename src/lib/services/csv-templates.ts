// Pure, dependency-free CSV helpers — deliberately kept out of
// csv-import-service.ts (which imports "server-only" and Prisma) so client
// components like import-accounts-step.tsx can generate a sample file or an
// error report locally without pulling server-only code into the browser
// bundle.

export interface CsvRowError {
  rowNumber: number;
  message: string;
}

export function generateErrorCsv(errors: CsvRowError[]): string {
  const lines = ["row,error", ...errors.map((e) => `${e.rowNumber},"${e.message.replace(/"/g, '""')}"`)];
  return lines.join("\n");
}

export function generateSampleCsv(): string {
  return [
    "name,owner_email,arr,currency,renewal_date,segment,tier,health",
    "Acme Logistics,,84000,USD,2026-11-15,Mid-Market,Growth,STABLE",
    "Brightline Health,,152000,USD,2026-09-01,Enterprise,Strategic,WATCH",
    "Coastal Analytics,,26000,USD,,SMB,Standard,",
  ].join("\n");
}
