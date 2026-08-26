import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { sql } from "@/lib/db";

async function getOwnedDocumentOrError(documentId, userId) {
  const rows = await sql`
    SELECT d.id, p.owner_id
    FROM documents d
    JOIN persons p ON p.id = d.person_id
    WHERE d.id = ${documentId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return { error: NextResponse.json({ error: "Document not found." }, { status: 404 }) };
  }
  if (rows[0].owner_id !== userId) {
    return {
      error: NextResponse.json(
        { error: "You can only edit or delete documents you created." },
        { status: 403 }
      ),
    };
  }
  return { ok: true };
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

  const check = await getOwnedDocumentOrError(documentId, user.id);
  if (check.error) return check.error;

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

  const check = await getOwnedDocumentOrError(documentId, user.id);
  if (check.error) return check.error;

  await sql`DELETE FROM documents WHERE id = ${documentId}`;

  return NextResponse.json({ message: "Document deleted." });
}
