async function req(apiKey: string, path: string, method = "GET", body?: unknown): Promise<unknown> {
  const res = await fetch(`https://api.airtable.com/v0${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function createRecord(
  apiKey: string,
  baseId: string,
  tableName: string,
  fields: Record<string, unknown>
): Promise<string> {
  const data = await req(apiKey, `/${baseId}/${encodeURIComponent(tableName)}`, "POST", {
    records: [{ fields }],
  }) as { records: Array<{ id: string }> };

  return `Created Airtable record in "${tableName}" — id: ${data.records[0].id}`;
}

export async function listRecords(
  apiKey: string,
  baseId: string,
  tableName: string,
  maxRecords = 10
): Promise<string> {
  const data = await req(
    apiKey,
    `/${baseId}/${encodeURIComponent(tableName)}?maxRecords=${Math.min(maxRecords, 25)}`
  ) as { records: Array<{ id: string; fields: Record<string, unknown> }> };

  if (!data.records.length) return `No records in "${tableName}".`;

  const rows = data.records.map((r) => {
    const fieldStr = Object.entries(r.fields)
      .slice(0, 4)
      .map(([k, v]) => `${k}: ${String(v).slice(0, 40)}`)
      .join(" | ");
    return `[${r.id}] ${fieldStr}`;
  });

  return `Found ${data.records.length} records in "${tableName}":\n${rows.join("\n")}`;
}
