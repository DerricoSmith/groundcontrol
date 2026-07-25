import type { Metadata } from "next";
import Link from "next/link";
import { Activity, AlertTriangle, CalendarClock, FileText, Layers, ShieldCheck } from "lucide-react";
import { Section, SectionHeading, FeatureCard, PrimaryLink, SecondaryLink, HonestyNote } from "@/components/public/sections";

export const metadata: Metadata = {
  title: "Turn customer signals into action",
  description:
    "Signal & State helps growing companies identify customer risk, strengthen retention, improve adoption, and build more intelligent customer operations.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Section className="pt-14 sm:pt-20">
        <div className="max-w-3xl">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-brand">Signal &amp; State</p>
          <h1 className="font-serif text-[34px] font-medium leading-[1.1] tracking-tight text-text-primary sm:text-[52px]">
            Turn customer signals into action.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-text-secondary sm:text-[18px]">
            Signal &amp; State helps growing companies identify customer risk, strengthen retention, improve adoption,
            and build more intelligent customer operations.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-text-secondary sm:text-[16px]">
            Ground Control brings customer, revenue, usage, support, and relationship signals together so leaders can
            see what requires attention and what should happen next.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryLink href="/demo">Launch live demo</PrimaryLink>
            <SecondaryLink href="/showcase">View the build story</SecondaryLink>
            <SecondaryLink href="/contact?reason=review">Book a Customer Intelligence Review</SecondaryLink>
          </div>

          <p className="mt-5 text-[13px] text-text-muted">
            The demo needs no account and opens on a fictional portfolio.
          </p>
        </div>
      </Section>

      <Section tone="soft">
        <SectionHeading
          eyebrow="The problem"
          title="Customer data is scattered, so risk is found late."
          description="A growing software company usually knows something is wrong with an account after the renewal conversation, not before it. The signals were there. They were in four systems, owned by three teams, and nobody had a reason to look at them together on a Tuesday."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <Section>
        <SectionHeading
          eyebrow="Ground Control"
          title="See risk earlier. Know what to do next."
          description="Ground Control is the software Signal & State uses to deliver customer intelligence work, and it is available to teams who want to run it themselves."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={Activity} title="Explainable health scoring">
            Five weighted components, each with its own score, its own confidence, and the individual records behind it.
            A component with no data is excluded and its weight redistributed rather than quietly counted as fine.
          </FeatureCard>
          <FeatureCard icon={AlertTriangle} title="Risk rules with evidence">
            Eleven deterministic rules run against imported data. Each risk states what changed, the current state, the
            evidence, the potential impact, the recommended response, and its confidence.
          </FeatureCard>
          <FeatureCard icon={CalendarClock} title="Renewal preparation">
            A milestone plan per renewal, plus a forecast confidence category that shows the factors that produced it.
            It is a rule-based category, not a prediction, and the product never calls it one.
          </FeatureCard>
          <FeatureCard icon={FileText} title="Executive brief">
            Sixteen sections assembled from counts, sums, and rules, including a section on what the assessment cannot
            see and why.
          </FeatureCard>
          <FeatureCard icon={ShieldCheck} title="Honest about gaps">
            An account that has never been scored reads as unmeasured. Data quality that has never been checked reads as
            not evaluated. Missing information never presents as health.
          </FeatureCard>
          <FeatureCard icon={Layers} title="Starts with a CSV">
            No integration project. Export what you already have, import it, and get a portfolio view the same day.
          </FeatureCard>
        </div>

        <div className="mt-10">
          <HonestyNote>
            Ground Control currently imports data by CSV. Native connectors for CRM, support, billing, and product
            analytics are on the roadmap and are not built yet. Nothing on this site claims an integration that exists
            only as a plan.
          </HonestyNote>
        </div>
      </Section>

      <Section tone="soft">
        <SectionHeading
          eyebrow="Who it is for"
          title="Founder-led and growth-stage B2B software companies."
          description="Roughly two to thirty million in recurring revenue, fifteen to a hundred and fifty people, a customer success team of one to ten, and no customer success operations leader yet."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
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

      <Section>
        <div className="rounded-2xl border border-border bg-surface p-8 sm:p-12">
          <h2 className="font-serif text-[26px] font-medium tracking-tight text-text-primary sm:text-[32px]">
            See it working before you talk to anyone.
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
            The live demo opens on a fictional fourteen account portfolio with real scoring, real risk rules, and a real
            executive brief. It takes about two minutes to understand what the product does.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <PrimaryLink href="/demo">Launch live demo</PrimaryLink>
            <SecondaryLink href="/ground-control">Explore Ground Control</SecondaryLink>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-2 py-2.5 text-[14.5px] font-medium text-brand hover:text-brand-hover"
            >
              Contact Signal &amp; State
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
