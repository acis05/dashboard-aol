import crypto from "crypto";
import { cookies } from "next/headers";

export type OAuthState = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
  user?: { name?: string; email?: string };
  database?: { id: number; alias: string };
  host?: string;
  sessionId?: string;
};

const COOKIE = "aol_oauth";

function key() {
  const secret = process.env.APP_SECRET || process.env.ACCURATE_CLIENT_SECRET || "";
  if (!secret) throw new Error("APP_SECRET belum diisi di Railway Variables.");
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(value: OAuthState) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

function decrypt(value: string): OAuthState | null {
  try {
    const raw = Buffer.from(value, "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    return JSON.parse(plain);
  } catch {
    return null;
  }
}

export async function getOAuthState() {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  return value ? decrypt(value) : null;
}

export async function setOAuthState(state: OAuthState) {
  const jar = await cookies();
  jar.set(COOKIE, encrypt(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearOAuthState() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
