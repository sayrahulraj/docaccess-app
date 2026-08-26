import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { sql } from "@/lib/db";

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.json(
      { error: "You don't have permission to access this page." },
      { status: 403 }
    );
  }

  const { userId } = params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.canAccessDocuments !== "boolean") {
    return NextResponse.json(
      { error: "canAccessDocuments must be true or false." },
      { status: 400 }
    );
  }

  const existing = await sql`SELECT id FROM users WHERE id = ${userId} LIMIT 1`;
  if (existing.length === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const updated = await sql`
    UPDATE users
    SET can_access_documents = ${body.canAccessDocuments}
    WHERE id = ${userId}
    RETURNING id, full_name, email, can_access_documents, created_at
  `;

  return NextResponse.json({ user: updated[0] });
}
