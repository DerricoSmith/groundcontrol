import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading, Prose, HonestyNote } from "@/components/public/sections";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for Ground Control. Draft pending legal review.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <Section className="pt-14">
      <div className="max-w-3xl">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-brand">Terms</p>
        <h1 className="font-serif text-[30px] font-medium leading-[1.14] tracking-tight text-text-primary sm:text-[40px]">
          Terms of use
        </h1>
        <p className="mt-4 text-[13px] text-text-muted">Last updated 25 July 2026.</p>

        <div className="mt-6">
          <HonestyNote>
            This is a draft prepared by Signal &amp; State and has not been reviewed by an attorney. A paid engagement
            is governed by the agreement signed for that engagement, not by this page. If there is a conflict, the
            signed agreement controls.
          </HonestyNote>
        </div>

        <div className="mt-10 space-y-10">
          <section>
            <SectionHeading title="The service" />
            <Prose>
              <p>
                Ground Control is customer intelligence software operated by Signal &amp; State. It analyses data you
                provide and presents health assessments, risk signals, renewal information, and recommended actions.
              </p>
              <p>
                The analysis is decision support. It is not advice, and it does not replace the judgment of the people
                running your customer relationships. Every score and signal is explained so you can evaluate it rather
                than defer to it.
              </p>
            </Prose>
          </section>

          <section>
            <SectionHeading title="Your account" />
            <Prose>
              <p>
                You are responsible for keeping your credentials secure and for the actions taken by people you invite
                into your organization. Tell us promptly if you believe an account has been compromised.
              </p>
            </Prose>
          </section>

          <section>
            <SectionHeading title="Your data" />
            <Prose>
              <p>
                You retain ownership of everything you import. You are responsible for having the right to provide that
                data, including any personal data about your own customers&apos; staff.
              </p>
              <p>
                Signal &amp; State processes it to operate the service for you, as described in the{" "}
                <Link href="/privacy" className="text-brand hover:text-brand-hover">privacy information</Link>.
              </p>
            </Prose>
          </section>

          <section>
            <SectionHeading title="Acceptable use" />
            <Prose>
              <p>
                Do not use the service to store data you are not entitled to hold, attempt to access another
                organization&apos;s data, probe or disrupt the infrastructure, or resell access without an agreement.
              </p>
            </Prose>
          </section>

          <section>
            <SectionHeading title="Availability and limitations" />
            <Prose>
              <p>
                The service is provided as it is. Signal &amp; State is an early stage company and does not currently
                offer a contractual uptime commitment. Known product limitations are published openly on the{" "}
                <Link href="/trust" className="text-brand hover:text-brand-hover">trust page</Link> rather than
                discovered later.
              </p>
              <p>
                The demonstration environment contains entirely fictional data and is provided for evaluation only.
              </p>
            </Prose>
          </section>

          <section>
            <SectionHeading title="Ending it" />
            <Prose>
              <p>
                You can stop using the service at any time and request deletion of your organization&apos;s data. We may
                suspend an account that breaches the acceptable use terms above.
              </p>
            </Prose>
          </section>
        </div>
      </div>
    </Section>
  );
}
