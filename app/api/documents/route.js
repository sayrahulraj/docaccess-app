import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { sql } from "@/lib/db";

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const personId = searchParams.get("personId");

  if (!personId) {
    return NextResponse.json({ error: "personId is required." }, { status: 400 });
  }

  const person = await sql`
    SELECT id, name, owner_id FROM persons WHERE id = ${personId} LIMIT 1
  `;

  if (person.length === 0) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }

  const isOwner = person[0].owner_id === user.id;

  // Viewable if you own it, or if you have full (can_access_documents) scope.
  if (!isOwner && !user.can_access_documents) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }

  const documents = await sql`
    SELECT id, name, url, created_at
    FROM documents
    WHERE person_id = ${personId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ person: person[0], documents, isOwner });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const { personId, name, url } = await request.json();

    if (!personId || !name || !url) {
      return NextResponse.json(
        { error: "personId, name, and url are all required." },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Please provide a valid URL." }, { status: 400 });
    }

    const person = await sql`
      SELECT id, owner_id FROM persons WHERE id = ${personId} LIMIT 1
    `;
    if (person.length === 0) {
      return NextResponse.json({ error: "Person not found." }, { status: 404 });
    }

    // Adding documents is still owner-only, even for users with full
    // viewing access — viewing everyone's documents doesn't mean you can
    // modify someone else's.
    if (person[0].owner_id !== user.id) {
      return NextResponse.json(
        { error: "You can only add documents to people you created." },
        { status: 403 }
      );
    }

    const inserted = await sql`
      INSERT INTO documents (person_id, name, url)
      VALUES (${personId}, ${name.trim()}, ${url.trim()})
      RETURNING id, name, url, created_at
    `;

    return NextResponse.json({ document: inserted[0] }, { status: 201 });
  } catch (err) {
    console.error("Create document error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
