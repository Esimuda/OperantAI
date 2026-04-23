export async function sendMessage(webhookUrl: string, message: string): Promise<string> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });

  if (!res.ok) {
    throw new Error(`Slack returned ${res.status}: ${await res.text()}`);
  }

  return `Slack message sent successfully.`;
}
