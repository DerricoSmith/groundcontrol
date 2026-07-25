import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a conversation about customer intelligence, a pilot, advisory work, or hiring.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-brand-wash" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid mask-fade-b opacity-50" />

      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="mb-4 flex items-center gap-2.5 text-[12px] font-medium uppercase tracking-[0.16em] text-brand">
            <span aria-hidden="true" className="h-px w-6 bg-brand/40" />
            Contact
          </p>
          <h1 className="font-serif text-[34px] font-medium leading-[1.08] tracking-[-0.02em] text-text-primary sm:text-[46px]">
            Start a conversation.
          </h1>
          <p className="mt-5 text-[15.5px] leading-relaxed text-text-secondary">
            Whether you want a pilot, advisory work, or a straight answer about whether Ground Control fits your
            situation, this reaches the Signal &amp; State team directly.
          </p>

          <dl className="mt-8 space-y-5 text-[14px]">
            <div>
              <dt className="font-medium text-text-primary">If you lead customer success, or you are a founder</dt>
              <dd className="mt-1 leading-relaxed text-text-secondary">
                Tell us what you cannot currently see about your customers. That is usually enough to know whether a
                sprint or a pilot is the right starting point.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-text-primary">If you are recruiting</dt>
              <dd className="mt-1 leading-relaxed text-text-secondary">
                The build story explains how the product was designed and built, and the demo is live. We are happy to
                walk through either.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-text-primary">If you are an investor or potential partner</dt>
              <dd className="mt-1 leading-relaxed text-text-secondary">
                The commercial thesis is on the build story page. We are glad to talk about where the service enabled
                model goes next.
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 elevate-lg sm:p-8">
          <ContactForm defaultReason={reason} sourcePage="/contact" />
        </div>
      </div>
      </div>
    </section>
  );
}
