import Stripe from "stripe";

function client(secretKey: string) {
  return new Stripe(secretKey);
}

export async function listCustomers(
  secretKey: string,
  limit = 10,
  email?: string
): Promise<string> {
  const stripe = client(secretKey);

  const params: Stripe.CustomerListParams = { limit: Math.min(limit, 25) };
  if (email) params.email = email;

  const customers = await stripe.customers.list(params);

  if (customers.data.length === 0) return "No customers found.";

  const rows = customers.data.map((c) =>
    `${c.name ?? "Unknown"} | ${c.email ?? "no email"} | id: ${c.id}`
  );

  return `Found ${customers.data.length} customers:\n${rows.join("\n")}`;
}

export async function listCharges(
  secretKey: string,
  limit = 10,
  customerId?: string
): Promise<string> {
  const stripe = client(secretKey);

  const params: Stripe.ChargeListParams = { limit: Math.min(limit, 25) };
  if (customerId) params.customer = customerId;

  const charges = await stripe.charges.list(params);

  if (charges.data.length === 0) return "No charges found.";

  const rows = charges.data.map((c) => {
    const amount = (c.amount / 100).toFixed(2);
    const status = c.status;
    const date = new Date(c.created * 1000).toLocaleDateString();
    return `$${amount} ${c.currency.toUpperCase()} | ${status} | ${date} | ${c.description ?? "no description"}`;
  });

  return `Found ${charges.data.length} charges:\n${rows.join("\n")}`;
}
