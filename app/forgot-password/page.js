"use client";

import { useState } from "react";
import Link from "next/link";
import AuthIllustration from "@/components/AuthIllustration";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setMessage(data.message);
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch (err) {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="card-shell flex w-full max-w-3xl flex-col md:flex-row">
        <div className="flex w-full flex-col items-center justify-center gap-6 bg-navy px-8 py-14 md:w-2/5">
          <span className="self-start font-display text-lg font-semibold tracking-wide text-white">
            Rudra Dev.
          </span>
          <AuthIllustration variant="login" />
        </div>

        <div className="w-full px-8 py-12 md:w-3/5 md:px-12">
          <h1 className="font-display text-3xl font-semibold text-navy">
            Forgot password
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your account email and we&apos;ll generate a reset link.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="hello@reallygreatsite.com"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            {message && (
              <div className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                <p>{message}</p>
                {resetUrl && (
                  <Link href={resetUrl} className="mt-2 inline-block font-medium underline">
                    Continue to reset password
                  </Link>
                )}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Generating link..." : "Send reset link"}
            </button>

            <p className="text-center text-sm text-slate-500">
              Remembered your password?{" "}
              <Link href="/" className="link-teal">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
