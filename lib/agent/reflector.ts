import Anthropic from "@anthropic-ai/sdk";
import type { ExecutionObservation, ReflectionResult, MemoryEntry } from "@/lib/types";

const SYSTEM_BASE = `You are a reflection engine for an automation platform.
Analyze execution failures and produce a structured diagnosis with actionable fixes.
Return ONLY valid JSON — no markdown, no prose:
{
  "hasIssues": boolean,
  "issues": [{ "stepId": "id", "issue": "what failed", "cause": "why", "fix": "how to fix" }],
  "shouldRetry": boolean,
  "suggestedWorkflowChanges": "optional description of changes needed",
  "summary": "one sentence human-readable summary"
}
shouldRetry = true only if the fix is deterministic and retry will likely succeed.`;

export async function reflect(
  observation: ExecutionObservation,
  pastPatterns: MemoryEntry[]
): Promise<ReflectionResult> {
  if (observation.failures.length === 0) {
    return {
      hasIssues: false,
      issues: [],
      shouldRetry: false,
      summary: "All steps completed successfully.",
    };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const patternContext =
    pastPatterns.length > 0
      ? `\nKnown failure patterns from memory:\n${pastPatterns.map((p) => JSON.stringify(p.value)).join("\n")}`
      : "";

  const system = SYSTEM_BASE + patternContext;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system,
    messages: [
      {
        role: "user",
        content: `Execution observation:\n${JSON.stringify(observation, null, 2)}\n\nDiagnose and propose fixes. JSON only.`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
  try {
    const clean = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(clean) as ReflectionResult;
  } catch {
    return {
      hasIssues: true,
      issues: observation.failures.map((f) => ({
        stepId: f.stepId,
        issue: f.error,
        cause: "unknown",
        fix: "retry with same parameters",
      })),
      shouldRetry: observation.totalRetries < 2,
      summary: `${observation.failures.length} step(s) failed.`,
    };
  }
}
