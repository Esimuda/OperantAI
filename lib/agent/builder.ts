import Anthropic from "@anthropic-ai/sdk";
import type { OperationalPlan, StepToolMapping, WorkflowGraph } from "@/lib/types";

const SYSTEM = `You are a workflow synthesis engine.
Convert an operational plan with tool mappings into an executable workflow graph.
Return ONLY valid JSON — no markdown, no prose:
{
  "nodes": [
    { "id": "node_id", "type": "trigger|action|condition|parallel", "tool": "tool_name", "label": "description", "config": {} }
  ],
  "edges": [["source_id", "target_id"]]
}
First node should be the trigger. Subsequent nodes are actions.
Nodes that can run in parallel share the same source edge.`;

export async function synthesizeWorkflow(
  plan: OperationalPlan,
  toolMappings: StepToolMapping[],
  goalDescription: string
): Promise<WorkflowGraph> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Goal: ${goalDescription}\nPlan: ${JSON.stringify(plan, null, 2)}\nTool mappings: ${JSON.stringify(toolMappings, null, 2)}\n\nGenerate workflow graph. JSON only.`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
  try {
    const clean = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(clean) as WorkflowGraph;
  } catch {
    return {
      nodes: plan.steps.map((s, i) => {
        const mapping = toolMappings.find((m) => m.stepId === s.id);
        return {
          id: `step_${s.id}`,
          type: i === 0 ? "trigger" : "action",
          tool: mapping?.tool,
          label: s.description,
        };
      }),
      edges: plan.steps.slice(0, -1).map((s, i) => [`step_${s.id}`, `step_${plan.steps[i + 1].id}`]),
    };
  }
}
