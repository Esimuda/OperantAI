const BASE = "https://api.hubapi.com";

async function req(apiKey: string, path: string, method = "GET", body?: unknown): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`HubSpot ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function createContact(
  apiKey: string,
  email: string,
  firstName?: string,
  lastName?: string,
  company?: string,
  phone?: string
): Promise<string> {
  const properties: Record<string, string> = { email };
  if (firstName) properties.firstname = firstName;
  if (lastName) properties.lastname = lastName;
  if (company) properties.company = company;
  if (phone) properties.phone = phone;

  const data = await req(apiKey, "/crm/v3/objects/contacts", "POST", { properties }) as { id: string };
  return `Created HubSpot contact: ${firstName ?? ""} ${lastName ?? ""} (${email}) — id: ${data.id}`;
}

export async function searchContacts(
  apiKey: string,
  query: string,
  limit = 10
): Promise<string> {
  const data = await req(apiKey, "/crm/v3/objects/contacts/search", "POST", {
    query,
    limit: Math.min(limit, 25),
    properties: ["firstname", "lastname", "email", "company"],
  }) as { results: Array<{ id: string; properties: Record<string, string> }> };

  if (!data.results.length) return "No HubSpot contacts found.";

  const rows = data.results.map((c) => {
    const p = c.properties;
    return `${p.firstname ?? ""} ${p.lastname ?? ""} | ${p.email ?? "no email"} | ${p.company ?? ""} | id: ${c.id}`;
  });

  return `Found ${data.results.length} contacts:\n${rows.join("\n")}`;
}
