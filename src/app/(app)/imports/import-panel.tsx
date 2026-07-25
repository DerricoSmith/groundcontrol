"use client";

import * as React from "react";
import { Download, Upload, CircleAlert, CheckCircle2 } from "lucide-react";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { Button } from "@/components/ui/button";
import {
  previewIntelligenceImport,
  commitIntelligenceImport,
  type ImportKind,
  type ImportPreview,
} from "@/lib/actions/import-actions";
import { SAMPLE_FILES, IMPORT_DESCRIPTIONS, type SampleFileKind } from "@/lib/services/import/sample-files";

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const KINDS: SampleFileKind[] = ["contact", "renewal", "product_usage", "support_ticket", "interaction"];

export function ImportPanel() {
  const [kind, setKind] = React.useState<ImportKind>("contact");
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{ successRows: number; errorRows: number; duplicateRows: number } | null>(null);

  const description = IMPORT_DESCRIPTIONS[kind as SampleFileKind];

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("file", file);
    const previewResult = await previewIntelligenceImport(formData);
    setPending(false);

    if (previewResult.error) {
      setError(previewResult.error);
      setPreview(null);
    } else {
      setPreview(previewResult);
    }
    e.target.value = "";
  }

  async function handleCommit() {
    if (!preview?.fileName || !preview.csvText) return;
    setPending(true);
    const commitResult = await commitIntelligenceImport(kind, preview.fileName, preview.csvText);
    setPending(false);

    if (commitResult.error) {
      setError(commitResult.error);
      return;
    }
    setResult({
      successRows: commitResult.successRows ?? 0,
      errorRows: commitResult.errorRows ?? 0,
      duplicateRows: commitResult.duplicateRows ?? 0,
    });
    setPreview((current) => (current ? { ...current, errors: commitResult.errors } : current));
  }

  return (
    <SurfaceCard className="p-6">
      <CardTitle title="Import data" subtitle="Health and data quality are recalculated automatically after every import." />

      <div className="mt-4 flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              setPreview(null);
              setResult(null);
              setError(null);
            }}
            className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
              kind === k ? "border-brand bg-brand-soft font-medium text-brand" : "border-border text-text-secondary hover:bg-surface-soft"
            }`}
          >
            {IMPORT_DESCRIPTIONS[k].label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface-soft p-4">
        <p className="text-[13px] text-text-secondary">
          <span className="font-medium text-text-primary">Required: </span>
          {description.required}
        </p>
        <p className="mt-1 text-[13px] text-text-secondary">
          <span className="font-medium text-text-primary">Unlocks: </span>
          {description.unlocks}
        </p>
        <button
          type="button"
          onClick={() => downloadText(SAMPLE_FILES[kind as SampleFileKind].fileName, SAMPLE_FILES[kind as SampleFileKind].content)}
          className="mt-3 flex items-center gap-1.5 text-[13px] text-brand hover:text-brand-hover"
        >
          <Download className="h-3.5 w-3.5" /> Download sample CSV
        </button>
      </div>

      {!result && (
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface-soft px-6 py-8 text-center">
          <Upload className="h-5 w-5 text-brand" />
          <span className="text-[13.5px] font-medium text-text-primary">Choose a CSV file</span>
          <span className="text-[12px] text-text-muted">Up to 2MB, up to 5,000 rows</span>
          <input type="file" accept=".csv" className="hidden" onChange={handleFile} disabled={pending} />
        </label>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft p-3 text-[13px] text-text-primary">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          {error}
        </div>
      )}

      {preview && !result && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-border p-4">
            <p className="text-[13.5px] font-medium text-text-primary">{preview.fileName}</p>
            <p className="mt-1 text-[13px] text-text-secondary">
              {preview.validRowCount} valid row{preview.validRowCount === 1 ? "" : "s"}
              {preview.errorCount ? `, ${preview.errorCount} row${preview.errorCount === 1 ? "" : "s"} with errors` : ""}.
            </p>
          </div>

          {preview.errors && preview.errors.length > 0 && (
            <div className="rounded-lg border border-warning/25 bg-warning-soft p-3">
              <p className="text-[12.5px] font-medium text-warning">Row errors</p>
              <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-[12px] text-text-secondary">
                {preview.errors.map((e, i) => (
                  <li key={i}>Row {e.rowNumber}: {e.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="button" disabled={pending || preview.validRowCount === 0} onClick={handleCommit} className="bg-brand text-white hover:bg-brand-hover">
              {pending ? "Importing..." : `Import ${preview.validRowCount} row${preview.validRowCount === 1 ? "" : "s"}`}
            </Button>
            <button type="button" onClick={() => setPreview(null)} className="text-[13px] text-text-muted hover:text-text-primary">
              Choose a different file
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-positive/25 bg-positive-soft p-3 text-[13.5px] text-text-primary">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
            <span>
              Imported {result.successRows} row{result.successRows === 1 ? "" : "s"}.
              {result.duplicateRows > 0 && ` ${result.duplicateRows} duplicate${result.duplicateRows === 1 ? "" : "s"} handled.`}
              {result.errorRows > 0 && ` ${result.errorRows} row${result.errorRows === 1 ? "" : "s"} had errors.`} Health and data
              quality have been recalculated.
            </span>
          </div>
          {preview?.errors && preview.errors.length > 0 && (
            <button
              type="button"
              onClick={() =>
                downloadText(
                  "import-errors.csv",
                  ["row,error", ...preview.errors!.map((e) => `${e.rowNumber},"${e.message.replace(/"/g, '""')}"`)].join("\n")
                )
              }
              className="flex items-center gap-1.5 text-[13px] text-brand hover:text-brand-hover"
            >
              <Download className="h-3.5 w-3.5" /> Download error report
            </button>
          )}
          <Button type="button" onClick={() => window.location.reload()} className="bg-brand text-white hover:bg-brand-hover">
            Done
          </Button>
        </div>
      )}
    </SurfaceCard>
  );
}
