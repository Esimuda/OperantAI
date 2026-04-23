import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { runAgent } from "@/lib/agent/runner";
import { saveRun, updateRun } from "@/lib/db/runs";
import { AgentRun, AgentStreamEvent, BusinessProfile, IntegrationConfig, ToolCallRecord } from "@/lib/types";

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getIntegrationConfig(userConfig?: Partial<IntegrationConfig>): IntegrationConfig {
  // User-provided keys take precedence over server env vars
  return {
    notionApiKey:            userConfig?.notionApiKey            || process.env.NOTION_API_KEY,
    notionDatabaseId:        userConfig?.notionDatabaseId        || process.env.NOTION_DATABASE_ID,
    resendApiKey:            userConfig?.resendApiKey            || process.env.RESEND_API_KEY,
    slackWebhookUrl:         userConfig?.slackWebhookUrl         || process.env.SLACK_WEBHOOK_URL,
    stripeSecretKey:         userConfig?.stripeSecretKey         || process.env.STRIPE_SECRET_KEY,
    hubspotApiKey:           userConfig?.hubspotApiKey           || process.env.HUBSPOT_API_KEY,
    airtableApiKey:          userConfig?.airtableApiKey          || process.env.AIRTABLE_API_KEY,
    airtableBaseId:          userConfig?.airtableBaseId          || process.env.AIRTABLE_BASE_ID,
    googleSheetsClientEmail: userConfig?.googleSheetsClientEmail || process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    googleSheetsPrivateKey:  userConfig?.googleSheetsPrivateKey  || process.env.GOOGLE_SHEETS_PRIVATE_KEY,
    gmailClientId:           userConfig?.gmailClientId           || process.env.GMAIL_CLIENT_ID,
    gmailClientSecret:       userConfig?.gmailClientSecret       || process.env.GMAIL_CLIENT_SECRET,
    gmailRefreshToken:       userConfig?.gmailRefreshToken       || process.env.GMAIL_REFRESH_TOKEN,
  };
}

export async function POST(req: NextRequest): Promise<Response> {
  const { message, conversationHistory = [], userConfig, businessProfile } = await req.json() as {
    message: string;
    conversationHistory?: Anthropic.MessageParam[];
    userConfig?: Partial<IntegrationConfig>;
    businessProfile?: BusinessProfile | null;
  };

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "message is required" }), { status: 400 });
  }

  const runId = generateId();
  const run: AgentRun = {
    id: runId,
    status: "running",
    userMessage: message,
    toolCalls: [],
    startedAt: Date.now(),
  };
  saveRun(run);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function emit(event: AgentStreamEvent) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));

        // Mirror tool call events into the run record
        if (event.type === "tool_call_start") {
          const tc: ToolCallRecord = {
            id: event.toolCallId,
            toolName: event.toolName,
            status: "calling",
            input: event.input,
            startedAt: Date.now(),
          };
          const existing = run.toolCalls;
          existing.push(tc);
          updateRun(runId, { toolCalls: existing });
        }

        if (event.type === "tool_call_complete") {
          const updated = run.toolCalls.map((tc) =>
            tc.id === event.toolCallId
              ? { ...tc, status: "success" as const, output: event.output, completedAt: Date.now() }
              : tc
          );
          updateRun(runId, { toolCalls: updated });
        }

        if (event.type === "tool_call_error") {
          const updated = run.toolCalls.map((tc) =>
            tc.id === event.toolCallId
              ? { ...tc, status: "error" as const, error: event.error, completedAt: Date.now() }
              : tc
          );
          updateRun(runId, { toolCalls: updated });
        }
      }

      emit({ type: "run_started", runId });

      try {
        const finalMessage = await runAgent({
          message,
          conversationHistory,
          runId,
          emit,
          config: getIntegrationConfig(userConfig),
          businessProfile,
        });

        updateRun(runId, { status: "completed", finalMessage, completedAt: Date.now() });
        emit({ type: "run_complete", runId, finalMessage });
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        updateRun(runId, { status: "failed", completedAt: Date.now() });
        emit({ type: "run_error", runId, error });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
