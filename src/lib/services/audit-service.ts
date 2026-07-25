import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Required event types — SECURITY.md "Audit log". Keep this list in sync
 * with that document; it is the contract for what "material action" means
 * in this product.
 */
export type AuditEventType =
  | "user_login"
  | "user_logout"
  | "organization_created"
  | "user_invited"
  | "invitation_revoked"
  | "invitation_resent"
  | "invitation_accepted"
  | "user_role_changed"
  | "user_removed"
  | "organization_switched"
  | "data_imported"
  | "data_deleted"
  | "health_model_changed"
  | "health_score_overridden"
  | "risk_created"
  | "risk_updated"
  | "risk_resolved"
  | "action_assigned"
  | "action_completed"
  | "escalation_opened"
  | "escalation_updated"
  | "escalation_resolved"
  | "executive_brief_generated"
  | "executive_brief_approved"
  | "executive_brief_delivered"
  | "integration_connected"
  | "integration_disconnected"
  | "consultant_access_granted"
  | "consultant_access_revoked"
  | "ai_analysis_generated"
  | "ai_output_approved"
  | "export_created"
  | "organization_setting_changed";

export interface RecordAuditEventInput {
  organizationId: string;
  actorUserId?: string | null;
  eventType: AuditEventType;
  targetType?: string;
  targetId?: string;
  /** Never put sensitive values here — see SECURITY.md. Non-sensitive context only. */
  metadata?: Record<string, string | number | boolean | null>;
}

export async function recordAuditEvent(input: RecordAuditEventInput) {
  return prisma.auditEvent.create({
    data: {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId ?? null,
      eventType: input.eventType,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ?? undefined,
    },
  });
}
