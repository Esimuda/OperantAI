import Anthropic from "@anthropic-ai/sdk";
import type { GoalRepresentation, OperationalPlan } from "@/lib/types";

const SYSTEM = `You are an operational planner for an automation platform.
Convert a goal into an ordered list of concrete steps with dependency tracking.
Return ONLY valid JSON — no markdown, no prose:
{
  "steps": [
    { "id": 1, "description": "what to do", "dependencies": [], "estimatedTool": "tool_name or null" }
  ],
  "parallelGroups": [[1, 2], [3]],
  "estimatedComplexity": "simple|medium|complex"
}
dependencies = array of step IDs this step must wait for. Empty = can start immediately.
parallelGroups = groups of step IDs that can execute simultaneously.`;

export async function createPlan(
  goal: GoalRepresentation,
  availableTools: string[]
): Promise<OperationalPlan> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Goal: ${JSON.stringify(goal, null, 2)}\nAvailable tools: ${availableTools.join(", ")}\n\nGenerate execution plan. JSON only.`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
  try {
    const clean = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(clean) as OperationalPlan;
  } catch {
    return {
      steps: [{ id: 1, description: goal.goal, dependencies: [], estimatedTool: undefined }],
      parallelGroups: [[1]],
      estimatedComplexity: "simple",
    };
  }
}
