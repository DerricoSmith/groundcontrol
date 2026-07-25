import type { Metadata } from "next";
import Link from "next/link";
import { getDemoActions, DemoUnavailableError } from "@/lib/demo/demo-data";
import { ACTION_TYPE_LABELS } from "@/lib/services/action-service";
import { DemoChrome, DemoUnavailable } from "../demo-chrome";

export const metadata: Metadata = {
  title: "Demo actions",
  description: "Recommended actions generated from open risks in the fictional demonstration portfolio.",
  alternates: { canonical: "/demo/actions" },
};

export const dynamic = "force-dynamic";

export default async function DemoActionsPage() {
  let data: Awaited<ReturnType<typeof getDemoActions>>;
  try {
    data = await getDemoActions();
  } catch (error) {
    if (error instanceof DemoUnavailableError) return <DemoUnavailable message={error.message} />;
    throw error;
  }

  return (
    <DemoChrome
      current="/demo/actions"
      title="Actions"
      description="What should happen next, and who owns it. Suggested actions carry the evidence from the risk that produced them, and nothing is sent to a customer automatically."
    >
      {data.actions.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-[14px] text-text-muted">
          No open actions in the demonstration environment.
        </p>
      ) : (
        <div className="space-y-4">
          {data.actions.map((action) => {
            const evidence = Array.isArray(action.evidence) ? (action.evidence as string[]) : [];
            return (
              <article key={action.id} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/demo/accounts/${action.customerAccount.externalId}`}
                      className="text-[12.5px] font-medium text-brand hover:text-brand-hover"
                    >
                      {action.customerAccount.name}
                    </Link>
                    <h2 className="mt-0.5 text-[15px] font-medium text-text-primary">{action.title}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-[11.5px] capitalize text-text-secondary">
                      {action.priority}
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-[11.5px] text-text-secondary">
                      {ACTION_TYPE_LABELS[action.actionType] ?? action.actionType}
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-[11.5px] text-text-secondary">
                      {action.status}
                    </span>
                  </div>
                </div>

                {action.reason && (
                  <p className="mt-2 text-[13.5px] leading-relaxed text-text-secondary">{action.reason}</p>
                )}

                {evidence.length > 0 && (
                  <div className="mt-3">
                    <h3 className="text-[12px] font-medium uppercase tracking-wide text-text-muted">Evidence</h3>
                    <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[12.5px] text-text-secondary">
                      {evidence.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {action.dueDate && (
                  <p className="mt-3 text-[12.5px] text-text-muted">
                    Due {action.dueDate.toLocaleDateString()}
                    {action.dueDate < new Date() ? " (overdue)" : ""}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </DemoChrome>
  );
}
