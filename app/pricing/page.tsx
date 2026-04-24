"use client";

import Link from "next/link";

const TIERS = [
  {
    name: "Starter",
    price: "Free",
    priceNote: "forever",
    priceId: null,
    description: "Perfect for trying FlowMind AI and running simple automations.",
    highlight: false,
    features: [
      "50 agent runs / month",
      "3 saved workflows",
      "All integrations (13+)",
      "Workflow export (n8n, Make, Zapier)",
      "Community support",
    ],
    cta: "Get started free",
    ctaHref: "/auth",
  },
  {
    name: "Pro",
    price: "$49",
    priceNote: "/ month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    description: "For automation specialists running workflows every day.",
    highlight: true,
    features: [
      "500 agent runs / month",
      "Unlimited saved workflows",
      "Workflow scheduling & triggers",
      "Priority agent execution",
      "Run history (90 days)",
      "Email support",
    ],
    cta: "Start Pro",
    ctaHref: "/billing?upgrade=pro",
  },
  {
    name: "Business",
    price: "$149",
    priceNote: "/ month",
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
    description: "For teams that run their entire operations layer on FlowMind AI.",
    highlight: false,
    features: [
      "Unlimited agent runs",
      "Unlimited saved workflows",
      "Team workspaces (up to 10 members)",
      "Role-based access (Owner / Editor / Viewer)",
      "Shared workflow library",
      "Priority support + onboarding call",
    ],
    cta: "Start Business",
    ctaHref: "/billing?upgrade=business",
  },
];

const FAQ = [
  { q: "What counts as an agent run?", a: "Each message you send to FlowMind AI that triggers the agent (tool calls, workflow execution) counts as one run. Conversational replies do not count." },
  { q: "Can I upgrade or downgrade anytime?", a: "Yes. Upgrades take effect immediately; downgrades apply at the end of your billing period. You keep Pro features until then." },
  { q: "Is there a free trial for Pro?", a: "The Starter plan is always free with no time limit. We don't offer a Pro trial currently, but you can cancel anytime within the first billing period for a full refund." },
  { q: "What happens if I hit my run limit?", a: "The agent will notify you that your monthly limit has been reached and prompt you to upgrade. No charges are made automatically." },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#050508", color: "#e2e8f0" }}>
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#1a1a2e" }}>
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)", boxShadow: "0 0 12px rgba(124,58,237,0.4)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h3M7 2v3M7 9v3M9 7h3M4.5 4.5l1.5 1.5M8 8l1.5 1.5M9.5 4.5L8 6M4.5 9.5L6 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-semibold text-[15px]">FlowMind <span style={{ background: "linear-gradient(90deg,#7c3aed,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm" style={{ color: "#64748b" }}>Dashboard</Link>
          <Link href="/auth" className="text-sm px-4 py-2 rounded-lg font-medium" style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "#fff" }}>Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <div className="text-center px-6 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-6" style={{ background: "rgba(124,58,237,0.1)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}>
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Pay for what you{" "}
          <span style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            actually use
          </span>
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "#64748b" }}>
          Start free. Upgrade when your workflows outgrow it.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className="rounded-2xl p-6 flex flex-col relative"
              style={{
                background: tier.highlight ? "rgba(124,58,237,0.08)" : "#0d0d12",
                border: tier.highlight ? "1px solid rgba(124,58,237,0.4)" : "1px solid #1a1a2e",
                boxShadow: tier.highlight ? "0 0 40px rgba(124,58,237,0.1)" : "none",
              }}
            >
              {tier.highlight && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] px-3 py-1 rounded-full font-semibold"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff" }}
                >
                  Most popular
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm font-semibold mb-1" style={{ color: "#94a3b8" }}>{tier.name}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold" style={{ color: "#e2e8f0" }}>{tier.price}</span>
                  <span className="text-sm" style={{ color: "#475569" }}>{tier.priceNote}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{tier.description}</p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "#94a3b8" }}>
                    <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="rgba(124,58,237,0.2)" />
                      <path d="M4.5 7l1.5 1.5 3-3" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.ctaHref}
                className="block text-center py-3 rounded-xl text-sm font-semibold transition-all"
                style={
                  tier.highlight
                    ? { background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "#fff", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }
                    : { background: "#1a1a2e", color: "#94a3b8", border: "1px solid #1a1a2e" }
                }
                onMouseEnter={(e) => { if (!tier.highlight) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.3)"; (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; } }}
                onMouseLeave={(e) => { if (!tier.highlight) { (e.currentTarget as HTMLElement).style.borderColor = "#1a1a2e"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; } }}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Feature comparison note */}
        <p className="text-center text-sm mt-10" style={{ color: "#334155" }}>
          All plans include access to 13+ integrations, Slack, GitHub, Notion, Stripe, Google Workspace, and more.
        </p>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "#e2e8f0" }}>Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-xl p-5" style={{ background: "#0d0d12", border: "1px solid #1a1a2e" }}>
              <p className="text-sm font-semibold mb-2" style={{ color: "#e2e8f0" }}>{q}</p>
              <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
