const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json() as { access_token?: string; error?: string; error_description?: string };
  if (!data.access_token) {
    throw new Error(`Gmail auth failed: ${data.error_description ?? data.error ?? "unknown error"}`);
  }
  return data.access_token;
}

function buildMimeMessage(to: string, subject: string, body: string, from?: string): string {
  const isHtml = body.trimStart().startsWith("<");
  const contentType = isHtml ? "text/html" : "text/plain";
  const lines = [
    from ? `From: ${from}` : "",
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: ${contentType}; charset=UTF-8`,
    "",
    body,
  ].filter((l, i) => i !== 0 || l !== "");
  return Buffer.from(lines.join("\r\n")).toString("base64url");
}

export async function sendEmail(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  to: string,
  subject: string,
  body: string,
  from?: string
): Promise<string> {
  const token = await getAccessToken(clientId, clientSecret, refreshToken);
  const raw = buildMimeMessage(to, subject, body, from);

  const res = await fetch(`${GMAIL_BASE}/messages/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Gmail API error ${res.status}`);
  }

  const data = await res.json() as { id: string; threadId: string };
  return `Email sent to ${to} — message ID: ${data.id}`;
}

export async function searchEmails(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  query: string,
  maxResults = 10
): Promise<string> {
  const token = await getAccessToken(clientId, clientSecret, refreshToken);
  const params = new URLSearchParams({ q: query, maxResults: String(Math.min(maxResults, 25)) });
  const res = await fetch(`${GMAIL_BASE}/messages?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Gmail API error ${res.status}`);
  }

  const data = await res.json() as { messages?: Array<{ id: string; threadId: string }>; resultSizeEstimate?: number };
  const messages = data.messages ?? [];
  if (messages.length === 0) return `No emails found matching query: "${query}"`;

  // Fetch subject + sender for each message
  const details = await Promise.all(
    messages.slice(0, 10).map(async (m) => {
      const r = await fetch(`${GMAIL_BASE}/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return `  - ID: ${m.id}`;
      const d = await r.json() as { payload?: { headers?: Array<{ name: string; value: string }> }; snippet?: string };
      const headers = d.payload?.headers ?? [];
      const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
      const from    = headers.find((h) => h.name === "From")?.value ?? "unknown";
      const date    = headers.find((h) => h.name === "Date")?.value ?? "";
      return `  - [${m.id}] From: ${from} | Subject: ${subject} | ${date}`;
    })
  );

  return `${data.resultSizeEstimate ?? messages.length} email(s) matching "${query}":\n${details.join("\n")}`;
}

export async function readEmail(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  messageId: string
): Promise<string> {
  const token = await getAccessToken(clientId, clientSecret, refreshToken);
  const res = await fetch(`${GMAIL_BASE}/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Gmail API error ${res.status}`);
  }

  const data = await res.json() as {
    payload?: {
      headers?: Array<{ name: string; value: string }>;
      body?: { data?: string };
      parts?: Array<{ mimeType: string; body?: { data?: string } }>;
    };
    snippet?: string;
  };

  const headers = data.payload?.headers ?? [];
  const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
  const from    = headers.find((h) => h.name === "From")?.value ?? "unknown";
  const date    = headers.find((h) => h.name === "Date")?.value ?? "";

  // Extract body — try direct body first, then parts
  let bodyText = "";
  const directData = data.payload?.body?.data;
  if (directData) {
    bodyText = Buffer.from(directData, "base64").toString("utf-8");
  } else {
    const textPart = data.payload?.parts?.find((p) => p.mimeType === "text/plain");
    const htmlPart = data.payload?.parts?.find((p) => p.mimeType === "text/html");
    const part = textPart ?? htmlPart;
    if (part?.body?.data) {
      bodyText = Buffer.from(part.body.data, "base64").toString("utf-8");
      // Strip HTML tags for readability
      if (!textPart) bodyText = bodyText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
  }

  if (!bodyText && data.snippet) bodyText = data.snippet;

  return `From: ${from}\nDate: ${date}\nSubject: ${subject}\n\n${bodyText.slice(0, 2000)}`;
}
