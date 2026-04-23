import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { BusinessProfile } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are FlowMind AI's business setup assistant. Your only task is to learn about the user's business by asking 4 specific questions, one at a time.

Ask questions in this exact order. After each answer, give a brief warm acknowledgment (one short sentence) then immediately ask the next question. Never ask multiple questions at once. Never skip a question.

Question 1: Already asked — "What's your company name and what does your business do?"
Question 2: "What tools does your team use day-to-day? For example: CRM, email, project management tools, databases, payments, communication apps, etc."
Question 3: "What are the 2-3 most common operations or workflows you run regularly? For example: onboarding new customers, generating reports, following up on leads."
Question 4: "Any specific IDs, channel names, or defaults I should always remember? For example: a Slack channel you use, spreadsheet IDs, Notion database IDs, email addresses."

Once you have answers to ALL 4 questions (the user has answered questions about company info, tools, workflows, AND specific defaults), do two things:
1. Write a warm 1-2 sentence summary of what you've learned
2. Call the save_business_profile tool immediately with all the structured data

Be warm, concise, and conversational. You are already past Question 1 — continue from where the conversation left off.`;

const SAVE_PROFILE_TOOL: Anthropic.Tool = {
  name: "save_business_profile",
  description: "Save the business profile. Call this ONLY after collecting answers to all 4 questions.",
  input_schema: {
    type: "object" as const,
    properties: {
      companyName: { type: "string", description: "The company name." },
      description: { type: "string", description: "2-3 sentences describing what the business does." },
      tools: {
        type: "object",
        description: "Map of tool category to tool name/details. e.g. { 'crm': 'HubSpot', 'email': 'Gmail (hello@co.com)', 'payments': 'Stripe' }",
      },
      commonWorkflows: {
        type: "array",
        items: { type: "string" },
        description: "List of 2-4 common workflows/operations the business runs.",
      },
      defaultReferences: {
        type: "object",
        description: "Specific IDs, channel names, or defaults. e.g. { 'slack_channel': '#ops', 'notion_db_id': '1abc...', 'sheets_id': '1BxiM...' }",
      },
      notes: { type: "string", description: "Any other relevant context about the business or team." },
    },
    required: ["companyName", "description", "tools", "commonWorkflows"],
  },
};

export async function POST(req: NextRequest): Promise<Response> {
  const { message, conversationHistory = [] } = await req.json() as {
    message: string;
    conversationHistory?: Anthropic.MessageParam[];
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function emit(data: unknown) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const messages: Anthropic.MessageParam[] = [
          ...conversationHistory,
          { role: "user", content: message },
        ];

        let iterations = 0;
        while (iterations < 8) {
          iterations++;

          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            tools: [SAVE_PROFILE_TOOL],
            messages,
          });

          if (response.stop_reason === "end_turn") {
            const text = response.content.find((b) => b.type === "text");
            emit({ type: "text_delta", text: text?.type === "text" ? text.text : "" });
            break;
          }

          if (response.stop_reason === "tool_use") {
            const toolBlock = response.content.find((b) => b.type === "tool_use" && b.name === "save_business_profile");

            // Emit any text before the tool call
            const textBefore = response.content.find((b) => b.type === "text");
            if (textBefore?.type === "text" && textBefore.text) {
              emit({ type: "text_delta", text: textBefore.text });
            }

            if (toolBlock?.type === "tool_use") {
              const input = toolBlock.input as Omit<BusinessProfile, "savedAt">;
              emit({ type: "profile_saved", profile: input });

              // Give Claude the tool result so it can write a closing message
              messages.push({ role: "assistant", content: response.content });
              messages.push({
                role: "user",
                content: [{ type: "tool_result", tool_use_id: toolBlock.id, content: "Profile saved successfully." }],
              });
              continue;
            }

            break;
          }

          break;
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        emit({ type: "text_delta", text: `Something went wrong: ${error}` });
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
