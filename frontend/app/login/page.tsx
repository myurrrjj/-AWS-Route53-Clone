"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/Button";
import { useFlash } from "@/components/FlashProvider";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login, register, user, loading } = useAuth();
  const { push } = useFlash();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password123");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/hosted-zones");
  }, [loading, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      push("error", "Sign-in failed", message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-aws-bg">
      <div className="flex h-12 items-center bg-aws-navy px-6">
        <span className="text-lg font-bold text-white">aws</span>
      </div>
      <div className="mx-auto mt-12 w-full max-w-md rounded-sm border border-aws-border bg-white p-8 shadow-card">
        <h1 className="text-center text-2xl font-bold text-aws-text">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-center text-sm text-aws-muted">
          Route 53 Management Console
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="aws-focus w-full rounded-sm border border-aws-steel px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="aws-focus w-full rounded-sm border border-aws-steel px-3 py-2 text-sm"
            />
          </Field>
          <Button type="submit" variant="primary" disabled={busy} className="w-full justify-center py-2">
            {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === "signin" ? (
            <button
              onClick={() => setMode("register")}
              className="text-aws-link hover:underline"
            >
              Create a new account
            </button>
          ) : (
            <button
              onClick={() => setMode("signin")}
              className="text-aws-link hover:underline"
            >
              Back to sign in
            </button>
          )}
        </div>

        <div className="mt-6 rounded-sm border border-dashed border-aws-border bg-aws-bg p-3 text-xs text-aws-muted">
          Demo credentials &mdash; email <span className="font-bold">demo@example.com</span>, password{" "}
          <span className="font-bold">password123</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-aws-text">{label}</span>
      {children}
    </label>
  );
}
