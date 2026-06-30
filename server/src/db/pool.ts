import pg from "pg";

/**
 * A single shared connection pool for the whole server. The connection string
 * comes from DATABASE_URL (e.g. postgres://user:pass@host:5432/interview_bot).
 */
let pool: pg.Pool | null = null;

/**
 * Whether to connect with SSL. Managed Postgres (Render, etc.) requires it;
 * local dev does not. We enable it for any non-local host - so it works whether
 * or not the URL carries `?sslmode=require` - and let DATABASE_SSL override.
 */
function shouldUseSsl(connectionString: string): boolean {
  if (process.env.DATABASE_SSL === "true") return true;
  if (process.env.DATABASE_SSL === "false") return false;
  if (/sslmode=require/.test(connectionString)) return true;
  try {
    const host = new URL(connectionString).hostname;
    return host !== "" && host !== "localhost" && host !== "127.0.0.1";
  } catch {
    return false;
  }
}

export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new pg.Pool({
      connectionString,
      ssl: shouldUseSsl(connectionString)
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }
  return pool;
}

/** Run a parameterized query and return the rows. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await getPool().query(text, params as never[]);
  return res.rows as T[];
}

/** Run a query and return the first row, or null. */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
