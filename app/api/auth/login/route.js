import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { signSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const rows = await sql`
      SELECT id, full_name, email, password_hash, can_access_documents
      FROM users
      WHERE email = ${normalizedEmail}
      LIMIT 1
    `;

    // Use a generic error message so we don't reveal whether the email exists.
    const genericError = "Invalid email or password.";

    if (rows.length === 0) {
      return NextResponse.json({ error: genericError }, { status: 401 });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return NextResponse.json({ error: genericError }, { status: 401 });
    }

    const token = await signSessionToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({
      message: "Logged in successfully.",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
