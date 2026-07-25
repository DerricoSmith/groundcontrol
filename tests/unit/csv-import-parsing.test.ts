import { describe, expect, it } from "vitest";
import { parseCsv, parseCustomerAccountCsv, validateFile, CsvImportError } from "@/lib/services/csv-import-service";

describe("parseCsv", () => {
  it("parses a simple comma-separated file", () => {
    const rows = parseCsv("a,b,c\n1,2,3\n");
    expect(rows).toEqual([["a", "b", "c"], ["1", "2", "3"]]);
  });

  it("handles quoted fields containing commas", () => {
    const rows = parseCsv('name,note\n"Acme, Inc.","Has a comma"\n');
    expect(rows).toEqual([["name", "note"], ["Acme, Inc.", "Has a comma"]]);
  });

  it("handles escaped quotes inside quoted fields", () => {
    const rows = parseCsv('name\n"Say ""hi"""\n');
    expect(rows).toEqual([["name"], ['Say "hi"']]);
  });
});

describe("validateFile", () => {
  it("rejects a non-csv file extension", () => {
    expect(() => validateFile({ fileName: "accounts.xlsx", sizeBytes: 100 })).toThrow(CsvImportError);
  });

  it("rejects a file name containing a path traversal attempt", () => {
    expect(() => validateFile({ fileName: "../../etc/passwd.csv", sizeBytes: 100 })).toThrow(CsvImportError);
  });

  it("rejects an oversized file", () => {
    expect(() => validateFile({ fileName: "accounts.csv", sizeBytes: 3 * 1024 * 1024 })).toThrow(/too large/);
  });

  it("accepts a normal small csv file", () => {
    expect(() => validateFile({ fileName: "accounts.csv", sizeBytes: 1024 })).not.toThrow();
  });
});

describe("parseCustomerAccountCsv", () => {
  it("throws when the file has no name column", () => {
    expect(() => parseCustomerAccountCsv("arr,segment\n1000,SMB\n")).toThrow(/name.*column/i);
  });

  it("throws on an empty file", () => {
    expect(() => parseCustomerAccountCsv("")).toThrow(/empty/i);
  });

  it("parses a valid row with only a name", () => {
    const result = parseCustomerAccountCsv("name\nAcme Co\n");
    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0]).toMatchObject({ name: "Acme Co", arr: undefined, renewalDate: undefined });
    expect(result.errors).toHaveLength(0);
  });

  it("reports a row missing the required name field as an error, not a crash", () => {
    const result = parseCustomerAccountCsv("name,arr\n,1000\nBeta Co,2000\n");
    expect(result.validRows).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/Missing required field: name/);
  });

  it("rejects an invalid renewal date", () => {
    const result = parseCustomerAccountCsv("name,renewal_date\nAcme Co,not-a-date\n");
    expect(result.errors[0].message).toMatch(/Invalid renewal date/);
  });

  it("rejects an unsupported currency", () => {
    const result = parseCustomerAccountCsv("name,currency\nAcme Co,CAD\n");
    expect(result.errors[0].message).toMatch(/Unsupported currency/);
  });

  it("rejects a negative or non-numeric revenue value", () => {
    const result = parseCustomerAccountCsv("name,arr\nAcme Co,not-a-number\n");
    expect(result.errors[0].message).toMatch(/Invalid revenue/);
  });

  it("accepts a fully populated valid row", () => {
    const result = parseCustomerAccountCsv(
      "name,owner_email,arr,currency,renewal_date,segment,tier,health\nAcme Co,owner@acme.com,50000,usd,2026-12-01,Mid-Market,Growth,watch\n"
    );
    expect(result.errors).toHaveLength(0);
    expect(result.validRows[0]).toMatchObject({
      name: "Acme Co",
      ownerEmail: "owner@acme.com",
      arr: 50000,
      currency: "USD",
      segment: "Mid-Market",
      tier: "Growth",
      health: "WATCH",
    });
  });
});
