import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";

export async function POST(request) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Token, password, and confirm password are all required." },
        { status: 400 }
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, user_id, expires_at, used
      FROM password_reset_tokens
      WHERE token = ${token}
      LIMIT 1
    `;

    const invalidError = "This reset link is invalid or has expired.";

    if (rows.length === 0) {
      return NextResponse.json({ error: invalidError }, { status: 400 });
    }

    const resetToken = rows[0];
    const isExpired = new Date(resetToken.expires_at) < new Date();

    if (resetToken.used || isExpired) {
      return NextResponse.json({ error: invalidError }, { status: 400 });
    }

    // The new password is hashed with the same bcrypt setup used at signup —
    // the old password is never recovered, only overwritten.
    const passwordHash = await bcrypt.hash(password, 10);

    // Update the password and consume the token together. Neon's serverless
    // driver auto-commits each statement, so we mark the token used right
    // after the password update to close the reuse window as tightly as
    // possible.
    await sql`
      UPDATE users SET password_hash = ${passwordHash} WHERE id = ${resetToken.user_id}
    `;
    await sql`
      UPDATE password_reset_tokens SET used = true WHERE id = ${resetToken.id}
    `;

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
