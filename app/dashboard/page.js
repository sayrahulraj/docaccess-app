"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";

export default function DashboardPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.user) setUser(data.user);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-3xl font-semibold text-navy">
          Welcome{user ? `, ${user.fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-slate-500">
          Choose what you&apos;d like to do from your dashboard.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/documents"
            className="group card-shell flex flex-col gap-4 border border-transparent p-6 transition hover:-translate-y-0.5 hover:border-teal/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-teal transition group-hover:bg-teal group-hover:text-white">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
                <path d="M14 3v5h5" />
                <path d="M9 13h6M9 17h4" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-navy">Access Document</h2>
              <p className="mt-1 text-sm text-slate-500">
                Browse people and view or download their shared documents.
              </p>
            </div>
          </Link>

          <Link
            href="/permissions"
            className="group card-shell flex flex-col gap-4 border border-transparent p-6 transition hover:-translate-y-0.5 hover:border-teal/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-teal transition group-hover:bg-teal group-hover:text-white">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-navy">Permissions</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage which accounts can access documents. Admin only.
              </p>
            </div>
          </Link>

          <div className="card-shell flex flex-col gap-4 border border-transparent p-6 opacity-60">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-navy">My Profile</h2>
              <p className="mt-1 text-sm text-slate-500">Coming soon.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
