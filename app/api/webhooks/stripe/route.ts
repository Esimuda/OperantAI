import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { upsertSubscription, updateSubscriptionByCustomerId, Plan, SubStatus } from "@/lib/db/subscriptions";

// Must be raw body for Stripe signature verification
export const runtime = "nodejs";

// current_period_end is a unix timestamp but omitted from some Stripe SDK versioned types
function periodEndIso(sub: unknown): string | null {
  const ts = (sub as Record<string, unknown>).current_period_end;
  return typeof ts === "number" ? new Date(ts * 1000).toISOString() : null;
}

function planFromMetadata(metadata: Stripe.Metadata): Plan {
  const p = metadata.plan as string;
  if (p === "pro" || p === "business") return p;
  return "free";
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" });
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = planFromMetadata(session.metadata ?? {});
        if (!userId || session.mode !== "subscription") break;

        const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string);
        await upsertSubscription({
          userId,
          stripeCustomerId:     session.customer as string,
          stripeSubscriptionId: stripeSub.id,
          plan,
          status:               stripeSub.status as SubStatus,
          currentPeriodEnd:     periodEndIso(stripeSub),
          cancelAtPeriodEnd:    stripeSub.cancel_at_period_end,
        });
        break;
      }

      case "customer.subscription.updated": {
        const stripeSub = event.data.object as Stripe.Subscription;
        const userId = stripeSub.metadata?.userId;
        if (!userId) break;
        await upsertSubscription({
          userId,
          stripeSubscriptionId: stripeSub.id,
          plan:                 planFromMetadata(stripeSub.metadata ?? {}),
          status:               stripeSub.status as SubStatus,
          currentPeriodEnd:     periodEndIso(stripeSub),
          cancelAtPeriodEnd:    stripeSub.cancel_at_period_end,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub = event.data.object as Stripe.Subscription;
        const userId = stripeSub.metadata?.userId;
        if (!userId) break;
        await upsertSubscription({
          userId,
          stripeSubscriptionId: stripeSub.id,
          plan:                 "free",
          status:               "canceled",
          cancelAtPeriodEnd:    false,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        if (customerId) {
          await updateSubscriptionByCustomerId(customerId, { status: "past_due" });
        }
        break;
      }

      case "invoice.paid": {
        // Restore active status after a previously failed payment recovers
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        if (customerId) {
          await updateSubscriptionByCustomerId(customerId, { status: "active" });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
