import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { sql } from "@/lib/db";

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { personId } = params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const existing = await sql`
    SELECT id, owner_id FROM persons WHERE id = ${personId} LIMIT 1
  `;
  if (existing.length === 0) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }
  if (existing[0].owner_id !== user.id) {
    return NextResponse.json(
      { error: "You can only edit people you created." },
      { status: 403 }
    );
  }

  const updated = await sql`
    UPDATE persons SET name = ${name} WHERE id = ${personId}
    RETURNING id, name, created_at, owner_id
  `;

  return NextResponse.json({
    person: { ...updated[0], owner_name: user.full_name, is_owner: true },
  });
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { personId } = params;

  const existing = await sql`
    SELECT id, owner_id FROM persons WHERE id = ${personId} LIMIT 1
  `;
  if (existing.length === 0) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }
  if (existing[0].owner_id !== user.id) {
    return NextResponse.json(
      { error: "You can only delete people you created." },
      { status: 403 }
    );
  }

  // documents.person_id has ON DELETE CASCADE, so this removes their
  // documents too — no orphaned rows left behind.
  await sql`DELETE FROM persons WHERE id = ${personId}`;

  return NextResponse.json({ message: "Person deleted." });
}
