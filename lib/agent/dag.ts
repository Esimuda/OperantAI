import type { WorkflowStep } from "@/lib/export/n8n";

export type DagStep = WorkflowStep & { dependencies?: number[] };

interface ExecutionRound {
  steps: DagStep[];
}

export function buildExecutionPlan(steps: DagStep[]): ExecutionRound[] {
  const completed = new Set<number>();
  const remaining = [...steps];
  const rounds: ExecutionRound[] = [];

  while (remaining.length > 0) {
    const ready = remaining.filter((s) => {
      // Default: sequential — step N depends on step N-1
      const deps = s.dependencies ?? (s.step > 1 ? [s.step - 1] : []);
      return deps.every((d) => completed.has(d));
    });

    if (ready.length === 0) {
      // Broken graph — push first remaining to unblock
      const fallback = remaining[0];
      rounds.push({ steps: [fallback] });
      completed.add(fallback.step);
      remaining.splice(0, 1);
      continue;
    }

    rounds.push({ steps: ready });
    for (const s of ready) {
      completed.add(s.step);
      remaining.splice(remaining.indexOf(s), 1);
    }
  }

  return rounds;
}

export function formatExecutionPlan(
  name: string,
  trigger: string,
  rounds: ExecutionRound[]
): string {
  const lines: string[] = [
    `Executing workflow "${name}" (trigger: ${trigger}).`,
    ``,
    `EXECUTION PLAN — dependency-aware:`,
  ];

  rounds.forEach((round, i) => {
    const parallel = round.steps.length > 1;
    lines.push(``);
    if (parallel) {
      lines.push(`Round ${i + 1} — call ALL of these tools simultaneously in one response (parallel):`);
    } else {
      lines.push(`Round ${i + 1}:`);
    }
    round.steps.forEach((s) => {
      lines.push(`  Step ${s.step}: [${s.tool}] ${s.action} → Expected: ${s.output}`);
    });
  });

  lines.push(``);
  lines.push(`Execution rules:`);
  lines.push(`- For rounds marked "parallel", issue all tool calls in a single response.`);
  lines.push(`- If a step fails, skip all steps that list it as a dependency and record the failure.`);
  lines.push(`- Continue to the next round after each round completes (success or handled failure).`);
  lines.push(`- After all rounds, give a brief plain-text summary: steps succeeded, steps failed, and fixes if needed.`);
  lines.push(`- Do not describe what you are about to do — execute immediately.`);

  return lines.join("\n");
}
