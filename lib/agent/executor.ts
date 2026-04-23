import { IntegrationConfig } from "@/lib/types";
import * as notion from "@/lib/integrations/notion";
import * as resend from "@/lib/integrations/resend";
import * as slack from "@/lib/integrations/slack";
import * as stripe from "@/lib/integrations/stripe";
import * as hubspot from "@/lib/integrations/hubspot";
import * as airtable from "@/lib/integrations/airtable";
import * as sheets from "@/lib/integrations/sheets";
import * as gmail from "@/lib/integrations/gmail";
import * as calendar from "@/lib/integrations/calendar";

export interface ToolResult {
  output: string;
  isError: boolean;
}

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  config: IntegrationConfig
): Promise<ToolResult> {
  try {
    const output = await dispatch(toolName, input, config);
    return { output, isError: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { output: message, isError: true };
  }
}

async function dispatch(
  toolName: string,
  input: Record<string, unknown>,
  config: IntegrationConfig
): Promise<string> {
  switch (toolName) {
    case "notion_create_page": {
      const apiKey = config.notionApiKey;
      const dbId = (input.database_id as string | undefined) ?? config.notionDatabaseId;
      if (!apiKey) throw new Error("Notion is not connected. Please add NOTION_API_KEY.");
      if (!dbId) throw new Error("No Notion database configured. Please add NOTION_DATABASE_ID.");
      return notion.createPage(
        apiKey,
        dbId,
        input.title as string,
        (input.properties as Record<string, unknown>) ?? {},
        input.content as string | undefined
      );
    }

    case "notion_query_database": {
      const apiKey = config.notionApiKey;
      const dbId = (input.database_id as string | undefined) ?? config.notionDatabaseId;
      if (!apiKey) throw new Error("Notion is not connected. Please add NOTION_API_KEY.");
      if (!dbId) throw new Error("No Notion database configured. Please add NOTION_DATABASE_ID.");
      return notion.queryDatabase(
        apiKey,
        dbId,
        input.filter_property as string | undefined,
        input.filter_value as string | undefined,
        (input.page_size as number | undefined) ?? 10
      );
    }

    case "send_email": {
      const apiKey = config.resendApiKey;
      if (!apiKey) throw new Error("Email is not connected. Please add RESEND_API_KEY.");
      return resend.sendEmail(
        apiKey,
        input.to as string,
        input.subject as string,
        input.body_html as string,
        (input.from_name as string | undefined) ?? "FlowMind AI",
        input.reply_to as string | undefined
      );
    }

    case "slack_send_message": {
      const webhookUrl = (input.webhook_url as string | undefined) ?? config.slackWebhookUrl;
      if (!webhookUrl) throw new Error("Slack is not connected. Please add SLACK_WEBHOOK_URL.");
      return slack.sendMessage(webhookUrl, input.message as string);
    }

    case "stripe_list_customers": {
      const secretKey = config.stripeSecretKey;
      if (!secretKey) throw new Error("Stripe is not connected. Please add STRIPE_SECRET_KEY.");
      return stripe.listCustomers(
        secretKey,
        (input.limit as number | undefined) ?? 10,
        input.email as string | undefined
      );
    }

    case "stripe_list_charges": {
      const secretKey = config.stripeSecretKey;
      if (!secretKey) throw new Error("Stripe is not connected. Please add STRIPE_SECRET_KEY.");
      return stripe.listCharges(
        secretKey,
        (input.limit as number | undefined) ?? 10,
        input.customer_id as string | undefined
      );
    }

    case "build_workflow": {
      const steps = input.steps as Array<{ step: number; action: string; tool: string; output: string }>;
      const summary = steps.map((s) => `  ${s.step}. [${s.tool}] ${s.action}`).join("\n");
      return `Workflow "${input.name}" designed:\nTrigger: ${input.trigger}\nSteps:\n${summary}\nOutcome: ${input.expected_outcome}\n__WORKFLOW_JSON__:${JSON.stringify(input)}`;
    }

    case "hubspot_create_contact": {
      const apiKey = config.hubspotApiKey;
      if (!apiKey) throw new Error("HubSpot is not connected. Please add HUBSPOT_API_KEY.");
      return hubspot.createContact(
        apiKey,
        input.email as string,
        input.first_name as string | undefined,
        input.last_name as string | undefined,
        input.company as string | undefined,
        input.phone as string | undefined
      );
    }

    case "hubspot_search_contacts": {
      const apiKey = config.hubspotApiKey;
      if (!apiKey) throw new Error("HubSpot is not connected. Please add HUBSPOT_API_KEY.");
      return hubspot.searchContacts(
        apiKey,
        input.query as string,
        (input.limit as number | undefined) ?? 10
      );
    }

    case "airtable_create_record": {
      const apiKey = config.airtableApiKey;
      const baseId = (input.base_id as string | undefined) ?? config.airtableBaseId;
      if (!apiKey) throw new Error("Airtable is not connected. Please add AIRTABLE_API_KEY.");
      if (!baseId) throw new Error("No Airtable base configured. Please add AIRTABLE_BASE_ID.");
      return airtable.createRecord(
        apiKey,
        baseId,
        input.table_name as string,
        input.fields as Record<string, unknown>
      );
    }

    case "airtable_list_records": {
      const apiKey = config.airtableApiKey;
      const baseId = (input.base_id as string | undefined) ?? config.airtableBaseId;
      if (!apiKey) throw new Error("Airtable is not connected. Please add AIRTABLE_API_KEY.");
      if (!baseId) throw new Error("No Airtable base configured. Please add AIRTABLE_BASE_ID.");
      return airtable.listRecords(
        apiKey,
        baseId,
        input.table_name as string,
        (input.max_records as number | undefined) ?? 10
      );
    }

    case "sheets_read_rows": {
      const email = config.googleSheetsClientEmail;
      const key = config.googleSheetsPrivateKey;
      if (!email || !key) throw new Error("Google Sheets is not connected. Please add your service account credentials in Settings.");
      return sheets.readRows(email, key, input.spreadsheet_id as string, input.range as string);
    }

    case "sheets_append_row": {
      const email = config.googleSheetsClientEmail;
      const key = config.googleSheetsPrivateKey;
      if (!email || !key) throw new Error("Google Sheets is not connected. Please add your service account credentials in Settings.");
      return sheets.appendRow(email, key, input.spreadsheet_id as string, input.range as string, input.values as string[]);
    }

    case "sheets_find_rows": {
      const email = config.googleSheetsClientEmail;
      const key = config.googleSheetsPrivateKey;
      if (!email || !key) throw new Error("Google Sheets is not connected. Please add your service account credentials in Settings.");
      return sheets.findRows(email, key, input.spreadsheet_id as string, input.range as string, input.search_value as string);
    }

    case "calendar_list_events": {
      const { gmailClientId: cid, gmailClientSecret: csec, gmailRefreshToken: rtok } = config;
      if (!cid || !csec || !rtok) throw new Error("Google Calendar is not connected. Add Gmail OAuth credentials in Settings (Calendar uses the same credentials).");
      return calendar.listEvents(cid, csec, rtok, (input.max_results as number | undefined) ?? 10, (input.calendar_id as string | undefined) ?? "primary", input.time_min as string | undefined);
    }

    case "calendar_create_event": {
      const { gmailClientId: cid, gmailClientSecret: csec, gmailRefreshToken: rtok } = config;
      if (!cid || !csec || !rtok) throw new Error("Google Calendar is not connected. Add Gmail OAuth credentials in Settings.");
      return calendar.createEvent(cid, csec, rtok, input.summary as string, input.start_datetime as string, input.end_datetime as string, input.description as string | undefined, input.attendee_emails as string | undefined, (input.calendar_id as string | undefined) ?? "primary");
    }

    case "gmail_send_email": {
      const { gmailClientId: cid, gmailClientSecret: csec, gmailRefreshToken: rtok } = config;
      if (!cid || !csec || !rtok) throw new Error("Gmail is not connected. Please add your OAuth2 credentials in Settings.");
      return gmail.sendEmail(cid, csec, rtok, input.to as string, input.subject as string, input.body as string, input.from as string | undefined);
    }

    case "gmail_search_emails": {
      const { gmailClientId: cid, gmailClientSecret: csec, gmailRefreshToken: rtok } = config;
      if (!cid || !csec || !rtok) throw new Error("Gmail is not connected. Please add your OAuth2 credentials in Settings.");
      return gmail.searchEmails(cid, csec, rtok, input.query as string, (input.max_results as number | undefined) ?? 10);
    }

    case "gmail_read_email": {
      const { gmailClientId: cid, gmailClientSecret: csec, gmailRefreshToken: rtok } = config;
      if (!cid || !csec || !rtok) throw new Error("Gmail is not connected. Please add your OAuth2 credentials in Settings.");
      return gmail.readEmail(cid, csec, rtok, input.message_id as string);
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
