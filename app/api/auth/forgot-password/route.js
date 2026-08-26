import { NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "@/lib/db";

const RESET_TOKEN_TTL_MINUTES = 30;

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const rows = await sql`
      SELECT id FROM users WHERE email = ${normalizedEmail} LIMIT 1
    `;

    // Always respond the same way whether or not the account exists, so the
    // API doesn't reveal which emails are registered.
    const genericMessage =
      "If an account exists for that email, a password reset link has been generated.";

    if (rows.length === 0) {
      return NextResponse.json({ message: genericMessage });
    }

    const userId = rows[0].id;
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
    `;

    const resetUrl = `/reset-password?token=${token}`;

    return NextResponse.json({ message: genericMessage, resetUrl });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
