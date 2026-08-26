import { NextResponse } from "next/server";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUser } from "@/lib/session";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

// Vercel's default body size limit for Node.js serverless functions is
// 4.5MB, so this is set conservatively below that. If you need larger
// files, switch to presigned direct-to-R2 uploads instead of proxying
// through this route (see README).
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 4MB

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!R2_BUCKET || !R2_PUBLIC_URL) {
    return NextResponse.json(
      {
        error:
          "File uploads aren't configured yet. Set the R2_* environment variables (see README) or add the document using a URL instead.",
      },
      { status: 500 }
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file was provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only PDF, PNG, JPG, WEBP, or GIF files are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File is too large. Maximum size is 4MB." },
      { status: 400 }
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extension = file.name.includes(".")
      ? file.name.split(".").pop().toLowerCase()
      : "";
    const key = `documents/${user.id}/${crypto.randomUUID()}${
      extension ? `.${extension}` : ""
    }`;

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const url = `${R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({ url, name: file.name });
  } catch (err) {
    console.error("R2 upload error:", err);
    return NextResponse.json(
      { error: "Could not upload the file. Please try again." },
      { status: 500 }
    );
  }
}
