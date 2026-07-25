-- Row-Level Security policies for Postgres environments (staging/production).
--
-- SQLite (used for local dev) has no RLS concept — this file is NOT applied
-- locally and cannot be exercised by the local test suite. Apply it to every
-- Postgres environment immediately after running `prisma migrate deploy`,
-- and re-run it whenever a new tenant-owned table is added to schema.prisma.
--
-- Pattern: every tenant-owned table compares its organization_id column to
-- a session variable set per-request by the application (see
-- src/lib/db/tenant-context.ts). If that variable is never set, every
-- policy below evaluates false and the query returns zero rows — the safe
-- failure mode.
--
-- See SECURITY.md "Tenant isolation" and DECISIONS.md for why this exists
-- as raw SQL rather than a Supabase-managed policy.

-- Membership is scoped by organization_id directly (not via a join), and a
-- user must also be able to read their OWN memberships to resolve which
-- orgs they belong to — so it gets a second policy in addition to the
-- standard tenant policy.

alter table "CustomerAccount" enable row level security;
create policy tenant_isolation on "CustomerAccount"
  using ("organizationId" = current_setting('app.current_org_id', true));

alter table "Renewal" enable row level security;
create policy tenant_isolation on "Renewal"
  using ("organizationId" = current_setting('app.current_org_id', true));

alter table "HealthScore" enable row level security;
create policy tenant_isolation on "HealthScore"
  using ("organizationId" = current_setting('app.current_org_id', true));

alter table "HealthScoreComponent" enable row level security;
create policy tenant_isolation on "HealthScoreComponent"
  using (
    "healthScoreId" in (
      select id from "HealthScore"
      where "organizationId" = current_setting('app.current_org_id', true)
    )
  );

alter table "RiskSignal" enable row level security;
create policy tenant_isolation on "RiskSignal"
  using ("organizationId" = current_setting('app.current_org_id', true));

alter table "RecommendedAction" enable row level security;
create policy tenant_isolation on "RecommendedAction"
  using ("organizationId" = current_setting('app.current_org_id', true));

alter table "ImportJob" enable row level security;
create policy tenant_isolation on "ImportJob"
  using ("organizationId" = current_setting('app.current_org_id', true));

alter table "DataSource" enable row level security;
create policy tenant_isolation on "DataSource"
  using ("organizationId" = current_setting('app.current_org_id', true));

alter table "AuditEvent" enable row level security;
create policy tenant_isolation on "AuditEvent"
  using ("organizationId" = current_setting('app.current_org_id', true));

alter table "Membership" enable row level security;
create policy tenant_isolation on "Membership"
  using (
    "organizationId" = current_setting('app.current_org_id', true)
    or "userId" = current_setting('app.current_user_id', true)
  );

-- Organization itself: a user may read only organizations they hold a
-- membership in. This policy intentionally does NOT depend on
-- app.current_org_id (that variable doesn't exist until an org is chosen),
-- it depends on membership.
alter table "Organization" enable row level security;
create policy membership_scoped on "Organization"
  using (
    id in (
      select "organizationId" from "Membership"
      where "userId" = current_setting('app.current_user_id', true)
    )
  );

-- Lead and User are intentionally NOT tenant-scoped the same way: Lead is
-- internal-only (Signal & State org), gated at the service/role layer
-- rather than by organizationId (leads aren't yet tied to a customer
-- organization at capture time). User has no organizationId at all — a
-- person's identity is not owned by any single org. Both are documented
-- here so the absence of a policy is a decision, not an oversight.
