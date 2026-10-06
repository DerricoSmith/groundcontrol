import { answerQuestion } from "@/lib/ask-claude";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim().slice(0, 500) : "";
  if (!question) return Response.json({ error: "question is required" }, { status: 400 });

  const engine = body?.engine === "rules" ? "rules" : "auto";
  return Response.json(await answerQuestion(question, engine));
}
