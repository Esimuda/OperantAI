import { Client } from "@notionhq/client";

function client(apiKey: string) {
  return new Client({ auth: apiKey });
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
    parent: { database_id: databaseId },
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

  // Use the raw Notion API since SDK types may vary by version
  const body: Record<string, unknown> = {
    page_size: Math.min(pageSize, 25),
  };

  if (filterProperty && filterValue) {
    body.filter = {
      property: filterProperty,
      rich_text: { contains: filterValue },
    };
  }

  const response = await notion.request<{
    results: Array<{ id: string; properties: Record<string, unknown> }>;
  }>({
    path: `databases/${databaseId}/query`,
    method: "post",
    body,
  });

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
