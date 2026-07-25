import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading, Prose, FeatureCard, PrimaryLink, SecondaryLink, HonestyNote } from "@/components/public/sections";

export const metadata: Metadata = {
  title: "The build story",
  description:
    "Why I built Ground Control, what it does, how it decides, where AI fits, and what the project demonstrates.",
  alternates: { canonical: "/showcase" },
};

const CONTENTS = [
  ["why", "Why I built it"],
  ["problem", "The customer operations problem"],
  ["what", "What Ground Control does"],
  ["walkthrough", "Product walkthrough"],
  ["signals", "Customer signals and evidence"],
  ["logic", "Health and risk logic"],
  ["brief", "Executive brief"],
  ["ai", "AI with human judgment"],
  ["architecture", "Product architecture"],
  ["security", "Security and tenant isolation"],
  ["time", "Time to value"],
  ["built", "What I personally built"],
  ["demonstrates", "What this demonstrates"],
  ["commercial", "Commercial opportunity"],
  ["capabilities", "Current capabilities"],
  ["roadmap", "Roadmap"],
] as const;

export default function ShowcasePage() {
  return (
    <>
      {/* 1. Hero */}
      <Section className="pt-14">
        <div className="max-w-3xl">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-brand">The build story</p>
          <h1 className="font-serif text-[34px] font-medium leading-[1.1] tracking-tight text-text-primary sm:text-[50px]">
            I ran customer organizations for years. Then I built the system I kept wishing existed.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-text-secondary sm:text-[17px]">
            Ground Control is a working customer intelligence platform. It scores customer health from evidence,
            detects renewal risk with deterministic rules, explains every number it produces, and tells a leader what
            should happen next. This page explains why it exists, how it decides, and what I designed and built myself.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryLink href="/demo">Launch live demo</PrimaryLink>
            <SecondaryLink href="/contact">Contact Rico</SecondaryLink>
          </div>
        </div>

        <nav aria-label="On this page" className="mt-12 rounded-xl border border-border bg-surface p-5">
          <h2 className="text-[12px] font-medium uppercase tracking-wide text-text-muted">On this page</h2>
          <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-[13.5px] sm:grid-cols-2 lg:grid-cols-3">
            {CONTENTS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-text-secondary hover:text-brand">{label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </Section>

      {/* 2. Why I Built It */}
      <Section tone="soft">
        <SectionHeading id="why" eyebrow="01" title="Why I built it" />
        <Prose>
          <p>
            I am Rico Smith. I helped scale an enterprise software company from zero to approximately forty million
            dollars in annual recurring revenue, and I later advised across a customer portfolio exceeding one hundred
            and fifty million dollars. My work has spanned customer success, customer experience, onboarding,
            implementation, support, retention, renewals, expansion, escalation management, executive engagement,
            product feedback, customer operations, AI transformation, ecommerce, and global operations, across the
            United States and Asia including considerable time doing business in Japan.
          </p>
          <p>
            Across those organizations, one pattern kept surfacing. The accounts that were hardest to save were the
            ones where the warning signs were real but scattered, sitting in four different systems, with no single
            person who had a reason to look at them together on an ordinary Tuesday.
          </p>
          <p>
            We built good process, strong reporting, and capable teams, and those moved the numbers. What none of them
            could do was make the connection automatic. A process holds only while someone maintains it, and reporting
            tells you what happened rather than what to do about it. The gap was structural. Ground Control began as a
            portfolio concept built on that observation, and it became a real product because the problem was specific
            enough to build against.
          </p>
        </Prose>
      </Section>

      {/* 3. The Customer Operations Problem */}
      <Section>
        <SectionHeading id="problem" eyebrow="02" title="The customer operations problem" />
        <Prose>
          <p>
            A company between two and thirty million in recurring revenue typically has a customer success team of one
            to ten people, no customer success operations leader, and customer data spread across a CRM, a billing
            system, a support platform, and a product analytics tool.
          </p>
        </Prose>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <FeatureCard title="Nobody owns the whole picture">
            Each system has an owner. The relationship between them has none, so risk that only appears when signals are
            combined is the risk nobody sees.
          </FeatureCard>
          <FeatureCard title="Health scores are unexplained">
            A colour with no reasoning behind it cannot be acted on and will not be trusted twice. Most tools give you a
            number and no argument.
          </FeatureCard>
          <FeatureCard title="Renewals become events, not processes">
            Without evidence-based preparation, renewal work starts when the date shows up in a calendar rather than
            when the risk showed up in the data.
          </FeatureCard>
        </div>
      </Section>

      {/* 4. What Ground Control Does */}
      <Section tone="soft">
        <SectionHeading
          id="what"
          eyebrow="03"
          title="What Ground Control does"
          description="Outcome: see risk earlier, know what to do next."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <FeatureCard title="Brings the signals together">
            Customer accounts, contacts, renewals, product usage, support tickets, and customer interactions, imported
            by CSV and joined into one portfolio view.
          </FeatureCard>
          <FeatureCard title="Scores health from evidence">
            Five weighted components, each with its own score, confidence, and the records behind it.
          </FeatureCard>
          <FeatureCard title="Detects risk deterministically">
            Eleven rules producing signals that carry what changed, the current state, the evidence, the impact, the
            recommended response, and a confidence value.
          </FeatureCard>
          <FeatureCard title="Turns risk into owned work">
            Suggested actions inherit the originating risk&apos;s evidence, get an owner and a due date, and track
            status changes with who made them.
          </FeatureCard>
        </div>
      </Section>

      {/* 5. Product Walkthrough */}
      <Section>
        <SectionHeading
          id="walkthrough"
          eyebrow="04"
          title="Product walkthrough"
          description="The demo is live and needs no account. This is the path I would walk you through."
        />
        <ol className="mt-8 space-y-4">
          {[
            ["Mission Control", "What changed, what needs attention, revenue at risk, and what the data can currently support.", "/demo"],
            ["Customer Portfolio", "Every account with saved views, sorting, and honest gaps. Unscored accounts read as unmeasured.", "/demo/accounts"],
            ["Account Detail", "The full evidence chain: component scores, weights, confidence, and the individual records.", "/demo/accounts/harborline"],
            ["Risk Radar", "Open risks with their six part explanation and revenue counted once per account.", "/demo/risks"],
            ["Renewal Center", "Milestone plans and an explained forecast confidence category.", "/demo/renewals"],
            ["Actions", "Suggested work carrying the evidence that produced it.", "/demo/actions"],
            ["Executive Brief", "Sixteen sections including what the assessment cannot see.", "/demo/brief"],
          ].map(([title, description, href], index) => (
            <li key={title} className="flex gap-4 rounded-xl border border-border bg-surface p-5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12.5px] font-medium text-brand">
                {index + 1}
              </span>
              <div>
                <h3 className="text-[15px] font-medium text-text-primary">{title}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-text-secondary">{description}</p>
                <Link href={href} className="mt-2 inline-block text-[13px] font-medium text-brand hover:text-brand-hover">
                  Open in the demo
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* 6. Customer Signals and Evidence */}
      <Section tone="soft">
        <SectionHeading id="signals" eyebrow="05" title="Customer signals and evidence" />
        <Prose>
          <p>
            The product&apos;s central commitment is that every statement traces back to a record. A risk does not say
            an account is disengaged. It says the last meaningful interaction was one hundred and thirty two days ago,
            names the interactions it counted, and shows the threshold it compared against.
          </p>
          <p>
            That commitment is what forced the hardest decisions in the build. If evidence is the standard, then
            missing evidence cannot quietly become a passing grade.
          </p>
        </Prose>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <FeatureCard title="Missing data lowers confidence">
            A component with no supporting data scores a neutral baseline and carries zero confidence, and its weight is
            redistributed to components that do have evidence. The gap is disclosed rather than smoothed over.
          </FeatureCard>
          <FeatureCard title="Absence is never a finding">
            An account with no contacts and no interactions has an absent relationship picture, not a disengaged
            sponsor. It produces a data quality issue, not a risk.
          </FeatureCard>
        </div>
      </Section>

      {/* 7. Health and Risk Logic */}
      <Section>
        <SectionHeading id="logic" eyebrow="06" title="Health and risk logic" />
        <Prose>
          <p>
            Health scoring is a versioned weighted model over five components: product adoption, customer relationship,
            support experience, commercial position, and business outcomes. Weights and thresholds are configurable per
            organization. Every calculation writes a snapshot carrying the previous score, the new score, and a plain
            language reason naming the component that moved it most.
          </p>
          <p>
            Risk detection is a catalog of twelve rules, of which eleven run today. Each rule declares the data it
            needs and reports itself as unavailable, with the reason, when that data is missing. Evaluations are
            repeatable: a rule that stops triggering auto-resolves its signal, and a risk a person has dismissed is
            never reopened by the machine.
          </p>
        </Prose>
        <div className="mt-8">
          <HonestyNote>
            The twelfth rule, failed or delayed payment, is permanently unavailable in this release because no billing
            data source exists yet. It is reported as unavailable rather than removed from the catalog, so the gap is
            visible instead of invisible.
          </HonestyNote>
        </div>
      </Section>

      {/* 8. Executive Brief */}
      <Section tone="soft">
        <SectionHeading id="brief" eyebrow="07" title="Executive brief" />
        <Prose>
          <p>
            The brief is sixteen sections assembled from counts, sums, and rules: executive summary, what changed,
            portfolio health, revenue at risk, accounts needing attention, upcoming renewals, renewal forecast,
            escalations, risk themes, open work and ownership, recommended actions, data readiness, data freshness,
            what the assessment cannot see, and how the brief was produced.
          </p>
          <p>
            A section with nothing to report says so and says why. If no account has a renewal date, the renewals
            section says exactly that rather than reporting no upcoming renewals, because those two statements mean
            completely different things to a leader reading quickly.
          </p>
        </Prose>
        <div className="mt-6">
          <SecondaryLink href="/demo/brief">Read the demo brief</SecondaryLink>
        </div>
      </Section>

      {/* 9. AI With Human Judgment */}
      <Section>
        <SectionHeading id="ai" eyebrow="08" title="AI with human judgment" />
        <Prose>
          <p>
            Every number Ground Control reports is deterministic. Health scores, component scores, confidence values,
            risk severities, forecast categories, and revenue figures are produced by code, are reproducible, and are
            never touched by a model. That is a hard architectural boundary, not a policy statement.
          </p>
          <p>
            A model, when one is configured, is used for language. It makes an explanation read better or drafts an
            internal summary. Each output is validated against a schema before storage, recorded with its prompt
            version and the evidence it was grounded in, tagged as fact, calculation, interpretation, recommendation, or
            assumption, and labeled in the interface.
          </p>
          <p>
            With no provider configured, the same features run on deterministic composition from the same evidence, and
            the interface discloses which one produced the text. The product is complete without a model, which is the
            only honest way to depend on one.
          </p>
        </Prose>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <FeatureCard title="Human judgment stays central">
            AI drafts. A person decides. No customer communication is ever sent by the system, and the workflows that
            produce customer-facing language require explicit human approval before use.
          </FeatureCard>
          <FeatureCard title="Nothing is called predictive">
            No feature in this release is backed by a validated predictive model, so no feature is described as
            predictive. The renewal forecast is a rule-based confidence category and is labeled that way everywhere.
          </FeatureCard>
        </div>
      </Section>

      {/* 10. Product Architecture */}
      <Section tone="soft">
        <SectionHeading id="architecture" eyebrow="09" title="Product architecture" />
        <Prose>
          <p>
            Next.js App Router with TypeScript and React Server Components, Tailwind, Prisma, and Postgres, deployed on
            Vercel with Auth.js for authentication. A modular monolith rather than microservices: server-only service
            modules own all business logic, and no page or route builds a database query directly.
          </p>
          <p>
            The server and client boundary is absolute. Prisma, secrets, and the AI service layer never reach a Client
            Component, enforced by the server-only package rather than by convention.
          </p>
          <p>
            Local development, both test suites, and production all run on Postgres. Keeping SQLite locally would have
            been faster but would have meant testing against a different engine than the one that ships, so the test
            suite runs slower and proves more.
          </p>
        </Prose>
      </Section>

      {/* 11. Security and Tenant Isolation */}
      <Section>
        <SectionHeading id="security" eyebrow="10" title="Security and tenant isolation" />
        <Prose>
          <p>
            Every table holding customer data carries a non-nullable organization identifier, and every query is scoped
            in the service layer. Cross-organization access is tested rather than assumed: the suite attempts to read
            another organization&apos;s accounts, renewals, risks, actions, and briefs and asserts each returns nothing.
          </p>
          <p>
            The public demonstration is server rendered and read only. It resolves its organization from a constant
            slug that must also carry a demo flag, so no route parameter can point it at a real customer.
          </p>
        </Prose>
        <div className="mt-6">
          <HonestyNote>
            Signal &amp; State does not hold SOC 2, ISO 27001, or HIPAA certification and does not claim readiness for
            any of them. Ground Control is being designed around modern security and privacy practices. Formal
            certification work will follow as the company grows.
          </HonestyNote>
        </div>
      </Section>

      {/* 12. Time to Value */}
      <Section tone="soft">
        <SectionHeading id="time" eyebrow="11" title="Time to value" />
        <Prose>
          <p>
            Signup to a scored portfolio is a single session. There is no integration project, no data warehouse
            prerequisite, and no professional services engagement required before the first insight.
          </p>
          <p>
            Export what you already have, import it, and the product tells you which accounts need attention and why.
            When information is missing it tells you that too, and which rules it could not run as a result.
          </p>
        </Prose>
      </Section>

      {/* 13. What I Personally Built */}
      <Section>
        <SectionHeading id="built" eyebrow="12" title="What I personally built" />
        <Prose>
          <p>
            I designed the product, the data model, the health scoring philosophy, the risk rule catalog, the evidence
            and confidence model, the operating principles, and the information architecture. I advanced the
            implementation through AI assisted development workflows, including Claude Code, as part of how I work
            rather than as a substitute for the thinking.
          </p>
          <p>The judgment calls are mine, and they are the substance of the project:</p>
        </Prose>
        <ul className="mt-6 max-w-3xl space-y-3">
          {[
            "What a health score should decompose into, and why five components rather than one number.",
            "Why a component with no data must carry zero confidence and have its weight redistributed, rather than assume the middle.",
            "Why an account with no contacts recorded has a data gap and not a disengaged sponsor.",
            "Why revenue exposure is counted once per account, not once per risk.",
            "Why a risk a human dismissed must never be reopened by the machine.",
            "Why the forecast is a confidence category and not a prediction.",
            "Why the product must be complete with no AI provider configured.",
          ].map((item) => (
            <li key={item} className="flex gap-3 text-[14.5px] leading-relaxed text-text-secondary">
              <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 max-w-3xl">
          <HonestyNote>
            Three of those decisions exist because I found the opposite behaviour in my own product while using it.
            Unscored accounts were displaying as healthy, data quality that had never been checked was displaying as
            ready, and revenue at risk was being summed per risk rather than per account. All three were found by
            opening the product and reading it as a customer would, not by reading the code.
          </HonestyNote>
        </div>
      </Section>

      {/* 14. What This Demonstrates */}
      <Section tone="soft">
        <SectionHeading id="demonstrates" eyebrow="13" title="What this demonstrates" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard title="Executive customer leadership">
            The problems it solves are the ones I lived with while accountable for retention, renewals, and escalation
            outcomes.
          </FeatureCard>
          <FeatureCard title="CX and customer operations strategy">
            Segmentation, coverage, health philosophy, and escalation handling are encoded as product decisions, not
            slides.
          </FeatureCard>
          <FeatureCard title="Product thinking">
            Scope discipline: eleven working rules shipped, a twelfth honestly marked unavailable, and a long roadmap
            deliberately not started.
          </FeatureCard>
          <FeatureCard title="Data and workflow design">
            A normalized multi-tenant model covering accounts, contacts, usage, support, interactions, renewals, risks,
            actions, and escalations.
          </FeatureCard>
          <FeatureCard title="AI implementation judgment">
            Knowing where a model helps, where it must be kept out, and how to stay useful when it is unavailable.
          </FeatureCard>
          <FeatureCard title="Hands on building">
            A deployed multi-tenant application with authentication, imports, a test suite, and a production database.
          </FeatureCard>
        </div>
      </Section>

      {/* 15. Commercial Opportunity */}
      <Section>
        <SectionHeading id="commercial" eyebrow="14" title="Commercial opportunity" />
        <Prose>
          <p>
            Signal &amp; State is a service enabled software company. Consulting engagements deliver the outcome today
            and are what make the software credible on day one. The software is what makes the consulting repeatable
            and progressively cheaper to deliver.
          </p>
          <p>
            The ideal customer is a founder led B2B software company between roughly two and thirty million in
            recurring revenue, with a small customer success team, scattered data, and no reliable renewal forecast.
            That company cannot yet justify a customer success operations hire, and it is exactly where an unnoticed
            renewal risk is most expensive.
          </p>
          <p>
            The initial offers are a Customer Intelligence Sprint, Managed Customer Intelligence, a transformation
            engagement, fractional executive advisory, and a Ground Control pilot. Each engagement runs on the same
            product, so delivery work compounds into the software rather than evaporating into a deliverable.
          </p>
        </Prose>
        <div className="mt-6">
          <HonestyNote>
            No market size claim appears on this site. Signal &amp; State has not published one it can substantiate, and
            an invented number would undermine everything else here.
          </HonestyNote>
        </div>
      </Section>

      {/* 16. Current Capabilities */}
      <Section tone="soft">
        <SectionHeading id="capabilities" eyebrow="15" title="Current capabilities" description="Working today, in production." />
        <div className="mt-8 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {[
            "Multi-tenant organizations with roles, invitations, and switching",
            "Quick Start onboarding from signup to first insight",
            "CSV import for accounts, contacts, renewals, usage, tickets, and interactions",
            "Deterministic health scoring with per-component evidence",
            "Eleven operational risk rules with six part explanations",
            "Renewal center with milestone plans and explained forecast confidence",
            "Actions center with ownership, status history, and audit events",
            "Escalation tracking with resolution gating",
            "Data quality detection and data freshness states",
            "Sixteen section executive brief",
            "AI service layer with a complete deterministic fallback",
            "Public read-only demonstration environment",
          ].map((item) => (
            <p key={item} className="flex gap-2.5 py-1 text-[14px] text-text-secondary">
              <span aria-hidden="true" className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-positive" />
              <span>{item}</span>
            </p>
          ))}
        </div>
      </Section>

      {/* 17. Roadmap */}
      <Section>
        <SectionHeading id="roadmap" eyebrow="16" title="Roadmap" description="Not built. Listed so the line between shipped and planned stays visible." />
        <div className="mt-8 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {[
            "Native CRM integrations for Salesforce and HubSpot",
            "Native support integrations for Zendesk and Intercom",
            "Product analytics and billing integrations",
            "Payment risk detection, once billing data exists",
            "Business outcomes scoring with goal tracking and success plans",
            "Voice of Customer theme confirmation workflow",
            "Automated executive brief delivery by email and Slack",
            "Validated predictive renewal modelling",
            "Guided Setup and Assisted Setup onboarding paths",
            "SOC 2 certification",
          ].map((item) => (
            <p key={item} className="flex gap-2.5 py-1 text-[14px] text-text-secondary">
              <span aria-hidden="true" className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted" />
              <span>{item}</span>
            </p>
          ))}
        </div>
      </Section>

      {/* 18 and 19. Demo and contact calls to action */}
      <Section tone="soft">
        <div className="rounded-2xl border border-border bg-surface p-8 sm:p-12">
          <h2 className="font-serif text-[26px] font-medium tracking-tight text-text-primary sm:text-[34px]">
            The fastest way to judge this is to open it.
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
            The demo needs no account. Fourteen fictional accounts, scored by the model described above, with the
            evidence behind every number and an executive brief at the end.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <PrimaryLink href="/demo">Launch live demo</PrimaryLink>
            <SecondaryLink href="/contact?reason=recruiting">Contact Rico</SecondaryLink>
            <SecondaryLink href="/ground-control">Explore Ground Control</SecondaryLink>
          </div>
        </div>
      </Section>
    </>
  );
}
