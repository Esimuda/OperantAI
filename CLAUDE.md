# Operant AI — CLAUDE.md

## Product Vision

Operant AI is an AI agent platform for automation specialists (and businesses without one).

- **With a specialist**: the AI co-pilots workflow creation — specialist describes what they want, AI builds it, exports it to Zapier/n8n/Make.com
- **Without a specialist**: the AI runs the entire operations layer autonomously — connecting APIs, building workflows, executing and monitoring them

Think of it as **Claude Code, but for automation specialists**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + custom CSS animations |
| Font | Inter (Google Fonts via `next/font/google`) |
| AI | Claude API (`claude-sonnet-4-6`) via Anthropic SDK |
| Language | TypeScript |

---

## File Structure

```
/app
  page.tsx                    — Main layout, state management (messages, currentRun, panelView)
  layout.tsx                  — Root layout with Inter font + metadata
  globals.css                 — Global styles, grid overlay, aurora gradient, scrollbar
  /api/agent/route.ts         — POST handler: runs agent with tool use loop, streams SSE
  /api/runs/route.ts          — GET handler: returns run history

/components
  TopBar.tsx                  — Logo + Run/History/Settings toggle buttons
  ChatPanel.tsx               — Scrollable message history + textarea input
  AgentRunPanel.tsx           — Live tool call timeline + export buttons (n8n/Make)
  RunHistoryPanel.tsx         — Past runs list with expandable detail
  SettingsPanel.tsx           — Per-integration credential inputs (LocalStorage)
  ToolCallCard.tsx            — Individual tool call card with input/output preview

/lib
  types.ts                    — Shared TypeScript interfaces
  /agent
    tools.ts                  — AGENT_TOOLS array (all available tool definitions)
    executor.ts               — executeTool(): routes tool calls to integration modules
    runner.ts                 — runAgent(): Claude API loop, SSE event emission
  /integrations
    notion.ts                 — createPage(), queryDatabase()
    resend.ts                 — sendEmail()
    slack.ts                  — sendMessage()
    stripe.ts                 — listCustomers(), listCharges()
    hubspot.ts                — createContact(), searchContacts()
    airtable.ts               — createRecord(), listRecords()
  /export
    n8n.ts                    — toN8nJson(), toMakeJson() — workflow export
  /db
    runs.ts                   — In-memory run store (saveRun, getRun, listRuns, updateRun)

.env.local                    — ANTHROPIC_API_KEY + optional integration keys
```

---

## Architecture

### State Flow
```
page.tsx (state owner)
  ├── messages: ChatMessage[]         — full chat history
  ├── currentRun: AgentRun|null       — live run with tool call timeline
  ├── panelView: PanelView            — "run" | "history" | "settings"
  └── inputValue: string             — controlled textarea value

User sends message
  → POST /api/agent { message, conversationHistory, userConfig }
  → runAgent() calls Claude with AGENT_TOOLS
  → Claude responds with tool_use blocks
  → executeTool() calls the right integration
  → SSE events streamed back: tool_call_start, tool_call_complete, run_complete
  → AgentRunPanel renders live tool call timeline
```

### Agent Loop (`/lib/agent/runner.ts`)
- Uses `claude-sonnet-4-6` with tool use
- Loops up to 10 iterations until Claude returns `end_turn`
- Emits SSE events at each step for real-time UI updates
- Merges user credentials from SettingsPanel with env vars

### Tool System
- Tools defined in `/lib/agent/tools.ts` as Anthropic tool definitions
- `executeTool()` in `/lib/agent/executor.ts` dispatches to integration modules
- Adding a new integration = add tool definition + add case in executor + add integration module

### Export (`/lib/export/n8n.ts`)
- `toN8nJson()` converts a workflow blueprint to n8n-compatible JSON
- `toMakeJson()` converts to Make.com (Integromat) scenario format

---

## Key Types (`/lib/types.ts`)

```typescript
interface ToolCallRecord {
  id: string;
  toolName: string;
  status: "calling" | "success" | "error";
  input: Record<string, unknown>;
  output?: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

interface AgentRun {
  id: string;
  status: AgentRunStatus;  // "running" | "completed" | "failed"
  userMessage: string;
  toolCalls: ToolCallRecord[];
  finalMessage?: string;
  startedAt: number;
  completedAt?: number;
}

interface IntegrationConfig {
  notionApiKey?: string;
  notionDatabaseId?: string;
  resendApiKey?: string;
  slackWebhookUrl?: string;
  stripeSecretKey?: string;
  hubspotApiKey?: string;
  airtableApiKey?: string;
  airtableBaseId?: string;
}

type PanelView = "run" | "history" | "settings";
```

---

## Layout

- **Top bar** (h-14): Logo left, view toggle buttons right, active run pulse indicator
- **Left panel** (40% width on md+): `ChatPanel` — dark `#050508` with aurora/grid overlay
- **Right panel** (60% width on md+): `AgentRunPanel` | `RunHistoryPanel` | `SettingsPanel`
- **Mobile**: Chat only; right panel hidden

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Add your API key
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env.local

# 3. Start dev server
npm run dev

# 4. Open http://localhost:3000
```

Optional integration env vars (can also be set in the Settings panel at runtime):
```
NOTION_API_KEY=
NOTION_DATABASE_ID=
RESEND_API_KEY=
SLACK_WEBHOOK_URL=
STRIPE_SECRET_KEY=
HUBSPOT_API_KEY=
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
```

---

## Roadmap

- **Phase 1** — API connection layer: companies connect all their tools once (OAuth + API keys)
- **Phase 2** — Smarter workflow generation using the connected API context
- **Phase 3** — Export to Zapier (in addition to n8n and Make.com)
- **Phase 4** — Autonomous mode: AI builds + runs + monitors workflows without a specialist
- **Phase 5** — Memory layer: agent learns business context, rules, and past workflows
