# Performance findings, v1.0.1

| Finding | Severity | Action |
| --- | --- | --- |
| Nine demo screenshots totalling about 1.9 MB would ship as raw PNGs | Would have been high | Served through `next/image` with explicit dimensions and a `sizes` hint, so the platform delivers optimized responsive formats. Fixed. |
| Account detail recalculates health per request rather than reading the snapshot | Low at current scale | Not changed. Deliberate for correctness. Revisit above roughly a thousand accounts. |
| Demo portfolio has no pagination | Low | Not changed. Fourteen rows. Would matter at customer scale. |
| Neon cold start adds a visible delay to the first demo request after idle | Low | Not changed. Free tier characteristic. Scripts warm their own connections. |
| No Lighthouse or Core Web Vitals measurement | Informational | Not done. Recorded rather than estimated. |

## Nothing severe was found

No blocking issue was identified in the showcase, the demo, or account detail. The pages that matter most for the recruiter and prospect path are static or lightly dynamic, there are no third-party scripts, and query counts are bounded and parallel.

The largest real risk was image weight, and it is resolved.
