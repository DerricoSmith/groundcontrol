"use client";

import * as React from "react";
import { TourOverlay } from "./tour-overlay";
import { tourSteps } from "./tour-steps";

const STEP_KEY = "gc-tour-step";
const NOTES_KEY = "gc-tour-notes";

interface TourContextValue {
  active: boolean;
  index: number;
  showNotes: boolean;
  start: (at?: number) => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  goTo: (i: number) => void;
  toggleNotes: () => void;
}

const TourContext = React.createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = React.useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside <TourProvider>");
  return ctx;
}

function read(key: string, store: "session" | "local") {
  try {
    return (store === "session" ? sessionStorage : localStorage).getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null, store: "session" | "local") {
  try {
    const s = store === "session" ? sessionStorage : localStorage;
    if (value === null) s.removeItem(key);
    else s.setItem(key, value);
  } catch {
    // Storage blocked (private mode etc.) — the tour still works, it just won't resume after a reload.
  }
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = React.useState<number | null>(null);
  const [showNotes, setShowNotes] = React.useState(false);

  // Resume an in-progress tour after a reload, and support ?tour=1 deep links.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const saved = read(STEP_KEY, "session");
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from browser storage */
    if (params.get("tour") === "1") {
      setIndex(0);
      // Consume the deep link so a reload resumes where you were instead of restarting.
      params.delete("tour");
      const query = params.toString();
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    } else if (saved !== null && !Number.isNaN(Number(saved))) setIndex(Math.min(Number(saved), tourSteps.length - 1));
    setShowNotes(read(NOTES_KEY, "local") === "1");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Skip the very first commit: index is still null there, and writing it would erase the step
  // the hydration effect above is about to restore.
  const hydrated = React.useRef(false);
  React.useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    write(STEP_KEY, index === null ? null : String(index), "session");
  }, [index]);

  const value = React.useMemo<TourContextValue>(() => {
    const clamp = (i: number) => Math.max(0, Math.min(tourSteps.length - 1, i));
    return {
      active: index !== null,
      index: index ?? 0,
      showNotes,
      start: (at = 0) => setIndex(clamp(at)),
      stop: () => setIndex(null),
      next: () => setIndex((i) => (i === null ? i : i >= tourSteps.length - 1 ? null : i + 1)),
      prev: () => setIndex((i) => (i === null ? i : clamp(i - 1))),
      goTo: (i: number) => setIndex(clamp(i)),
      toggleNotes: () =>
        setShowNotes((v) => {
          write(NOTES_KEY, v ? "0" : "1", "local");
          return !v;
        }),
    };
  }, [index, showNotes]);

  React.useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") return value.stop();
      if (isTyping(e.target)) return;
      // Let a focused button handle its own Enter/Space so one press never advances twice.
      const onButton = e.target instanceof HTMLButtonElement;
      if (e.key === "ArrowRight" || ((e.key === "Enter" || e.key === " ") && !onButton)) {
        e.preventDefault();
        value.next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        value.prev();
      } else if (e.key === "n" || e.key === "N") {
        value.toggleNotes();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, value]);

  return (
    <TourContext.Provider value={value}>
      {children}
      {index !== null && <TourOverlay />}
    </TourContext.Provider>
  );
}
