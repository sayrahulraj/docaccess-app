"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TopNav() {
  const router = useRouter();
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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="font-display text-lg font-semibold text-navy">
          RudraDev<span className="text-teal">.</span>
        </Link>
        <div className="flex items-center gap-4">
          {user && (
            <span className="hidden text-sm text-slate-500 sm:inline">
              Hello, <span className="font-medium text-navy">{user.fullName}</span>
            </span>
          )}
          <button onClick={handleLogout} className="btn-secondary">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
