import type { Metadata } from "next";
import { Section, SectionHeading, Prose, PrimaryLink, SecondaryLink, PageHero } from "@/components/public/sections";

export const metadata: Metadata = {
  title: "About Rico Smith",
  description:
    "Rico Smith is a Customer Success and Customer Experience executive who built Ground Control from problems he saw while leading customer organizations.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="I spent my career running customer organizations. Ground Control is what I kept wishing existed."
      />

      {/*
        Two columns rather than one. A single measure-constrained column on a
        wide screen leaves half the page empty, which reads as unfinished. The
        sidebar carries the scannable version for anyone who will not read four
        paragraphs, which on an about page is most people.
      */}
      <Section tone="soft">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          <div>
            <SectionHeading title="Background" />
            <Prose>
              <p>
                I&apos;m Rico Smith, a Customer Success and Customer Experience executive. I have spent my career
                building and leading the customer organizations inside enterprise software companies, through
                hypergrowth and through the harder years that follow it.
              </p>
              <p>
                I have owned retention, renewals, escalation, and executive relationships at scale. I have built
                customer operating models from nothing, rebuilt ones that had stopped working, and advised leadership
                teams on where their customer base was actually heading rather than where the dashboard said it was.
              </p>
              <p>
                I have worked extensively across the United States and Asia, including considerable time doing business
                in Japan. That shaped how I think about customer operations more than any framework did. The same
                account signal means different things in different markets, and a system that ignores context produces
                confident answers that are wrong.
              </p>
            </Prose>
          </div>

          <aside className="lg:pt-16">
            <div className="rounded-xl border border-border bg-surface p-6 elevate sm:p-7">
              <h3 className="text-[12px] font-medium uppercase tracking-[0.14em] text-text-muted">
                Where I have operated
              </h3>
              <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  "Customer Success leadership",
                  "Customer Experience strategy",
                  "Onboarding and implementation",
                  "Support and escalation management",
                  "Retention and renewals",
                  "Expansion and account growth",
                  "Executive engagement",
                  "Product feedback and voice of customer",
                  "Customer operations",
                  "AI transformation",
                  "Ecommerce",
                  "Global operations",
                ].map((area) => (
                  <li key={area} className="flex items-start gap-2.5 text-[14px] leading-snug text-text-secondary">
                    <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>

      <Section>
        <SectionHeading title="Why I built this" />
        <Prose>
          <p>
            Across every customer organization I have led, one pattern kept showing up. The hardest accounts to save
            were the ones where the warning signs were real but scattered. Usage had softened in the product analytics
            tool, a ticket had escalated in the support platform, a champion had gone quiet in the CRM, and no single
            person had a reason to look at those three things together on an ordinary Tuesday.
          </p>
          <p>
            We built good process, good reporting, and strong teams, and those moved the numbers. What they could not
            do was make the connection automatic. A process holds only while someone maintains it, and reporting tells
            you what happened rather than what to do about it. The gap was structural, not a people problem.
          </p>
          <p>
            Ground Control began as a portfolio concept based on those recurring problems. It became a working product
            because the problems were specific enough to build against.
          </p>
        </Prose>
      </Section>

      <Section tone="soft">
        <SectionHeading title="How it was built" />
        <Prose>
          <p>
            I designed the product, the data model, the scoring logic, the risk rules, and the operating principles. I
            advanced the implementation through AI assisted development workflows, including Claude Code, as part of how
            I work rather than as a replacement for the thinking.
          </p>
          <p>
            The judgment calls are mine and they are the substance of the project. What a health score should decompose
            into. Why a component with no data must lower confidence rather than assume the middle. Why an account with
            no contacts recorded has a data gap and not a disengaged sponsor. Why revenue exposure is counted once per
            account. Those decisions are what make the output trustworthy, and no tool makes them for you.
          </p>
          <p>
            The project demonstrates that I am not only an executive strategist. It also demonstrates hands on product
            thinking, workflow design, data modeling, AI implementation judgment, and operating system design.
          </p>
        </Prose>
      </Section>

      <Section>
        <div className="rounded-2xl border border-border bg-surface p-8 sm:p-12">
          <h2 className="type-h2 font-serif font-medium text-text-primary">
            Let us talk about your customer operation.
          </h2>
          <p className="type-lead measure mt-4 text-text-secondary">
            Whether you want the software, the advisory work, or a conversation about what your data can already tell
            you.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <PrimaryLink href="/contact">Contact Signal &amp; State</PrimaryLink>
            <SecondaryLink href="/showcase">View the build story</SecondaryLink>
          </div>
        </div>
      </Section>
    </>
  );
}
