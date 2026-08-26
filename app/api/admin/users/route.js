import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { sql } from "@/lib/db";

export async function GET() {
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

  const users = await sql`
    SELECT id, full_name, email, can_access_documents, created_at
    FROM users
    ORDER BY full_name ASC
  `;

  return NextResponse.json({ users });
}
