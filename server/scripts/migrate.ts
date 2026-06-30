import "dotenv/config";
import { runMigrations } from "../src/db/migrate.js";
import { getPool } from "../src/db/pool.js";

await runMigrations();
console.log("[migrate] up to date");
await getPool().end();
