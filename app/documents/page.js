"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";

const STATUS = {
  LOADING: "loading",
  DENIED: "denied",
  ALLOWED: "allowed",
  ERROR: "error",
};

export default function DocumentsPage() {
  const [status, setStatus] = useState(STATUS.LOADING);
  const [persons, setPersons] = useState([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const accessRes = await fetch("/api/documents/access");
        const accessData = await accessRes.json();

        if (!accessRes.ok) {
          if (active) setStatus(STATUS.ERROR);
          return;
        }

        if (!accessData.allowed) {
          if (active) setStatus(STATUS.DENIED);
          return;
        }

        const personsRes = await fetch("/api/persons");
        const personsData = await personsRes.json();

        if (!personsRes.ok) {
          if (active) setStatus(STATUS.ERROR);
          return;
        }

        if (active) {
          setPersons(personsData.persons || []);
          setStatus(STATUS.ALLOWED);
        }
      } catch (err) {
        if (active) setStatus(STATUS.ERROR);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-3xl font-semibold text-navy">Access Document</h1>
        <p className="mt-2 text-slate-500">Select a person to view their documents.</p>

        {status === STATUS.LOADING && (
          <p className="mt-10 text-sm text-slate-400">Checking your access...</p>
        )}

        {status === STATUS.ERROR && (
          <p className="mt-10 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            Something went wrong while checking your access. Please try again.
          </p>
        )}

        {status === STATUS.DENIED && (
          <div className="mt-10 card-shell flex flex-col items-center gap-3 px-8 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 1 1 8 0v3" />
              </svg>
            </div>
            <h2 className="font-display text-xl font-semibold text-navy">
              You don&apos;t have permission to access document
            </h2>
            <p className="max-w-md text-sm text-slate-500">
              Your account doesn&apos;t currently have document access. Please contact an
              administrator if you believe this is a mistake.
            </p>
          </div>
        )}

        {status === STATUS.ALLOWED && (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {persons.map((person) => (
              <Link
                key={person.id}
                href={`/documents/${person.id}`}
                className="group card-shell flex flex-col items-center gap-3 border border-transparent p-6 text-center transition hover:-translate-y-0.5 hover:border-teal/40"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy font-display text-xl font-semibold text-teal transition group-hover:bg-teal group-hover:text-white">
                  {person.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-navy">
                    {person.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {person.document_count}{" "}
                    {person.document_count === 1 ? "document" : "documents"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
