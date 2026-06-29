import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Object storage for the repurpose pipeline: the source .mp4 and every cut clip.
//
// Provider-agnostic on purpose. The @aws-sdk/client-s3 SDK talks to both AWS S3
// and any S3-compatible service (Cloudflare R2, MinIO, Backblaze B2). The only
// difference is R2/MinIO need a custom endpoint + region "auto"; AWS infers the
// endpoint from the region. So the choice is config, not code — set S3_ENDPOINT
// for R2 and leave it unset for AWS. See .env.example.
//
// Env:
//   S3_BUCKET            (required) bucket name
//   S3_ACCESS_KEY_ID     (required)
//   S3_SECRET_ACCESS_KEY (required)
//   S3_ENDPOINT          (R2/MinIO only) e.g. https://<account>.r2.cloudflarestorage.com
//   S3_REGION            defaults to "auto" (correct for R2; set your AWS region for S3)

const globalForS3 = globalThis as unknown as { __contentOsS3?: S3Client };

function env(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `${name} is not set. Object storage (the repurpose video upload/clip features) ` +
        `needs S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY (and S3_ENDPOINT for R2). ` +
        `See .env.example.`,
    );
  }
  return v;
}

export function getBucket(): string {
  return env("S3_BUCKET");
}

function createClient(): S3Client {
  const endpoint = process.env.S3_ENDPOINT; // unset for AWS S3, set for R2/MinIO
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: endpoint || undefined,
    // R2 and most S3-compatible providers require path-style addressing.
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId: env("S3_ACCESS_KEY_ID"),
      secretAccessKey: env("S3_SECRET_ACCESS_KEY"),
    },
  });
}

export function getS3Client(): S3Client {
  if (!globalForS3.__contentOsS3) {
    globalForS3.__contentOsS3 = createClient();
  }
  return globalForS3.__contentOsS3;
}

// Strip a user-supplied filename down to a safe object-key segment. Keeps the
// extension; collapses everything else to a slug.
export function sanitizeFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const slug =
    stem
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "file";
  return ext ? `${slug}.${ext}` : slug;
}

// A time-boxed PUT url the browser uploads the source video to directly (so a
// multi-GB file never routes through the Next.js server, which has body-size
// limits). The key is returned so the caller can persist it on the project row.
export async function presignUpload(
  key: string,
  contentType = "video/mp4",
  expiresInSeconds = 3600,
): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getS3Client(), cmd, { expiresIn: expiresInSeconds });
}

// A time-boxed GET url. Used two ways: handed to Deepgram so it fetches the
// source video server-side, and handed to the browser for clip preview/download.
// Deepgram needs long enough to download a large video, so the default is 1h.
export async function presignDownload(
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  return getSignedUrl(getS3Client(), cmd, { expiresIn: expiresInSeconds });
}

// Upload bytes already in the server's memory/temp dir (the cut clips). The
// browser-direct presigned PUT is only for the large source upload.
export async function uploadBuffer(
  key: string,
  body: Buffer,
  contentType = "video/mp4",
): Promise<void> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await getS3Client().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}
