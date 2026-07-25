import { prisma } from "@/lib/prisma";

/**
 * Sets the Postgres session variables that prisma/rls-postgres.sql policies
 * read (`app.current_org_id`, `app.current_user_id`). This is a real
 * database-level enforcement mechanism in Postgres environments and a
 * documented no-op on local SQLite, which has no session-variable or RLS
 * concept — see SECURITY.md and the note at the top of schema.prisma.
 *
 * Call this at the start of any request handling tenant data, then run
 * queries within the same transaction/connection so the setting applies.
 */
export async function withTenantContext<T>(
  organizationId: string,
  userId: string,
  fn: () => Promise<T>
): Promise<T> {
  const provider = process.env.DATABASE_URL?.startsWith("file:") ? "sqlite" : "postgresql";

  if (provider !== "postgresql") {
    // Local/SQLite: no RLS to configure. Service-layer organizationId
    // scoping (already required on every query) is the only enforcement
    // available in this environment.
    return fn();
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`select set_config('app.current_org_id', $1, true)`, organizationId);
    await tx.$executeRawUnsafe(`select set_config('app.current_user_id', $1, true)`, userId);
    return fn();
  });
}
