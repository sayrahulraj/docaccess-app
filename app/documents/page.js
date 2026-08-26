"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";

const STATUS = {
  LOADING: "loading",
  READY: "ready",
  ERROR: "error",
};

export default function DocumentsPage() {
  const [status, setStatus] = useState(STATUS.LOADING);
  const [persons, setPersons] = useState([]);
  const [scope, setScope] = useState("own");

  const [showAddModal, setShowAddModal] = useState(false);
  const [personName, setPersonName] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/persons");
        const data = await res.json();
        if (!res.ok) {
          if (active) setStatus(STATUS.ERROR);
          return;
        }
        if (active) {
          setPersons(data.persons || []);
          setScope(data.scope || "own");
          setStatus(STATUS.READY);
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

  async function handleAddPerson(e) {
    e.preventDefault();
    setAddError("");

    if (!personName.trim()) {
      setAddError("Please enter a name.");
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: personName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Could not add person.");
        return;
      }
      setPersons((list) => [data.person, ...list]);
      setPersonName("");
      setShowAddModal(false);
    } catch (err) {
      setAddError("Could not reach the server. Please try again.");
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-navy">
              Access Document
            </h1>
            <p className="mt-2 text-slate-500">
              {status === STATUS.READY && scope === "all"
                ? "You can view documents added by everyone."
                : "You can view documents you've added yourself."}
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary w-auto px-5">
            + Add Person
          </button>
        </div>

        {status === STATUS.LOADING && (
          <p className="mt-10 text-sm text-slate-400">Loading...</p>
        )}

        {status === STATUS.ERROR && (
          <p className="mt-10 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            Something went wrong. Please try again.
          </p>
        )}

        {status === STATUS.READY && persons.length === 0 && (
          <div className="mt-10 card-shell flex flex-col items-center gap-2 px-8 py-14 text-center">
            <h3 className="font-display text-lg font-semibold text-navy">
              No one added yet
            </h3>
            <p className="text-sm text-slate-500">
              Click <span className="font-medium text-navy">+ Add Person</span> to create
              your first one.
            </p>
          </div>
        )}

        {status === STATUS.READY && persons.length > 0 && (
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
                  {!person.is_owner && person.owner_name && (
                    <p className="mt-1 text-[11px] font-medium text-teal">
                      Added by {person.owner_name}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showAddModal && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-navy/60 p-6"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="card-shell w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold text-navy">Add Person</h3>
            <p className="mt-1 text-sm text-slate-500">
              You&apos;ll always be able to manage this person&apos;s documents.
            </p>

            <form onSubmit={handleAddPerson} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Raj"
                  className="input-field"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  autoFocus
                />
              </div>

              {addError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {addError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={addLoading}>
                  {addLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
