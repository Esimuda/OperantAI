import Link from "next/link";

const FEATURES = [
  {
    icon: "→",
    title: "Goal-driven automation",
    body: "Describe what you want in plain language. Operant interprets intent, plans steps, selects tools, and executes — no configuration required.",
  },
  {
    icon: "↺",
    title: "Self-healing workflows",
    body: "When a step fails, the Reflection engine diagnoses the cause, patches the workflow, and retries automatically — up to twice per run.",
  },
  {
    icon: "◎",
    title: "Learns over time",
    body: "Every failure pattern is stored in long-term memory. The agent applies past fixes to future runs without being told.",
  },
  {
    icon: "⊞",
    title: "15 integrations out of the box",
    body: "Notion, Gmail, Slack, Stripe, HubSpot, Airtable, Google Sheets, Calendar, Twilio, GitHub, Linear, Discord, Resend, Mailchimp, Meta.",
  },
  {
    icon: "↗",
    title: "Export to any platform",
    body: "Every workflow can be exported as n8n JSON, Make.com scenario, or Zapier guide — so you own your automations.",
  },
  {
    icon: "◻",
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
  "Notion", "Gmail", "Slack", "Stripe", "HubSpot",
  "Airtable", "Google Sheets", "Google Calendar",
  "Twilio", "GitHub", "Linear", "Discord", "Resend", "Mailchimp", "Meta",
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
  { value: "15", label: "native integrations" },
  { value: "< 2 min", label: "to first automation" },
  { value: "10×", label: "faster than manual setup" },
  { value: "0", label: "config files required" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h3M7 2v3M7 9v3M9 7h3M4.5 4.5l1.5 1.5M8 8l1.5 1.5M9.5 4.5L8 6M4.5 9.5L6 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-sm font-semibold">Operant <span style={{ color: "var(--accent)" }}>AI</span></span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: "var(--foreground-3)" }}>
          <a href="#how-it-works" className="transition-colors hover:text-[var(--foreground-2)]">How it works</a>
          <a href="#integrations" className="transition-colors hover:text-[var(--foreground-2)]">Integrations</a>
          <Link href="/pricing" className="transition-colors hover:text-[var(--foreground-2)]">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="text-sm px-4 py-1.5 rounded-lg transition-all"
            style={{ color: "var(--foreground-2)" }}
          >
            Sign in
          </Link>
          <Link
            href="/auth?mode=signup"
            className="text-sm px-4 py-2 rounded-lg font-semibold transition-all"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-24 pb-16 max-w-4xl mx-auto">
        <div
          className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-8 font-medium"
          style={{ background: "var(--accent-glow)", border: "1px solid rgba(218,119,86,0.3)", color: "var(--accent)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
          Autonomous Operations Agent
        </div>

        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6" style={{ color: "var(--foreground)" }}>
          The AI that runs your{" "}
          <span style={{ color: "var(--accent)" }}>entire operations layer</span>
        </h1>

        <p className="text-lg mb-4 max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--foreground-2)" }}>
          Operant AI is an automation agent that builds, runs, and self-heals your business workflows.
          Describe your goal in plain English — Operant plans the steps, executes across your tools, and fixes itself when things go wrong.
        </p>
        <p className="text-sm mb-10 max-w-xl mx-auto" style={{ color: "var(--foreground-3)" }}>
          No drag-and-drop. No YAML. No Zapier expertise required.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/auth?mode=signup"
            className="px-8 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Start automating free
          </Link>
          <Link
            href="/demo"
            className="px-8 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: "var(--surface)", color: "var(--foreground-2)", border: "1px solid var(--border)" }}
          >
            Watch the demo →
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
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: "var(--accent)" }}>{s.value}</div>
              <div className="text-xs" style={{ color: "var(--foreground-3)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div
          className="rounded-2xl p-8 md:p-10"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--foreground-3)" }}>The problem</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Automation tools are built for developers.<br />
            <span style={{ color: "var(--foreground-2)" }}>Your business isn&apos;t.</span>
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--foreground-2)" }}>
            Zapier, Make.com, and n8n are powerful — but they require you to know exactly which triggers, actions, and filters to wire together.
            That knowledge takes months to build. Most businesses either hire a specialist or give up entirely.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-2)" }}>
            Operant AI removes that barrier. Describe the outcome — the agent figures out the rest,
            and keeps it running even when APIs break, rate limits hit, or data formats change.
          </p>
        </div>
      </section>

      {/* Who it's for */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest mb-10 text-center" style={{ color: "var(--foreground-3)" }}>
          Who it&apos;s for
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PERSONAS.map((p) => (
            <div
              key={p.tag}
              className="rounded-2xl p-6"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div
                className="inline-flex items-center text-xs px-2.5 py-1 rounded-full mb-4 font-medium"
                style={{ background: "var(--accent-glow)", border: "1px solid rgba(218,119,86,0.25)", color: "var(--accent)" }}
              >
                {p.tag}
              </div>
              <h3 className="text-base font-semibold mb-4">{p.title}</h3>
              <ul className="space-y-2.5">
                {p.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--foreground-2)" }}>
                    <span className="mt-0.5 flex-shrink-0" style={{ color: "var(--accent)" }}>✓</span>
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
        <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "var(--foreground-3)" }}>
          What you can automate
        </p>
        <p className="text-sm text-center mb-10" style={{ color: "var(--foreground-2)" }}>
          These are real prompts you can type into Operant right now.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {USE_CASES.map((u) => (
            <div
              key={u.label}
              className="rounded-2xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-lg mb-3 inline-block"
                style={{ background: "var(--accent-glow)", color: "var(--accent)" }}
              >
                {u.label}
              </span>
              <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-2)", fontStyle: "italic" }}>
                &ldquo;{u.prompt}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-16 max-w-4xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest mb-10 text-center" style={{ color: "var(--foreground-3)" }}>
          How it works
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl p-6"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span className="text-xs font-bold mb-3 block" style={{ color: "var(--accent)" }}>{s.n}</span>
              <h3 className="text-sm font-semibold mb-2">{s.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-2)" }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest mb-10 text-center" style={{ color: "var(--foreground-3)" }}>
          Built different
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm mb-4 font-mono"
                style={{ background: "var(--accent-glow)", color: "var(--accent)", border: "1px solid rgba(218,119,86,0.2)" }}
              >
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-2)" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="px-6 py-16 max-w-4xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "var(--foreground-3)" }}>
          Integrations
        </p>
        <p className="text-sm text-center mb-10" style={{ color: "var(--foreground-2)" }}>
          Connect your stack once. Operant handles the rest.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {INTEGRATIONS.map((name) => (
            <div
              key={name}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground-2)" }}
            >
              {name}
            </div>
          ))}
          <div
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "var(--accent-glow)", border: "1px dashed rgba(218,119,86,0.3)", color: "var(--accent)" }}
          >
            + More coming
          </div>
        </div>
      </section>

      {/* Export */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div
          className="rounded-2xl p-8 md:p-10"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--foreground-3)" }}>You own your workflows</p>
          <h2 className="text-2xl font-bold mb-4">Export to n8n, Make.com, or Zapier</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--foreground-2)" }}>
            Operant isn&apos;t a lock-in platform. Every workflow you build can be exported as a native JSON file for n8n or a Make.com scenario —
            so you can hand it to a client, run it self-hosted, or migrate it later without losing your work.
          </p>
          <div className="flex flex-wrap gap-3">
            {["n8n JSON", "Make.com scenario", "Zapier guide (beta)"].map((platform) => (
              <span
                key={platform}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: "var(--accent-glow)", border: "1px solid rgba(218,119,86,0.25)", color: "var(--accent)" }}
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
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-2xl font-bold mb-3">Ready to automate everything?</h2>
          <p className="text-sm mb-2" style={{ color: "var(--foreground-2)" }}>
            Create your account and connect your first integration in under 2 minutes.
          </p>
          <p className="text-xs mb-8" style={{ color: "var(--foreground-3)" }}>
            Free plan available. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth?mode=signup"
              className="inline-block px-8 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Create free account
            </Link>
            <Link
              href="/demo"
              className="inline-block px-8 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: "var(--background)", color: "var(--foreground-2)", border: "1px solid var(--border)" }}
            >
              Watch the demo →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h3M7 2v3M7 9v3M9 7h3M4.5 4.5l1.5 1.5M8 8l1.5 1.5M9.5 4.5L8 6M4.5 9.5L6 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xs font-semibold" style={{ color: "var(--foreground-2)" }}>Operant AI</span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: "var(--foreground-3)" }}>
            <Link href="/demo" className="transition-colors hover:text-[var(--foreground-2)]">Demo</Link>
            <Link href="/pricing" className="transition-colors hover:text-[var(--foreground-2)]">Pricing</Link>
            <Link href="/auth" className="transition-colors hover:text-[var(--foreground-2)]">Sign in</Link>
            <Link href="/auth?mode=signup" className="transition-colors hover:text-[var(--foreground-2)]">Sign up</Link>
          </div>
          <p className="text-xs" style={{ color: "var(--foreground-3)" }}>© 2026 Operant AI</p>
        </div>
      </footer>
    </div>
  );
}
