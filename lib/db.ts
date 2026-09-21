import { Pool } from "pg";

const globalForDb = globalThis as unknown as { aolPool?: Pool; aolSchemaReady?: Promise<void> };

export const pool = globalForDb.aolPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

if (process.env.NODE_ENV !== "production") globalForDb.aolPool = pool;

export async function ensureSchema() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum tersedia. Tambahkan PostgreSQL di Railway.");
  if (!globalForDb.aolSchemaReady) {
    globalForDb.aolSchemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_users (
          id BIGSERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'USER',
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS app_users_email_idx ON app_users (LOWER(email));`);
    })();
  }
  await globalForDb.aolSchemaReady;
}
