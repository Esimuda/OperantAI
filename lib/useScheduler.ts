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
          `Execute this scheduled workflow now using your tools — actually call each tool, do not just describe it.`,
          ``,
          `WORKFLOW: "${s.blueprint.name}"`,
          `TRIGGER: ${s.blueprint.trigger} (scheduled — ${s.frequency})`,
          ``,
          `STEPS:`,
          steps,
          ``,
          `Execute each step in order. Summarise results when done.`,
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
