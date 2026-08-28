import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { sql } from "@/lib/db";

async function findDocumentOwner(documentId) {
  const rows = await sql`
    SELECT d.id, p.owner_id
    FROM documents d
    JOIN persons p ON p.id = d.person_id
    WHERE d.id = ${documentId}
    LIMIT 1
  `;
  return rows.length > 0 ? rows[0] : null;
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { documentId } = params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const url = (body.url || "").trim();

  if (!name || !url) {
    return NextResponse.json(
      { error: "Document name and URL are both required." },
      { status: 400 }
    );
  }
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Please provide a valid URL." }, { status: 400 });
  }

  const doc = await findDocumentOwner(documentId);
  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  // Editing stays owner-only, even for users with full viewing access.
  if (doc.owner_id !== user.id) {
    return NextResponse.json(
      { error: "You can only edit documents you created." },
      { status: 403 }
    );
  }

  const updated = await sql`
    UPDATE documents
    SET name = ${name}, url = ${url}
    WHERE id = ${documentId}
    RETURNING id, name, url, created_at
  `;

  return NextResponse.json({ document: updated[0] });
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { documentId } = params;

  const doc = await findDocumentOwner(documentId);
  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  // Deleting is allowed for the document's owner, OR any user with full
  // (can_access_documents = true) viewing access.
  const canDelete = doc.owner_id === user.id || user.can_access_documents;
  if (!canDelete) {
    return NextResponse.json(
      { error: "You don't have permission to delete this document." },
      { status: 403 }
    );
  }

  await sql`DELETE FROM documents WHERE id = ${documentId}`;

  return NextResponse.json({ message: "Document deleted." });
}
