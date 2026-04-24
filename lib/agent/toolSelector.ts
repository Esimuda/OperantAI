import Anthropic from "@anthropic-ai/sdk";
import type { OperationalPlan, StepToolMapping } from "@/lib/types";

const SYSTEM = `You are a tool selection engine for an automation platform.
Map each plan step to the most appropriate available tool.
Return ONLY valid JSON — no markdown, no prose:
[{ "stepId": 1, "tool": "tool_name", "parameters": { "key": "value or {placeholder}" } }]
Use null for tool if no available tool fits the step.`;

export async function selectTools(
  plan: OperationalPlan,
  availableTools: Array<{ name: string; description: string }>
): Promise<StepToolMapping[]> {
  if (plan.steps.length === 0) return [];

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const toolList = availableTools.map((t) => `${t.name}: ${t.description}`).join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Available tools:\n${toolList}\n\nPlan steps:\n${JSON.stringify(plan.steps, null, 2)}\n\nMap each step to a tool. JSON array only.`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "[]";
  try {
    const clean = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(clean) as StepToolMapping[];
  } catch {
    return plan.steps.map((s) => ({
      stepId: s.id,
      tool: s.estimatedTool ?? "unknown",
      parameters: {},
    }));
  }
}
