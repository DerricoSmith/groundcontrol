import "server-only";

/**
 * Shared CSV primitives, generalized from the proven Customer Account
 * importer rather than reinvented. Every importer in this directory uses
 * these readers so error phrasing is identical across imports — a user who
 * learns to read one error report can read all of them.
 *
 * See CSV_IMPORT_ARCHITECTURE.md for what is and isn't handled (no BOM
 * stripping, no encoding detection, comma delimiter only).
 */

export class CsvImportError extends Error {}

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_ROWS = 5000;
export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "JPY"] as const;

export interface RowError {
  rowNumber: number;
  message: string;
}

/** Dependency-free CSV parser: quoted fields, escaped `""`, commas in quotes, CRLF or LF. */
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

export function normalizeHeader(h: string): string {
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

/** Parses raw text into a header list plus a per-row field accessor. Throws for structural problems (empty file, too many rows, missing required column). */
export function readCsvTable(csvText: string, requiredColumns: string[]): {
  headers: string[];
  rows: Array<{ rowNumber: number; get: (column: string) => string | undefined }>;
} {
  const raw = parseCsv(csvText);
  if (raw.length === 0) throw new CsvImportError("The file is empty.");
  if (raw.length - 1 > MAX_ROWS) throw new CsvImportError(`Too many rows — the limit is ${MAX_ROWS}.`);

  const headers = raw[0].map(normalizeHeader);
  for (const required of requiredColumns) {
    if (!headers.includes(required)) {
      throw new CsvImportError(`The file must have a "${required}" column.`);
    }
  }

  const index = new Map(headers.map((h, i) => [h, i]));
  const rows = raw.slice(1).map((cells, i) => ({
    rowNumber: i + 1, // header excluded from numbering
    get: (column: string) => {
      const idx = index.get(column);
      const value = idx === undefined ? undefined : cells[idx]?.trim();
      return value === "" ? undefined : value;
    },
  }));

  return { headers, rows };
}

// ---------------------------------------------------------------------------
// Typed field readers
//
// Each returns { ok: true, value } or { ok: false, message }. Callers
// accumulate the message into the row's error list — no reader ever throws
// for bad data, only for a structurally broken file.
// ---------------------------------------------------------------------------

export type FieldResult<T> = { ok: true; value: T } | { ok: false; message: string };

export function readRequiredString(raw: string | undefined, label: string): FieldResult<string> {
  if (!raw) return { ok: false, message: `Missing required field: ${label}.` };
  return { ok: true, value: raw };
}

export function readNumber(raw: string | undefined, label: string, opts: { min?: number; max?: number } = {}): FieldResult<number | undefined> {
  if (raw === undefined) return { ok: true, value: undefined };
  const parsed = Number(raw.replace(/[,$]/g, ""));
  if (Number.isNaN(parsed)) return { ok: false, message: `Invalid ${label}: "${raw}".` };
  if (opts.min !== undefined && parsed < opts.min) {
    return { ok: false, message: `Invalid ${label}: "${raw}". Must be at least ${opts.min}.` };
  }
  if (opts.max !== undefined && parsed > opts.max) {
    return { ok: false, message: `Invalid ${label}: "${raw}". Must be at most ${opts.max}.` };
  }
  return { ok: true, value: parsed };
}

export function readInteger(raw: string | undefined, label: string, opts: { min?: number } = {}): FieldResult<number | undefined> {
  const result = readNumber(raw, label, opts);
  if (!result.ok || result.value === undefined) return result;
  if (!Number.isInteger(result.value)) return { ok: false, message: `Invalid ${label}: "${raw}". Must be a whole number.` };
  return result;
}

export function readPercentage(raw: string | undefined, label: string): FieldResult<number | undefined> {
  return readNumber(raw?.replace("%", ""), label, { min: 0, max: 100 });
}

export function readDate(raw: string | undefined, label: string): FieldResult<Date | undefined> {
  if (raw === undefined) return { ok: true, value: undefined };
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return { ok: false, message: `Invalid ${label}: "${raw}". Use YYYY-MM-DD.` };
  return { ok: true, value: parsed };
}

export function readRequiredDate(raw: string | undefined, label: string): FieldResult<Date> {
  if (!raw) return { ok: false, message: `Missing required field: ${label}.` };
  const result = readDate(raw, label);
  if (!result.ok) return result;
  return { ok: true, value: result.value! };
}

export function readBoolean(raw: string | undefined): boolean | undefined {
  if (raw === undefined) return undefined;
  const normalized = raw.toLowerCase();
  if (["true", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "no", "n", "0"].includes(normalized)) return false;
  return undefined;
}

export function readEnum<T extends string>(
  raw: string | undefined,
  label: string,
  allowed: readonly T[]
): FieldResult<T | undefined> {
  if (raw === undefined) return { ok: true, value: undefined };
  const normalized = raw.toUpperCase().replace(/[\s-]+/g, "_") as T;
  if (!allowed.includes(normalized)) {
    return { ok: false, message: `Invalid ${label}: "${raw}". Expected one of ${allowed.join(", ")}.` };
  }
  return { ok: true, value: normalized };
}

export function readCurrency(raw: string | undefined): FieldResult<string | undefined> {
  if (raw === undefined) return { ok: true, value: undefined };
  const normalized = raw.toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(normalized as (typeof SUPPORTED_CURRENCIES)[number])) {
    return { ok: false, message: `Unsupported currency: "${raw}". Supported: ${SUPPORTED_CURRENCIES.join(", ")}.` };
  }
  return { ok: true, value: normalized };
}

/** Collects field results for one row; call `.fail()` to test whether the row should be skipped. */
export class RowCollector {
  private error: string | null = null;

  take<T>(result: FieldResult<T>): T | undefined {
    if (this.error) return undefined;
    if (!result.ok) {
      this.error = result.message;
      return undefined;
    }
    return result.value;
  }

  reject(message: string): void {
    if (!this.error) this.error = message;
  }

  get failure(): string | null {
    return this.error;
  }
}
