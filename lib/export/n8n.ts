export interface WorkflowStep {
  step: number;
  action: string;
  tool: string;
  output: string;
  dependencies?: number[];
}

export interface WorkflowBlueprint {
  name: string;
  trigger: string;
  steps: WorkflowStep[];
  expected_outcome: string;
}

const TOOL_TO_N8N: Record<string, string> = {
  Gmail: "n8n-nodes-base.gmail",
  Email: "n8n-nodes-base.emailSend",
  Resend: "n8n-nodes-base.httpRequest",
  Slack: "n8n-nodes-base.slack",
  Notion: "n8n-nodes-base.notion",
  Airtable: "n8n-nodes-base.airtable",
  HubSpot: "n8n-nodes-base.hubspot",
  Stripe: "n8n-nodes-base.stripe",
  Typeform: "n8n-nodes-base.typeformTrigger",
  Webhook: "n8n-nodes-base.webhook",
  HTTP: "n8n-nodes-base.httpRequest",
  default: "n8n-nodes-base.httpRequest",
};

function toolNodeType(tool: string): string {
  const key = Object.keys(TOOL_TO_N8N).find((k) => tool.toLowerCase().includes(k.toLowerCase()));
  return key ? TOOL_TO_N8N[key] : TOOL_TO_N8N.default;
}

export function toN8nJson(workflow: WorkflowBlueprint): string {
  const isTriggerWebhook = workflow.trigger.toLowerCase().includes("typeform") ||
    workflow.trigger.toLowerCase().includes("form") ||
    workflow.trigger.toLowerCase().includes("webhook");

  const triggerNode = {
    id: "trigger-0",
    name: isTriggerWebhook ? "Webhook Trigger" : "Manual Trigger",
    type: isTriggerWebhook ? "n8n-nodes-base.webhook" : "n8n-nodes-base.manualTrigger",
    typeVersion: 1,
    position: [100, 300],
    parameters: isTriggerWebhook ? { path: "flowmind", httpMethod: "POST" } : {},
  };

  const stepNodes = workflow.steps.map((s, i) => ({
    id: `step-${i + 1}`,
    name: s.action.slice(0, 50),
    type: toolNodeType(s.tool),
    typeVersion: 1,
    position: [400 + i * 300, 300],
    parameters: {
      description: s.output,
    },
    notes: s.action,
  }));

  const allNodes = [triggerNode, ...stepNodes];

  const connections: Record<string, unknown> = {};
  allNodes.forEach((node, i) => {
    if (i < allNodes.length - 1) {
      connections[node.name] = {
        main: [[{ node: allNodes[i + 1].name, type: "main", index: 0 }]],
      };
    }
  });

  const n8nWorkflow = {
    name: workflow.name,
    nodes: allNodes,
    connections,
    active: false,
    settings: { executionOrder: "v1" },
    meta: {
      instanceId: "flowmind-export",
      templateId: "flowmind-ai",
    },
  };

  return JSON.stringify(n8nWorkflow, null, 2);
}

export function toMakeJson(workflow: WorkflowBlueprint): string {
  const scenario = {
    name: workflow.name,
    description: workflow.expected_outcome,
    modules: workflow.steps.map((s, i) => ({
      id: i + 1,
      module: `${s.tool.toLowerCase()}:${s.action.split(" ")[0].toLowerCase()}`,
      version: 1,
      parameters: {},
      label: s.action,
      notes: s.output,
    })),
    metadata: {
      instant: workflow.trigger.toLowerCase().includes("webhook") ||
        workflow.trigger.toLowerCase().includes("form"),
      version: 1,
      trigger: workflow.trigger,
    },
  };

  return JSON.stringify(scenario, null, 2);
}
