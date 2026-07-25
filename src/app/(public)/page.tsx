import type { Metadata } from "next";
import Link from "next/link";
import { Activity, AlertTriangle, CalendarClock, FileText, Layers, ShieldCheck, ArrowRight } from "lucide-react";
import {
  Section,
  SectionHeading,
  FeatureCard,
  PrimaryLink,
  SecondaryLink,
  HonestyNote,
  FactBand,
} from "@/components/public/sections";
import { AppFrame } from "@/components/public/app-frame";

export const metadata: Metadata = {
  title: "Turn customer signals into action",
  description:
    "Signal & State helps growing companies identify customer risk, strengthen retention, improve adoption, and build more intelligent customer operations.",
  alternates: { canonical: "/" },
};

/**
 * Every figure here is a fact about the product that can be checked in the
 * codebase or the live demo. None is a customer count, a performance claim, or
 * anything the company has not earned.
 */
const PRODUCT_FACTS = [
  { value: "5", label: "Health components, each with its own evidence" },
  { value: "11", label: "Deterministic risk rules running today" },
  { value: "16", label: "Executive brief sections" },
  { value: "6", label: "Data types imported by CSV" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-brand-wash" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid mask-radial opacity-70" />

        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-[12.5px] font-medium text-text-secondary backdrop-blur">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-positive" />
              Live demo, no account required
            </p>

            <h1 className="font-serif text-[38px] font-medium leading-[1.06] tracking-[-0.02em] text-text-primary sm:text-[60px]">
              Turn customer signals into action.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-text-secondary sm:text-[19px]">
              Signal &amp; State helps growing companies identify customer risk, strengthen retention, improve
              adoption, and build more intelligent customer operations.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <PrimaryLink href="/demo">Launch live demo</PrimaryLink>
              <SecondaryLink href="/showcase">View the build story</SecondaryLink>
            </div>

            <p className="mt-5 text-[13px] text-text-muted">
              Or{" "}
              <Link href="/contact?reason=review" className="text-brand hover:text-brand-hover">
                book a Customer Intelligence Review
              </Link>
            </p>
          </div>

          <div className="relative mx-auto mt-16 max-w-5xl">
            <AppFrame
              src="/screenshots/demo-mission-control.png"
              alt="Ground Control Mission Control showing fourteen fictional customer accounts, revenue at risk, a ranked list of accounts needing attention, and a health distribution across five bands."
              width={1440}
              height={1600}
              priority
              className="max-h-[560px] overflow-hidden"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent"
            />
          </div>
        </div>
      </section>

      {/* Facts */}
      <section className="relative -mt-8">
        <div className="mx-auto max-w-6xl px-5">
          <FactBand facts={PRODUCT_FACTS} />
        </div>
      </section>

      {/* Problem */}
      <Section>
        <SectionHeading
          eyebrow="The problem"
          title="Customer data is scattered, so risk is found late."
          description="A growing software company usually learns an account is in trouble during the renewal conversation. The signals were there for months, sitting in four systems owned by three teams, and nobody had a reason to look at them together on an ordinary Tuesday."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={Layers} title="Signals live apart">
            CRM holds the commercial picture, billing holds revenue, support holds friction, analytics holds adoption.
            No single view says which account is in trouble.
          </FeatureCard>
          <FeatureCard icon={AlertTriangle} title="Health scores are opinions">
            Most scores are a colour with no explanation. If a leader cannot see why an account is yellow, they cannot
            act on it and will not trust it twice.
          </FeatureCard>
          <FeatureCard icon={CalendarClock} title="Renewals arrive as surprises">
            Without a forecast grounded in evidence, renewal planning starts when the date appears in a calendar rather
            than when the risk appeared in the data.
          </FeatureCard>
        </div>
      </Section>

      {/* Product */}
      <Section tone="soft">
        <SectionHeading
          eyebrow="Ground Control"
          title="See risk earlier. Know what to do next."
          description="The software Signal & State uses to deliver customer intelligence work, available to teams who want to run it themselves."
        />

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <AppFrame
              src="/screenshots/demo-account-detail.png"
              alt="An account detail view showing a health score decomposed into five weighted components, each with its own score, weight, confidence percentage, and the individual records behind it."
              width={1440}
              height={1800}
              label="signal-and-state-ground-control.vercel.app/demo/accounts/harborline"
              className="max-h-[520px] overflow-hidden"
            />
          </div>

          <div className="order-1 space-y-5 lg:order-2">
            <FeatureCard icon={Activity} title="Explainable health scoring">
              Five weighted components, each with its own score, its own confidence, and the individual records behind
              it. A component with no data is excluded and its weight redistributed rather than quietly counted as
              fine.
            </FeatureCard>
            <FeatureCard icon={AlertTriangle} title="Risk rules with evidence">
              Eleven deterministic rules. Each risk states what changed, the current state, the evidence, the potential
              impact, the recommended response, and its confidence.
            </FeatureCard>
            <FeatureCard icon={CalendarClock} title="Renewal preparation">
              A milestone plan per renewal, plus a forecast confidence category that shows the factors that produced
              it. It is a rule-based category, not a prediction, and the product never calls it one.
            </FeatureCard>
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          <FeatureCard icon={FileText} title="Executive brief">
            Sixteen sections assembled from counts, sums, and rules, including a section on what the assessment cannot
            see and why.
          </FeatureCard>
          <FeatureCard icon={ShieldCheck} title="Honest about gaps">
            An account that has never been scored reads as unmeasured. Data quality that has never been checked reads
            as not evaluated. Missing information never presents as health.
          </FeatureCard>
          <FeatureCard icon={Layers} title="Starts with a CSV">
            No integration project. Export what you already have, import it, and get a portfolio view the same day.
          </FeatureCard>
        </div>

        <div className="mt-10 max-w-3xl">
          <HonestyNote>
            Ground Control currently imports data by CSV. Native connectors for CRM, support, billing, and product
            analytics are on the roadmap and are not built yet. Nothing on this site claims an integration that exists
            only as a plan.
          </HonestyNote>
        </div>
      </Section>

      {/* Audience */}
      <Section>
        <SectionHeading
          eyebrow="Who it is for"
          title="Founder-led and growth-stage B2B software companies."
          description="Roughly two to thirty million in recurring revenue, fifteen to a hundred and fifty people, a customer success team of one to ten, and no customer success operations leader yet."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          <FeatureCard title="You have the data">
            It is in a CRM, a billing system, a support tool, and an analytics product. It has never been in one place.
          </FeatureCard>
          <FeatureCard title="You do not have the operation">
            Health scoring is inconsistent, the renewal forecast is a guess, and escalations are managed in a channel.
          </FeatureCard>
          <FeatureCard title="You need the answer this quarter">
            Hiring a CS Ops leader takes months. A Customer Intelligence Sprint takes weeks.
          </FeatureCard>
        </div>
      </Section>

      {/* Closing */}
      <section className="relative overflow-hidden border-t border-border bg-surface-soft">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid mask-fade-b opacity-60" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-[30px] font-medium leading-tight tracking-tight text-text-primary sm:text-[40px]">
              See it working before you talk to anyone.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-text-secondary sm:text-[17px]">
              The live demo opens on a fictional fourteen account portfolio with real scoring, real risk rules, and a
              real executive brief. It takes about two minutes to understand what the product does.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <PrimaryLink href="/demo">Launch live demo</PrimaryLink>
              <SecondaryLink href="/ground-control">Explore Ground Control</SecondaryLink>
            </div>
            <p className="mt-6">
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand hover:text-brand-hover"
              >
                Contact Signal &amp; State <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
