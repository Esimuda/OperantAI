import { describe, it, expect } from "vitest";
import { toN8nJson, toMakeJson } from "@/lib/export/n8n";
import type { WorkflowBlueprint } from "@/lib/export/n8n";

const base: WorkflowBlueprint = {
  name: "Sync CRM to Notion",
  trigger: "manual",
  expected_outcome: "All HubSpot contacts are synced to a Notion database",
  steps: [
    { step: 1, tool: "HubSpot", action: "List all contacts", output: "contacts array" },
    { step: 2, tool: "Notion", action: "Create page for each contact", output: "created pages" },
  ],
};

describe("toN8nJson()", () => {
  it("returns valid JSON", () => {
    expect(() => JSON.parse(toN8nJson(base))).not.toThrow();
  });

  it("includes the workflow name", () => {
    const w = JSON.parse(toN8nJson(base));
    expect(w.name).toBe("Sync CRM to Notion");
  });

  it("uses ManualTrigger for non-webhook trigger", () => {
    const w = JSON.parse(toN8nJson(base));
    const trigger = w.nodes[0];
    expect(trigger.type).toBe("n8n-nodes-base.manualTrigger");
    expect(trigger.name).toBe("Manual Trigger");
  });

  it("uses WebhookTrigger when trigger contains 'webhook'", () => {
    const webhookBlueprint: WorkflowBlueprint = { ...base, trigger: "New form webhook submission" };
    const w = JSON.parse(toN8nJson(webhookBlueprint));
    expect(w.nodes[0].type).toBe("n8n-nodes-base.webhook");
  });

  it("uses WebhookTrigger when trigger contains 'form'", () => {
    const formBlueprint: WorkflowBlueprint = { ...base, trigger: "Typeform submission" };
    const w = JSON.parse(toN8nJson(formBlueprint));
    expect(w.nodes[0].type).toBe("n8n-nodes-base.webhook");
  });

  it("maps HubSpot tool to hubspot node type", () => {
    const w = JSON.parse(toN8nJson(base));
    const hubspotNode = w.nodes.find((n: { type: string }) => n.type === "n8n-nodes-base.hubspot");
    expect(hubspotNode).toBeDefined();
  });

  it("maps Notion tool to notion node type", () => {
    const w = JSON.parse(toN8nJson(base));
    const notionNode = w.nodes.find((n: { type: string }) => n.type === "n8n-nodes-base.notion");
    expect(notionNode).toBeDefined();
  });

  it("maps unknown tool to httpRequest fallback", () => {
    const custom: WorkflowBlueprint = {
      ...base,
      steps: [{ step: 1, tool: "MyCustomAPI", action: "Do something", output: "result" }],
    };
    const w = JSON.parse(toN8nJson(custom));
    const customNode = w.nodes[1];
    expect(customNode.type).toBe("n8n-nodes-base.httpRequest");
  });

  it("creates connections chaining all nodes", () => {
    const w = JSON.parse(toN8nJson(base));
    const nodeNames = w.nodes.map((n: { name: string }) => n.name);
    // Every node except the last should appear as a source in connections
    nodeNames.slice(0, -1).forEach((name: string) => {
      expect(w.connections[name]).toBeDefined();
    });
  });

  it("sets active: false", () => {
    const w = JSON.parse(toN8nJson(base));
    expect(w.active).toBe(false);
  });

  it("node count equals steps + 1 (trigger)", () => {
    const w = JSON.parse(toN8nJson(base));
    expect(w.nodes).toHaveLength(base.steps.length + 1);
  });
});

describe("toMakeJson()", () => {
  it("returns valid JSON", () => {
    expect(() => JSON.parse(toMakeJson(base))).not.toThrow();
  });

  it("includes the workflow name", () => {
    const s = JSON.parse(toMakeJson(base));
    expect(s.name).toBe("Sync CRM to Notion");
  });

  it("module count matches step count", () => {
    const s = JSON.parse(toMakeJson(base));
    expect(s.modules).toHaveLength(base.steps.length);
  });

  it("sets instant:true for webhook trigger", () => {
    const webhookBlueprint: WorkflowBlueprint = { ...base, trigger: "webhook" };
    const s = JSON.parse(toMakeJson(webhookBlueprint));
    expect(s.metadata.instant).toBe(true);
  });

  it("sets instant:false for manual trigger", () => {
    const s = JSON.parse(toMakeJson(base));
    expect(s.metadata.instant).toBe(false);
  });

  it("includes expected_outcome as description", () => {
    const s = JSON.parse(toMakeJson(base));
    expect(s.description).toBe(base.expected_outcome);
  });
});
