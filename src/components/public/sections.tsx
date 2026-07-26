import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * Shared layout primitives for the public site.
 *
 * The visual language is a control room crossed with a business publication:
 * generous space, a single indigo accent, hairline rules, and paper-like
 * elevation. Depth comes from very soft shadows rather than heavy borders, and
 * nothing is added that could be mistaken for data.
 */

export function Section({
  children,
  className = "",
  tone = "default",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "soft" | "contrast";
  id?: string;
}) {
  const toneClass =
    tone === "soft"
      ? "bg-surface-soft border-y border-border"
      : tone === "contrast"
        ? "bg-text-primary"
        : "";

  return (
    <section id={id} className={`${toneClass} ${className}`}>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  id?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow && (
        <p
          className={`mb-3 flex items-center gap-2.5 text-[12px] font-medium uppercase tracking-[0.16em] text-brand ${
            align === "center" ? "justify-center" : ""
          }`}
        >
          <span aria-hidden="true" className="h-px w-6 bg-brand/40" />
          {eyebrow}
        </p>
      )}
      <h2 id={id} className="type-h2 font-serif font-medium text-text-primary">
        {title}
      </h2>
      {description && <p className="type-lead measure mt-5 text-text-secondary">{description}</p>}
    </div>
  );
}

/**
 * The standard page opener for secondary pages.
 *
 * Every public page gets the same treatment so the site reads as one thing:
 * the brand wash, a fading grid, an eyebrow with a rule, and a serif headline.
 * Before this existed each page rolled its own opener and the site looked
 * assembled rather than designed.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  align?: "left" | "center";
}) {
  const centered = align === "center";

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-brand-wash" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid mask-fade-b opacity-60" />

      <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-16 sm:pt-24">
        <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
          <p
            className={`mb-4 flex items-center gap-2.5 text-[12px] font-medium uppercase tracking-[0.16em] text-brand ${
              centered ? "justify-center" : ""
            }`}
          >
            <span aria-hidden="true" className="h-px w-6 bg-brand/40" />
            {eyebrow}
          </p>
          <h1 className="type-h1 font-serif font-medium text-text-primary">{title}</h1>
          {description && (
            <p className={`type-lead mt-6 text-text-secondary ${centered ? "mx-auto measure" : "measure"}`}>
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * Long-form copy.
 *
 * The first paragraph is treated as a lead: larger, darker, and set at the
 * primary text colour. It gives a section an entry point and stops a wall of
 * uniform grey, which is most of what made the page feel flat.
 */
export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="prose-block type-body measure mt-6 space-y-5 text-text-secondary">{children}</div>;
}

export function FeatureCard({
  icon: Icon,
  title,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-6 transition-shadow duration-200 elevate hover:elevate-lg">
      {Icon && (
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand ring-1 ring-inset ring-brand/10">
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
      )}
      <h3 className="text-[16px] font-medium leading-snug tracking-[-0.011em] text-text-primary">{title}</h3>
      <p className="type-small mt-2.5 text-text-secondary">{children}</p>
    </div>
  );
}

/** A card whose top edge carries the brand hairline. Used for emphasis, sparingly. */
export function AccentCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rule-brand relative overflow-hidden rounded-xl border border-border bg-surface p-6 elevate">
      <h3 className="text-[16px] font-medium leading-snug tracking-[-0.011em] text-text-primary">{title}</h3>
      <p className="type-small mt-2.5 text-text-secondary">{children}</p>
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-3 text-[14.5px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-brand-hover hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg border border-border-strong bg-surface px-5 py-3 text-[14.5px] font-medium text-text-primary transition-colors duration-200 hover:border-brand/30 hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {children}
    </Link>
  );
}

/**
 * Used wherever the site states something it cannot yet prove. Keeping this a
 * component rather than ad hoc prose means the honesty rules stay visible in
 * the codebase instead of depending on whoever writes the next page.
 */
export function HonestyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-surface-soft px-5 py-4">
      <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-warning-strong" />
      <p className="text-[13.5px] leading-relaxed text-text-secondary">{children}</p>
    </div>
  );
}

/**
 * A band of real facts about the product. Every figure here is checkable in
 * the codebase or the demo; none is a performance metric, a customer count, or
 * anything the company has not earned.
 */
export function FactBand({ facts }: { facts: { value: string; label: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
      {facts.map((fact) => (
        <div key={fact.label} className="bg-surface px-5 py-6 text-center">
          <dt className="sr-only">{fact.label}</dt>
          <dd>
            <span className="block font-serif text-[30px] font-medium tracking-tight text-text-primary tabular-nums">
              {fact.value}
            </span>
            <span className="mt-1 block text-[12.5px] leading-snug text-text-muted">{fact.label}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
