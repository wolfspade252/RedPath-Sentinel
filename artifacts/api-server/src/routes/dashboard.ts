import { Router, type IRouter } from "express";
import { db, hostsTable, identityUsersTable, attackPathsTable, scansTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard", async (req, res): Promise<void> => {
  const hosts = await db.select().from(hostsTable);
  const users = await db.select().from(identityUsersTable);
  const attackPaths = await db.select({ id: attackPathsTable.id }).from(attackPathsTable);

  let totalOpenPorts = 0;
  let highRiskServices = 0;
  let easyTargets = 0;
  let mediumTargets = 0;
  let hardTargets = 0;

  const HIGH_RISK_PORTS = new Set([21, 23, 445, 3389, 389, 3306, 5432, 1433, 5985, 6379, 27017]);

  for (const host of hosts) {
    const services = (host.services as { port: number }[]) ?? [];
    totalOpenPorts += services.length;
    highRiskServices += services.filter((s) => HIGH_RISK_PORTS.has(s.port)).length;

    if (host.difficultyScore === "easy") easyTargets++;
    else if (host.difficultyScore === "medium") mediumTargets++;
    else hardTargets++;
  }

  const identityRisks = users.filter((u) => {
    const flags = (u.riskFlags as string[]) ?? [];
    return flags.length > 0 || !u.mfaEnabled || u.accountType === "dormant";
  }).length;

  res.json({
    totalHosts: hosts.length,
    totalOpenPorts,
    highRiskServices,
    identityRisks,
    easyTargets,
    mediumTargets,
    hardTargets,
    totalAttackPaths: attackPaths.length,
  });
});

export default router;
