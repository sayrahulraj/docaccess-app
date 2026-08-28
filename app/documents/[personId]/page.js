"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";

const STATUS = {
  LOADING: "loading",
  READY: "ready",
  NOT_FOUND: "not_found",
  ERROR: "error",
};

function isImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(url);
}

function getGoogleDriveFileId(url) {
  try {
    const u = new URL(url);
    if (!/(^|\.)(drive|docs)\.google\.com$/.test(u.hostname)) return null;

    const pathMatch = u.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (pathMatch) return pathMatch[1];

    const idParam = u.searchParams.get("id");
    if (idParam) return idParam;

    return null;
  } catch {
    return null;
  }
}

function getDrivePreviewUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

function getDriveDownloadUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const emptyForm = { name: "", url: "", file: null };

export default function PersonDocumentsPage() {
  const { personId } = useParams();

  const [status, setStatus] = useState(STATUS.LOADING);
  const [person, setPerson] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [canDeleteAny, setCanDeleteAny] = useState(false);

  const [viewDoc, setViewDoc] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [modalMode, setModalMode] = useState(null); // null | "add" | "edit"
  const [editingDocId, setEditingDocId] = useState(null);
  const [inputMode, setInputMode] = useState("link");
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setStatus(STATUS.LOADING);
    try {
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
      setIsOwner(Boolean(docsData.isOwner));
      setCanDeleteAny(Boolean(docsData.canDeleteAny));
      setStatus(STATUS.READY);
    } catch (err) {
      setStatus(STATUS.ERROR);
    }
  }, [personId]);

  useEffect(() => {
    load();
  }, [load]);

  function openAddModal() {
    setModalMode("add");
    setEditingDocId(null);
    setInputMode("link");
    setForm(emptyForm);
    setFormError("");
  }

  function openEditModal(doc) {
    setModalMode("edit");
    setEditingDocId(doc.id);
    setInputMode("link");
    setForm({ name: doc.name, url: doc.url, file: null });
    setFormError("");
  }

  function closeModal() {
    setModalMode(null);
    setEditingDocId(null);
    setForm(emptyForm);
    setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Please enter a document name.");
      return;
    }

    let finalUrl = form.url.trim();

    if (inputMode === "file") {
      if (!form.file) {
        setFormError("Please choose a PDF or image file to upload.");
        return;
      }
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", form.file);
        const uploadRes = await fetch("/api/documents/upload", {
          method: "POST",
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setFormError(uploadData.error || "Could not upload the file.");
          return;
        }
        finalUrl = uploadData.url;
      } catch (err) {
        setFormError("Could not reach the server while uploading. Please try again.");
        return;
      } finally {
        setUploading(false);
      }
    } else if (!finalUrl) {
      setFormError("Please enter a URL.");
      return;
    } else {
      try {
        new URL(finalUrl);
      } catch {
        setFormError("Please enter a valid URL.");
        return;
      }
    }

    setSaving(true);
    try {
      if (modalMode === "add") {
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId, name: form.name.trim(), url: finalUrl }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "Could not add document.");
          return;
        }
        setDocuments((docs) => [data.document, ...docs]);
      } else {
        const res = await fetch(`/api/documents/${editingDocId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name.trim(), url: finalUrl }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "Could not update document.");
          return;
        }
        setDocuments((docs) =>
          docs.map((d) => (d.id === data.document.id ? data.document : d))
        );
      }
      closeModal();
    } catch (err) {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(doc) {
    const confirmed = window.confirm(
      `Delete "${doc.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not delete document.");
        return;
      }
      setDocuments((docs) => docs.filter((d) => d.id !== doc.id));
    } catch (err) {
      alert("Could not reach the server. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownload(doc) {
    setDownloadingId(doc.id);
    const driveFileId = getGoogleDriveFileId(doc.url);
    const downloadUrl = driveFileId ? getDriveDownloadUrl(driveFileId) : doc.url;

    try {
      const res = await fetch(downloadUrl);
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
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
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

        {status === STATUS.NOT_FOUND && (
          <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            This person could not be found, or you don&apos;t have permission to view them.
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
                  {!isOwner && " · view only"}
                </p>
              </div>
              {isOwner && (
                <button onClick={openAddModal} className="btn-primary w-auto px-5">
                  + Add Document
                </button>
              )}
            </div>

            {!isOwner && (
              <p className="mt-4 rounded-lg bg-teal/10 px-4 py-3 text-sm text-teal-dark">
                You&apos;re viewing this because your account can see everyone&apos;s
                documents. Only the creator can add or edit documents here, but you
                can delete any document since your account has full access.
              </p>
            )}

            {documents.length === 0 ? (
              <div className="mt-10 card-shell flex flex-col items-center gap-2 px-8 py-14 text-center">
                <h3 className="font-display text-lg font-semibold text-navy">
                  No documents yet
                </h3>
                <p className="text-sm text-slate-500">
                  {isOwner
                    ? `Add the first document for ${person?.name} using the button above.`
                    : `${person?.name} doesn't have any documents yet.`}
                </p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="card-shell flex flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
                            <path d="M14 3v5h5" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-medium text-navy">{doc.name}</h3>
                          <p className="mt-0.5 text-xs text-slate-400">
                            Added {formatDate(doc.created_at)}
                          </p>
                        </div>
                      </div>
                      {(isOwner || canDeleteAny) && (
                        <div className="flex shrink-0 gap-3">
                          {isOwner && (
                            <button
                              onClick={() => openEditModal(doc)}
                              className="text-xs font-medium text-slate-400 hover:text-teal"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(doc)}
                            disabled={deletingId === doc.id}
                            className="text-xs font-medium text-slate-400 hover:text-red-500 disabled:opacity-50"
                          >
                            {deletingId === doc.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
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

      {/* View modal */}
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
              {(() => {
                const driveFileId = getGoogleDriveFileId(viewDoc.url);
                if (driveFileId) {
                  return (
                    <iframe
                      src={getDrivePreviewUrl(driveFileId)}
                      title={viewDoc.name}
                      className="h-[60vh] w-full rounded-lg border-0"
                      allow="autoplay"
                    />
                  );
                }
                if (isImageUrl(viewDoc.url)) {
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={viewDoc.url}
                      alt={viewDoc.name}
                      className="max-h-[60vh] max-w-full rounded-lg object-contain"
                    />
                  );
                }
                if (/\.pdf(\?.*)?$/i.test(viewDoc.url)) {
                  return (
                    <iframe
                      src={viewDoc.url}
                      title={viewDoc.name}
                      className="h-[60vh] w-full rounded-lg border-0"
                    />
                  );
                }
                return (
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
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit document modal */}
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
              {modalMode === "add" ? "Add Document" : "Edit Document"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              For {person?.name}. This is saved to the database.
            </p>

            <div className="mt-4 flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setInputMode("link")}
                className={`flex-1 rounded-md py-2 transition ${
                  inputMode === "link" ? "bg-white text-navy shadow-soft" : "text-slate-500"
                }`}
              >
                Paste a link
              </button>
              <button
                type="button"
                onClick={() => setInputMode("file")}
                className={`flex-1 rounded-md py-2 transition ${
                  inputMode === "file" ? "bg-white text-navy shadow-soft" : "text-slate-500"
                }`}
              >
                Upload file
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">
                  Document Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aadhar Card"
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              {inputMode === "link" ? (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">
                    Document URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="input-field"
                    value={form.url}
                    onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy">
                    PDF or Image File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
                    className="input-field file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))
                    }
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    PDF, PNG, JPG, WEBP, or GIF — up to 4MB.
                  </p>
                </div>
              )}

              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={uploading || saving}
                >
                  {uploading ? "Uploading..." : saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
