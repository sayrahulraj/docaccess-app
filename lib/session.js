import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./auth";
import { sql } from "./db";

/**
 * Reads the session cookie, verifies it, and returns the fresh user record
 * from the database (so permission changes take effect immediately without
 * re-login). Returns null if there is no valid session.
 */
export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload?.userId) return null;

  const rows = await sql`
    SELECT id, full_name, email, can_access_documents
    FROM users
    WHERE id = ${payload.userId}
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  return rows[0];
}
