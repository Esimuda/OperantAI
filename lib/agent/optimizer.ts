import Anthropic from "@anthropic-ai/sdk";
import type { WorkflowGraph, ReflectionResult } from "@/lib/types";

const SYSTEM = `You are a workflow optimization engine for an automation platform.
Improve a workflow graph based on reflection results.
You may: merge redundant nodes, add parallel edges, reorder steps to reduce latency, add retry hints in config.
Return the optimized graph as ONLY valid JSON — same schema, no markdown, no prose:
{ "nodes": [...], "edges": [...] }`;

export async function optimize(
  graph: WorkflowGraph,
  reflection: ReflectionResult
): Promise<WorkflowGraph> {
  if (!reflection.hasIssues && graph.nodes.length <= 2) return graph;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Current graph:\n${JSON.stringify(graph, null, 2)}\n\nReflection:\n${JSON.stringify(reflection, null, 2)}\n\nOptimize and return improved graph. JSON only.`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
  try {
    const clean = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    const optimized = JSON.parse(clean) as WorkflowGraph;
    // Validate basic structure
    if (!Array.isArray(optimized.nodes) || !Array.isArray(optimized.edges)) return graph;
    return optimized;
  } catch {
    return graph;
  }
}
