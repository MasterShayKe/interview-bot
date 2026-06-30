import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPool } from "./pool.js";

// migrations/ lives at the server package root, a sibling of src/ (and of dist/
// after a build), so the same relative hop works in dev (tsx) and prod (node).
const MIGRATIONS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../migrations",
);

/**
 * Applies every *.sql file in migrations/ that has not run yet, in filename
 * order, each inside its own transaction. Applied filenames are tracked in the
 * _migrations table so this is safe to call on every server start.
 */
export async function runMigrations(): Promise<void> {
  const pool = getPool();
  await pool.query(
    `CREATE TABLE IF NOT EXISTS _migrations (
       name text PRIMARY KEY,
       applied_at timestamptz NOT NULL DEFAULT now()
     )`,
  );

  const applied = new Set(
    (await pool.query<{ name: string }>("SELECT name FROM _migrations")).rows.map(
      (r) => r.name,
    ),
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`[migrate] applied ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }
}
