import { Client } from "@notionhq/client";

function client(apiKey: string) {
  return new Client({ auth: apiKey });
}

// Extracts a clean 32-char hex UUID from whatever the user pasted (full URL, with dashes, etc.)
function sanitizeId(raw: string): string {
  const hex = raw.replace(/[^0-9a-f]/gi, "");
  if (hex.length !== 32) {
    throw new Error(
      `Invalid Notion ID "${raw.slice(0, 80)}": expected a 32-character hex ID. Copy the ID from your Notion database URL or the Settings panel.`
    );
  }
  return hex;
}

export async function createDatabase(
  apiKey: string,
  parentPageId: string,
  title: string,
  columns: Record<string, "rich_text" | "email" | "number" | "select" | "date" | "checkbox" | "url" | "phone_number">
): Promise<string> {
  const notion = client(apiKey);

  const properties: Record<string, unknown> = {
    Name: { title: {} },
  };
  for (const [name, type] of Object.entries(columns)) {
    if (name === "Name") continue;
    properties[name] = { [type]: {} };
  }

  const dsClient = (notion as unknown as {
    dataSources: {
      create: (args: Record<string, unknown>) => Promise<{ id: string }>;
    };
  }).dataSources;

  const db = await dsClient.create({
    parent: { page_id: sanitizeId(parentPageId) },
    title: [{ type: "text", text: { content: title } }],
    properties,
  });

  return `Created Notion database: "${title}" (id: ${db.id}). Columns: Name (title), ${Object.keys(columns).join(", ")}.`;
}

export async function createPage(
  apiKey: string,
  databaseId: string,
  title: string,
  properties: Record<string, unknown> = {},
  content?: string
): Promise<string> {
  const notion = client(apiKey);

  const builtProps: Record<string, unknown> = {
    Name: { title: [{ text: { content: title } }] },
  };

  for (const [key, value] of Object.entries(properties)) {
    if (key === "Name") continue;
    if (typeof value === "string") {
      builtProps[key] = { rich_text: [{ text: { content: value } }] };
    } else {
      builtProps[key] = value;
    }
  }

  const children: unknown[] = content
    ? [{ object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content } }] } }]
    : [];

  const page = await notion.pages.create({
    parent: { database_id: sanitizeId(databaseId) },
    properties: builtProps as Parameters<typeof notion.pages.create>[0]["properties"],
    children: children as Parameters<typeof notion.pages.create>[0]["children"],
  });

  return `Created Notion page: "${title}" (id: ${page.id})`;
}

export async function queryDatabase(
  apiKey: string,
  databaseId: string,
  filterProperty?: string,
  filterValue?: string,
  pageSize = 10
): Promise<string> {
  const notion = client(apiKey);

  const cleanId = sanitizeId(databaseId);

  // The installed SDK (v5, API version 2025-09-03) replaced databases/{id}/query
  // with data_sources/{id}/query. Use the dataSources namespace accordingly.
  const dsClient = (notion as unknown as {
    dataSources: {
      query: (args: Record<string, unknown>) => Promise<{
        results: Array<{ id: string; properties: Record<string, unknown> }>;
      }>;
    };
  }).dataSources;

  const queryArgs: Record<string, unknown> = {
    data_source_id: cleanId,
    page_size: Math.min(pageSize, 25),
  };

  if (filterProperty && filterValue) {
    queryArgs.filter = {
      property: filterProperty,
      rich_text: { contains: filterValue },
    };
  }

  const response = await dsClient.query(queryArgs);

  if (response.results.length === 0) {
    return "No records found in the database.";
  }

  const rows = response.results.map((page) => {
    const parts: string[] = [];
    for (const [key, prop] of Object.entries(page.properties)) {
      const p = prop as Record<string, unknown>;
      if (p.type === "title" && Array.isArray(p.title)) {
        const text = (p.title as Array<{ plain_text: string }>).map((t) => t.plain_text).join("");
        parts.push(`${key}: ${text}`);
      } else if (p.type === "rich_text" && Array.isArray(p.rich_text)) {
        const text = (p.rich_text as Array<{ plain_text: string }>).map((t) => t.plain_text).join("");
        if (text) parts.push(`${key}: ${text}`);
      } else if (p.type === "email" && p.email) {
        parts.push(`${key}: ${p.email}`);
      } else if (p.type === "select" && p.select && typeof p.select === "object") {
        parts.push(`${key}: ${(p.select as { name: string }).name}`);
      } else if (p.type === "date" && p.date && typeof p.date === "object") {
        parts.push(`${key}: ${(p.date as { start: string }).start}`);
      }
    }
    return parts.join(" | ");
  });

  return `Found ${response.results.length} records:\n${rows.join("\n")}`;
}
