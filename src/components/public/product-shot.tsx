import Image from "next/image";
import Link from "next/link";

/**
 * A product screenshot with the explanation that makes it worth showing.
 *
 * Every shot answers four questions, because a screenshot on its own tells a
 * recruiter or a prospect nothing: what am I looking at, why does it matter,
 * what decision does it support, and what was deliberately designed here.
 *
 * Images are served through next/image so they are optimized and responsive
 * rather than shipping full-size PNGs to a phone. All of them come from the
 * fictional demonstration environment.
 */
export function ProductShot({
  src,
  alt,
  width,
  height,
  title,
  what,
  why,
  decision,
  designed,
  demoHref,
  demoLabel,
  reverse = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  title: string;
  what: string;
  why: string;
  decision: string;
  designed: string;
  demoHref: string;
  demoLabel: string;
  reverse?: boolean;
}) {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <div className={reverse ? "lg:order-2" : undefined}>
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="h-auto w-full"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
      </div>

      <div className={reverse ? "lg:order-1" : undefined}>
        <h3 className="font-serif text-[21px] font-medium tracking-tight text-text-primary sm:text-[24px]">{title}</h3>

        <dl className="mt-4 space-y-3.5 text-[14px] leading-relaxed">
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-text-muted">What this is</dt>
            <dd className="mt-1 text-text-secondary">{what}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-text-muted">Why it matters</dt>
            <dd className="mt-1 text-text-secondary">{why}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-text-muted">The decision it supports</dt>
            <dd className="mt-1 text-text-secondary">{decision}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-text-muted">What I designed</dt>
            <dd className="mt-1 text-text-secondary">{designed}</dd>
          </div>
        </dl>

        <Link
          href={demoHref}
          className="mt-5 inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-[13.5px] font-medium text-text-primary transition-colors hover:bg-surface-soft"
        >
          {demoLabel}
        </Link>
      </div>
    </div>
  );
}
