import "server-only";
import { prisma } from "@/lib/prisma";
import { calculateAccountHealth } from "@/lib/services/health-calculation-service";
import { runWorkflow, type AIOutput, type EvidenceRef, type RunWorkflowResult } from "@/lib/ai/ai-service";
import { OPEN_RISK_STATUSES } from "@/lib/services/portfolio-summary-service";

/**
 * "Where does this account stand, in a paragraph."
 *
 * The deterministic composer below is the reference implementation of the
 * product's central claim: the language is assembled from the same evidence a
 * model would receive, so the product is complete with no provider configured.
 * The model path, when a key exists, only makes the prose read better.
 */
export async function summarizeAccount(params: {
  organizationId: string;
  customerAccountId: string;
}): Promise<RunWorkflowResult> {
  const account = await prisma.customerAccount.findFirst({
    where: { id: params.customerAccountId, organizationId: params.organizationId },
    include: {
      riskSignals: { where: { status: { in: [...OPEN_RISK_STATUSES] } } },
      escalations: { where: { status: { notIn: ["RESOLVED", "CLOSED"] } } },
      renewals: { where: { status: { notIn: ["RENEWED", "CHURNED"] } }, orderBy: { periodEnd: "asc" }, take: 1 },
    },
  });
  if (!account) throw new Error("Account not found in this organization.");

  const health = await calculateAccountHealth({ customerAccountId: account.id });

  const evidence: EvidenceRef[] = [
    { kind: "health", label: `Health score ${Math.round(health.overallScore)} (${health.category}), data confidence ${Math.round(health.dataConfidence * 100)} percent.` },
    ...health.components
      .filter((component) => component.confidence > 0)
      .map((component) => ({
        kind: "health_component",
        label: `${component.type.replace(/_/g, " ").toLowerCase()}: score ${Math.round(component.score)}. ${component.explanation}`,
      })),
    ...account.riskSignals.map((risk) => ({
      kind: "risk",
      id: risk.id,
      label: `Open risk (${risk.severity}): ${risk.title}. ${risk.currentState}`,
    })),
    ...account.escalations.map((escalation) => ({
      kind: "escalation",
      id: escalation.id,
      label: `Open escalation (${escalation.severity}): ${escalation.title}`,
    })),
  ];

  const renewal = account.renewals[0];
  if (renewal) {
    evidence.push({
      kind: "renewal",
      id: renewal.id,
      label: `Renewal on ${renewal.periodEnd.toISOString().slice(0, 10)} worth ${account.currency} ${renewal.arr.toLocaleString()}, forecast ${renewal.forecastCategory.replace(/_/g, " ").toLowerCase()}.`,
    });
  }

  return runWorkflow({
    organizationId: params.organizationId,
    workflow: "account_summary",
    subjectType: "CustomerAccount",
    subjectId: account.id,
    evidence,
    buildPrompt: () =>
      `Summarize where the customer account "${account.name}" stands for a customer success leader. Two or three sentences. Lead with what needs attention. Do not restate every number.`,
    deterministic: (): AIOutput => {
      const severe = account.riskSignals.filter((r) => r.severity === "CRITICAL" || r.severity === "HIGH");
      const weakest = [...health.components]
        .filter((component) => component.confidence > 0)
        .sort((a, b) => a.score - b.score)[0];

      const sentences: string[] = [];
      sentences.push(
        `${account.name} scores ${Math.round(health.overallScore)} and sits in the ${health.category.replace(/_/g, " ").toLowerCase()} band, on ${Math.round(health.dataConfidence * 100)} percent data confidence.`
      );

      if (account.escalations.length > 0) {
        sentences.push(
          `${account.escalations.length} escalation${account.escalations.length === 1 ? " is" : "s are"} open, which is the most urgent thing on this account.`
        );
      } else if (severe.length > 0) {
        sentences.push(
          `${severe.length} high or critical risk${severe.length === 1 ? "" : "s"} ${severe.length === 1 ? "is" : "are"} open, led by ${severe[0].title.replace(`${account.name}: `, "")}.`
        );
      } else if (account.riskSignals.length > 0) {
        sentences.push(`${account.riskSignals.length} open risk${account.riskSignals.length === 1 ? "" : "s"} recorded, none of them high or critical.`);
      } else {
        sentences.push("No rule the current data can evaluate is triggering on this account.");
      }

      if (weakest) {
        sentences.push(`The weakest component is ${weakest.type.replace(/_/g, " ").toLowerCase()} at ${Math.round(weakest.score)}.`);
      }

      if (renewal) {
        const days = Math.ceil((renewal.periodEnd.getTime() - Date.now()) / 86400000);
        sentences.push(
          days >= 0
            ? `The renewal is ${days} days out at ${account.currency} ${renewal.arr.toLocaleString()}.`
            : `The renewal date passed ${Math.abs(days)} days ago and has not been closed.`
        );
      }

      const claims: AIOutput["claims"] = [
        { kind: "calculation", text: `Health score ${Math.round(health.overallScore)} from ${health.components.filter((c) => c.confidence > 0).length} scored components.` },
        ...severe.slice(0, 3).map((risk) => ({ kind: "fact" as const, text: risk.currentState })),
      ];
      if (weakest) {
        claims.push({ kind: "interpretation", text: `${weakest.type.replace(/_/g, " ").toLowerCase()} is the component holding this score down.` });
      }

      const uncertainties: string[] = [];
      const unscored = health.components.filter((component) => component.confidence === 0);
      for (const component of unscored) {
        uncertainties.push(`${component.type.replace(/_/g, " ").toLowerCase()} could not be assessed: ${component.explanation}`);
      }
      if (!renewal) uncertainties.push("No open renewal record exists, so renewal exposure is unknown.");

      return { narrative: sentences.join(" "), claims, uncertainties };
    },
  });
}
