"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowLeft, ArrowRight, StickyNote, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTour } from "./tour-provider";
import { TourScene } from "./tour-scenes";
import { chapterOf, chapters, firstStepOfChapter, tourSteps, type Placement, type SpotlightStep, type TourStep } from "./tour-steps";

const PAD = 10;
const RADIUS = 18;
const EDGE = 16;
const RAIL_SPACE = 76; // keep tooltips clear of the chapter rail at the bottom
const SPRING = { stiffness: 170, damping: 26, mass: 0.9 };

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ───────────────────────────── target discovery ───────────────────────────── */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function findVisible(id: string) {
  const el = document.querySelector<HTMLElement>(`[data-tour="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : null;
}

async function waitFor<T>(probe: () => T | null | false, timeoutMs: number, cancelled: () => boolean): Promise<T | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (cancelled()) return null;
    const hit = probe();
    if (hit) return hit;
    await sleep(60);
  }
  return null;
}

const TOOLTIP_ROOM = 330; // approximate tooltip height plus gap

/**
 * Scrolls so the target is visible AND the tooltip has room on its preferred side:
 * pinned under the top bar for "bottom", pinned above the rail for "top", centered otherwise.
 */
function scrollToTarget(el: HTMLElement, smooth: boolean, placement?: Placement) {
  const r = el.getBoundingClientRect();
  const top = 84; // clear the sticky top bar
  const bottom = RAIL_SPACE + 12;
  const vh = window.innerHeight;
  const room = vh - top - bottom;
  const fitsWithTooltip = r.height + TOOLTIP_ROOM <= room;

  let desiredTop: number;
  if (placement === "bottom" && fitsWithTooltip) desiredTop = top;
  else if (placement === "top" && fitsWithTooltip) desiredTop = vh - bottom - r.height;
  else if (r.top >= top && r.bottom <= vh - bottom) return;
  else desiredTop = r.height > room ? top : (vh - r.height) / 2;

  if (Math.abs(r.top - desiredTop) < 4) return;
  window.scrollTo({ top: Math.max(0, window.scrollY + r.top - desiredTop), behavior: smooth ? "smooth" : "auto" });
}

/** Navigates to the step's route, performs its scripted click, then resolves the element to highlight. */
function useStepTarget(step: TourStep, reduce: boolean) {
  const router = useRouter();
  const [state, setState] = React.useState<{ id: string; el: HTMLElement | null; status: "seeking" | "found" | "missing" }>({
    id: step.id,
    el: null,
    status: "seeking",
  });

  React.useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;

    if (step.kind !== "spotlight") return;
    if (window.location.pathname !== step.route) router.push(step.route);

    (async () => {
      await waitFor(() => window.location.pathname === step.route, 6000, isCancelled);
      if (step.click) {
        const button = await waitFor(() => findVisible(step.click!), 2500, isCancelled);
        if (button && !cancelled) {
          await sleep(reduce ? 0 : 450); // let the viewer see the page before the tour acts on it
          button.click();
        }
      }
      const el = await waitFor(() => findVisible(step.target), 5000, isCancelled);
      if (cancelled) return;
      if (el) scrollToTarget(el, !reduce, step.placement);
      setState({ id: step.id, el, status: el ? "found" : "missing" });
    })();

    return () => {
      cancelled = true;
    };
  }, [step, router, reduce]);

  if (step.kind !== "spotlight") return { id: step.id, el: null, status: "found" as const };
  // Never hand back a previous step's element while the new one is still resolving.
  return state.id === step.id ? state : { id: step.id, el: null, status: "seeking" as const };
}

/** Follows the element through scrolling, resizing, and animation, every frame. */
function useTrackedRect(el: HTMLElement | null, vw: number, vh: number) {
  const [tracked, setTracked] = React.useState<{ el: HTMLElement; rect: Rect } | null>(null);

  React.useEffect(() => {
    if (!el) return;
    let raf = 0;
    let last: Rect | null = null;
    const tick = () => {
      const r = el.getBoundingClientRect();
      const x1 = Math.max(r.left - PAD, 6);
      const y1 = Math.max(r.top - PAD, 6);
      const x2 = Math.min(r.right + PAD, vw - 6);
      const y2 = Math.min(r.bottom + PAD, vh - 6);
      const next = { x: x1, y: y1, w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) };
      if (!last || Math.abs(last.x - next.x) + Math.abs(last.y - next.y) + Math.abs(last.w - next.w) + Math.abs(last.h - next.h) > 0.5) {
        last = next;
        setTracked({ el, rect: next });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [el, vw, vh]);

  // A rect measured for a previous element is stale the moment the target changes.
  return el && tracked?.el === el ? tracked.rect : null;
}

function useViewport() {
  const [vp, setVp] = React.useState({ vw: 1280, vh: 800 });
  React.useEffect(() => {
    const update = () => setVp({ vw: window.innerWidth, vh: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return vp;
}

/* ───────────────────────────── spotlight ───────────────────────────── */

function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${x + rr} ${y}H${x + w - rr}A${rr} ${rr} 0 0 1 ${x + w} ${y + rr}V${y + h - rr}A${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h}H${x + rr}A${rr} ${rr} 0 0 1 ${x} ${y + h - rr}V${y + rr}A${rr} ${rr} 0 0 1 ${x + rr} ${y}Z`;
}

function useHoleSprings(hole: Rect, reduce: boolean) {
  const x = useSpring(hole.x, SPRING);
  const y = useSpring(hole.y, SPRING);
  const w = useSpring(hole.w, SPRING);
  const h = useSpring(hole.h, SPRING);
  React.useEffect(() => {
    const pairs: [MotionValue<number>, number][] = [
      [x, hole.x],
      [y, hole.y],
      [w, hole.w],
      [h, hole.h],
    ];
    for (const [mv, v] of pairs) {
      if (reduce) mv.jump(v);
      else mv.set(v);
    }
  }, [hole.x, hole.y, hole.w, hole.h, reduce, x, y, w, h]);
  return { x, y, w, h };
}

function Spotlight({
  springs,
  vw,
  vh,
  dim,
}: {
  springs: ReturnType<typeof useHoleSprings>;
  vw: number;
  vh: number;
  dim: number;
}) {
  const vwMv = useMotionValue(vw);
  const vhMv = useMotionValue(vh);
  React.useEffect(() => {
    vwMv.set(vw);
    vhMv.set(vh);
  }, [vw, vh, vwMv, vhMv]);

  // One path, two sub-paths, even-odd fill: the page is dimmed everywhere except the hole,
  // and because the hole isn't painted, clicks pass straight through to the highlighted element.
  const d = useTransform([springs.x, springs.y, springs.w, springs.h, vwMv, vhMv], ([x, y, w, h, W, H]: number[]) =>
    `M0 0H${W}V${H}H0Z${roundedRect(x, y, w, h, RADIUS)}`
  );

  return (
    <svg className="pointer-events-none fixed inset-0 h-full w-full" width={vw} height={vh} aria-hidden>
      <motion.path
        d={d}
        fillRule="evenodd"
        fill="rgb(5, 7, 18)"
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: dim }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={{ pointerEvents: "visiblePainted" }}
      />
    </svg>
  );
}

function Ring({ springs, visible }: { springs: ReturnType<typeof useHoleSprings>; visible: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="tour-ring pointer-events-none fixed left-0 top-0 rounded-[18px]"
      style={{ x: springs.x, y: springs.y, width: springs.w, height: springs.h }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    />
  );
}

/* ───────────────────────────── tooltip ───────────────────────────── */

interface Placed {
  side: Placement | "free";
  left: number;
  top: number;
  arrow: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function place(rect: Rect | null, size: { w: number; h: number }, vw: number, vh: number, preferred?: Placement): Placed {
  const gap = 16;
  const maxTop = vh - size.h - RAIL_SPACE;
  if (!rect || vw < 640) {
    // No anchor (or a phone): dock bottom-right, above the chapter rail.
    return { side: "free", left: clamp(vw - size.w - EDGE * 1.5, EDGE, vw), top: clamp(maxTop, EDGE, vh), arrow: 0 };
  }

  const room: Record<Placement, boolean> = {
    right: vw - (rect.x + rect.w) - gap >= size.w + EDGE,
    left: rect.x - gap >= size.w + EDGE,
    bottom: maxTop - (rect.y + rect.h) - gap >= 0,
    top: rect.y - gap - size.h >= EDGE,
  };
  const order: Placement[] = [preferred ?? "right", "right", "bottom", "left", "top"];
  const side = order.find((s) => room[s]);

  if (!side) {
    // Nothing fits cleanly: sit in whichever half of the screen has more empty space.
    const spaceAbove = rect.y;
    const spaceBelow = vh - (rect.y + rect.h);
    const top = spaceAbove > spaceBelow ? EDGE + 64 : maxTop;
    return { side: "free", left: vw - size.w - EDGE * 1.5, top: clamp(top, EDGE, Math.max(EDGE, maxTop)), arrow: 0 };
  }

  let left = 0;
  let top = 0;
  if (side === "right" || side === "left") {
    left = side === "right" ? rect.x + rect.w + gap : rect.x - gap - size.w;
    top = clamp(rect.y + rect.h / 2 - size.h / 2, EDGE, Math.max(EDGE, maxTop));
    return { side, left, top, arrow: clamp(rect.y + rect.h / 2 - top, 24, size.h - 24) };
  }
  top = side === "bottom" ? rect.y + rect.h + gap : rect.y - gap - size.h;
  left = clamp(rect.x + rect.w / 2 - size.w / 2, EDGE, vw - size.w - EDGE);
  return { side, left, top, arrow: clamp(rect.x + rect.w / 2 - left, 24, size.w - 24) };
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const rise = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.2, 0.7, 0.3, 1] as const } },
};

function Tooltip({
  step,
  rect,
  missing,
  vw,
  vh,
}: {
  step: SpotlightStep;
  rect: Rect | null;
  missing: boolean;
  vw: number;
  vh: number;
}) {
  const { showNotes } = useTour();
  const ref = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ w: 384, h: 280 });

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pos = place(rect, size, vw, vh, step.placement);
  const arrowStyle: React.CSSProperties | undefined =
    pos.side === "right"
      ? { left: -6, top: pos.arrow - 6 }
      : pos.side === "left"
        ? { right: -6, top: pos.arrow - 6 }
        : pos.side === "bottom"
          ? { top: -6, left: pos.arrow - 6 }
          : pos.side === "top"
            ? { bottom: -6, left: pos.arrow - 6 }
            : undefined;

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-labelledby={`tour-title-${step.id}`}
      className="pointer-events-auto fixed left-0 top-0 w-[min(384px,calc(100vw-32px))] rounded-2xl border border-border bg-surface p-5 shadow-[0_24px_60px_-12px_rgba(5,7,18,0.45)]"
      initial={{ opacity: 0, scale: 0.94, x: pos.left, y: pos.top + 10 }}
      animate={{ opacity: 1, scale: 1, x: pos.left, y: pos.top }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      {arrowStyle && (
        // A rotated square; only the two borders on the corner that points at the target are drawn.
        <span
          aria-hidden
          className={cn(
            "absolute h-3 w-3 rotate-45 border-border bg-surface",
            pos.side === "right" && "border-b border-l",
            pos.side === "left" && "border-r border-t",
            pos.side === "bottom" && "border-l border-t",
            pos.side === "top" && "border-b border-r"
          )}
          style={arrowStyle}
        />
      )}

      <motion.div variants={stagger} initial="hidden" animate="show">
        <StepHeader step={step} />
        <motion.h2 variants={rise} id={`tour-title-${step.id}`} className="mt-2 text-[18px] font-semibold leading-snug tracking-tight text-text-primary">
          {step.title}
        </motion.h2>
        <motion.p variants={rise} className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">
          {step.body}
        </motion.p>
        {missing && (
          <motion.p variants={rise} className="mt-2 text-[12px] text-text-muted">
            This part of the screen isn&apos;t visible at this window size. Widen the window to see it highlighted.
          </motion.p>
        )}
        {step.cx && (
          <motion.div variants={rise} className="mt-3.5 flex gap-2.5 rounded-xl border border-brand/20 bg-brand-soft p-3">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">CX parallel</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-text-primary">{step.cx}</p>
            </div>
          </motion.div>
        )}
        <AnimatePresence initial={false}>
          {showNotes && step.say && <PresenterNote text={step.say} />}
        </AnimatePresence>
        <motion.div variants={rise}>
          <TourControls />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function StepHeader({ step }: { step: TourStep }) {
  const { index, stop } = useTour();
  const chapter = chapters[chapterOf(index)];
  return (
    <motion.div variants={rise} className="flex items-center justify-between gap-3">
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-brand">
        {chapter?.label}
        <span className="ml-2 font-medium normal-case tracking-normal text-text-muted">
          {index + 1} of {tourSteps.length}
        </span>
      </p>
      <button
        onClick={stop}
        aria-label={`Exit walkthrough (currently on ${step.title})`}
        className="-mr-1.5 flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-soft hover:text-text-primary"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

function PresenterNote({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-3 flex gap-2.5 rounded-xl border border-warning/30 bg-warning-soft p-3">
        <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-warning">Presenter note</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-text-primary">{text}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function TourControls({ large = false }: { large?: boolean }) {
  const { index, next, prev, showNotes, toggleNotes } = useTour();
  const nextRef = React.useRef<HTMLButtonElement>(null);
  const last = index === tourSteps.length - 1;
  const pct = ((index + 1) / tourSteps.length) * 100;

  // Keep keyboard focus on Next so Enter always advances.
  React.useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
  }, [index]);

  return (
    <div className={cn("mt-4", large && "mt-6")}>
      <div className="h-1 overflow-hidden rounded-full bg-surface-soft">
        <motion.div className="h-full rounded-full bg-brand" initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 24 }} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={toggleNotes}
          aria-pressed={showNotes}
          title="Presenter notes (N)"
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium transition-colors",
            showNotes ? "bg-warning-soft text-warning" : "text-text-muted hover:bg-surface-soft hover:text-text-secondary"
          )}
        >
          <StickyNote className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Notes</span>
          <kbd className="hidden rounded border border-border px-1 text-[10px] sm:inline">N</kbd>
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={prev}
            disabled={index === 0}
            className="flex h-9 items-center gap-1 rounded-xl px-3 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-soft disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <button
            ref={nextRef}
            onClick={next}
            className={cn(
              "group flex h-9 items-center gap-1.5 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white shadow-sm shadow-brand/30 transition-all hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25",
              large && "h-10 px-5"
            )}
          >
            {last ? "Finish" : "Next"}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── scenes ───────────────────────────── */

function SceneFrame({ step }: { step: Extract<TourStep, { kind: "scene" }> }) {
  const { showNotes } = useTour();

  React.useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, []);

  return (
    <motion.div
      className="pointer-events-auto fixed inset-0 flex items-center justify-center px-3 pb-[84px] pt-4 sm:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <div aria-hidden className="absolute inset-0 overflow-hidden backdrop-blur-[6px]">
        <div className="tour-blob absolute -left-32 top-[10%] h-[420px] w-[420px] rounded-full bg-brand/25 blur-3xl" />
        <div className="tour-blob tour-blob-slow absolute -right-24 bottom-[5%] h-[380px] w-[380px] rounded-full bg-accent-blue/20 blur-3xl" />
      </div>

      <motion.section
        role="dialog"
        aria-labelledby={`tour-title-${step.id}`}
        className="scrollbar-thin relative max-h-full w-full max-w-[1120px] overflow-y-auto rounded-[28px] border border-border bg-surface shadow-[0_40px_120px_-20px_rgba(5,7,18,0.6)]"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.18 } }}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
      >
        <div className="p-6 sm:p-9">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <StepHeader step={step} />
            <motion.p variants={rise} className="mt-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-text-muted">
              {step.eyebrow}
            </motion.p>
            <motion.h2
              variants={rise}
              id={`tour-title-${step.id}`}
              className="mt-1.5 font-serif text-[30px] font-medium leading-[1.1] tracking-tight text-text-primary sm:text-[42px]"
            >
              {step.title}
            </motion.h2>
            <motion.p variants={rise} className="mt-3 max-w-3xl text-[15px] leading-relaxed text-text-secondary sm:text-[16.5px]">
              {step.lede}
            </motion.p>
          </motion.div>

          <div className="mt-7">
            <TourScene scene={step.scene} />
          </div>

          <AnimatePresence initial={false}>{showNotes && step.say && <PresenterNote text={step.say} />}</AnimatePresence>
          <TourControls large />
        </div>
      </motion.section>
    </motion.div>
  );
}

/* ───────────────────────────── chapter rail ───────────────────────────── */

function ChapterRail() {
  const { index, goTo, stop } = useTour();
  const current = chapterOf(index);

  return (
    <motion.nav
      aria-label="Walkthrough chapters"
      className="pointer-events-auto fixed bottom-4 left-1/2 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-[rgb(12,15,30)]/90 p-1.5 shadow-2xl backdrop-blur-md"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 26, delay: 0.2 }}
    >
      {chapters.map((c, i) => {
        const start = firstStepOfChapter(c.key);
        const count = tourSteps.filter((s) => s.chapter === c.key).length;
        const fill = i < current ? 1 : i > current ? 0 : (index - start + 1) / count;
        return (
          <button
            key={c.key}
            onClick={() => goTo(start)}
            title={c.label}
            className={cn(
              "group flex flex-col items-start gap-1 rounded-full px-3 py-1.5 text-left transition-colors",
              i === current ? "bg-white/10" : "hover:bg-white/5"
            )}
          >
            <span
              className={cn(
                "hidden whitespace-nowrap text-[11px] font-medium md:block",
                i === current ? "text-white" : "text-white/55 group-hover:text-white/80"
              )}
            >
              {c.label}
            </span>
            <span className="block h-1 w-8 overflow-hidden rounded-full bg-white/15 md:w-full md:min-w-14">
              <motion.span
                className="block h-full rounded-full bg-[#8b7cff]"
                initial={false}
                animate={{ width: `${fill * 100}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 24 }}
              />
            </span>
          </button>
        );
      })}
      <button
        onClick={stop}
        className="ml-1 flex h-8 items-center gap-1 rounded-full px-3 text-[11.5px] font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        Exit <kbd className="hidden rounded border border-white/20 px-1 text-[10px] sm:inline">Esc</kbd>
      </button>
    </motion.nav>
  );
}

/* ───────────────────────────── root ───────────────────────────── */

export function TourOverlay() {
  const { index } = useTour();
  const step = tourSteps[index];
  const reduce = useReducedMotion() ?? false;
  const { vw, vh } = useViewport();
  const target = useStepTarget(step, reduce);
  const rect = useTrackedRect(target.el, vw, vh);

  const isScene = step.kind === "scene";
  const spotlightOn = !isScene && rect !== null;
  // With no target, the hole collapses to a point mid-screen: an iris that closes for scenes and
  // re-opens on the next highlighted element.
  const hole = spotlightOn ? rect : { x: vw / 2, y: vh / 2, w: 0, h: 0 };
  const springs = useHoleSprings(hole, reduce);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none" aria-live="polite">
      <Spotlight springs={springs} vw={vw} vh={vh} dim={isScene ? 0.78 : 0.62} />
      <Ring springs={springs} visible={spotlightOn} />

      <AnimatePresence mode="wait">
        {isScene ? (
          <SceneFrame key={step.id} step={step} />
        ) : target.status !== "seeking" ? (
          <Tooltip key={step.id} step={step} rect={rect} missing={target.status === "missing"} vw={vw} vh={vh} />
        ) : (
          <motion.div
            key={`${step.id}-seeking`}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface/90 px-4 py-2 text-[12.5px] font-medium text-text-secondary shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.35 } }}
            exit={{ opacity: 0 }}
          >
            Loading the next screen…
          </motion.div>
        )}
      </AnimatePresence>

      <ChapterRail />
    </div>
  );
}
