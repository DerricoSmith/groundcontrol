import type { Metadata } from "next";
import { Section, SectionHeading, FeatureCard, PrimaryLink, SecondaryLink, HonestyNote, Prose } from "@/components/public/sections";
import { AppFrame } from "@/components/public/app-frame";
import { RISK_RULES } from "@/lib/services/risk-engine";

export const metadata: Metadata = {
  title: "Ground Control",
  description:
    "Ground Control brings customer, revenue, usage, support, and relationship signals together so leaders can see what requires attention and what should happen next.",
  alternates: { canonical: "/ground-control" },
};

const HEALTH_COMPONENTS = [
  {
    name: "Product adoption",
    reads: "Active users, licensed seats, seat utilization, and last recorded activity across reporting periods.",
  },
  {
    name: "Customer relationship",
    reads: "Contact roles, interaction recency, and whether an executive sponsor and champion are engaged.",
  },
  {
    name: "Support experience",
    reads: "Ticket volume, priority mix, reopens, resolution time, satisfaction, and open escalations.",
  },
  {
    name: "Commercial position",
    reads: "Renewal proximity, renewal status, forecast category, and whether a renewal plan exists.",
  },
  {
    name: "Business outcomes",
    reads:
      "Nothing yet. Goal tracking and success plans are not in this release, so this component always carries zero confidence and is excluded from the score.",
  },
];

export default function GroundControlPage() {
  const availableRules = RISK_RULES.filter((rule) => rule.key !== "payment_risk");

  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-brand-wash" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid mask-radial opacity-60" />

        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-2.5 text-[12px] font-medium uppercase tracking-[0.16em] text-brand">
              <span aria-hidden="true" className="h-px w-6 bg-brand/40" />
              Ground Control
            </p>
            <h1 className="type-display font-serif font-medium text-text-primary">
              See risk earlier. Know what to do next.
            </h1>
            <p className="type-lead measure-tight mx-auto mt-6 text-text-secondary">
              A clear view of customer health, renewal risk, adoption, escalation context, feedback, and expansion
              opportunity, together with the action that should happen next.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <PrimaryLink href="/demo">Launch live demo</PrimaryLink>
              <SecondaryLink href="/contact?reason=pilot">Start a pilot</SecondaryLink>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-4xl">
            <AppFrame
              src="/screenshots/demo-risk-evidence.png"
              alt="Risk radar listing open risk signals, each with what changed, the current state, supporting evidence, potential impact, recommended action, and a confidence percentage."
              width={1440}
              height={1400}
              label="signal-and-state-ground-control.vercel.app/demo/risks"
              className="max-h-[460px] overflow-hidden"
            />
          </div>
        </div>
      </section>

      <Section tone="soft">
        <SectionHeading
          eyebrow="How it works"
          title="Import what you already have. Get a portfolio the same day."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard title="1. Import">
            Customer accounts, contacts, renewals, product usage, support tickets, and customer interactions, all by
            CSV. Duplicate handling is defined per entity and documented.
          </FeatureCard>
          <FeatureCard title="2. Assess">
            Deterministic health scoring runs across five components. Every component reports its own confidence, and
            components with no data are excluded rather than guessed.
          </FeatureCard>
          <FeatureCard title="3. Detect">
            Eleven risk rules evaluate the portfolio. Each produces a signal with evidence, or explains why it could not
            run.
          </FeatureCard>
          <FeatureCard title="4. Act">
            Risks become suggested actions carrying the same evidence. Owners are assigned, statuses tracked, and the
            executive brief summarizes what leadership should do.
          </FeatureCard>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Health scoring"
          title="A score you can argue with."
          description="Every score decomposes into components, every component carries a confidence, and every component shows the records behind it. If a number cannot be explained, it should not influence a renewal conversation."
        />
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13.5px]">
            <caption className="sr-only">Health score components and the data each one reads</caption>
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th scope="col" className="py-2.5 pr-4 font-medium">Component</th>
                <th scope="col" className="py-2.5 font-medium">What it reads</th>
              </tr>
            </thead>
            <tbody>
              {HEALTH_COMPONENTS.map((component) => (
                <tr key={component.name} className="border-b border-border last:border-0">
                  <th scope="row" className="py-3 pr-4 align-top font-medium text-text-primary">{component.name}</th>
                  <td className="py-3 align-top text-text-secondary">{component.reads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section tone="soft">
        <SectionHeading
          eyebrow="Risk detection"
          title={`${availableRules.length} rules that run on imported data.`}
          description="Each rule declares the data it needs. When that data is missing the rule reports itself as unavailable, with the reason, rather than passing silently."
        />
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {availableRules.map((rule) => (
            <div key={rule.key} className="rounded-lg border border-border bg-surface p-4">
              <h3 className="text-[14px] font-medium text-text-primary">{rule.label}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{rule.purpose}</p>
              <p className="mt-1.5 text-[12px] text-text-muted">Needs: {rule.requiredData}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <HonestyNote>
            A twelfth rule, failed or delayed payment, exists in the catalog and is permanently unavailable in this
            release. It needs billing data that no import or integration provides yet. Ground Control reports it as
            unavailable rather than inventing payment signals to fill the gap.
          </HonestyNote>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Principles" title="What the product refuses to do." />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <FeatureCard title="It will not treat silence as health">
            An account that has never been scored reads as unmeasured. An organization that has never run a data quality
            check reads as not evaluated. Neither reads as fine.
          </FeatureCard>
          <FeatureCard title="It will not invent evidence">
            No risk is raised from absent data. An account with no contacts and no interactions has a data gap, not a
            disengaged sponsor, and the product says so.
          </FeatureCard>
          <FeatureCard title="It will not double count revenue">
            Exposure is counted once per account. An account with six open risks contributes its revenue once, because
            the alternative is a number that exists nowhere in the business.
          </FeatureCard>
          <FeatureCard title="It will not contact your customers">
            Ground Control drafts internally and tracks what a person did. It sends nothing on its own, and no roadmap
            item changes that without an explicit human approval step.
          </FeatureCard>
        </div>
      </Section>

      <Section tone="soft">
        <SectionHeading eyebrow="Where AI fits" title="Language, not arithmetic." />
        <Prose>
          <p>
            Every number Ground Control reports is produced by deterministic code. Health scores, risk severities,
            forecast confidence, and revenue figures are reproducible and are never touched by a model.
          </p>
          <p>
            When a model provider is configured, it is used to make explanations read better and to draft internal
            summaries. Each of those outputs is schema validated, stored with its prompt version and the evidence it was
            grounded in, and labeled in the interface. When no provider is configured, the same features run on
            deterministic composition from the same evidence, and the product discloses which one produced the text.
          </p>
        </Prose>
        <div className="mt-6">
          <HonestyNote>
            No feature in this release is described as predictive, because none is backed by a validated model. The
            renewal forecast is a rule-based confidence category and is labeled that way everywhere it appears.
          </HonestyNote>
        </div>
      </Section>

      <Section>
        <div className="rounded-2xl border border-border bg-surface p-8 sm:p-12">
          <h2 className="font-serif text-[26px] font-medium tracking-tight text-text-primary sm:text-[30px]">
            Open the demo and judge it yourself.
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
            Fourteen fictional accounts, scored by the model described above, with the evidence behind every number.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <PrimaryLink href="/demo">Launch live demo</PrimaryLink>
            <SecondaryLink href="/showcase">Read the build story</SecondaryLink>
          </div>
        </div>
      </Section>
    </>
  );
}
