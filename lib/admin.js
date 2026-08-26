/**
 * A single email address (set via the ADMIN_EMAIL environment variable) is
 * treated as the admin account. No separate "role" column is needed for a
 * single fixed admin — if you later want multiple admins, replace this with
 * an `is_admin` column on the users table instead.
 */
export function isAdminEmail(email) {
  const adminEmail = process.env.ADMIN_EMAIL;
  console.log("ADMIN_EMAIL env:", adminEmail, "| logged-in email:", email); // temp debug
  if (!adminEmail || !email) return false;
  return email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
}
