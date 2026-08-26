"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";

const STATUS = {
  LOADING: "loading",
  DENIED: "denied",
  READY: "ready",
  ERROR: "error",
};

export default function PermissionsPage() {
  const [status, setStatus] = useState(STATUS.LOADING);
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedValue, setSelectedValue] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();

        if (res.status === 403) {
          if (active) setStatus(STATUS.DENIED);
          return;
        }
        if (!res.ok) {
          if (active) setStatus(STATUS.ERROR);
          return;
        }

        if (active) {
          setUsers(data.users || []);
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

  function openEditModal(user) {
    setEditingUser(user);
    setSelectedValue(user.can_access_documents);
    setSaveError("");
  }

  async function handleSave() {
    if (!editingUser) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canAccessDocuments: selectedValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Could not update permission.");
        return;
      }
      setUsers((list) =>
        list.map((u) => (u.id === data.user.id ? data.user : u))
      );
      setEditingUser(null);
    } catch (err) {
      setSaveError("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-3xl font-semibold text-navy">Permissions</h1>
        <p className="mt-2 text-slate-500">
          Control which accounts are allowed to access documents.
        </p>

        {status === STATUS.LOADING && (
          <p className="mt-10 text-sm text-slate-400">Checking your access...</p>
        )}

        {status === STATUS.ERROR && (
          <p className="mt-10 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            Something went wrong. Please try again.
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
              You don&apos;t have permission to access this page
            </h2>
            <p className="max-w-md text-sm text-slate-500">
              Only the administrator account can manage document access
              permissions.
            </p>
          </div>
        )}

        {status === STATUS.READY && (
          <div className="mt-8 card-shell overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Document Access</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-4 font-medium text-navy">{u.full_name}</td>
                    <td className="px-5 py-4 text-slate-500">{u.email}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          u.can_access_documents
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {u.can_access_documents ? "Allowed" : "Not allowed"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openEditModal(u)}
                        className="btn-secondary"
                      >
                        Edit Permission
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {editingUser && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-navy/60 p-6"
          onClick={() => setEditingUser(null)}
        >
          <div
            className="card-shell w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold text-navy">
              Edit Permission
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {editingUser.full_name} ({editingUser.email})
            </p>

            <div className="mt-5 space-y-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 has-[:checked]:border-teal has-[:checked]:bg-teal/5">
                <input
                  type="radio"
                  name="permission"
                  checked={selectedValue === true}
                  onChange={() => setSelectedValue(true)}
                  className="accent-teal"
                />
                <span className="text-sm font-medium text-navy">
                  Allowed — can access documents
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 has-[:checked]:border-teal has-[:checked]:bg-teal/5">
                <input
                  type="radio"
                  name="permission"
                  checked={selectedValue === false}
                  onChange={() => setSelectedValue(false)}
                  className="accent-teal"
                />
                <span className="text-sm font-medium text-navy">
                  Not allowed — no document access
                </span>
              </label>
            </div>

            {saveError && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {saveError}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary flex-1"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
