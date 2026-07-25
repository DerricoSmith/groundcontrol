import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { HealthCategory } from "@prisma/client";
import { getDemoAccount, DemoUnavailableError } from "@/lib/demo/demo-data";
import { formatRiskExplanation } from "@/lib/services/risk-engine";
import { DemoChrome, DemoUnavailable } from "../../demo-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demo account detail",
  description: "The evidence behind one fictional account's health score and open risks.",
  robots: { index: false },
};

const HEALTH_LABEL: Record<HealthCategory, string> = {
  STRONG: "Strong",
  STABLE: "Stable",
  WATCH: "Watch",
  AT_RISK: "At Risk",
  CRITICAL: "Critical",
};
const HEALTH_TONE: Record<HealthCategory, string> = {
  STRONG: "bg-health-strong-soft text-health-strong",
  STABLE: "bg-health-stable-soft text-health-stable",
  WATCH: "bg-health-watch-soft text-health-watch",
  AT_RISK: "bg-health-at-risk-soft text-health-at-risk",
  CRITICAL: "bg-health-critical-soft text-health-critical",
};

const COMPONENT_LABELS: Record<string, string> = {
  PRODUCT_ADOPTION: "Product adoption",
  CUSTOMER_RELATIONSHIP: "Customer relationship",
  SUPPORT_EXPERIENCE: "Support experience",
  COMMERCIAL_POSITION: "Commercial position",
  BUSINESS_OUTCOMES: "Business outcomes",
};

function sentenceCase(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

export default async function DemoAccountDetailPage({
  params,
}: {
  params: Promise<{ externalId: string }>;
}) {
  const { externalId } = await params;

  let result: Awaited<ReturnType<typeof getDemoAccount>>;
  try {
    result = await getDemoAccount(externalId);
  } catch (error) {
    if (error instanceof DemoUnavailableError) return <DemoUnavailable message={error.message} />;
    throw error;
  }
  if (!result) notFound();

  const { account, health, metrics } = result;
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: account.currency || "USD", maximumFractionDigits: 0 });
  const renewal = account.renewals.find((r) => r.status !== "RENEWED" && r.status !== "CHURNED");

  return (
    <DemoChrome
      current="/demo/accounts"
      title={account.name}
      description="Everything below is derived from imported records. Each component shows its own score, weight, confidence, and the evidence behind it."
    >
      <Link href="/demo/accounts" className="mb-6 inline-block text-[13px] text-text-muted hover:text-text-primary">
        Back to the portfolio
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${HEALTH_TONE[health.category]}`}>
          {HEALTH_LABEL[health.category]} · {Math.round(health.overallScore)}
        </span>
        <span className="rounded-full border border-border px-3 py-1 text-[12.5px] text-text-secondary">
          {Math.round(health.dataConfidence * 100)}% data confidence
        </span>
        {account.segment && (
          <span className="rounded-full border border-border px-3 py-1 text-[12.5px] text-text-secondary">{account.segment}</span>
        )}
        <span className="rounded-full border border-border px-3 py-1 text-[12.5px] text-text-secondary">
          {account.arr > 0 ? money.format(account.arr) : "No revenue on file"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section data-shot="account-detail" className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-serif text-[19px] font-medium text-text-primary">How this score was produced</h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Model {health.calculationVersion}. Components with no supporting data are excluded and their weight is
              redistributed across the rest.
            </p>
            <div className="mt-5 space-y-4">
              {health.components.map((component) => (
                <div key={component.type} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[14px] font-medium text-text-primary">
                      {COMPONENT_LABELS[component.type] ?? component.type}
                    </h3>
                    <p className="text-[12.5px] tabular-nums text-text-secondary">
                      Score {Math.round(component.score)} · weight {Math.round(component.weight * 100)}% · confidence{" "}
                      {Math.round(component.confidence * 100)}%
                    </p>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">{sentenceCase(component.explanation)}</p>
                  {component.evidence.length > 0 && (
                    <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[12px] text-text-muted">
                      {component.evidence.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-serif text-[19px] font-medium text-text-primary">
              Open risks ({account.riskSignals.length})
            </h2>
            {account.riskSignals.length === 0 ? (
              <p className="mt-3 text-[13.5px] text-text-muted">
                No open risk signals. That is not the same as no risk: it means no rule the current data can evaluate is
                triggering.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {account.riskSignals.map((risk) => (
                  <div key={risk.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-[14px] font-medium text-text-primary">
                        {risk.title.replace(`${account.name}: `, "")}
                      </h3>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11.5px] text-text-secondary">
                        {risk.severity}
                      </span>
                    </div>
                    <dl className="mt-2 space-y-1.5 text-[13px]">
                      {formatRiskExplanation(risk).map((part) => (
                        <div key={part.label}>
                          <dt className="inline font-medium text-text-primary">{part.label}: </dt>
                          <dd className="inline text-text-secondary">{part.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-serif text-[17px] font-medium text-text-primary">Renewal</h2>
            {!renewal ? (
              <p className="mt-2 text-[13px] text-text-muted">No open renewal record on this account.</p>
            ) : (
              <div className="mt-2 space-y-1 text-[13px]">
                <p className="text-text-primary">{renewal.periodEnd.toLocaleDateString()}</p>
                <p className="text-text-secondary">
                  {money.format(renewal.arr)} · {renewal.forecastCategory.replace(/_/g, " ").toLowerCase()}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-serif text-[17px] font-medium text-text-primary">Relationship</h2>
            <p className="mt-2 text-[13px] text-text-secondary">
              Executive engagement: {metrics.relationship.executiveEngagement.replace(/_/g, " ").toLowerCase()}
            </p>
            {account.contacts.length === 0 ? (
              <p className="mt-2 text-[13px] text-text-muted">
                No contacts on file, so champion and sponsor coverage cannot be assessed.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5 text-[13px]">
                {account.contacts.map((contact) => (
                  <li key={contact.id}>
                    <span className="text-text-primary">{contact.name}</span>
                    {contact.title && <span className="text-text-muted">, {contact.title}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-serif text-[17px] font-medium text-text-primary">Open actions</h2>
            {account.recommendedActions.length === 0 ? (
              <p className="mt-2 text-[13px] text-text-muted">No open actions.</p>
            ) : (
              <ul className="mt-3 space-y-2.5 text-[13px]">
                {account.recommendedActions.map((action) => (
                  <li key={action.id}>
                    <p className="text-text-primary">{action.title}</p>
                    <p className="text-[12px] text-text-muted">{action.status} · {action.priority}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {account.dataQualityIssues.length > 0 && (
            <section className="rounded-xl border border-border bg-surface p-6">
              <h2 className="font-serif text-[17px] font-medium text-text-primary">Data quality</h2>
              <ul className="mt-3 space-y-2.5 text-[13px]">
                {account.dataQualityIssues.map((issue) => (
                  <li key={issue.id}>
                    <p className="text-text-primary">{issue.explanation}</p>
                    <p className="text-[12px] text-text-muted">{issue.suggestedResolution}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </DemoChrome>
  );
}
