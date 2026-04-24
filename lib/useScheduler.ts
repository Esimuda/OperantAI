"use client";

import { useEffect } from "react";
import { getDueSchedules, markScheduleRan } from "@/lib/db/schedules";

/**
 * Checks every minute if any scheduled workflows are due.
 * When due, dispatches flowmind-run-workflow so the main chat handler picks it up.
 */
export function useScheduler() {
  useEffect(() => {
    function check() {
      const due = getDueSchedules();
      for (const s of due) {
        markScheduleRan(s.id);
        const steps = s.blueprint.steps
          .map((step) => `  ${step.step}. [${step.tool}] ${step.action} → ${step.output}`)
          .join("\n");
        const prompt = [
          `Execute this scheduled workflow now — call each tool in sequence using your actual tools. Do not describe or summarise; execute.`,
          ``,
          `WORKFLOW: "${s.blueprint.name}"`,
          `TRIGGER: ${s.blueprint.trigger} (scheduled — ${s.frequency})`,
          ``,
          `STEPS:`,
          steps,
          ``,
          `Execution rules:`,
          `- Run each step in order.`,
          `- If a step fails, log the error and continue to the next step where possible.`,
          `- If a step fails and all retries are exhausted, skip it and note the failure.`,
          `- After all steps, give a plain summary: which steps succeeded, which failed, and any suggested fixes for failures.`,
        ].join("\n");

        window.dispatchEvent(
          new CustomEvent("flowmind-run-workflow", { detail: { prompt } })
        );
      }
    }

    check(); // check immediately on mount
    const interval = setInterval(check, 60_000); // check every minute
    return () => clearInterval(interval);
  }, []);
}
