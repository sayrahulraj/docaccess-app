"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";

const STATUS = {
  LOADING: "loading",
  DENIED: "denied",
  READY: "ready",
  NOT_FOUND: "not_found",
  ERROR: "error",
};

function isImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(url);
}

export default function PersonDocumentsPage() {
  const { personId } = useParams();
  const router = useRouter();

  const [status, setStatus] = useState(STATUS.LOADING);
  const [person, setPerson] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [viewDoc, setViewDoc] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", url: "" });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback(async () => {
    setStatus(STATUS.LOADING);
    try {
      const accessRes = await fetch("/api/documents/access");
      const accessData = await accessRes.json();
      if (!accessRes.ok) {
        setStatus(STATUS.ERROR);
        return;
      }
      if (!accessData.allowed) {
        setStatus(STATUS.DENIED);
        return;
      }

      const docsRes = await fetch(`/api/documents?personId=${personId}`);
      if (docsRes.status === 404) {
        setStatus(STATUS.NOT_FOUND);
        return;
      }
      const docsData = await docsRes.json();
      if (!docsRes.ok) {
        setStatus(STATUS.ERROR);
        return;
      }

      setPerson(docsData.person);
      setDocuments(docsData.documents || []);
      setStatus(STATUS.READY);
    } catch (err) {
      setStatus(STATUS.ERROR);
    }
  }, [personId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddDocument(e) {
    e.preventDefault();
    setAddError("");

    if (!addForm.name.trim() || !addForm.url.trim()) {
      setAddError("Please provide both a document name and a URL.");
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          name: addForm.name.trim(),
          url: addForm.url.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Could not add document.");
        return;
      }
      setDocuments((docs) => [data.document, ...docs]);
      setAddForm({ name: "", url: "" });
      setShowAddModal(false);
    } catch (err) {
      setAddError("Could not reach the server. Please try again.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDownload(doc) {
    setDownloadingId(doc.id);
    try {
      const res = await fetch(doc.url);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Cross-origin or network issue: fall back to opening the file directly.
      window.open(doc.url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link href="/documents" className="text-sm text-slate-400 hover:text-teal">
          &larr; Back to all people
        </Link>

        {status === STATUS.LOADING && (
          <p className="mt-6 text-sm text-slate-400">Loading documents...</p>
        )}

        {status === STATUS.DENIED && (
          <div className="mt-8 card-shell flex flex-col items-center gap-3 px-8 py-14 text-center">
            <h2 className="font-display text-xl font-semibold text-navy">
              You don&apos;t have permission to access document
            </h2>
            <p className="max-w-md text-sm text-slate-500">
              Your account doesn&apos;t currently have document access.
            </p>
          </div>
        )}

        {status === STATUS.NOT_FOUND && (
          <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            This person could not be found.
          </p>
        )}

        {status === STATUS.ERROR && (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            Something went wrong. Please try again.
          </p>
        )}

        {status === STATUS.READY && (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-semibold text-navy">
                  {person?.name}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {documents.length} {documents.length === 1 ? "document" : "documents"}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary w-auto px-5"
              >
                + Add Document
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="mt-10 card-shell flex flex-col items-center gap-2 px-8 py-14 text-center">
                <h3 className="font-display text-lg font-semibold text-navy">
                  No documents yet
                </h3>
                <p className="text-sm text-slate-500">
                  Add the first document for {person?.name} using the button above.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="card-shell flex flex-col gap-4 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
                          <path d="M14 3v5h5" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-medium text-navy">{doc.name}</h3>
                        <p className="truncate text-xs text-slate-400">{doc.url}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setViewDoc(doc)}
                        className="btn-secondary flex-1"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        disabled={downloadingId === doc.id}
                        className="flex-1 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-light disabled:opacity-60"
                      >
                        {downloadingId === doc.id ? "Downloading..." : "Download"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {viewDoc && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-navy/60 p-6"
          onClick={() => setViewDoc(null)}
        >
          <div
            className="card-shell w-full max-w-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-medium text-navy">{viewDoc.name}</h3>
              <button
                onClick={() => setViewDoc(null)}
                className="text-slate-400 hover:text-navy"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
            <div className="flex max-h-[70vh] items-center justify-center bg-slate-50 p-4">
              {isImageUrl(viewDoc.url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewDoc.url}
                  alt={viewDoc.name}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <p className="text-sm text-slate-500">
                    A preview isn&apos;t available for this file type.
                  </p>
                  <a
                    href={viewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-teal text-sm"
                  >
                    Open in a new tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-navy/60 p-6"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="card-shell w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold text-navy">Add Document</h3>
            <p className="mt-1 text-sm text-slate-500">
              For {person?.name}. This will be saved to the database.
            </p>

            <form onSubmit={handleAddDocument} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Document Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aadhar Card"
                  className="input-field"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Document URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  className="input-field"
                  value={addForm.url}
                  onChange={(e) => setAddForm((f) => ({ ...f, url: e.target.value }))}
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
