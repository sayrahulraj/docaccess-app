"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";

const STATUS = {
  LOADING: "loading",
  READY: "ready",
  ERROR: "error",
};

const emptyPersonForm = { name: "" };

export default function DocumentsPage() {
  const [status, setStatus] = useState(STATUS.LOADING);
  const [persons, setPersons] = useState([]);
  const [scope, setScope] = useState("own");

  // Shared Add/Edit person modal state
  const [modalMode, setModalMode] = useState(null); // null | "add" | "edit"
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [personForm, setPersonForm] = useState(emptyPersonForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  function openAddModal() {
    setModalMode("add");
    setEditingPersonId(null);
    setPersonForm(emptyPersonForm);
    setFormError("");
  }

  function openEditModal(person) {
    setModalMode("edit");
    setEditingPersonId(person.id);
    setPersonForm({ name: person.name });
    setFormError("");
  }

  function closeModal() {
    setModalMode(null);
    setEditingPersonId(null);
    setPersonForm(emptyPersonForm);
    setFormError("");
  }

  async function handlePersonFormSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!personForm.name.trim()) {
      setFormError("Please enter a name.");
      return;
    }

    setSaving(true);
    try {
      if (modalMode === "add") {
        const res = await fetch("/api/persons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: personForm.name.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "Could not add person.");
          return;
        }
        setPersons((list) => [data.person, ...list]);
      } else {
        const res = await fetch(`/api/persons/${editingPersonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: personForm.name.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "Could not update person.");
          return;
        }
        setPersons((list) =>
          list.map((p) =>
            p.id === data.person.id ? { ...p, name: data.person.name } : p
          )
        );
      }
      closeModal();
    } catch (err) {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePerson(person) {
    const confirmed = window.confirm(
      `Delete "${person.name}" and all their documents? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(person.id);
    try {
      const res = await fetch(`/api/persons/${person.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not delete person.");
        return;
      }
      setPersons((list) => list.filter((p) => p.id !== person.id));
    } catch (err) {
      alert("Could not reach the server. Please try again.");
    } finally {
      setDeletingId(null);
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
          <button onClick={openAddModal} className="btn-primary w-auto px-5">
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
              <div
                key={person.id}
                className="group card-shell flex flex-col items-center gap-3 border border-transparent p-6 text-center transition hover:-translate-y-0.5 hover:border-teal/40"
              >
                <Link
                  href={`/documents/${person.id}`}
                  className="flex flex-col items-center gap-3"
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

                {person.is_owner && (
                  <div className="flex gap-4 pt-1">
                    <button
                      onClick={() => openEditModal(person)}
                      className="text-xs font-medium text-slate-400 hover:text-teal"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePerson(person)}
                      disabled={deletingId === person.id}
                      className="text-xs font-medium text-slate-400 hover:text-red-500 disabled:opacity-50"
                    >
                      {deletingId === person.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {modalMode && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-navy/60 p-6"
          onClick={closeModal}
        >
          <div
            className="card-shell w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold text-navy">
              {modalMode === "add" ? "Add Person" : "Edit Person"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {modalMode === "add"
                ? "You'll always be able to manage this person's documents."
                : "Update this person's name."}
            </p>

            <form onSubmit={handlePersonFormSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Raj"
                  className="input-field"
                  value={personForm.name}
                  onChange={(e) => setPersonForm({ name: e.target.value })}
                  autoFocus
                />
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
