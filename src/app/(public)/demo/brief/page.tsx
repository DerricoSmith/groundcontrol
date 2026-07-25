import type { Metadata } from "next";
import { getDemoBrief, DemoUnavailableError } from "@/lib/demo/demo-data";
import { DemoChrome, DemoUnavailable } from "../demo-chrome";

export const metadata: Metadata = {
  title: "Demo executive brief",
  description: "A deterministic executive brief assembled from the fictional demonstration portfolio.",
  alternates: { canonical: "/demo/brief" },
};

export const dynamic = "force-dynamic";

export default async function DemoBriefPage() {
  let data: Awaited<ReturnType<typeof getDemoBrief>>;
  try {
    data = await getDemoBrief();
  } catch (error) {
    if (error instanceof DemoUnavailableError) return <DemoUnavailable message={error.message} />;
    throw error;
  }

  return (
    <DemoChrome
      current="/demo/brief"
      title="Executive brief"
      description="What leadership should know and do next. Every section is a count, a sum, or a rule applied to records already imported."
    >
      {!data.brief ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-[14px] text-text-muted">
          No brief has been generated for the demonstration environment yet.
        </p>
      ) : (
        <article data-shot="brief" className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <header className="border-b border-border pb-5">
            <p className="text-[12px] font-medium uppercase tracking-wide text-brand">{data.brief.periodLabel}</p>
            <h2 className="mt-1 font-serif text-[22px] font-medium text-text-primary">
              {data.organization.name}
            </h2>
            <p className="mt-1 text-[12.5px] text-text-muted">
              Generated {data.brief.generatedAt.toLocaleString()}
            </p>
          </header>

          <div className="mt-6 space-y-6">
            {data.brief.sections.map((section) => (
              <section key={section.id}>
                <h3 className="text-[15px] font-medium text-text-primary">{section.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-text-secondary">{section.content}</p>
              </section>
            ))}
          </div>
        </article>
      )}
    </DemoChrome>
  );
}
