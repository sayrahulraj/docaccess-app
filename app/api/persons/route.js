import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { sql } from "@/lib/db";

export async function GET() {
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

  // Only the persons this user created — ownership is enforced here, not
  // just hidden in the UI.
  const persons = await sql`
    SELECT p.id, p.name, p.created_at, COUNT(d.id)::int AS document_count
    FROM persons p
    LEFT JOIN documents d ON d.person_id = p.id
    WHERE p.owner_id = ${user.id}
    GROUP BY p.id, p.name, p.created_at
    ORDER BY p.created_at DESC
  `;

  return NextResponse.json({ persons });
}

export async function POST(request) {
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Person name is required." }, { status: 400 });
  }

  const inserted = await sql`
    INSERT INTO persons (name, owner_id)
    VALUES (${name}, ${user.id})
    RETURNING id, name, created_at
  `;

  return NextResponse.json(
    { person: { ...inserted[0], document_count: 0 } },
    { status: 201 }
  );
}
