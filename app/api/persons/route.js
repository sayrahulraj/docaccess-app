import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { sql } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // can_access_documents now controls SCOPE, not a hard allow/deny:
  //   true  -> see every person, from every user
  //   false -> see only the persons this user created
  let persons;
  if (user.can_access_documents) {
    persons = await sql`
      SELECT p.id, p.name, p.created_at, p.owner_id, u.full_name AS owner_name,
             COUNT(d.id)::int AS document_count
      FROM persons p
      LEFT JOIN documents d ON d.person_id = p.id
      LEFT JOIN users u ON u.id = p.owner_id
      GROUP BY p.id, p.name, p.created_at, p.owner_id, u.full_name
      ORDER BY p.created_at DESC
    `;
  } else {
    persons = await sql`
      SELECT p.id, p.name, p.created_at, p.owner_id, NULL::text AS owner_name,
             COUNT(d.id)::int AS document_count
      FROM persons p
      LEFT JOIN documents d ON d.person_id = p.id
      WHERE p.owner_id = ${user.id}
      GROUP BY p.id, p.name, p.created_at, p.owner_id
      ORDER BY p.created_at DESC
    `;
  }

  const withOwnership = persons.map((p) => ({
    ...p,
    is_owner: p.owner_id === user.id,
  }));

  return NextResponse.json({
    persons: withOwnership,
    scope: user.can_access_documents ? "all" : "own",
  });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
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
    RETURNING id, name, created_at, owner_id
  `;

  return NextResponse.json(
    {
      person: {
        ...inserted[0],
        owner_name: user.full_name,
        document_count: 0,
        is_owner: true,
      },
    },
    { status: 201 }
  );
}
