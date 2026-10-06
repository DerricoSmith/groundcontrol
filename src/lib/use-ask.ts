"use client";

import * as React from "react";
import { getAIResponse, type AIResponse } from "@/lib/ai-response";

/** Asks /api/ask (Claude, grounded on workspace data); falls back to the local rule engine if the request fails. */
export function useAsk() {
  const [pending, setPending] = React.useState(false);

  const ask = React.useCallback(async (question: string): Promise<AIResponse> => {
    const startedAt = Date.now();
    setPending(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as AIResponse;
    } catch {
      return {
        ...getAIResponse(question),
        meta: { source: "rules", latencyMs: Date.now() - startedAt, fallbackReason: "network error" },
      };
    } finally {
      setPending(false);
    }
  }, []);

  return { ask, pending };
}
