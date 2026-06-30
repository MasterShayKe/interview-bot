import "dotenv/config";
import { runMigrations } from "../src/db/migrate.js";
import { getPool } from "../src/db/pool.js";
import { seedShay } from "../src/seed.js";

// Always rewrites Shay's persona + knowledge from spec/ (force).
await runMigrations();
const bot = await seedShay({ force: true });
console.log(`[seed] Shay seeded: bot ${bot!.id} (@${bot!.handle}, published)`);
await getPool().end();
