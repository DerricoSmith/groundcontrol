import type { Metadata } from "next";
import Link from "next/link";
import { getDemoRisks, DemoUnavailableError } from "@/lib/demo/demo-data";
import { formatRiskExplanation } from "@/lib/services/risk-engine";
import { DemoChrome, DemoUnavailable } from "../demo-chrome";

export const metadata: Metadata = {
  title: "Demo risk radar",
  description: "Deterministic risk signals detected across the fictional demonstration portfolio.",
  alternates: { canonical: "/demo/risks" },
};

export const dynamic = "force-dynamic";

export default async function DemoRisksPage() {
  let data: Awaited<ReturnType<typeof getDemoRisks>>;
  try {
    data = await getDemoRisks();
  } catch (error) {
    if (error instanceof DemoUnavailableError) return <DemoUnavailable message={error.message} />;
    throw error;
  }

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  // Counted once per account, never once per risk.
  const exposureByAccount = new Map<string, number>();
  for (const risk of data.risks) exposureByAccount.set(risk.customerAccountId, risk.revenueExposure);
  const totalExposure = [...exposureByAccount.values()].reduce((sum, arr) => sum + arr, 0);

  return (
    <DemoChrome
      current="/demo/risks"
      title="Risk radar"
      description="Every risk here was produced by a deterministic rule from imported evidence. Nothing is inferred, and nothing is raised from absent data."
    >
      <div className="mb-6 rounded-xl border border-border bg-surface p-5">
        <p className="text-[14px] text-text-primary">
          <span className="font-medium">{data.risks.length} open risks</span> across{" "}
          <span className="font-medium">{exposureByAccount.size} accounts</span>, holding{" "}
          <span className="font-medium tabular-nums">{money.format(totalExposure)}</span> in revenue.
        </p>
        <p className="mt-1 text-[12.5px] text-text-muted">
          Revenue is counted once per account. An account with six open risks contributes its revenue once.
        </p>
      </div>

      <div data-shot="risks" className="space-y-4">
        {data.risks.map((risk) => (
          <article key={risk.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={`/demo/accounts/${risk.customerAccount.externalId}`}
                  className="text-[12.5px] font-medium text-brand hover:text-brand-hover"
                >
                  {risk.customerAccount.name}
                </Link>
                <h2 className="mt-0.5 text-[15px] font-medium text-text-primary">
                  {risk.title.replace(`${risk.customerAccount.name}: `, "")}
                </h2>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full border border-border px-2.5 py-0.5 text-[11.5px] text-text-secondary">
                  {risk.severity}
                </span>
                <span className="rounded-full border border-border px-2.5 py-0.5 text-[11.5px] tabular-nums text-text-secondary">
                  {money.format(risk.revenueExposure)}
                </span>
              </div>
            </div>

            <dl className="mt-3 space-y-1.5 text-[13px]">
              {formatRiskExplanation(risk).map((part) => (
                <div key={part.label}>
                  <dt className="inline font-medium text-text-primary">{part.label}: </dt>
                  <dd className="inline text-text-secondary">{part.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </DemoChrome>
  );
}
