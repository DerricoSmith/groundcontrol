import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Liveness and database reachability.
 *
 * Deliberately says almost nothing. It reports whether the process is up and
 * whether it can reach its database, plus which environment it believes it is,
 * because confusing preview with production is a real operational hazard. It
 * never reports the database host, the schema, a version, a commit, or any
 * count, since an unauthenticated endpoint should not describe the system to
 * someone deciding whether to attack it.
 */
export async function GET(): Promise<NextResponse> {
  const startedAt = Date.now();

  let database: "ok" | "unreachable" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "unreachable";
  }

  const body = {
    status: database === "ok" ? "ok" : "degraded",
    database,
    environment: process.env.VERCEL_ENV ?? "development",
    checkedAt: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
  };

  return NextResponse.json(body, {
    status: database === "ok" ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
