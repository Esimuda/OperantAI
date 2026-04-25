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
| Database | Supabase (auth + persistent storage) |
| Language | TypeScript |

---

## File Structure

```
/app
  page.tsx                    — Public landing page (hero, features, use cases, CTAs)
  layout.tsx                  — Root layout with Inter font + metadata
  globals.css                 — Global styles, grid overlay, aurora gradient, scrollbar
  auth/page.tsx               — Auth page: Google OAuth, GitHub OAuth, email/password
  dashboard/page.tsx          — Main app (authenticated): chat + all right-panel views
  billing/page.tsx            — Billing management page
  pricing/page.tsx            — Public pricing page
  workspaces/page.tsx         — Workspace management
  invite/[token]/page.tsx     — Invite acceptance flow

  /api
    agent/route.ts            — POST: runs orchestrator, streams SSE events to client
    runs/route.ts             — GET: returns run history
    integrations/route.ts     — GET/POST: load & save integration credentials (Supabase)
    dashboard/route.ts        — GET: dashboard analytics
    onboarding/route.ts       — POST: save BusinessProfile from onboarding questions
    schedules/route.ts        — GET/POST: list & create scheduled workflows
    schedules/[id]/route.ts   — PUT/DELETE: update & remove schedules
    alerts/route.ts           — GET/POST: alert configuration
    custom-tools/route.ts     — GET/POST/DELETE: user-defined HTTP integrations
    cron/run-schedules/route.ts — GET: triggered by Vercel cron to execute due schedules
    webhooks/route.ts         — POST: generic inbound webhook handler
    webhooks/[id]/route.ts    — POST: named webhook handler
    webhooks/stripe/route.ts  — POST: Stripe billing events
    oauth/google/route.ts     — GET: initiate Google OAuth
    oauth/google/callback/route.ts — GET: Google OAuth callback
    oauth/slack/route.ts      — GET: initiate Slack OAuth
    oauth/slack/callback/route.ts  — GET: Slack OAuth callback
    subscription/route.ts     — GET: current subscription status
    billing/portal/route.ts   — POST: Stripe billing portal session
    checkout/route.ts         — POST: Stripe checkout session
    workspaces/route.ts       — GET/POST: list & create workspaces
    workspaces/[id]/route.ts  — GET/PUT/DELETE: workspace CRUD
    workspaces/invite/route.ts — POST: send workspace invite
    workspaces/invite/[token]/route.ts — POST: accept invite by token
    workspaces/leave/route.ts — POST: leave a workspace

/components
  TopBar.tsx                  — Logo, view toggle buttons, active run pulse indicator
  ChatPanel.tsx               — Scrollable message history + textarea input
  AgentRunPanel.tsx           — Live tool call timeline, reflection/observation output, export buttons
  RunHistoryPanel.tsx         — Past runs list with expandable detail
  WorkflowLibraryPanel.tsx    — Saved workflow blueprints with run/delete actions
  SettingsPanel.tsx           — Per-integration credential inputs + business profile editor
  DashboardPanel.tsx          — Analytics: run counts, tool usage, success rates
  MonitoringPanel.tsx         — Execution monitoring, active schedules, alerts
  CustomToolsPanel.tsx        — CRUD UI for user-defined HTTP tools
  MobileBottomNav.tsx         — Mobile bottom navigation bar
  ToolCallCard.tsx            — Individual tool call card with input/output preview

/lib
  types.ts                    — All shared TypeScript interfaces (see Key Types section)
  markdown.ts                 — Markdown parsing utilities
  useScheduler.ts             — React hook for schedule management

  /agent
    orchestrator.ts           — runOrchestrator(): 8-stage autonomous pipeline
    runner.ts                 — runAgent(): single-turn Claude loop with tool execution
    tools.ts                  — AGENT_TOOLS array + getActiveTools(config) filter
    executor.ts               — executeTool(): dispatches tool calls to integration modules
    interpreter.ts            — Parses natural language goals into GoalRepresentation
    planner.ts                — Converts GoalRepresentation into OperationalPlan with dependencies
    toolSelector.ts           — Maps plan steps to available tools
    builder.ts                — Synthesizes WorkflowGraph (DAG) from plan + tool mappings
    stateMachine.ts           — Manages execution state transitions
    dag.ts                    — DAG traversal and parallel execution scheduling
    observer.ts               — Collects ExecutionObservation metrics from a completed run
    reflector.ts              — LLM-powered failure diagnosis → ReflectionResult
    optimizer.ts              — Updates workflow graph based on reflection output
    memory.ts                 — MemoryManager: short-term cache, long-term DB, pattern storage

  /integrations
    notion.ts                 — createPage(), queryDatabase()
    resend.ts                 — sendEmail()
    slack.ts                  — sendMessage()
    stripe.ts                 — listCustomers(), listCharges()
    hubspot.ts                — createContact(), searchContacts()
    airtable.ts               — createRecord(), listRecords()
    gmail.ts                  — sendEmail(), searchEmails(), readEmail()
    sheets.ts                 — readRows(), appendRow(), findRows()
    calendar.ts               — listEvents(), createEvent()
    twilio.ts                 — sendSms(), sendWhatsapp()
    github.ts                 — createIssue(), listIssues(), listRepos()
    linear.ts                 — createIssue(), listIssues()
    discord.ts                — sendMessage()
    mailchimp.ts              — addContact(), listContacts(), listAudiences()
    meta.ts                   — Meta/Facebook integration

  /export
    n8n.ts                    — toN8nJson(), toMakeJson() — workflow export

  /db
    runs.ts                   — In-memory: saveRun, getRun, listRuns, updateRun
    workflows.ts              — Supabase: saveWorkflow, listWorkflows, deleteWorkflow
    integrations.ts           — Supabase: loadIntegrationConfig, saveIntegrationConfig
    businessProfile.ts        — Supabase: load/save BusinessProfile per user
    executions.ts             — Supabase: persist ExecutionStepRecord history
    memory.ts                 — Supabase: persist MemoryEntry (long-term + patterns)
    schedules.ts              — Supabase: schedule CRUD
    subscriptions.ts          — Supabase: subscription status
    runHistory.ts             — Supabase: persist AgentRun records
    alerts.ts                 — Supabase: alert CRUD
    customTools.ts            — Supabase: custom tool CRUD

.env.local                    — API keys (see Environment Variables section)
```

---

## Architecture

### Request Flow
```
app/dashboard/page.tsx (state owner)
  ├── messages: ChatMessage[]
  ├── currentRun: AgentRun | null
  ├── panelView: PanelView
  ├── businessProfile: BusinessProfile | null
  ├── conversationHistory: Anthropic.MessageParam[] (ref)
  └── currentStage / currentReflection / currentObservation (live stream state)

User sends message
  → POST /api/agent { message, conversationHistory, businessProfile, savedWorkflows, runHistory }
  → runOrchestrator() decides: simple request → runAgent() | complex workflow → 8-stage pipeline
  → SSE events streamed back to client
  → Dashboard updates state from each SSE event in real-time
```

### Orchestrator Pipeline (`/lib/agent/orchestrator.ts`)
For complex automation requests, `runOrchestrator()` runs an 8-stage pipeline:
1. **Interpret** — parse goal into `GoalRepresentation` (intent, trigger, constraints, metrics)
2. **Memory** — load relevant long-term memories and past failure patterns
3. **Plan** — break goal into dependency-tracked `OperationalPlan` steps
4. **Select tools** — map each step to available tools via `getActiveTools()`
5. **Build graph** — synthesize `WorkflowGraph` (DAG) with parallel/sequential nodes
6. **Execute** — run DAG with retry loop (up to 2 retries per step)
7. **Observe** — collect `ExecutionObservation` (success rate, timing, retry count)
8. **Reflect + Optimize** — LLM diagnoses failures → `ReflectionResult` → patch workflow

Simple/conversational requests bypass the pipeline and go directly to `runAgent()`.
Results and failure patterns are persisted to long-term memory for learning.

### Agent Loop (`/lib/agent/runner.ts`)
- Uses `claude-sonnet-4-6` with full tool list, max 10 iterations
- Builds system prompt from `BusinessProfile` + connected integrations + custom tools
- Streams token deltas; executes tool calls via `executeTool()`
- Feeds tool results back to Claude until `end_turn`

### Tool System
- Tools defined in `/lib/agent/tools.ts` as Anthropic tool definitions
- `getActiveTools(config)` filters to only connected integrations
- `executeTool()` in `executor.ts` dispatches to the correct integration module
- **Adding a new integration:** add tool definition in `tools.ts` + case in `executor.ts` + module in `/integrations/`
- **Custom tools:** users can define HTTP integrations via `CustomToolsPanel` — stored in Supabase, injected at runtime

### Memory System (`/lib/agent/memory.ts`)
`MemoryManager` manages three memory tiers:
- **short_term** — volatile cache during a single run (goal, plan, tool mappings, graph)
- **long_term** — persistent user memories searchable via Jaccard similarity + time decay
- **pattern** — failure patterns learned from past executions (tool, error, solution)

Relevance scoring: `keyword_overlap × base_relevance × age_decay`. Memories older than 7 days decay exponentially.

### Export (`/lib/export/n8n.ts`)
- `toN8nJson()` — converts `WorkflowBlueprint` to n8n-compatible JSON
- `toMakeJson()` — converts to Make.com (Integromat) scenario format

---

## Key Types (`/lib/types.ts`)

```typescript
// Goal & Planning
interface GoalRepresentation   // Parsed intent: goal, trigger, constraints, success metrics
interface OperationalPlan      // Steps with dependency graph and complexity estimate
interface WorkflowNode         // DAG node: trigger | action | condition | parallel
interface WorkflowGraph        // DAG: WorkflowNode[] + edges[]

// Execution & Observability
interface ExecutionStepRecord  // Per-step runtime: state, input, output, error, retries, timing
interface ExecutionObservation // Aggregate metrics: execution time, success rate, tool call count
interface ReflectionResult     // LLM diagnosis: issues, root causes, suggested fixes, retry decision

// Memory
interface MemoryEntry          // short_term | long_term | pattern with relevance score + age

// Agent Run
interface ToolCallRecord       // Individual tool invocation: name, status, input, output, timing
interface AgentRun             // Full run session: id, status, messages, tool calls, timing
interface ChatMessage          // Conversation message: role, content, timestamp
interface AgentStreamEvent     // SSE event: run_started | tool_call_* | text_delta | reflection_complete | observation | run_complete | run_error

// Config & Profile
interface BusinessProfile      // Company name, description, tools in use, common workflows
interface IntegrationConfig    // API credentials for all 15 integrations
type PanelView = "run" | "history" | "library" | "dashboard" | "settings" | "monitor" | "tools"
```

---

## Integrations (15 total)

| Integration | Functions | Auth |
|-------------|-----------|------|
| Notion | createPage, queryDatabase | API key |
| Resend | sendEmail | API key |
| Slack | sendMessage | Webhook URL or OAuth |
| Stripe | listCustomers, listCharges | Secret key |
| HubSpot | createContact, searchContacts | API key |
| Airtable | createRecord, listRecords | API key + base ID |
| Gmail | sendEmail, searchEmails, readEmail | Google OAuth |
| Google Sheets | readRows, appendRow, findRows | Google OAuth |
| Google Calendar | listEvents, createEvent | Google OAuth |
| Twilio | sendSms, sendWhatsapp | Account SID + token |
| GitHub | createIssue, listIssues, listRepos | Personal access token |
| Linear | createIssue, listIssues | API key |
| Discord | sendMessage | Webhook URL |
| Mailchimp | addContact, listContacts, listAudiences | API key |
| Meta | (Facebook/Instagram integration) | API key |

---

## Layout

- **Public routes:** `/` (landing), `/auth`, `/pricing`
- **Authenticated routes:** `/dashboard`, `/billing`, `/workspaces`, `/invite/[token]`
- **Dashboard layout:**
  - Top bar (h-14): Logo, view toggles, active run pulse indicator
  - Left panel (40% on md+): `ChatPanel` — dark `#050508` with aurora/grid overlay
  - Right panel (60% on md+): switches between 7 views via `PanelView`
  - Mobile: Chat full-screen OR panel full-screen (toggle via `MobileBottomNav`)

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your keys

# 3. Start dev server
npm run dev

# 4. Open http://localhost:3000
```

---

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (billing)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Integration defaults (can also be set per-user in SettingsPanel)
NOTION_API_KEY=
NOTION_DATABASE_ID=
RESEND_API_KEY=
SLACK_WEBHOOK_URL=
HUBSPOT_API_KEY=
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
STRIPE_SECRET_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
GITHUB_TOKEN=
LINEAR_API_KEY=
DISCORD_WEBHOOK_URL=
MAILCHIMP_API_KEY=

# Google OAuth (for Gmail, Sheets, Calendar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Roadmap Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | API connection layer (OAuth + API keys) | ✅ Done |
| Phase 2 | Smarter workflow generation with context | ✅ Done |
| Phase 3 | Export to Zapier (n8n + Make.com already live) | Partially done |
| Phase 4 | Autonomous mode: 8-stage orchestrator pipeline | ✅ Done |
| Phase 5 | Memory layer: short-term, long-term, patterns | ✅ Done |
| — | Auth (Google OAuth, GitHub OAuth, email) | ✅ Done |
| — | Billing & subscriptions (Stripe) | ✅ Done |
| — | Multi-workspace + team invites | ✅ Done |
| — | Scheduling (cron-based workflow execution) | ✅ Done |
| — | Monitoring, alerts, custom tools | ✅ Done |
