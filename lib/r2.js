import { S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 is S3-compatible, so the standard AWS S3 SDK works against
// it — we just point the endpoint at the R2 account URL instead of AWS.
export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME;

// The public base URL for the bucket — either the free r2.dev subdomain
// (enabled per-bucket in the Cloudflare dashboard) or a custom domain you've
// connected to it. No trailing slash.
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
