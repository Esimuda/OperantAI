// ─── Agent types ─────────────────────────────────────────────────────────────

export type ToolStatus = "calling" | "success" | "error";

export interface ToolCallRecord {
  id: string;
  toolName: string;
  status: ToolStatus;
  input: Record<string, unknown>;
  output?: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

export type AgentRunStatus = "running" | "completed" | "failed";

export interface AgentRun {
  id: string;
  status: AgentRunStatus;
  userMessage: string;
  finalMessage?: string;
  toolCalls: ToolCallRecord[];
  startedAt: number;
  completedAt?: number;
}

// ─── Chat / conversation types ───────────────────────────────────────────────

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  runId?: string;
  toolsSummary?: string[];
  timestamp: number;
}

// ─── SSE stream events ───────────────────────────────────────────────────────

export type AgentStreamEvent =
  | { type: "run_started"; runId: string }
  | { type: "text_delta"; runId: string; text: string }
  | { type: "tool_call_start"; runId: string; toolCallId: string; toolName: string; input: Record<string, unknown> }
  | { type: "tool_call_complete"; runId: string; toolCallId: string; output: string; durationMs: number }
  | { type: "tool_call_error"; runId: string; toolCallId: string; error: string; durationMs: number }
  | { type: "run_complete"; runId: string; finalMessage: string }
  | { type: "run_error"; runId: string; error: string }
  | { type: "profile_saved"; profile: BusinessProfile };

// ─── Business profile ─────────────────────────────────────────────────────────

export interface BusinessProfile {
  companyName: string;
  description: string;
  tools: Record<string, string>;
  commonWorkflows: string[];
  defaultReferences?: Record<string, string>;
  notes?: string;
  savedAt: number;
}

// ─── Panel view ───────────────────────────────────────────────────────────────

export type PanelView = "run" | "history" | "library" | "settings";

// ─── Integration config ───────────────────────────────────────────────────────

export interface IntegrationConfig {
  notionApiKey?: string;
  notionDatabaseId?: string;
  resendApiKey?: string;
  slackWebhookUrl?: string;
  stripeSecretKey?: string;
  hubspotApiKey?: string;
  airtableApiKey?: string;
  airtableBaseId?: string;
  googleSheetsClientEmail?: string;
  googleSheetsPrivateKey?: string;
  gmailClientId?: string;
  gmailClientSecret?: string;
  gmailRefreshToken?: string;
}
