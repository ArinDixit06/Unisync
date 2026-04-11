import { Pool } from "pg";
import { settings } from "./config.js";
let pool = null;
export async function initDb() {
    if (!settings.useDb)
        return null;
    if (!settings.databaseUrl)
        throw new Error("DATABASE_URL is required when USE_DB=true");
    if (!pool) {
        pool = new Pool({
            connectionString: settings.databaseUrl,
            min: 5,
            max: 20
        });
    }
    return pool;
}
export async function getPool() {
    if (!settings.useDb)
        return null;
    return pool ?? initDb();
}
export async function closeDb() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
export async function fetchOne(query, params = []) {
    if (!settings.useDb)
        return null;
    const db = await getPool();
    const result = await db.query(query, params);
    return result.rows[0] ?? null;
}
export async function fetchAll(query, params = []) {
    if (!settings.useDb)
        return [];
    const db = await getPool();
    const result = await db.query(query, params);
    return result.rows;
}
export async function execute(query, params = []) {
    if (!settings.useDb)
        return "DB_DISABLED";
    const db = await getPool();
    await db.query(query, params);
    return "OK";
}
