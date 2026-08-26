"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthIllustration from "@/components/AuthIllustration";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSuccess("Account created! Redirecting to log in...");
      setTimeout(() => router.push("/"), 1200);
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
            RudraDev.
          </span>
          <AuthIllustration variant="signup" />
        </div>

        <div className="w-full px-8 py-10 md:w-3/5 md:px-12">
          <h1 className="font-display text-3xl font-semibold text-navy">Sign up</h1>
          <p className="mt-1 text-sm text-slate-500">Create an account to get started.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-navy">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                placeholder="Rudra Dev"
                className="input-field"
                value={form.fullName}
                onChange={update("fullName")}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="rudradev@gmail.com"
                className="input-field"
                value={form.email}
                onChange={update("email")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-navy">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••"
                  className="input-field"
                  value={form.password}
                  onChange={update("password")}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-navy">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••"
                  className="input-field"
                  value={form.confirmPassword}
                  onChange={update("confirmPassword")}
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            {success && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
                {success}
              </p>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
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
