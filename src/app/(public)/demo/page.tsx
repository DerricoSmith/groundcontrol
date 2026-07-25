import type { Metadata } from "next";
import Link from "next/link";
import type { HealthCategory } from "@prisma/client";
import { getDemoPortfolio, getDemoAccounts, DemoUnavailableError } from "@/lib/demo/demo-data";
import { DEMO_STEPS } from "@/lib/demo/demo-config";
import { DemoChrome, DemoUnavailable } from "./demo-chrome";

export const metadata: Metadata = {
  title: "Live demo",
  description:
    "A working Ground Control workspace on a fictional fourteen account portfolio. No account required.",
  alternates: { canonical: "/demo" },
};

export const dynamic = "force-dynamic";

const HEALTH_LABEL: Record<HealthCategory, string> = {
  STRONG: "Strong",
  STABLE: "Stable",
  WATCH: "Watch",
  AT_RISK: "At Risk",
  CRITICAL: "Critical",
};
const HEALTH_BAR: Record<HealthCategory, string> = {
  STRONG: "bg-health-strong",
  STABLE: "bg-health-stable",
  WATCH: "bg-health-watch",
  AT_RISK: "bg-health-at-risk",
  CRITICAL: "bg-health-critical",
};

export default async function DemoPage() {
  let data: Awaited<ReturnType<typeof getDemoPortfolio>>;
  let accountData: Awaited<ReturnType<typeof getDemoAccounts>>;
  try {
    [data, accountData] = await Promise.all([getDemoPortfolio(), getDemoAccounts()]);
  } catch (error) {
    if (error instanceof DemoUnavailableError) return <DemoUnavailable message={error.message} />;
    throw error;
  }

  const { summary } = data;
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const maxCount = Math.max(1, ...summary.healthDistribution.map((entry) => entry.accounts));

  const externalIdByAccountId = new Map(accountData.accounts.map((a) => [a.id, a.externalId]));

  return (
    <DemoChrome
      current="/demo"
      title="Mission Control"
      description="What changed, what needs attention, and what the data can support. This is the first screen a customer success leader opens."
    >
      <ol className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_STEPS.map((step, index) => (
          <li key={step.key} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-[11.5px] font-medium uppercase tracking-wide text-brand">Step {index + 1}</p>
            <h2 className="mt-1 text-[14px] font-medium text-text-primary">{step.label}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{step.question}</p>
            <Link href={step.href} className="mt-2 inline-block text-[12.5px] font-medium text-brand hover:text-brand-hover">
              Go there
            </Link>
          </li>
        ))}
      </ol>
      <p className="mb-8 text-[13px] text-text-muted">
        That sequence is a suggestion. Every page is reachable from the navigation above, in any order.
      </p>

      {/* data-shot marks the product region the showcase screenshots capture,
          so an image shows the application rather than the surrounding site. */}
      <div data-shot="mission-control" className="rounded-xl bg-background p-1">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile label="Customer accounts" value={String(summary.accountCount)} note={`${summary.accountsMissingArr} without revenue on file`} />
        <MetricTile
          label="Revenue at risk"
          value={money.format(summary.arrInAtRiskAccounts)}
          note={`of ${money.format(summary.totalArr)} across the portfolio`}
          tone="danger"
        />
        <MetricTile
          label="Renewing in 90 days"
          value={money.format(summary.arrRenewingNext90Days)}
          note={`${summary.renewalsNext90Days} renewals`}
          tone="warning"
        />
        <MetricTile label="Open risks" value={String(summary.openRisks)} note={`${summary.criticalRisks} critical`} tone="danger" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-serif text-[19px] font-medium text-text-primary">What needs attention</h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Accounts with an open escalation or risk, most exposed revenue first.
            </p>
            {summary.needsAttention.length === 0 ? (
              <p className="mt-4 text-[13.5px] text-text-muted">
                No account currently has an open risk or escalation.
              </p>
            ) : (
              <ul className="mt-5 space-y-3">
                {summary.needsAttention.map((item) => {
                  const externalId = externalIdByAccountId.get(item.accountId);
                  return (
                    <li key={item.accountId} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                      <div>
                        {externalId ? (
                          <Link href={`/demo/accounts/${externalId}`} className="text-[14px] font-medium text-brand hover:text-brand-hover">
                            {item.accountName}
                          </Link>
                        ) : (
                          <span className="text-[14px] font-medium text-text-primary">{item.accountName}</span>
                        )}
                        <p className="text-[13px] text-text-primary">{item.headline}</p>
                        <p className="text-[12.5px] text-text-muted">{item.detail}</p>
                      </div>
                      <span className="shrink-0 text-[13px] tabular-nums text-text-secondary">
                        {item.arr > 0 ? money.format(item.arr) : "No revenue on file"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-serif text-[19px] font-medium text-text-primary">Health distribution</h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              {summary.accountsNotAssessed > 0
                ? `${summary.accountCount - summary.accountsNotAssessed} of ${summary.accountCount} accounts scored. ${summary.accountsNotAssessed} have never been assessed and are excluded below.`
                : `All ${summary.accountCount} accounts scored.`}
            </p>
            <ul className="mt-5 space-y-2.5">
              {summary.healthDistribution.map((entry) => (
                <li key={entry.category} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-[12.5px] text-text-secondary">{HEALTH_LABEL[entry.category]}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-soft">
                    <span
                      className={`block h-full rounded-full ${HEALTH_BAR[entry.category]}`}
                      style={{ width: `${(entry.accounts / maxCount) * 100}%` }}
                    />
                  </span>
                  <span className="w-32 shrink-0 text-right text-[12.5px] tabular-nums text-text-secondary">
                    {entry.accounts} · {money.format(entry.arr)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-serif text-[19px] font-medium text-text-primary">Ownership and follow-through</h2>
            <dl className="mt-4 space-y-2.5 text-[13.5px]">
              <Row label="Accounts without an owner" value={summary.accountsWithoutOwner} />
              <Row label="Actions without an owner" value={summary.unassignedActions} />
              <Row label="Actions past their due date" value={summary.overdueActions} />
              <Row label="Accounts without a renewal date" value={summary.renewalsMissingDate} />
              <Row label="Open escalations" value={summary.openEscalations} />
              <Row label="Open data quality issues" value={summary.openDataQualityIssues} />
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-serif text-[19px] font-medium text-text-primary">Why this is believable</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-text-secondary">
              Revenue at risk counts each account once, never once per risk. Accounts that have never been scored are
              excluded from the distribution rather than counted as healthy. Both are deliberate, and both were bugs
              caught by using the product rather than reading it.
            </p>
          </section>
        </div>
      </div>
      </div>
    </DemoChrome>
  );
}

function MetricTile({
  label,
  value,
  note,
  tone = "brand",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "brand" | "danger" | "warning";
}) {
  // warning-strong rather than warning: amber is legible as a dot or a bar but
  // fails contrast as text on a light surface.
  const toneClass = tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning-strong" : "text-brand";
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-[12.5px] font-medium text-text-secondary">{label}</p>
      <p className={`mt-2 text-[24px] font-semibold tabular-nums tracking-tight ${toneClass}`}>{value}</p>
      <p className="mt-1 text-[12px] text-text-muted">{note}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="tabular-nums text-text-primary">{value}</dd>
    </div>
  );
}
