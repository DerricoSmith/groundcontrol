"use client";

import * as React from "react";
import { Monitor, Smartphone, Lock } from "lucide-react";
import { navItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

const tourPages = navItems.filter((n) => n.href !== "/case-study");

const FRAME_SIZE = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
} as const;

/** Measures the container's rendered width and returns a scale factor so a
 * fixed-size iframe (targetWidth) can be shrunk to fit it responsively. */
function useContainerScale(targetWidth: number) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.3);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setScale(width / targetWidth);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [targetWidth]);

  return { ref, scale };
}

function FramedIframe({ href, size, scale }: { href: string; size: { width: number; height: number }; scale: number }) {
  return (
    <div style={{ width: size.width * scale, height: size.height * scale }} className="overflow-hidden">
      <iframe
        key={href}
        src={href}
        title="Ground Control live preview"
        width={size.width}
        height={size.height}
        style={{ border: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}
      />
    </div>
  );
}

export function ProductTour() {
  const [device, setDevice] = React.useState<"desktop" | "mobile">("mobile");
  const [href, setHref] = React.useState(tourPages[0].href);
  const size = FRAME_SIZE[device];
  const { ref, scale } = useContainerScale(size.width);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 self-start rounded-full border border-border bg-surface-soft p-1">
          <button
            onClick={() => setDevice("mobile")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
              device === "mobile" ? "bg-brand text-white" : "text-text-secondary"
            )}
          >
            <Smartphone className="h-3.5 w-3.5" /> Mobile
          </button>
          <button
            onClick={() => setDevice("desktop")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
              device === "desktop" ? "bg-brand text-white" : "text-text-secondary"
            )}
          >
            <Monitor className="h-3.5 w-3.5" /> Desktop
          </button>
        </div>

        <div className="scrollbar-thin flex gap-1.5 overflow-x-auto">
          {tourPages.map((p) => (
            <button
              key={p.href}
              onClick={() => setHref(p.href)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                href === p.href ? "bg-brand-soft text-brand" : "bg-surface-soft text-text-muted hover:text-text-secondary"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {device === "desktop" ? (
        <div className="w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-border bg-surface-soft px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-positive/50" />
            <div className="ml-2 flex flex-1 items-center gap-1.5 truncate rounded-md bg-surface px-3 py-1 text-[11.5px] text-text-muted">
              <Lock className="h-3 w-3 shrink-0" />
              <span className="truncate">groundcontrol.app{href}</span>
            </div>
          </div>
          <div ref={ref} className="w-full bg-background">
            <FramedIframe href={href} size={size} scale={scale} />
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="relative rounded-[2.5rem] border-[8px] border-text-primary bg-text-primary p-1 shadow-xl">
            <div className="pointer-events-none absolute left-1/2 top-1 z-10 h-5 w-28 -translate-x-1/2 rounded-full bg-text-primary" />
            <div ref={ref} className="w-[270px] overflow-hidden rounded-[1.9rem] bg-background sm:w-[320px]">
              <FramedIframe href={href} size={size} scale={scale} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
