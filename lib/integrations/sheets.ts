import * as crypto from "crypto";

async function getAccessToken(clientEmail: string, rawPrivateKey: string): Promise<string> {
  // Service account private keys come from JSON with literal \n — normalize them
  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);

  const header  = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })).toString("base64url");

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(privateKey, "base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${payload}.${signature}`,
    }),
  });

  const data = await res.json() as { access_token?: string; error?: string; error_description?: string };
  if (!data.access_token) {
    throw new Error(`Google Sheets auth failed: ${data.error_description ?? data.error ?? "unknown error"}`);
  }
  return data.access_token;
}

const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

export async function readRows(
  clientEmail: string,
  privateKey: string,
  spreadsheetId: string,
  range: string
): Promise<string> {
  const token = await getAccessToken(clientEmail, privateKey);
  const url = `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Sheets API error ${res.status}`);
  }

  const data = await res.json() as { values?: string[][] };
  const rows = data.values ?? [];
  if (rows.length === 0) return `No data found in range "${range}".`;

  const [headers, ...body] = rows;
  if (!headers || body.length === 0) return `Range "${range}" contains only a header row with no data.`;

  const formatted = body.map((row, i) => {
    const cells = headers.map((h, j) => `${h}: ${row[j] ?? ""}`).join(" | ");
    return `Row ${i + 1}: ${cells}`;
  });

  return `${body.length} row${body.length !== 1 ? "s" : ""} from "${range}":\n${formatted.join("\n")}`;
}

export async function appendRow(
  clientEmail: string,
  privateKey: string,
  spreadsheetId: string,
  range: string,
  values: string[]
): Promise<string> {
  const token = await getAccessToken(clientEmail, privateKey);
  const url = `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [values] }),
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Sheets API error ${res.status}`);
  }

  const data = await res.json() as { updates?: { updatedRange?: string } };
  return `Row appended to "${data.updates?.updatedRange ?? range}": ${values.join(", ")}`;
}

export async function findRows(
  clientEmail: string,
  privateKey: string,
  spreadsheetId: string,
  range: string,
  searchValue: string
): Promise<string> {
  const token = await getAccessToken(clientEmail, privateKey);
  const url = `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Sheets API error ${res.status}`);
  }

  const data = await res.json() as { values?: string[][] };
  const rows = data.values ?? [];
  if (rows.length === 0) return `No data found in range "${range}".`;

  const [headers, ...body] = rows;
  const lower = searchValue.toLowerCase();
  const matches = body.filter((row) => row.some((cell) => cell.toLowerCase().includes(lower)));

  if (matches.length === 0) return `No rows found matching "${searchValue}" in "${range}".`;

  const formatted = matches.map((row) => {
    const cells = (headers ?? []).map((h, j) => `${h}: ${row[j] ?? ""}`).join(" | ");
    return cells;
  });

  return `${matches.length} row${matches.length !== 1 ? "s" : ""} matching "${searchValue}":\n${formatted.join("\n")}`;
}
