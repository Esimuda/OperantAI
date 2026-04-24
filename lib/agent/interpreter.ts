import Anthropic from "@anthropic-ai/sdk";
import type { GoalRepresentation } from "@/lib/types";

const SYSTEM = `You are an intent interpreter for an automation platform.
Analyze the user message and return ONLY valid JSON — no markdown, no prose — matching:
{
  "goal": "clear description of what the user wants",
  "trigger": "what triggers this (if any, else null)",
  "constraints": ["constraint strings"],
  "successMetrics": ["measurable outcome strings"],
  "isWorkflowRequest": boolean,
  "isConversational": boolean
}
isWorkflowRequest = true when the user wants to build, run, execute, schedule, or manage an automation or workflow.
isConversational = true when the user is asking a question or chatting without needing automation execution.`;

export async function interpretIntent(
  userMessage: string,
  context?: string
): Promise<GoalRepresentation> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Message: "${userMessage}"\nContext: ${context ?? "none"}\n\nExtract structured goal. JSON only.`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
  try {
    const clean = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(clean) as GoalRepresentation;
  } catch {
    return {
      goal: userMessage,
      trigger: undefined,
      constraints: [],
      successMetrics: [],
      isWorkflowRequest: userMessage.toLowerCase().includes("workflow") || userMessage.toLowerCase().includes("automat"),
      isConversational: true,
    };
  }
}
