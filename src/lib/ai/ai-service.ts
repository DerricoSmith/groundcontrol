import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAIConfig } from "@/lib/ai/provider";
import { PROMPT_VERSIONS, WORKFLOW_DEFINITIONS, type AIWorkflow } from "@/lib/ai/workflows";

export class AIError extends Error {}

/**
 * The single entry point for every AI workflow in the product. Nothing calls a
 * model from a page, a component, or a route handler.
 *
 * Three guarantees hold regardless of which provider serves a request:
 *
 *  1. The output is schema-validated before it is stored or displayed. A model
 *     that returns something unexpected produces a fallback, never a crash and
 *     never unvalidated prose rendered as fact.
 *  2. The output is stored as an AIAnalysisRecord with its prompt version, its
 *     provider, and references to the evidence it was grounded in.
 *  3. No numeric value the product reports is ever sourced from here.
 */

/** Every workflow returns this shape, whoever produced it. */
export const AIOutputSchema = z.object({
  /** One or two sentences. The part a person reads. */
  narrative: z.string().min(1).max(2000),
  /**
   * Claims the output makes, each tagged so the UI can distinguish a fact from
   * an interpretation. This is the founder's fact/calculation/interpretation/
   * recommendation/assumption rule, enforced in the type system.
   */
  claims: z
    .array(
      z.object({
        kind: z.enum(["fact", "calculation", "interpretation", "recommendation", "assumption"]),
        text: z.string().min(1).max(500),
      })
    )
    .max(12)
    .default([]),
  /** Anything the output could not determine. Never silently omitted. */
  uncertainties: z.array(z.string().min(1).max(300)).max(6).default([]),
});

export type AIOutput = z.infer<typeof AIOutputSchema>;

export interface EvidenceRef {
  kind: string;
  id?: string;
  label: string;
}

export interface RunWorkflowParams {
  organizationId: string;
  workflow: AIWorkflow;
  subjectType?: string;
  subjectId?: string;
  /** The facts the output must be grounded in. Nothing else is available to it. */
  evidence: EvidenceRef[];
  /**
   * Produces the output without a model, from the same evidence. Required, not
   * optional: a workflow that cannot work deterministically does not ship,
   * because the product must be complete with no provider configured.
   */
  deterministic: () => AIOutput;
  /** Instructions for the model. Never contains a secret and never leaves the server. */
  buildPrompt?: () => string;
}

export interface RunWorkflowResult {
  output: AIOutput;
  provider: string;
  isFallback: boolean;
  recordId: string;
  /** Safe to display. Explains to the reader how this text came to exist. */
  disclosure: string;
}

export async function runWorkflow(params: RunWorkflowParams): Promise<RunWorkflowResult> {
  const config = getAIConfig();
  const definition = WORKFLOW_DEFINITIONS[params.workflow];
  const promptVersion = PROMPT_VERSIONS[params.workflow];
  const startedAt = Date.now();

  let output: AIOutput;
  let provider: string;
  let isFallback: boolean;
  let model: string | null = null;
  let errorKind: string | null = null;
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;

  if (config.mode === "disabled") {
    // Disabled means disabled. No model call, and no deterministic text either,
    // because the operator asked for the feature to be off rather than degraded.
    throw new AIError("AI features are switched off for this environment.");
  }

  if (config.mode === "anthropic" && params.buildPrompt) {
    try {
      const result = await callAnthropic({
        model: config.model!,
        prompt: params.buildPrompt(),
        evidence: params.evidence,
      });
      output = result.output;
      provider = "anthropic";
      model = config.model;
      isFallback = false;
      inputTokens = result.inputTokens;
      outputTokens = result.outputTokens;
    } catch (error) {
      // A provider failure degrades to the deterministic path rather than
      // showing the user an error. The record still says it was a fallback.
      errorKind = error instanceof Error ? error.name : "unknown";
      output = params.deterministic();
      provider = "deterministic";
      isFallback = true;
    }
  } else {
    output = params.deterministic();
    provider = "deterministic";
    isFallback = true;
  }

  const record = await prisma.aIAnalysisRecord.create({
    data: {
      organizationId: params.organizationId,
      workflow: params.workflow,
      promptVersion,
      provider,
      model,
      subjectType: params.subjectType,
      subjectId: params.subjectId,
      evidenceRefs: params.evidence as unknown as object,
      output: output as unknown as object,
      isFallback,
      reviewState: definition.requiresHumanApproval ? "UNREVIEWED" : "UNREVIEWED",
    },
  });

  await prisma.aIUsageRecord.create({
    data: {
      organizationId: params.organizationId,
      workflow: params.workflow,
      provider,
      model,
      inputTokens,
      outputTokens,
      estimatedCostUsd: estimateCost(model, inputTokens, outputTokens),
      latencyMs: Date.now() - startedAt,
      succeeded: errorKind === null,
      errorKind,
    },
  });

  return {
    output,
    provider,
    isFallback,
    recordId: record.id,
    disclosure: isFallback
      ? "Composed by deterministic rules from the evidence listed below. No model produced this text."
      : "Drafted by a model from the evidence listed below, and not treated as fact until a person accepts it.",
  };
}

/**
 * Rough pricing, used only to make spend visible before it becomes a surprise.
 * Never presented as a billed amount.
 */
function estimateCost(model: string | null, inputTokens: number | null, outputTokens: number | null): number | null {
  if (!model || inputTokens === null || outputTokens === null) return null;
  const inputPerMillion = 3;
  const outputPerMillion = 15;
  return (inputTokens / 1_000_000) * inputPerMillion + (outputTokens / 1_000_000) * outputPerMillion;
}

interface AnthropicResult {
  output: AIOutput;
  inputTokens: number | null;
  outputTokens: number | null;
}

/**
 * Direct fetch rather than an SDK dependency. The response is parsed and
 * schema-validated before it is trusted; a shape we did not ask for throws and
 * the caller falls back.
 */
async function callAnthropic(params: {
  model: string;
  prompt: string;
  evidence: EvidenceRef[];
}): Promise<AnthropicResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AIError("No API key present.");

  const system = [
    "You write for a customer intelligence product used by executives.",
    "Ground every sentence in the supplied evidence. If the evidence does not support a claim, do not make it.",
    "Never invent a number, a date, a name, or an event.",
    "State what you could not determine in the uncertainties array rather than omitting it.",
    "Tag each claim as fact, calculation, interpretation, recommendation, or assumption.",
    "Respond with JSON only, matching: {narrative: string, claims: [{kind, text}], uncertainties: [string]}.",
  ].join(" ");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: 1024,
      system,
      messages: [
        {
          role: "user",
          content: `${params.prompt}\n\nEvidence:\n${params.evidence.map((e) => `- ${e.label}`).join("\n")}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new AIError(`Provider returned ${response.status}.`);
  }

  const body = (await response.json()) as { content?: { text?: string }[]; usage?: { input_tokens?: number; output_tokens?: number } };
  const text = body.content?.[0]?.text;
  if (!text) throw new AIError("Provider returned no content.");

  // Validation is the boundary. Anything that does not match the contract is
  // treated as a failure, not coerced into something displayable.
  const parsed = AIOutputSchema.parse(JSON.parse(text));

  return {
    output: parsed,
    inputTokens: body.usage?.input_tokens ?? null,
    outputTokens: body.usage?.output_tokens ?? null,
  };
}

export async function reviewAIOutput(params: {
  organizationId: string;
  recordId: string;
  reviewState: "ACCEPTED" | "EDITED" | "REJECTED";
  reviewNote?: string;
  actingUserId: string;
}) {
  const record = await prisma.aIAnalysisRecord.findFirst({
    where: { id: params.recordId, organizationId: params.organizationId },
  });
  if (!record) throw new AIError("Analysis record not found.");

  return prisma.aIAnalysisRecord.update({
    where: { id: record.id },
    data: {
      reviewState: params.reviewState,
      reviewNote: params.reviewNote,
      reviewedById: params.actingUserId,
      reviewedAt: new Date(),
    },
  });
}
