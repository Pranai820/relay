"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import AuthBackground from "@/app/components/AuthBackground";
import AuthCardHeader from "@/app/components/AuthCardHeader";
import Link from "next/link";
import { KeyRound, Loader2, LogIn } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Invalid email or password.");
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
          <h2 className="auth-heading">Welcome back</h2>
          <p className="auth-lead">Sign in to your connected work hub.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-input-wrap">
              <label className="auth-label" htmlFor="email">Email</label>
              <input
                id="email"
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
              <label className="auth-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                autoComplete="current-password"
                required
              />
            </div>

            {error && <p className="auth-error"><KeyRound size={14} /> {error}</p>}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
              Sign in
            </button>
          </form>

          <p className="auth-footer-link">
            Don&apos;t have an account? <Link href="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
