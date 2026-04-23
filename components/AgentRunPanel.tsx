"use client";

import { useEffect, useRef } from "react";
import { AgentRun } from "@/lib/types";
import ToolCallCard from "./ToolCallCard";
import { toN8nJson, toMakeJson, WorkflowBlueprint } from "@/lib/export/n8n";
import { toZapierJson } from "@/lib/export/zapier";
import { saveWorkflow } from "@/lib/db/workflows";

function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportButtons({ workflow }: { workflow: WorkflowBlueprint }) {
  const safeName = workflow.name.replace(/\s+/g, "-").toLowerCase();
  return (
    <div
      className="rounded-xl p-3 mt-2"
      style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.2)" }}
    >
      <p className="text-[11px] font-semibold mb-2" style={{ color: "#a78bfa" }}>
        ⬇ Export Workflow
      </p>
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "Zapier JSON", fn: () => downloadJson(`${safeName}-zapier.json`, toZapierJson(workflow)) },
          { label: "n8n JSON",   fn: () => downloadJson(`${safeName}-n8n.json`,    toN8nJson(workflow)) },
          { label: "Make JSON",  fn: () => downloadJson(`${safeName}-make.json`,   toMakeJson(workflow)) },
          { label: "Raw JSON",   fn: () => downloadJson(`${safeName}.json`,        JSON.stringify(workflow, null, 2)) },
        ].map(({ label, fn }) => (
          <button
            key={label}
            onClick={fn}
            className="text-[11px] px-3 py-1.5 rounded-lg transition-all"
            style={{ background: "rgba(124,58,237,0.12)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.25)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,58,237,0.22)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(124,58,237,0.12)")}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function extractWorkflowFromOutput(output: string): WorkflowBlueprint | null {
  const marker = "__WORKFLOW_JSON__:";
  const idx = output.indexOf(marker);
  if (idx === -1) return null;
  try {
    return JSON.parse(output.slice(idx + marker.length)) as WorkflowBlueprint;
  } catch {
    return null;
  }
}

function elapsed(startedAt: number, completedAt?: number): string {
  const ms = (completedAt ?? Date.now()) - startedAt;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatusBadge({ status }: { status: AgentRun["status"] }) {
  if (status === "running") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
        style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#7c3aed" }} />
        Running
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
        style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
        Complete
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#ef4444" }} />
      Failed
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}
      >
        <span className="text-xl">⚡</span>
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: "#475569" }}>
        Agent ready
      </p>
      <p className="text-xs max-w-[200px]" style={{ color: "#1e293b" }}>
        Ask me to send emails, create Notion records, check Stripe, or build a workflow
      </p>
    </div>
  );
}

export default function AgentRunPanel({ run }: { run: AgentRun | null }) {
  const savedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!run) return;
    for (const tc of run.toolCalls) {
      if (tc.toolName === "build_workflow" && tc.status === "success" && tc.output && !savedIds.current.has(tc.id)) {
        const workflow = extractWorkflowFromOutput(tc.output);
        if (workflow) {
          savedIds.current.add(tc.id);
          saveWorkflow(workflow);
          window.dispatchEvent(new CustomEvent("flowmind-workflow-saved"));
        }
      }
    }
  }, [run]);

  if (!run) return <EmptyState />;

  return (
    <div className="flex flex-col h-full">
      {/* Run header */}
      <div
        className="flex-shrink-0 rounded-xl p-4 mb-4"
        style={{ background: "#0d0d12", border: "1px solid #1a1a2e" }}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-xs font-semibold" style={{ color: "#e2e8f0" }} title={run.userMessage}>
            {run.userMessage.length > 80 ? run.userMessage.slice(0, 80) + "…" : run.userMessage}
          </p>
          <StatusBadge status={run.status} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: "#334155" }}>
            {run.toolCalls.length} tool call{run.toolCalls.length !== 1 ? "s" : ""}
          </span>
          <span className="text-[10px] font-mono" style={{ color: "#334155" }}>
            {elapsed(run.startedAt, run.completedAt)}
          </span>
        </div>
      </div>

      {/* Tool call timeline */}
      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
        {run.toolCalls.length === 0 && run.status === "running" ? (
          <div className="flex items-center gap-2 py-3">
            <span
              className="w-3 h-3 rounded-full border-2 animate-spin flex-shrink-0"
              style={{ borderColor: "#7c3aed", borderTopColor: "transparent" }}
            />
            <span className="text-xs" style={{ color: "#475569" }}>
              Thinking...
            </span>
          </div>
        ) : (
          run.toolCalls.map((tc) => {
          const workflow = tc.toolName === "build_workflow" && tc.output
            ? extractWorkflowFromOutput(tc.output)
            : null;
          return (
            <div key={tc.id}>
              <ToolCallCard tc={tc} />
              {workflow && <ExportButtons workflow={workflow} />}
            </div>
          );
        })
        )}

        {/* Final message */}
        {run.finalMessage && (
          <div
            className="rounded-xl p-3 mt-2"
            style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)" }}
          >
            <p className="text-[11px] font-semibold mb-1" style={{ color: "#22c55e" }}>
              Agent response
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
              {run.finalMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
