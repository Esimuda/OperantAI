import Anthropic from "@anthropic-ai/sdk";
import { IntegrationConfig } from "@/lib/types";
import { INTEGRATION_META } from "@/lib/integrations/meta";

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "notion_create_page",
    description:
      "Create a new page or row in a Notion database. Use this to log leads, tasks, records, or any structured data into Notion.",
    input_schema: {
      type: "object" as const,
      properties: {
        database_id: {
          type: "string",
          description: "The Notion database ID to create the page in. If not provided, uses the default configured database.",
        },
        title: {
          type: "string",
          description: "The title / Name of the new page.",
        },
        properties: {
          type: "object",
          description:
            "Key-value pairs of additional properties to set. Keys must match the database column names exactly.",
        },
        content: {
          type: "string",
          description: "Optional body text to add as a paragraph block on the page.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "notion_query_database",
    description:
      "Query rows from a Notion database. Use this to look up records, list leads, find tasks, or retrieve any stored data.",
    input_schema: {
      type: "object" as const,
      properties: {
        database_id: {
          type: "string",
          description: "The Notion database ID to query. Defaults to the configured database if omitted.",
        },
        filter_property: {
          type: "string",
          description: "Property name to filter by (optional).",
        },
        filter_value: {
          type: "string",
          description: "Value to match against the filter property (optional).",
        },
        page_size: {
          type: "number",
          description: "How many results to return. Default 10, max 25.",
        },
      },
      required: [],
    },
  },
  {
    name: "send_email",
    description:
      "Send a transactional email to one or more recipients via Resend. Use for welcome emails, notifications, reports, or any automated email.",
    input_schema: {
      type: "object" as const,
      properties: {
        to: {
          type: "string",
          description: "Recipient email address (or comma-separated list for multiple).",
        },
        subject: {
          type: "string",
          description: "Email subject line.",
        },
        body_html: {
          type: "string",
          description: "Full HTML body of the email. Make it professional and well-formatted.",
        },
        from_name: {
          type: "string",
          description: "Sender display name. Defaults to 'FlowMind AI'.",
        },
        reply_to: {
          type: "string",
          description: "Optional reply-to email address.",
        },
      },
      required: ["to", "subject", "body_html"],
    },
  },
  {
    name: "slack_send_message",
    description:
      "Send a message to a Slack channel using a webhook URL. Use for team notifications, alerts, status updates, or reports.",
    input_schema: {
      type: "object" as const,
      properties: {
        message: {
          type: "string",
          description: "The message text. Supports Slack mrkdwn formatting (*bold*, _italic_, `code`).",
        },
        webhook_url: {
          type: "string",
          description:
            "The Slack Incoming Webhook URL. If not provided, uses the configured default webhook.",
        },
      },
      required: ["message"],
    },
  },
  {
    name: "stripe_list_customers",
    description:
      "List customers from Stripe. Use to find customers, look up payment history, or get customer details.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "How many customers to return. Default 10, max 25.",
        },
        email: {
          type: "string",
          description: "Filter by exact email address (optional).",
        },
      },
      required: [],
    },
  },
  {
    name: "stripe_list_charges",
    description:
      "List recent charges/payments from Stripe. Use to review payment history, check revenue, or audit transactions.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "How many charges to return. Default 10, max 25.",
        },
        customer_id: {
          type: "string",
          description: "Filter by Stripe customer ID (optional).",
        },
      },
      required: [],
    },
  },
  {
    name: "build_workflow",
    description:
      "Design and save a multi-step automation workflow for the user. Use this when the user wants to create a reusable pipeline or automation blueprint rather than immediately executing actions.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Name of the workflow.",
        },
        trigger: {
          type: "string",
          description: "What triggers this workflow (e.g. 'New Typeform submission', 'Every Monday 9am', 'Manual').",
        },
        steps: {
          type: "array",
          description: "Ordered list of steps in the workflow.",
          items: {
            type: "object",
            properties: {
              step: { type: "number" },
              action: { type: "string" },
              tool: { type: "string" },
              output: { type: "string" },
            },
            required: ["step", "action", "tool", "output"],
          },
        },
        expected_outcome: {
          type: "string",
          description: "What the workflow accomplishes when it runs.",
        },
      },
      required: ["name", "trigger", "steps", "expected_outcome"],
    },
  },
  {
    name: "hubspot_create_contact",
    description: "Create a new contact in HubSpot CRM. Use for lead capture, sales pipeline, or CRM updates.",
    input_schema: {
      type: "object" as const,
      properties: {
        email: { type: "string", description: "Contact email address." },
        first_name: { type: "string", description: "First name (optional)." },
        last_name: { type: "string", description: "Last name (optional)." },
        company: { type: "string", description: "Company name (optional)." },
        phone: { type: "string", description: "Phone number (optional)." },
      },
      required: ["email"],
    },
  },
  {
    name: "hubspot_search_contacts",
    description: "Search for contacts in HubSpot CRM by name, email, or company.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query — name, email, or company." },
        limit: { type: "number", description: "How many results. Default 10, max 25." },
      },
      required: ["query"],
    },
  },
  {
    name: "airtable_create_record",
    description: "Create a new record in an Airtable table. Use for logging data, managing tasks, or storing structured information.",
    input_schema: {
      type: "object" as const,
      properties: {
        table_name: { type: "string", description: "The Airtable table name to write to." },
        fields: { type: "object", description: "Key-value pairs of field names and values." },
        base_id: { type: "string", description: "Airtable base ID (overrides configured default)." },
      },
      required: ["table_name", "fields"],
    },
  },
  {
    name: "airtable_list_records",
    description: "List records from an Airtable table.",
    input_schema: {
      type: "object" as const,
      properties: {
        table_name: { type: "string", description: "The Airtable table name to read from." },
        max_records: { type: "number", description: "How many records to return. Default 10, max 25." },
        base_id: { type: "string", description: "Airtable base ID (overrides configured default)." },
      },
      required: ["table_name"],
    },
  },
  {
    name: "sheets_read_rows",
    description: "Read rows from a Google Sheets spreadsheet. Use to fetch data, reports, or lists stored in Google Sheets.",
    input_schema: {
      type: "object" as const,
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "The Google Sheets spreadsheet ID (from the URL: /spreadsheets/d/SPREADSHEET_ID/).",
        },
        range: {
          type: "string",
          description: "A1 notation range to read, e.g. 'Sheet1!A1:E50' or 'Sheet1' for the whole sheet.",
        },
      },
      required: ["spreadsheet_id", "range"],
    },
  },
  {
    name: "sheets_append_row",
    description: "Append a new row to a Google Sheets spreadsheet. Use to log data, add leads, record events, or store any structured information.",
    input_schema: {
      type: "object" as const,
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "The Google Sheets spreadsheet ID.",
        },
        range: {
          type: "string",
          description: "Sheet name or range to append to, e.g. 'Sheet1' or 'Sheet1!A:E'.",
        },
        values: {
          type: "array",
          items: { type: "string" },
          description: "Ordered list of cell values for the new row, matching the column order.",
        },
      },
      required: ["spreadsheet_id", "range", "values"],
    },
  },
  {
    name: "sheets_find_rows",
    description: "Search for rows in a Google Sheets spreadsheet that contain a specific value. Use to look up records, find customers, or locate data.",
    input_schema: {
      type: "object" as const,
      properties: {
        spreadsheet_id: {
          type: "string",
          description: "The Google Sheets spreadsheet ID.",
        },
        range: {
          type: "string",
          description: "Sheet name or range to search within, e.g. 'Sheet1' or 'Sheet1!A:F'.",
        },
        search_value: {
          type: "string",
          description: "The value to search for. Matches any cell containing this string (case-insensitive).",
        },
      },
      required: ["spreadsheet_id", "range", "search_value"],
    },
  },
  {
    name: "gmail_send_email",
    description: "Send an email from the user's real Gmail inbox. Use for sending from a personal or business Gmail account rather than a transactional email service.",
    input_schema: {
      type: "object" as const,
      properties: {
        to:      { type: "string", description: "Recipient email address (or comma-separated list)." },
        subject: { type: "string", description: "Email subject line." },
        body:    { type: "string", description: "Email body. Can be plain text or HTML." },
        from:    { type: "string", description: "Optional sender name or email to display." },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "gmail_search_emails",
    description: "Search emails in the user's Gmail inbox using Gmail query syntax. Use to find emails by sender, subject, date, labels, or any keyword.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Gmail search query (same syntax as Gmail search bar). Examples: 'from:alice@example.com', 'subject:invoice is:unread', 'after:2024/01/01 has:attachment'.",
        },
        max_results: { type: "number", description: "How many results to return. Default 10, max 25." },
      },
      required: ["query"],
    },
  },
  {
    name: "calendar_list_events",
    description: "List upcoming events from Google Calendar. Use to check schedule, find meetings, or see what's coming up.",
    input_schema: {
      type: "object" as const,
      properties: {
        max_results:  { type: "number", description: "How many events to return. Default 10, max 25." },
        calendar_id:  { type: "string", description: "Calendar ID to query. Defaults to 'primary' (main calendar)." },
        time_min:     { type: "string", description: "Only show events after this ISO 8601 datetime. Defaults to now." },
      },
      required: [],
    },
  },
  {
    name: "calendar_create_event",
    description: "Create a new event in Google Calendar. Use to schedule meetings, set reminders, or block time.",
    input_schema: {
      type: "object" as const,
      properties: {
        summary:        { type: "string", description: "Event title." },
        start_datetime: { type: "string", description: "Start time in ISO 8601 format, e.g. '2024-03-15T14:00:00-05:00'." },
        end_datetime:   { type: "string", description: "End time in ISO 8601 format." },
        description:    { type: "string", description: "Optional event description or agenda." },
        attendee_emails:{ type: "string", description: "Comma-separated list of attendee email addresses (optional)." },
        calendar_id:    { type: "string", description: "Calendar ID. Defaults to 'primary'." },
      },
      required: ["summary", "start_datetime", "end_datetime"],
    },
  },
  {
    name: "gmail_read_email",
    description: "Read the full content of a specific Gmail message by its ID. Use after gmail_search_emails to read the body of a found email.",
    input_schema: {
      type: "object" as const,
      properties: {
        message_id: { type: "string", description: "The Gmail message ID (from gmail_search_emails results)." },
      },
      required: ["message_id"],
    },
  },
];

export function getActiveTools(config: IntegrationConfig): Anthropic.Tool[] {
  const activeToolNames = new Set<string>(["build_workflow"]);
  for (const meta of INTEGRATION_META) {
    if (meta.isConnected(config)) {
      meta.tools.forEach((t) => activeToolNames.add(t));
    }
  }
  return AGENT_TOOLS.filter((t) => activeToolNames.has(t.name));
}
