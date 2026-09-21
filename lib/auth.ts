import crypto from "crypto";
import { cookies } from "next/headers";
import { ensureSchema, pool } from "./db";
import { hashPassword } from "./password";

export type AppRole = "ADMIN" | "USER";
export type AppSession = { id: number; email: string; role: AppRole; exp: number };

const COOKIE = "aol_app_session";

function secret() {
  const value = process.env.APP_SECRET || "";
  if (value.length < 24) throw new Error("APP_SECRET harus diisi minimal 24 karakter.");
  return value;
}

function sign(input: string) {
  return crypto.createHmac("sha256", secret()).update(input).digest("base64url");
}

function encode(session: AppSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(value: string): AppSession | null {
  try {
    const [payload, sig] = value.split(".");
    if (!payload || !sig) return null;
    const expected = sign(payload);
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AppSession;
    if (!session?.id || !session?.email || !session?.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function setAppSession(input: Omit<AppSession, "exp">) {
  const jar = await cookies();
  const session: AppSession = { ...input, exp: Date.now() + 1000 * 60 * 60 * 12 };
  jar.set(COOKIE, encode(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAppSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getAppSession(): Promise<AppSession | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const decoded = decode(raw);
  if (!decoded) return null;
  await ensureSchema();
  const result = await pool.query(`SELECT id, email, role, active FROM app_users WHERE id=$1 LIMIT 1`, [decoded.id]);
  const row = result.rows[0];
  if (!row || !row.active) return null;
  return { id: Number(row.id), email: String(row.email), role: row.role === "ADMIN" ? "ADMIN" : "USER", exp: decoded.exp };
}

export async function requireAppSession(role?: AppRole) {
  const session = await getAppSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (role && session.role !== role) throw new Error("FORBIDDEN");
  return session;
}

export async function ensureBootstrapAdmin() {
  await ensureSchema();
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || !password) return;
  const existingAdmin = await pool.query(`SELECT id FROM app_users WHERE role='ADMIN' LIMIT 1`);
  if (existingAdmin.rowCount) return;
  await pool.query(
    `INSERT INTO app_users(email,password_hash,role,active) VALUES($1,$2,'ADMIN',TRUE) ON CONFLICT (email) DO UPDATE SET role='ADMIN', active=TRUE`,
    [email, hashPassword(password)]
  );
}
