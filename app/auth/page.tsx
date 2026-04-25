"use client";

import { Suspense, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M6.5 6.7A2 2 0 0010 10M4.2 4.3C2.8 5.4 1.7 6.8 1 8c1.5 2.5 4 5 7 5a7 7 0 003.7-1M6.5 3.1A7 7 0 0115 8c-.5 1-1.3 2-2.2 2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M15.545 6.558a9.42 9.42 0 01.139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 118 0a7.689 7.689 0 015.352 2.082l-2.284 2.284A4.347 4.347 0 008 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 000 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 001.599-2.431H8v-3.08h7.545z" fill="currentColor" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" fill="currentColor" />
    </svg>
  );
}

const RATE_LIMIT_HINT = "Email rate limit reached. Use Google or GitHub to sign in instantly, or wait an hour and try again.";

function AuthForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "signup") setMode("signup");
  }, [searchParams]);

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const router   = useRouter();
  const supabase = createClient();

  const isRateLimit = error.toLowerCase().includes("rate limit") || error.toLowerCase().includes("email rate");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccessMsg("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
    }
    setLoading(false);
  }

  async function handleOAuth(provider: "google" | "github") {
    setError("");
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      {/* Left panel — branding (desktop only) */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h3M7 2v3M7 9v3M9 7h3M4.5 4.5l1.5 1.5M8 8l1.5 1.5M9.5 4.5L8 6M4.5 9.5L6 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-semibold text-base" style={{ color: "var(--foreground)" }}>
            Operant <span style={{ color: "var(--accent)" }}>AI</span>
          </span>
        </Link>

        <div>
          <h2 className="text-3xl font-bold leading-snug mb-4" style={{ color: "var(--foreground)" }}>
            Your AI operations agent,<br />ready when you are.
          </h2>
          <p className="text-sm leading-relaxed mb-10" style={{ color: "var(--foreground-2)" }}>
            Describe any business process in plain English. Operant AI builds it, runs it across 15 integrations, and learns from every run.
          </p>
          <div className="space-y-3">
            {[
              "No drag-and-drop. No YAML. No specialist required.",
              "15 integrations — Stripe, Notion, Gmail, Slack, and more.",
              "Self-healing workflows that fix themselves automatically.",
              "Export to n8n, Make.com, or Zapier anytime.",
            ].map((point) => (
              <div key={point} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--foreground-2)" }}>
                <span className="mt-0.5 flex-shrink-0" style={{ color: "var(--accent)" }}>✓</span>
                {point}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "var(--foreground-3)" }}>
          Powered by Claude Sonnet 4.6 · Built for the Anthropic Hackathon
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h3M7 2v3M7 9v3M9 7h3M4.5 4.5l1.5 1.5M8 8l1.5 1.5M9.5 4.5L8 6M4.5 9.5L6 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>Operant <span style={{ color: "var(--accent)" }}>AI</span></span>
          </Link>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--foreground-2)" }}>
            {mode === "signin" ? "Sign in to your Operant AI account." : "Start automating in under 2 minutes."}
          </p>

          {/* OAuth buttons */}
          <div className="space-y-2.5 mb-6">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-2.5 text-sm py-2.5 rounded-xl transition-all font-medium"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--foreground-2)",
                cursor: oauthLoading ? "not-allowed" : "pointer",
                opacity: oauthLoading && oauthLoading !== "google" ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { if (!oauthLoading) { e.currentTarget.style.borderColor = "rgba(218,119,86,0.4)"; e.currentTarget.style.color = "var(--foreground)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--foreground-2)"; }}
            >
              <GoogleIcon />
              {oauthLoading === "google" ? "Redirecting..." : "Continue with Google"}
            </button>

            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-2.5 text-sm py-2.5 rounded-xl transition-all font-medium"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--foreground-2)",
                cursor: oauthLoading ? "not-allowed" : "pointer",
                opacity: oauthLoading && oauthLoading !== "github" ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { if (!oauthLoading) { e.currentTarget.style.borderColor = "rgba(218,119,86,0.4)"; e.currentTarget.style.color = "var(--foreground)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--foreground-2)"; }}
            >
              <GitHubIcon />
              {oauthLoading === "github" ? "Redirecting..." : "Continue with GitHub"}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--foreground-3)" }}>or continue with email</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-2)" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none transition-all"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(218,119,86,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-2)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full text-sm px-3.5 py-2.5 pr-10 rounded-xl outline-none transition-all"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(218,119,86,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100 opacity-50"
                  style={{ color: "var(--foreground-2)" }}
                  tabIndex={-1}
                >
                  <EyeIcon show={showPw} />
                </button>
              </div>
            </div>

            {error && (
              <div
                className="text-xs px-3.5 py-2.5 rounded-xl space-y-1"
                style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <p>{error}</p>
                {isRateLimit && <p style={{ color: "#fca5a5" }}>{RATE_LIMIT_HINT}</p>}
              </div>
            )}

            {successMsg && (
              <p className="text-xs px-3.5 py-2.5 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
                {successMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-sm font-semibold py-2.5 rounded-xl transition-all"
              style={{
                background: loading ? "var(--surface-2)" : "var(--accent)",
                color: loading ? "var(--foreground-3)" : "#fff",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-xs text-center mt-6" style={{ color: "var(--foreground-3)" }}>
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setSuccessMsg(""); }}
              className="font-medium transition-colors"
              style={{ color: "var(--accent)" }}
            >
              {mode === "signin" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--background)", minHeight: "100vh" }} />}>
      <AuthForm />
    </Suspense>
  );
}
