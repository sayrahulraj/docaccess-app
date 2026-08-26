import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export const SESSION_COOKIE = "session_token";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

/**
 * Sign a JWT for the given payload (typically { userId, email }).
 */
export async function signSessionToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey);
}

/**
 * Verify a JWT and return its payload, or null if invalid/expired.
 */
export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (err) {
    return null;
  }
}
