"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import AppLogo from "@/app/components/AppLogo";
import Link from "next/link";
import { Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { getPasswordError } from "@/lib/password";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const passwordError = getPasswordError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sign up failed.");

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        router.push("/signin");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <AppLogo className="auth-logo" />
          <div className="auth-brand-copy">
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">GitHub, Notion, Gmail, and Calendar in one place.</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="label">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span className="label">Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <span className="auth-hint">At least 8 characters with an uppercase letter, a lowercase letter, a number, and a symbol.</span>
          </label>

          {error && <p className="auth-error"><ShieldCheck size={14} /> {error}</p>}

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : <UserPlus size={16} />}
            Create account
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link href="/signin">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
