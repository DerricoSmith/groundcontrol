"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play } from "lucide-react";
import { useTour } from "./tour-provider";

export function TourLauncher() {
  const { active, start } = useTour();

  return (
    <AnimatePresence>
      {!active && (
        <motion.button
          onClick={() => start(0)}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.4 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="tour-launcher fixed bottom-6 right-6 z-40 hidden items-center gap-2.5 rounded-full py-2 pl-2 pr-5 text-[13.5px] font-semibold text-white shadow-[0_12px_32px_-8px_var(--brand)] lg:flex"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <span className="tour-ping absolute inset-0 rounded-full bg-white/30" />
            <Play className="relative h-3.5 w-3.5 fill-current" />
          </span>
          Guided walkthrough
        </motion.button>
      )}
    </AnimatePresence>
  );
}
