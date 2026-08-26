import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  // Thrown lazily at request time in real usage, but warn early in logs.
  console.warn(
    "DATABASE_URL is not set. Add it to .env.local (see .env.example)."
  );
}

// `sql` is a tagged-template query function, e.g. sql`SELECT * FROM users WHERE id = ${id}`
export const sql = neon(process.env.DATABASE_URL);
