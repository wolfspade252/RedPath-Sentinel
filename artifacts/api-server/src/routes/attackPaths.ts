import { Router, type IRouter } from "express";
import { db, attackPathsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { simulateAttackPath } from "../lib/attackPathEngine";
import { SimulateAttackPathBody, GetAttackPathParams, DeleteAttackPathParams } from "@workspace/api-zod";

const router: IRouter = Router();

function formatPath(ap: typeof attackPathsTable.$inferSelect) {
  return {
    id: ap.id,
    startIdentity: ap.startIdentity,
    targetHost: ap.targetHost,
    steps: (ap.steps as object[]) ?? [],
    riskSummary: ap.riskSummary,
    controlWeaknesses: (ap.controlWeaknesses as string[]) ?? [],
    defensiveActions: (ap.defensiveActions as string[]) ?? [],
    createdAt: ap.createdAt.toISOString(),
  };
}

router.get("/attack-paths", async (req, res): Promise<void> => {
  const paths = await db.select().from(attackPathsTable).orderBy(attackPathsTable.createdAt);
  res.json(paths.map(formatPath));
});

router.post("/attack-paths/simulate", async (req, res): Promise<void> => {
  const parsed = SimulateAttackPathBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const simulated = simulateAttackPath(parsed.data.startIdentity, parsed.data.targetHost);

  const [ap] = await db.insert(attackPathsTable).values({
    startIdentity: parsed.data.startIdentity,
    targetHost: parsed.data.targetHost,
    steps: simulated.steps,
    riskSummary: simulated.riskSummary,
    controlWeaknesses: simulated.controlWeaknesses,
    defensiveActions: simulated.defensiveActions,
  }).returning();

  res.status(201).json(formatPath(ap));
});

router.get("/attack-paths/:id", async (req, res): Promise<void> => {
  const params = GetAttackPathParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ap] = await db.select().from(attackPathsTable).where(eq(attackPathsTable.id, params.data.id));
  if (!ap) {
    res.status(404).json({ error: "Attack path not found" });
    return;
  }

  res.json(formatPath(ap));
});

router.delete("/attack-paths/:id", async (req, res): Promise<void> => {
  const params = DeleteAttackPathParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ap] = await db.delete(attackPathsTable).where(eq(attackPathsTable.id, params.data.id)).returning();
  if (!ap) {
    res.status(404).json({ error: "Attack path not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
