/**
 * The AI workflow catalog.
 *
 * Pure data with no server dependency, so Client Components can label an
 * output without pulling the service layer into the browser bundle.
 *
 * Every workflow is advisory. None of them writes a number. Health scores,
 * risk severities, forecast confidence, and revenue figures are produced by
 * deterministic services and are never touched by a model, which is the rule
 * that lets the product claim its numbers are reproducible.
 */

export const AI_WORKFLOWS = [
  "account_summary",
  "risk_explanation",
  "action_refinement",
  "executive_brief_narrative",
  "feedback_theme",
  "meeting_note_summary",
  "communication_draft",
] as const;

export type AIWorkflow = (typeof AI_WORKFLOWS)[number];

export interface WorkflowDefinition {
  key: AIWorkflow;
  label: string;
  /** What it produces, in the language the product uses with customers. */
  purpose: string;
  /** Stated plainly in the UI so a reader knows what they are looking at. */
  outputKind: "interpretation" | "recommendation" | "summary" | "draft";
  /** True when the output is never sent anywhere without a person approving it. */
  requiresHumanApproval: boolean;
}

export const WORKFLOW_DEFINITIONS: Record<AIWorkflow, WorkflowDefinition> = {
  account_summary: {
    key: "account_summary",
    label: "Account summary",
    purpose: "A short read on where an account stands, grounded in its health components and open risks.",
    outputKind: "summary",
    requiresHumanApproval: false,
  },
  risk_explanation: {
    key: "risk_explanation",
    label: "Risk explanation",
    purpose: "Restates a detected risk in plainer language without changing its severity or evidence.",
    outputKind: "interpretation",
    requiresHumanApproval: false,
  },
  action_refinement: {
    key: "action_refinement",
    label: "Recommended action refinement",
    purpose: "Sharpens a suggested action into something a specific owner can execute this week.",
    outputKind: "recommendation",
    requiresHumanApproval: false,
  },
  executive_brief_narrative: {
    key: "executive_brief_narrative",
    label: "Executive brief narrative",
    purpose: "Adds a readable narrative over the deterministic brief sections without altering any figure.",
    outputKind: "summary",
    requiresHumanApproval: true,
  },
  feedback_theme: {
    key: "feedback_theme",
    label: "Customer feedback theme",
    purpose: "Groups feedback and support signals into candidate themes for a person to confirm or dismiss.",
    outputKind: "interpretation",
    requiresHumanApproval: true,
  },
  meeting_note_summary: {
    key: "meeting_note_summary",
    label: "Meeting note summary",
    purpose: "Condenses a recorded interaction into outcome and next step.",
    outputKind: "summary",
    requiresHumanApproval: false,
  },
  communication_draft: {
    key: "communication_draft",
    label: "Customer communication draft",
    purpose: "Drafts an internal-only message for a person to edit and send themselves.",
    outputKind: "draft",
    requiresHumanApproval: true,
  },
};

/**
 * Prompt versions are part of the stored record, so an output can always be
 * traced to the exact instructions that produced it. Bump the version when a
 * prompt changes; never edit a prompt in place without bumping.
 */
export const PROMPT_VERSIONS: Record<AIWorkflow, string> = {
  account_summary: "account_summary@2026-07-25.1",
  risk_explanation: "risk_explanation@2026-07-25.1",
  action_refinement: "action_refinement@2026-07-25.1",
  executive_brief_narrative: "executive_brief_narrative@2026-07-25.1",
  feedback_theme: "feedback_theme@2026-07-25.1",
  meeting_note_summary: "meeting_note_summary@2026-07-25.1",
  communication_draft: "communication_draft@2026-07-25.1",
};
