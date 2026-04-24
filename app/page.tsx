import Link from "next/link";

const FEATURES = [
  {
    icon: "⚡",
    title: "Goal-driven automation",
    body: "Describe what you want in plain language. Operant interprets intent, plans steps, selects tools, and executes — no configuration required.",
  },
  {
    icon: "🔁",
    title: "Self-healing workflows",
    body: "When a step fails, the Reflection engine diagnoses the cause, patches the workflow, and retries automatically — up to twice per run.",
  },
  {
    icon: "🧠",
    title: "Learns over time",
    body: "Every failure pattern is stored in long-term memory. The agent applies past fixes to future runs without being told.",
  },
  {
    icon: "🔌",
    title: "9 integrations out of the box",
    body: "Notion, Gmail, Slack, Stripe, HubSpot, Airtable, Google Sheets, Google Calendar, Resend — connect once, use everywhere.",
  },
  {
    icon: "📤",
    title: "Export to any platform",
    body: "Every workflow can be exported as n8n JSON, Make.com scenario, or Zapier Zap — so you own your automations.",
  },
  {
    icon: "🔒",
    title: "Fully isolated per account",
    body: "Your workflows, API keys, and memory are scoped to your account with row-level security. No shared data.",
  },
];

const STEPS = [
  { n: "01", title: "Connect your tools", body: "Add your API keys once in the Settings panel. They're stored encrypted to your account — never shared, never exposed." },
  { n: "02", title: "Describe your goal", body: "Type what you want to automate in plain English. The agent interprets intent, plans steps, selects tools, and builds the workflow." },
  { n: "03", title: "Watch it execute", body: "The agent runs each step, observes results, reflects on failures, and self-heals — all in real time with a live timeline view." },
];

const INTEGRATIONS = [
  { name: "Notion", icon: "📝", color: "rgba(255,255,255,0.06)" },
  { name: "Gmail", icon: "📧", color: "rgba(234,67,53,0.08)" },
  { name: "Slack", icon: "💬", color: "rgba(74,21,75,0.1)" },
  { name: "Stripe", icon: "💳", color: "rgba(99,91,255,0.08)" },
  { name: "HubSpot", icon: "🔶", color: "rgba(255,122,0,0.08)" },
  { name: "Airtable", icon: "🗃️", color: "rgba(255,184,0,0.08)" },
  { name: "Google Sheets", icon: "📊", color: "rgba(52,168,83,0.08)" },
  { name: "Google Calendar", icon: "📅", color: "rgba(26,115,232,0.08)" },
  { name: "Resend", icon: "✉️", color: "rgba(255,255,255,0.06)" },
];

const USE_CASES = [
  {
    label: "Sales ops",
    prompt: "Every time a new Stripe payment comes in over $500, create a HubSpot deal, log it in Airtable, and send a Slack alert to #sales.",
  },
  {
    label: "Content ops",
    prompt: "Pull all blog post ideas from our Notion database, draft a weekly digest email, and send it to the list via Resend every Monday at 9am.",
  },
  {
    label: "Finance ops",
    prompt: "Fetch all Stripe charges from this month, group them by customer, and export a summary into Google Sheets.",
  },
  {
    label: "HR & onboarding",
    prompt: "When a new contact appears in HubSpot with tag 'new-hire', send them a welcome email via Resend and add a row to our onboarding Airtable base.",
  },
];

const PERSONAS = [
  {
    tag: "For automation specialists",
    icon: "🛠️",
    title: "Build 10× faster with an AI co-pilot",
    points: [
      "Describe the workflow — Operant drafts it instantly",
      "Iterate in plain language, not visual drag-and-drop",
      "Export to n8n, Make.com, or Zapier when you're done",
      "Handle client requests in minutes, not days",
    ],
  },
  {
    tag: "For businesses without a specialist",
    icon: "🏢",
    title: "Run your entire ops layer autonomously",
    points: [
      "No Zapier expertise or developer needed",
      "Connect your tools once — the AI does the rest",
      "Workflows self-heal when APIs change or steps fail",
      "The agent learns your business rules over time",
    ],
  },
];

const STATS = [
  { value: "9", label: "native integrations" },
  { value: "< 2 min", label: "to first automation" },
  { value: "10×", label: "faster than manual setup" },
  { value: "0", label: "config files required" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#050508", color: "#e2e8f0" }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            <span style={{ fontSize: 14 }}>⚡</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>Operant AI</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: "#475569" }}>
          <a href="#how-it-works" className="hover:text-slate-300 transition-colors">How it works</a>
          <a href="#integrations" className="hover:text-slate-300 transition-colors">Integrations</a>
          <Link href="/pricing" className="hover:text-slate-300 transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="text-sm px-4 py-1.5 rounded-lg transition-all"
            style={{ color: "#94a3b8" }}
          >
            Sign in
          </Link>
          <Link
            href="/auth?mode=signup"
            className="text-sm px-4 py-2 rounded-lg font-medium transition-all"
            style={{ background: "rgba(124,58,237,0.85)", color: "#fff", border: "1px solid rgba(124,58,237,0.4)" }}
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-16 max-w-4xl mx-auto">
        <div
          className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-8"
          style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa" }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#7c3aed" }} />
          Autonomous Operations Agent
        </div>

        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6" style={{ color: "#f1f5f9" }}>
          The AI that runs your{" "}
          <span style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            entire operations layer
          </span>
        </h1>

        <p className="text-lg mb-4 max-w-2xl mx-auto leading-relaxed" style={{ color: "#94a3b8" }}>
          Operant AI is an automation agent that builds, runs, and self-heals your business workflows.
          Describe your goal in plain English — Operant plans the steps, executes across your tools, and fixes itself when things go wrong.
        </p>
        <p className="text-sm mb-10 max-w-xl mx-auto" style={{ color: "#475569" }}>
          No drag-and-drop. No YAML. No Zapier expertise required.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/auth?mode=signup"
            className="px-8 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)", color: "#fff", boxShadow: "0 0 32px rgba(124,58,237,0.35)" }}
          >
            Start automating free
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid #1a1a2e" }}
          >
            See pricing
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 pb-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-5 text-center"
              style={{ background: "#0d0d12", border: "1px solid #1a1a2e" }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: "#a78bfa" }}>{s.value}</div>
              <div className="text-xs" style={{ color: "#475569" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div
          className="rounded-2xl p-8 md:p-10"
          style={{ background: "#0d0d12", border: "1px solid #1a1a2e" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#334155" }}>The problem</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: "#f1f5f9" }}>
            Automation tools are built for developers.<br />
            <span style={{ color: "#64748b" }}>Your business isn't.</span>
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "#64748b" }}>
            Zapier, Make.com, and n8n are powerful — but they require you to know exactly which triggers, actions, and filters to wire together.
            That knowledge takes months to build. Most businesses either hire a specialist or give up entirely.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
            Operant AI removes that barrier. Instead of building workflows step-by-step, you describe the outcome. The agent figures out the rest —
            and keeps it running, even when APIs break, rate limits hit, or data formats change.
          </p>
        </div>
      </section>

      {/* Who it's for */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest mb-10 text-center" style={{ color: "#334155" }}>
          Who it's for
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PERSONAS.map((p) => (
            <div
              key={p.tag}
              className="rounded-2xl p-6"
              style={{ background: "#0d0d12", border: "1px solid #1a1a2e" }}
            >
              <div
                className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full mb-4"
                style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa" }}
              >
                <span>{p.icon}</span>
                {p.tag}
              </div>
              <h3 className="text-base font-semibold mb-4" style={{ color: "#e2e8f0" }}>{p.title}</h3>
              <ul className="space-y-2.5">
                {p.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm" style={{ color: "#64748b" }}>
                    <span className="mt-0.5 text-xs" style={{ color: "#7c3aed" }}>✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "#334155" }}>
          What you can automate
        </p>
        <p className="text-sm text-center mb-10" style={{ color: "#475569" }}>
          These are real prompts you can type into Operant right now.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {USE_CASES.map((u) => (
            <div
              key={u.label}
              className="rounded-2xl p-5"
              style={{ background: "#0d0d12", border: "1px solid #1a1a2e" }}
            >
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-md mb-3 inline-block"
                style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa" }}
              >
                {u.label}
              </span>
              <p className="text-sm leading-relaxed" style={{ color: "#64748b", fontStyle: "italic" }}>
                &ldquo;{u.prompt}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-16 max-w-4xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest mb-10 text-center" style={{ color: "#334155" }}>
          How it works
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl p-6"
              style={{ background: "#0d0d12", border: "1px solid #1a1a2e" }}
            >
              <span className="text-xs font-bold mb-3 block" style={{ color: "#7c3aed" }}>{s.n}</span>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "#e2e8f0" }}>{s.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "#475569" }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest mb-10 text-center" style={{ color: "#334155" }}>
          Built different
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-5"
              style={{ background: "#0d0d12", border: "1px solid #1a1a2e" }}
            >
              <span className="text-xl mb-3 block">{f.icon}</span>
              <h3 className="text-sm font-semibold mb-1.5" style={{ color: "#e2e8f0" }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "#475569" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="px-6 py-16 max-w-4xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "#334155" }}>
          Integrations
        </p>
        <p className="text-sm text-center mb-10" style={{ color: "#475569" }}>
          Connect your stack once. Operant handles the rest.
        </p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {INTEGRATIONS.map((i) => (
            <div
              key={i.name}
              className="rounded-xl p-4 flex flex-col items-center gap-2"
              style={{ background: i.color, border: "1px solid #1a1a2e" }}
            >
              <span className="text-2xl">{i.icon}</span>
              <span className="text-xs font-medium text-center" style={{ color: "#64748b" }}>{i.name}</span>
            </div>
          ))}
          <div
            className="rounded-xl p-4 flex flex-col items-center gap-2"
            style={{ background: "rgba(124,58,237,0.05)", border: "1px dashed rgba(124,58,237,0.2)" }}
          >
            <span className="text-2xl">➕</span>
            <span className="text-xs font-medium text-center" style={{ color: "#7c3aed" }}>More coming</span>
          </div>
        </div>
      </section>

      {/* Export */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div
          className="rounded-2xl p-8 md:p-10"
          style={{ background: "#0d0d12", border: "1px solid #1a1a2e" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#334155" }}>You own your workflows</p>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#f1f5f9" }}>
            Export to n8n, Make.com, or Zapier
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#64748b" }}>
            Operant isn't a lock-in platform. Every workflow you build can be exported as a native JSON file for n8n or a Make.com scenario —
            so you can hand it to a client, run it self-hosted, or migrate it later without losing your work.
          </p>
          <div className="flex flex-wrap gap-3">
            {["n8n JSON", "Make.com scenario", "Zapier Zap (coming soon)"].map((platform) => (
              <span
                key={platform}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa" }}
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center max-w-2xl mx-auto">
        <div
          className="rounded-2xl p-10"
          style={{ background: "#0d0d12", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#f1f5f9" }}>
            Ready to automate everything?
          </h2>
          <p className="text-sm mb-2" style={{ color: "#475569" }}>
            Create your account and connect your first integration in under 2 minutes.
          </p>
          <p className="text-xs mb-8" style={{ color: "#334155" }}>
            Free plan available. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth?mode=signup"
              className="inline-block px-8 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)", color: "#fff", boxShadow: "0 0 32px rgba(124,58,237,0.3)" }}
            >
              Create free account
            </Link>
            <Link
              href="/pricing"
              className="inline-block px-8 py-3 rounded-xl text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid #1a1a2e" }}
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10" style={{ borderTop: "1px solid #1a1a2e" }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
            >
              <span style={{ fontSize: 12 }}>⚡</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: "#334155" }}>Operant AI</span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: "#1e293b" }}>
            <Link href="/pricing" className="hover:text-slate-500 transition-colors">Pricing</Link>
            <Link href="/auth" className="hover:text-slate-500 transition-colors">Sign in</Link>
            <Link href="/auth?mode=signup" className="hover:text-slate-500 transition-colors">Sign up</Link>
          </div>
          <p className="text-xs" style={{ color: "#1e293b" }}>
            © 2026 Operant AI
          </p>
        </div>
      </footer>
    </div>
  );
}
