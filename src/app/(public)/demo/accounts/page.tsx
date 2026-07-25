import type { Metadata } from "next";
import Link from "next/link";
import type { HealthCategory } from "@prisma/client";
import { getDemoAccounts, DemoUnavailableError } from "@/lib/demo/demo-data";
import { DemoChrome, DemoUnavailable } from "../demo-chrome";

export const metadata: Metadata = {
  title: "Demo portfolio",
  description: "The fictional customer portfolio behind the Ground Control demonstration.",
  alternates: { canonical: "/demo/accounts" },
};

export const dynamic = "force-dynamic";

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

export default async function DemoAccountsPage() {
  let data: Awaited<ReturnType<typeof getDemoAccounts>>;
  try {
    data = await getDemoAccounts();
  } catch (error) {
    if (error instanceof DemoUnavailableError) return <DemoUnavailable message={error.message} />;
    throw error;
  }

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <DemoChrome
      current="/demo/accounts"
      title="Customer portfolio"
      description="Every account, with what is known and what is missing. Open any row to see the evidence behind its score."
    >
      <div data-shot="portfolio" className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[860px] text-left text-[13.5px]">
          <caption className="sr-only">Fictional customer accounts with health, revenue, renewal date, and open risk counts</caption>
          <thead>
            <tr className="border-b border-border text-[12.5px] text-text-muted">
              <th scope="col" className="px-4 py-3 font-medium">Account</th>
              <th scope="col" className="px-4 py-3 font-medium">Owner</th>
              <th scope="col" className="px-4 py-3 font-medium">Segment</th>
              <th scope="col" className="px-4 py-3 font-medium">Revenue</th>
              <th scope="col" className="px-4 py-3 font-medium">Renewal</th>
              <th scope="col" className="px-4 py-3 font-medium">Health</th>
              <th scope="col" className="px-4 py-3 font-medium">Open risks</th>
              <th scope="col" className="px-4 py-3 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {data.accounts.map((account) => {
              const severe = account.riskSignals.filter((r) => r.severity === "CRITICAL" || r.severity === "HIGH").length;
              return (
                <tr key={account.id} className="border-b border-border last:border-0">
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    <Link href={`/demo/accounts/${account.externalId}`} className="text-brand hover:text-brand-hover">
                      {account.name}
                    </Link>
                  </th>
                  <td className="px-4 py-3 text-text-secondary">{account.owner?.name ?? <span className="text-text-muted">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-text-secondary">{account.segment ?? <span className="text-text-muted">Not set</span>}</td>
                  <td className="px-4 py-3 tabular-nums text-text-secondary">
                    {account.arr > 0 ? money.format(account.arr) : <span className="text-text-muted">Not on file</span>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {account.renewalDate ? account.renewalDate.toLocaleDateString() : <span className="text-text-muted">Not set</span>}
                  </td>
                  <td className="px-4 py-3">
                    {account.healthCalculatedAt === null ? (
                      <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[12px] font-medium text-text-muted">Not assessed</span>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${HEALTH_TONE[account.healthCategory]}`}>
                        {HEALTH_LABEL[account.healthCategory]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-text-secondary">
                    {account.riskSignals.length}
                    {severe > 0 && <span className="ml-1.5 text-[12px] text-danger">({severe} severe)</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-text-secondary">{Math.round(account.dataConfidence * 100)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-text-muted">
        Bastion Retail Group is deliberately incomplete: no revenue, no renewal date, no owner, no contacts. It is shown
        as unmeasured rather than healthy, which is the behaviour that matters most when a real portfolio is imported
        halfway.
      </p>
    </DemoChrome>
  );
}
