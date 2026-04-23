import { WorkflowBlueprint } from "./n8n";

interface ZapierTrigger {
  app: string;
  event: string;
}

interface ZapierAction {
  step: number;
  app: string;
  action: string;
  note: string;
  suggested_fields: Record<string, string>;
}

interface ZapierExport {
  zap_name: string;
  description: string;
  trigger: ZapierTrigger;
  actions: ZapierAction[];
  setup_instructions: string[];
  generated_by: string;
}

const TRIGGER_MAP: Array<{ keywords: string[]; trigger: ZapierTrigger }> = [
  { keywords: ["typeform", "form submission", "form fill"], trigger: { app: "Typeform", event: "New Entry" } },
  { keywords: ["webhook", "http", "api call"],             trigger: { app: "Webhooks by Zapier", event: "Catch Hook" } },
  { keywords: ["stripe", "payment", "charge", "customer"], trigger: { app: "Stripe", event: "New Customer" } },
  { keywords: ["shopify", "order", "purchase"],            trigger: { app: "Shopify", event: "New Order" } },
  { keywords: ["schedule", "every", "daily", "weekly", "monday", "cron"], trigger: { app: "Schedule by Zapier", event: "Every Day" } },
  { keywords: ["email", "gmail", "inbox"],                 trigger: { app: "Gmail", event: "New Email" } },
  { keywords: ["slack", "message"],                        trigger: { app: "Slack", event: "New Message" } },
  { keywords: ["airtable"],                                trigger: { app: "Airtable", event: "New Record" } },
  { keywords: ["notion"],                                  trigger: { app: "Notion", event: "New Database Item" } },
  { keywords: ["hubspot", "crm", "lead", "contact"],      trigger: { app: "HubSpot", event: "New Contact" } },
];

const ACTION_MAP: Array<{ keywords: string[]; app: string; action: string; fields: Record<string, string> }> = [
  {
    keywords: ["notion", "database", "record", "page"],
    app: "Notion", action: "Create Database Item",
    fields: { Database: "(select your database)", Name: "{{trigger.name}}", Email: "{{trigger.email}}" },
  },
  {
    keywords: ["email", "send email", "resend", "gmail", "welcome email", "notification"],
    app: "Gmail", action: "Send Email",
    fields: { To: "{{trigger.email}}", Subject: "(set subject)", Body: "(set body)" },
  },
  {
    keywords: ["slack", "notify", "channel", "message", "alert"],
    app: "Slack", action: "Send Channel Message",
    fields: { Channel: "(select channel)", Message: "(set message text)" },
  },
  {
    keywords: ["stripe", "customer", "payment", "charge"],
    app: "Stripe", action: "Find Customer",
    fields: { Email: "{{trigger.email}}" },
  },
  {
    keywords: ["hubspot", "crm", "contact", "lead"],
    app: "HubSpot", action: "Create Contact",
    fields: { Email: "{{trigger.email}}", Firstname: "{{trigger.first_name}}", Lastname: "{{trigger.last_name}}" },
  },
  {
    keywords: ["airtable", "table", "spreadsheet", "base"],
    app: "Airtable", action: "Create Record",
    fields: { Base: "(select your base)", Table: "(select your table)", Fields: "{{trigger.*}}" },
  },
];

function matchTrigger(triggerText: string): ZapierTrigger {
  const lower = triggerText.toLowerCase();
  for (const { keywords, trigger } of TRIGGER_MAP) {
    if (keywords.some((k) => lower.includes(k))) return trigger;
  }
  return { app: "Webhooks by Zapier", event: "Catch Hook" };
}

function matchAction(step: WorkflowBlueprint["steps"][number]): { app: string; action: string; fields: Record<string, string> } {
  const lower = (step.action + " " + step.tool + " " + step.output).toLowerCase();
  for (const entry of ACTION_MAP) {
    if (entry.keywords.some((k) => lower.includes(k))) {
      return { app: entry.app, action: entry.action, fields: entry.fields };
    }
  }
  return {
    app: "Webhooks by Zapier",
    action: "POST",
    fields: { URL: "(set endpoint URL)", Payload: "{{trigger.*}}" },
  };
}

function buildSetupInstructions(trigger: ZapierTrigger, actions: ZapierAction[]): string[] {
  const steps: string[] = [
    "1. Go to zapier.com and click 'Create Zap'",
    `2. Trigger — Search for '${trigger.app}' and select event: '${trigger.event}'`,
    "3. Connect your account and configure the trigger settings, then test it",
  ];

  actions.forEach((a, i) => {
    steps.push(
      `${i + 4}. Action ${a.step} — Search for '${a.app}' and select action: '${a.action}'`
    );
    const fieldLines = Object.entries(a.suggested_fields)
      .map(([k, v]) => `   • ${k}: ${v}`)
      .join("\n");
    if (fieldLines) steps.push(fieldLines);
  });

  steps.push(`${actions.length + 4}. Name your Zap and turn it on`);
  return steps;
}

export function toZapierJson(workflow: WorkflowBlueprint): string {
  const trigger = matchTrigger(workflow.trigger);

  const actions: ZapierAction[] = workflow.steps.map((s) => {
    const match = matchAction(s);
    return {
      step: s.step,
      app: match.app,
      action: match.action,
      note: s.output,
      suggested_fields: match.fields,
    };
  });

  const output: ZapierExport = {
    zap_name: workflow.name,
    description: workflow.expected_outcome,
    trigger,
    actions,
    setup_instructions: buildSetupInstructions(trigger, actions),
    generated_by: "FlowMind AI",
  };

  return JSON.stringify(output, null, 2);
}
