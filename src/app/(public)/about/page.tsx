import type { Metadata } from "next";
import { Section, SectionHeading, Prose, PrimaryLink, SecondaryLink } from "@/components/public/sections";

export const metadata: Metadata = {
  title: "About Rico Smith",
  description:
    "Rico Smith is a Customer Success and Customer Experience executive who built Ground Control from problems he saw while leading customer organizations.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <Section className="pt-14">
        <div className="max-w-3xl">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-brand">About</p>
          <h1 className="font-serif text-[32px] font-medium leading-[1.12] tracking-tight text-text-primary sm:text-[44px]">
            I spent my career running customer organizations. Ground Control is what I kept wishing existed.
          </h1>
        </div>
      </Section>

      <Section tone="soft">
        <SectionHeading title="Background" />
        <Prose>
          <p>
            I am Rico Smith. I am a Customer Success and Customer Experience executive. I helped scale an enterprise
            software company from zero to approximately forty million dollars in annual recurring revenue, and I later
            advised across a customer portfolio exceeding one hundred and fifty million dollars.
          </p>
          <p>
            My work has covered customer success, customer experience, onboarding, implementation, support, retention,
            renewals, expansion, escalation management, executive engagement, product feedback, customer operations, AI
            transformation, ecommerce, and global operations.
          </p>
          <p>
            I have worked extensively across the United States and Asia, including considerable time doing business in
            Japan. That shaped how I think about customer operations more than any framework did. The same account
            signal means different things in different markets, and a system that ignores context produces confident
            answers that are wrong.
          </p>
        </Prose>
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
          <h2 className="font-serif text-[24px] font-medium tracking-tight text-text-primary sm:text-[30px]">
            Let us talk about your customer operation.
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
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
