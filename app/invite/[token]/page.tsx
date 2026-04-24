"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface InviteData {
  email: string;
  role: string;
  workspace_id: string;
  workspaces: { name: string };
}

export default function AcceptInvitePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "accepting" | "done" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`/api/workspaces/invite/${params.token}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setErrorMsg(json.error); setStatus("error"); }
        else { setInvite(json.invite); setStatus("ready"); }
      })
      .catch(() => { setErrorMsg("Network error. Please try again."); setStatus("error"); });
  }, [params.token]);

  async function handleAccept() {
    setStatus("accepting");
    const res = await fetch(`/api/workspaces/invite/${params.token}`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        // Not signed in — redirect to auth with return URL
        router.push(`/auth?next=/invite/${params.token}`);
        return;
      }
      setErrorMsg(json.error ?? "Failed to accept invite");
      setStatus("error");
    } else {
      setStatus("done");
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#050508", color: "#e2e8f0" }}>
      {/* Logo */}
      <div className="mb-10 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M2 7h3M7 2v3M7 9v3M9 7h3M4.5 4.5l1.5 1.5M8 8l1.5 1.5M9.5 4.5L8 6M4.5 9.5L6 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </div>
        <span className="font-semibold text-lg">Operant <span style={{ background: "linear-gradient(90deg,#7c3aed,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span></span>
      </div>

      <div className="w-full max-w-sm rounded-2xl p-8" style={{ background: "#0d0d12", border: "1px solid #1a1a2e" }}>
        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-8">
            <span className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#7c3aed", borderTopColor: "transparent" }} />
            <span className="text-sm" style={{ color: "#475569" }}>Checking invite...</span>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <span className="text-2xl">✕</span>
            </div>
            <h2 className="font-semibold mb-2" style={{ color: "#f87171" }}>Invite invalid</h2>
            <p className="text-sm mb-6" style={{ color: "#64748b" }}>{errorMsg}</p>
            <Link href="/" className="text-sm" style={{ color: "#7c3aed" }}>Go to homepage →</Link>
          </div>
        )}

        {(status === "ready" || status === "accepting") && invite && (
          <div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-1">You&apos;re invited</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>
                Join <strong style={{ color: "#e2e8f0" }}>{invite.workspaces.name}</strong> as{" "}
                <span style={{ color: "#a78bfa" }}>{invite.role}</span>
              </p>
            </div>

            <div className="rounded-xl p-3 mb-6" style={{ background: "#050508", border: "1px solid #1a1a2e" }}>
              <p className="text-xs" style={{ color: "#64748b" }}>
                Invite for <span style={{ color: "#94a3b8" }}>{invite.email}</span>
              </p>
            </div>

            <button
              onClick={handleAccept}
              disabled={status === "accepting"}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "#fff", boxShadow: "0 0 20px rgba(124,58,237,0.25)" }}
            >
              {status === "accepting" ? "Joining..." : "Accept invitation"}
            </button>

            <p className="text-xs text-center mt-4" style={{ color: "#334155" }}>
              Don&apos;t have an account?{" "}
              <Link href={`/auth?next=/invite/${params.token}`} style={{ color: "#7c3aed" }}>Sign up free</Link>
            </p>
          </div>
        )}

        {status === "done" && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="font-semibold mb-1" style={{ color: "#22c55e" }}>You&apos;re in!</h2>
            <p className="text-sm" style={{ color: "#64748b" }}>Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
