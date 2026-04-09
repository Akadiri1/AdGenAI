"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await signIn("email", { email, redirect: false, callbackUrl: "/dashboard" });
    setLoading(false);
    if (res?.error) setMessage("Could not send magic link. Try again.");
    else setMessage("Check your email for a magic link.");
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-secondary/30">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <Link href="/" className="mb-8 flex items-center justify-center">
          <Logo size="lg" />
        </Link>

        <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-xl">
          <h1 className="font-heading text-2xl font-bold text-text-primary text-center mb-2">
            Welcome back
          </h1>
          <p className="text-center text-text-secondary mb-6">Log in to create ads that sell</p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="mb-4 flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-black/10 bg-white text-sm font-semibold text-text-primary transition-all hover:bg-bg-secondary"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-black/10" />
            <span className="text-xs uppercase tracking-wider text-text-secondary">or</span>
            <div className="h-px flex-1 bg-black/10" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-primary">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-primary font-semibold text-white transition-all hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-xl bg-bg-secondary p-3 text-center text-sm text-text-primary">
              {message}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
