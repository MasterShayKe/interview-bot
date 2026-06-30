import type { FastifyInstance } from "fastify";
import { requireAdmin } from "./auth/session.js";
import { adminOverview } from "./admin.js";

export function registerAdminRoutes(app: FastifyInstance): void {
  app.get(
    "/api/admin/overview",
    { preHandler: requireAdmin },
    async () => adminOverview(),
  );
}
