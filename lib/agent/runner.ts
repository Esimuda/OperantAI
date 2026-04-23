import Anthropic from "@anthropic-ai/sdk";
import { getActiveTools } from "./tools";
import { executeTool } from "./executor";
import { AgentStreamEvent, BusinessProfile, IntegrationConfig } from "@/lib/types";
import { INTEGRATION_META } from "@/lib/integrations/meta";

function buildBusinessContext(profile: BusinessProfile): string {
  const toolLines = Object.entries(profile.tools)
    .map(([k, v]) => `    ${k}: ${v}`)
    .join("\n");
  const workflowLines = profile.commonWorkflows.map((w) => `    - ${w}`).join("\n");
  const refLines = profile.defaultReferences
    ? Object.entries(profile.defaultReferences).map(([k, v]) => `    ${k}: ${v}`).join("\n")
    : "";

  return `
BUSINESS CONTEXT (always use this to inform your responses and tool calls):
  Company: ${profile.companyName}
  About: ${profile.description}
  Tools in use:
${toolLines}
  Common workflows:
${workflowLines}${refLines ? `\n  Default references:\n${refLines}` : ""}${profile.notes ? `\n  Notes: ${profile.notes}` : ""}
`;
}

function buildSystemPrompt(config: IntegrationConfig, profile?: BusinessProfile | null): string {
  const connected = INTEGRATION_META.filter((m) => m.isConnected(config));
  const disconnected = INTEGRATION_META.filter((m) => !m.isConnected(config));

  const connectedSection =
    connected.length > 0
      ? connected.map((m) => `  - ${m.name}`).join("\n")
      : "  None";

  const disconnectedSection =
    disconnected.length > 0
      ? disconnected.map((m) => `  - ${m.name}`).join("\n")
      : "  None";

  const businessContext = profile ? buildBusinessContext(profile) : "";

  return `You are FlowMind AI — an intelligent operations agent built for automation and operations professionals.
${businessContext}
CONNECTED INTEGRATIONS (you may use these tools):
${connectedSection}

NOT CONNECTED (never call tools for these — direct the user to add credentials in the Settings panel):
${disconnectedSection}

Available tools:
- notion_create_page / notion_query_database — Notion databases
- send_email — email via Resend
- slack_send_message — Slack notifications
- stripe_list_customers / stripe_list_charges — Stripe payments
- hubspot_create_contact / hubspot_search_contacts — HubSpot CRM
- airtable_create_record / airtable_list_records — Airtable
- sheets_read_rows / sheets_append_row / sheets_find_rows — Google Sheets
- gmail_send_email / gmail_search_emails / gmail_read_email — Gmail
- calendar_list_events / calendar_create_event — Google Calendar (uses Gmail credentials)
- build_workflow — always available: design a multi-step automation blueprint (no credentials needed)

BEHAVIOR RULES:
1. ONLY call tools for CONNECTED integrations listed above. The tool list you receive is already filtered to your connected integrations — stay within it.
2. If a task needs a disconnected integration, name it and say: "Connect [Integration] in the Settings panel (top-right) to enable this."
3. Use the BUSINESS CONTEXT above to make smart defaults — use the right spreadsheet IDs, Slack channels, databases, etc. without asking every time.
4. When asked to BUILD or DESIGN a workflow (not execute it), use build_workflow — this always works regardless of what is connected.
5. After using tools, give a concise summary of what was done and the results.
6. For multi-step tasks, execute all steps in sequence unless an error occurs.
7. Be direct and professional. This is a tool for experts.

You are not a general-purpose chatbot. Stay focused on automations, operations, and workflows.`;
}

export interface RunnerOptions {
  message: string;
  conversationHistory: Anthropic.MessageParam[];
  runId: string;
  emit: (event: AgentStreamEvent) => void;
  config: IntegrationConfig;
  businessProfile?: BusinessProfile | null;
}

export async function runAgent(options: RunnerOptions): Promise<string> {
  const { message, conversationHistory, runId, emit, config, businessProfile } = options;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory,
    { role: "user", content: message },
  ];

  let finalMessage = "";
  let iterations = 0;
  const MAX_ITERATIONS = 10;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: buildSystemPrompt(config, businessProfile),
      tools: getActiveTools(config),
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      finalMessage = textBlock?.type === "text" ? textBlock.text : "";
      emit({ type: "text_delta", runId, text: finalMessage });
      break;
    }

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");

      // Append assistant turn
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of toolUseBlocks) {
        if (block.type !== "tool_use") continue;

        const startedAt = Date.now();
        emit({
          type: "tool_call_start",
          runId,
          toolCallId: block.id,
          toolName: block.name,
          input: block.input as Record<string, unknown>,
        });

        const result = await executeTool(
          block.name,
          block.input as Record<string, unknown>,
          config
        );

        const durationMs = Date.now() - startedAt;

        if (result.isError) {
          emit({ type: "tool_call_error", runId, toolCallId: block.id, error: result.output, durationMs });
        } else {
          emit({ type: "tool_call_complete", runId, toolCallId: block.id, output: result.output, durationMs });
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result.output,
          is_error: result.isError,
        });
      }

      // Append tool results as user turn
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // Unexpected stop reason
    break;
  }

  return finalMessage;
}
