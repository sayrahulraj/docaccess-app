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

  const persons = await sql`
    SELECT p.id, p.name, COUNT(d.id)::int AS document_count
    FROM persons p
    LEFT JOIN documents d ON d.person_id = p.id
    GROUP BY p.id, p.name
    ORDER BY p.name ASC
  `;

  return NextResponse.json({ persons });
}
