"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import AuthBackground from "@/app/components/AuthBackground";
import AuthCardHeader from "@/app/components/AuthCardHeader";
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
    <main className="auth-page">
      <AuthBackground />
      <div className="auth-card">
        <AuthCardHeader />
        <div className="auth-card-body">
          <h2 className="auth-heading">Create your account</h2>
          <p className="auth-lead">GitHub, Notion, Gmail, and Calendar in one place.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <span className="auth-hint">At least 8 characters with an uppercase letter, a lowercase letter, a number, and a symbol.</span>
            </div>

            {error && <p className="auth-error"><ShieldCheck size={14} /> {error}</p>}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : <UserPlus size={18} />}
              Create account
            </button>
          </form>

          <p className="auth-footer-link">
            Already have an account? <Link href="/signin">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
