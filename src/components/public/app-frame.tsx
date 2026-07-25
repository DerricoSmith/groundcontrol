import Image from "next/image";

/**
 * A product screenshot presented inside browser chrome.
 *
 * The frame does two things a bare image cannot: it signals "this is a running
 * application" rather than a mockup, and it gives the screenshot an edge so it
 * does not dissolve into the page background.
 *
 * The chrome is deliberately plain. No traffic-light macOS imitation, no
 * drop-shadowed device bezel, no perspective transform. Those read as a
 * marketing template; this reads as a window.
 */
export function AppFrame({
  src,
  alt,
  width,
  height,
  label = "signal-and-state-ground-control.vercel.app/demo",
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  label?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={`overflow-hidden rounded-xl border border-border bg-surface elevate-lg ${className}`}>
      <div className="flex items-center gap-2 border-b border-border bg-surface-soft px-3 py-2.5">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        </span>
        <span className="mx-auto max-w-[70%] truncate rounded-md bg-surface px-2.5 py-1 text-[11px] text-text-muted">
          {label}
        </span>
      </div>

      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="h-auto w-full"
        sizes="(min-width: 1280px) 900px, (min-width: 768px) 90vw, 100vw"
      />
    </figure>
  );
}

/**
 * Two screenshots overlapped, a wide one behind and a narrow one in front.
 * Used where one image would leave the composition flat and there is a genuine
 * second view worth showing.
 */
export function AppFrameStack({
  primary,
  secondary,
}: {
  primary: { src: string; alt: string; width: number; height: number; label?: string };
  secondary: { src: string; alt: string; width: number; height: number };
}) {
  return (
    <div className="relative">
      <AppFrame {...primary} priority />

      {/* Decorative composition only; the alt text on the image still describes it. */}
      <div className="pointer-events-none absolute -bottom-10 -right-4 hidden w-[38%] lg:block">
        <div className="overflow-hidden rounded-lg border border-border bg-surface elevate-lg">
          <Image
            src={secondary.src}
            alt={secondary.alt}
            width={secondary.width}
            height={secondary.height}
            className="h-auto w-full"
            sizes="340px"
          />
        </div>
      </div>
    </div>
  );
}
