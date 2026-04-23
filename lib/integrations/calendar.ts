const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CAL_BASE = "https://www.googleapis.com/calendar/v3";

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
  if (!data.access_token) throw new Error(`Google auth failed: ${data.error_description ?? data.error ?? "unknown"}`);
  return data.access_token;
}

interface GCalEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
  htmlLink?: string;
}

function formatEvent(e: GCalEvent): string {
  const start = e.start?.dateTime ?? e.start?.date ?? "unknown";
  const end   = e.end?.dateTime   ?? e.end?.date   ?? "unknown";
  const attendees = e.attendees?.map((a) => a.email).join(", ") ?? "";
  return [
    `[${e.id}] ${e.summary ?? "(no title)"}`,
    `  When: ${start} → ${end}`,
    attendees ? `  Attendees: ${attendees}` : "",
    e.description ? `  Note: ${e.description.slice(0, 100)}` : "",
  ].filter(Boolean).join("\n");
}

export async function listEvents(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  maxResults = 10,
  calendarId = "primary",
  timeMin?: string
): Promise<string> {
  const token = await getAccessToken(clientId, clientSecret, refreshToken);
  const params = new URLSearchParams({
    maxResults: String(Math.min(maxResults, 25)),
    orderBy: "startTime",
    singleEvents: "true",
    timeMin: timeMin ?? new Date().toISOString(),
  });

  const res = await fetch(`${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Calendar API error ${res.status}`);
  }

  const data = await res.json() as { items?: GCalEvent[] };
  const events = data.items ?? [];
  if (events.length === 0) return "No upcoming events found.";
  return `${events.length} upcoming event${events.length !== 1 ? "s" : ""}:\n\n${events.map(formatEvent).join("\n\n")}`;
}

export async function createEvent(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  summary: string,
  startDateTime: string,
  endDateTime: string,
  description?: string,
  attendeeEmails?: string,
  calendarId = "primary"
): Promise<string> {
  const token = await getAccessToken(clientId, clientSecret, refreshToken);

  const body: Record<string, unknown> = {
    summary,
    start: { dateTime: startDateTime },
    end:   { dateTime: endDateTime },
  };
  if (description) body.description = description;
  if (attendeeEmails) {
    body.attendees = attendeeEmails.split(",").map((e) => ({ email: e.trim() }));
  }

  const res = await fetch(`${CAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Calendar API error ${res.status}`);
  }

  const event = await res.json() as GCalEvent;
  return `Event created: "${event.summary}" on ${event.start?.dateTime ?? event.start?.date} — ${event.htmlLink ?? ""}`;
}
