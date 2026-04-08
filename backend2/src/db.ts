import { Pool } from "pg";

import { settings } from "./config.js";

let pool: Pool | null = null;

export async function initDb(): Promise<Pool | null> {
  if (!settings.useDb) return null;
  if (!settings.databaseUrl) throw new Error("DATABASE_URL is required when USE_DB=true");
  if (!pool) {
    pool = new Pool({
      connectionString: settings.databaseUrl,
      min: 5,
      max: 20
    });
  }
  return pool;
}

export async function getPool(): Promise<Pool | null> {
  if (!settings.useDb) return null;
  return pool ?? initDb();
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function fetchOne<T = unknown>(query: string, params: unknown[] = []): Promise<T | null> {
  if (!settings.useDb) return null;
  const db = await getPool();
  const result = await db!.query<T>(query, params);
  return result.rows[0] ?? null;
}

export async function fetchAll<T = unknown>(query: string, params: unknown[] = []): Promise<T[]> {
  if (!settings.useDb) return [];
  const db = await getPool();
  const result = await db!.query<T>(query, params);
  return result.rows;
}

export async function execute(query: string, params: unknown[] = []): Promise<string> {
  if (!settings.useDb) return "DB_DISABLED";
  const db = await getPool();
  await db!.query(query, params);
  return "OK";
}
