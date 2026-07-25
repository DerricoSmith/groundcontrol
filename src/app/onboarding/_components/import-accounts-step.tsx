"use client";

import * as React from "react";
import { Download, Upload, CircleAlert, CheckCircle2 } from "lucide-react";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Button } from "@/components/ui/button";
import { StepHeader } from "./step-header";
import { previewImportAction, commitImportAction, type ImportPreviewResult } from "@/lib/actions/onboarding-actions";
import { generateSampleCsv, generateErrorCsv } from "@/lib/services/csv-templates";

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportAccountsStep({ existingAccountCount }: { existingAccountCount: number }) {
  const [preview, setPreview] = React.useState<ImportPreviewResult | null>(null);
  const [pending, setPending] = React.useState(false);
  const [summary, setSummary] = React.useState<{ successRows: number; errorRows: number; duplicateRows: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(true);
    setError(null);
    setSummary(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await previewImportAction(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      setPreview(null);
    } else {
      setPreview(result);
    }
  }

  async function handleConfirm() {
    if (!preview?.fileName || !preview.csvText) return;
    setPending(true);
    const result = await commitImportAction(preview.fileName, preview.csvText);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.summary) {
      setSummary(result.summary);
    }
  }

  return (
    <div>
      <StepHeader
        eyebrow="Customer accounts"
        title="Import your customer accounts"
        description="Only a customer name is required. Everything else can be added now, later, or never."
        effort="Moderate"
      />

      <SurfaceCard className="p-6">
        {existingAccountCount > 0 && (
          <p className="mb-4 text-[13px] text-text-secondary">{existingAccountCount} account{existingAccountCount === 1 ? "" : "s"} already imported. You can import more.</p>
        )}

        <button
          type="button"
          onClick={() => downloadText("ground-control-sample-accounts.csv", generateSampleCsv())}
          className="mb-4 flex items-center gap-1.5 text-[13px] text-brand hover:text-brand-hover"
        >
          <Download className="h-3.5 w-3.5" /> Download sample CSV
        </button>

        {!summary && (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface-soft px-6 py-10 text-center">
            <Upload className="h-5 w-5 text-brand" />
            <span className="text-[13.5px] font-medium text-text-primary">Choose a CSV file</span>
            <span className="text-[12px] text-text-muted">Up to 2MB, up to 5,000 rows</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </label>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft p-3 text-[13px] text-text-primary">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            {error}
          </div>
        )}

        {preview && !summary && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-border p-4">
              <p className="text-[13.5px] font-medium text-text-primary">{preview.fileName}</p>
              <p className="mt-1 text-[13px] text-text-secondary">
                {preview.validRowCount} valid row{preview.validRowCount === 1 ? "" : "s"}
                {preview.errorCount ? `, ${preview.errorCount} row${preview.errorCount === 1 ? "" : "s"} with errors` : ""}.
              </p>
              {preview.sampleNames && preview.sampleNames.length > 0 && (
                <p className="mt-2 text-[12.5px] text-text-muted">Includes: {preview.sampleNames.join(", ")}{preview.validRowCount! > 5 ? "…" : ""}</p>
              )}
            </div>

            {preview.errors && preview.errors.length > 0 && (
              <div className="rounded-lg border border-warning/25 bg-warning-soft p-3">
                <p className="text-[12.5px] font-medium text-warning">Row errors (first {preview.errors.length})</p>
                <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto text-[12px] text-text-secondary">
                  {preview.errors.map((e, i) => (
                    <li key={i}>Row {e.rowNumber}: {e.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="button" disabled={pending || preview.validRowCount === 0} onClick={handleConfirm} className="bg-brand text-white hover:bg-brand-hover">
                {pending ? "Importing..." : `Import ${preview.validRowCount} account${preview.validRowCount === 1 ? "" : "s"}`}
              </Button>
              <button type="button" onClick={() => setPreview(null)} className="text-[13px] text-text-muted hover:text-text-primary">
                Choose a different file
              </button>
            </div>
          </div>
        )}

        {summary && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-positive/25 bg-positive-soft p-3 text-[13.5px] text-text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-positive" />
              Imported {summary.successRows} account{summary.successRows === 1 ? "" : "s"}.
              {summary.duplicateRows > 0 && ` ${summary.duplicateRows} duplicate${summary.duplicateRows === 1 ? "" : "s"} skipped.`}
              {summary.errorRows > 0 && ` ${summary.errorRows} row${summary.errorRows === 1 ? "" : "s"} had errors and were not imported.`}
            </div>
            {preview?.errors && preview.errors.length > 0 && (
              <button
                type="button"
                onClick={() => downloadText("import-errors.csv", generateErrorCsv(preview.errors!))}
                className="flex items-center gap-1.5 text-[13px] text-brand hover:text-brand-hover"
              >
                <Download className="h-3.5 w-3.5" /> Download error report
              </button>
            )}
            <Button
              type="button"
              onClick={() => {
                // A plain router.push() can serve a stale Router Cache entry for
                // "/onboarding" here even after revalidatePath() in the server
                // action — a full navigation guarantees the freshly-persisted
                // currentStep is what gets read.
                window.location.assign("/onboarding");
              }}
              className="bg-brand text-white hover:bg-brand-hover"
            >
              Continue
            </Button>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
