/**
 * One-time setup script:
 *  - Creates the users / persons / documents tables (if missing)
 *  - Seeds the 4 people
 *  - Creates two demo accounts so you can test both permission states:
 *      allowed@example.com   / password123   (can_access_documents = true)
 *      denied@example.com    / password123   (can_access_documents = false)
 *
 * Usage:
 *   npm run seed
 *
 * Requires DATABASE_URL to be set (in .env.local or the shell environment).
 */

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { neon } = require("@neondatabase/serverless");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "Missing DATABASE_URL. Add it to .env.local first (see .env.example)."
    );
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log("Applying schema...");
  const schema = fs.readFileSync(
    path.join(__dirname, "schema.sql"),
    "utf8"
  );

  // neon's serverless driver executes one statement per call, so split on
  // semicolons that end a statement (simple schema, no semicolons inside strings).
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql(statement);
  }
  console.log("Schema ready.");

  const demoPasswordHash = await bcrypt.hash("password123", 10);

  const demoUsers = [
    {
      full_name: "Allowed Demo User",
      email: "allowed@example.com",
      can_access_documents: true,
    },
    {
      full_name: "Denied Demo User",
      email: "denied@example.com",
      can_access_documents: false,
    },
  ];

  for (const user of demoUsers) {
    const existing = await sql`SELECT id FROM users WHERE email = ${user.email}`;
    if (existing.length > 0) {
      console.log(`User ${user.email} already exists, skipping.`);
      continue;
    }
    await sql`
      INSERT INTO users (full_name, email, password_hash, can_access_documents)
      VALUES (${user.full_name}, ${user.email}, ${demoPasswordHash}, ${user.can_access_documents})
    `;
    console.log(`Created ${user.email} (access: ${user.can_access_documents})`);
  }

  console.log("\nSeed complete. Demo logins:");
  console.log("  allowed@example.com / password123  -> has document access");
  console.log("  denied@example.com  / password123  -> no document access");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
