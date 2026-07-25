# Performance review

Reviewed 2026-07-25 for v1.0.1. Practical review focused on the recruiter, demo, and pilot experience rather than synthetic benchmarking.

## Method

Local production build against the Neon database, plus Vercel build output. This is not a load test and no claim about scale is made.

## Rendering strategy

| Surface | Strategy | Why |
| --- | --- | --- |
| Home, product, showcase, about, services, trust, privacy, terms | Static | No per-request data. Served from the edge. |
| Demo routes | Dynamic, `force-dynamic` | Read the database per request |
| Authenticated routes | Dynamic | Must never serve one organization's data from another's cache |

The recruiter and investor path, which is home to showcase to demo, is two static pages and one dynamic page. That is the fastest possible shape for the pages that matter most.

## Findings

**Screenshots were the largest payload.** Nine PNGs totalling about 1.9 MB. Served through `next/image` with explicit dimensions and a `sizes` hint, so Vercel serves optimized WebP or AVIF at the requested width and a phone never downloads a 1440 pixel PNG. No build-time image pipeline was added, because the platform already does this well.

**Fonts.** Three families through `next/font`, self-hosted with automatic preloading and no layout shift from a swap.

**Query counts.** Mission Control and the demo portfolio issue a bounded set of parallel queries through `Promise.all` rather than sequentially. Account detail is the heaviest page, with the account plus nine included relations in one query, then health and metrics in parallel. No N plus one was found: relations are fetched with `include` rather than per-row lookups.

**Pagination.** Customer Portfolio pages at 50 with a separate count. Risk Radar and Actions cap at 200. The demo portfolio is unbounded at 14 rows, which is fine at demo scale and would need pagination at customer scale.

**Cold database.** Neon suspends an idle compute, so the first request after a quiet period pays a wake penalty. This is visible on the demo if nobody has opened it recently. Scripts warm the connection; the application does not, and a request simply waits. Acceptable on a free tier.

## Not fixed

**Account detail recalculates health on every request** rather than reading the stored snapshot. That is deliberate for correctness, since it shows the score as of now including any data imported since the last recalculation. At fourteen or a few hundred accounts it is not a problem. At thousands it should read the snapshot and offer recalculation on demand.

**No caching layer.** Deliberate. Caching tenant-scoped data is where cross-tenant leaks come from, and the correctness risk is not worth the milliseconds at this scale.

## Budgets

See PERFORMANCE_BUDGETS.md.
