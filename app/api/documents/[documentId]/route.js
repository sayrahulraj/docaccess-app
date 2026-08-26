import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { sql } from "@/lib/db";

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!user.can_access_documents) {
    return NextResponse.json(
      { error: "You don't have permission to access documents." },
      { status: 403 }
    );
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

  // Confirm this document belongs to a person owned by the current user
  // before allowing the edit.
  const rows = await sql`
    SELECT d.id, p.owner_id
    FROM documents d
    JOIN persons p ON p.id = d.person_id
    WHERE d.id = ${documentId}
    LIMIT 1
  `;

  if (rows.length === 0 || rows[0].owner_id !== user.id) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const updated = await sql`
    UPDATE documents
    SET name = ${name}, url = ${url}
    WHERE id = ${documentId}
    RETURNING id, name, url, created_at
  `;

  return NextResponse.json({ document: updated[0] });
}
