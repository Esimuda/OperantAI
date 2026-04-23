"use client";

import { useState } from "react";
import { ToolCallRecord } from "@/lib/types";

const TOOL_ICONS: Record<string, string> = {
  notion_create_page: "📄",
  notion_query_database: "🔍",
  send_email: "✉️",
  slack_send_message: "💬",
  stripe_list_customers: "👥",
  stripe_list_charges: "💳",
  build_workflow: "⚡",
};

const TOOL_LABELS: Record<string, string> = {
  notion_create_page: "Notion · Create page",
  notion_query_database: "Notion · Query database",
  send_email: "Email · Send",
  slack_send_message: "Slack · Send message",
  stripe_list_customers: "Stripe · List customers",
  stripe_list_charges: "Stripe · List charges",
  build_workflow: "Workflow · Build",
};

function elapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function ToolCallCard({ tc }: { tc: ToolCallRecord }) {
  const [expanded, setExpanded] = useState(false);

  const borderColor =
    tc.status === "calling" ? "#7c3aed" : tc.status === "success" ? "#22c55e" : "#ef4444";

  const statusText =
    tc.status === "calling" ? "Running..." : tc.status === "success" ? "Done" : "Failed";

  const statusColor =
    tc.status === "calling" ? "#a78bfa" : tc.status === "success" ? "#22c55e" : "#ef4444";

  const icon = TOOL_ICONS[tc.toolName] ?? "🔧";
  const label = TOOL_LABELS[tc.toolName] ?? tc.toolName;
  const durationMs = tc.completedAt ? tc.completedAt - tc.startedAt : undefined;

  const inputEntries = Object.entries(tc.input).filter(([, v]) => v !== undefined && v !== "");

  return (
    <div
      className="rounded-xl p-3 mb-2"
      style={{
        background: "#0d0d12",
        border: `1px solid #1a1a2e`,
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm flex-shrink-0">{icon}</span>
          <span className="text-[12px] font-semibold truncate" style={{ color: "#c4b5fd" }}>
            {label}
          </span>
          {tc.status === "calling" && (
            <span
              className="w-3 h-3 rounded-full border-2 animate-spin flex-shrink-0"
              style={{ borderColor: "#7c3aed", borderTopColor: "transparent" }}
            />
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {durationMs !== undefined && (
            <span className="text-[10px] font-mono" style={{ color: "#334155" }}>
              {elapsed(durationMs)}
            </span>
          )}
          <span className="text-[10px] font-semibold" style={{ color: statusColor }}>
            {statusText}
          </span>
        </div>
      </div>

      {/* Input preview */}
      {inputEntries.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {inputEntries.slice(0, 3).map(([k, v]) => (
            <span
              key={k}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: "#080810", color: "#475569" }}
            >
              {k}: {typeof v === "string" ? v.slice(0, 30) + (v.length > 30 ? "…" : "") : JSON.stringify(v).slice(0, 30)}
            </span>
          ))}
        </div>
      )}

      {/* Output / error */}
      {(tc.output || tc.error) && (
        <div className="mt-2">
          <button
            className="text-[10px] flex items-center gap-1"
            style={{ color: "#475569" }}
            onClick={() => setExpanded((e) => !e)}
          >
            <span>{expanded ? "▾" : "▸"}</span>
            <span>{expanded ? "Hide output" : "Show output"}</span>
          </button>
          {expanded && (
            <pre
              className="mt-1.5 text-[10px] font-mono whitespace-pre-wrap rounded p-2 overflow-auto max-h-32"
              style={{
                background: "#080810",
                color: tc.error ? "#ef4444" : "#94a3b8",
                border: "1px solid #1a1a2e",
              }}
            >
              {tc.output ?? tc.error}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
