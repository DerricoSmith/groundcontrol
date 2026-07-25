import type { Metadata } from "next";
import Link from "next/link";
import { getDemoRenewals, DemoUnavailableError } from "@/lib/demo/demo-data";
import { daysUntil } from "@/lib/dates";
import { DemoChrome, DemoUnavailable } from "../demo-chrome";

export const metadata: Metadata = {
  title: "Demo renewals",
  description: "Upcoming renewals and their preparation state in the fictional demonstration portfolio.",
  alternates: { canonical: "/demo/renewals" },
};

export const dynamic = "force-dynamic";

export default async function DemoRenewalsPage() {
  let data: Awaited<ReturnType<typeof getDemoRenewals>>;
  try {
    data = await getDemoRenewals();
  } catch (error) {
    if (error instanceof DemoUnavailableError) return <DemoUnavailable message={error.message} />;
    throw error;
  }

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const total = data.renewals.reduce((sum, renewal) => sum + renewal.arr, 0);

  return (
    <DemoChrome
      current="/demo/renewals"
      title="Renewal center"
      description="What is closing and how prepared it is. The forecast category is produced by rules from data on file. It is not a prediction and the product never calls it one."
    >
      <div className="mb-6 rounded-xl border border-border bg-surface p-5">
        <p className="text-[14px] text-text-primary">
          <span className="font-medium">{data.renewals.length} open renewals</span> worth{" "}
          <span className="font-medium tabular-nums">{money.format(total)}</span>.
        </p>
      </div>

      <div className="space-y-4">
        {data.renewals.map((renewal) => {
          const days = daysUntil(renewal.periodEnd);
          const milestones = renewal.plan?.milestones ?? [];
          const complete = milestones.filter((m) => m.completed).length;

          return (
            <article key={renewal.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/demo/accounts/${renewal.customerAccount.externalId}`}
                    className="text-[15px] font-medium text-brand hover:text-brand-hover"
                  >
                    {renewal.customerAccount.name}
                  </Link>
                  <p className="mt-0.5 text-[13px] text-text-secondary">
                    {renewal.periodEnd.toLocaleDateString()} ·{" "}
                    {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days away`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-[11.5px] tabular-nums text-text-secondary">
                    {money.format(renewal.arr)}
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-[11.5px] text-text-secondary">
                    {renewal.forecastCategory.replace(/_/g, " ").toLowerCase()}
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-[11.5px] text-text-secondary">
                    {renewal.status.replace(/_/g, " ").toLowerCase()}
                  </span>
                </div>
              </div>

              {milestones.length === 0 ? (
                <p className="mt-3 text-[13px] text-text-muted">
                  No renewal plan exists yet. Inside 90 days that is itself a detected risk.
                </p>
              ) : (
                <div className="mt-4">
                  <p className="text-[12.5px] text-text-muted">
                    Renewal plan: {complete} of {milestones.length} milestones complete
                  </p>
                  <ul className="mt-2 space-y-1 text-[13px]">
                    {milestones.map((milestone) => (
                      <li key={milestone.id} className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 rounded-full ${milestone.completed ? "bg-positive" : "bg-text-muted"}`}
                        />
                        <span className={milestone.completed ? "text-text-muted line-through" : "text-text-primary"}>
                          {milestone.label}
                        </span>
                        <span className="sr-only">{milestone.completed ? "Complete" : "Not complete"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </DemoChrome>
  );
}
