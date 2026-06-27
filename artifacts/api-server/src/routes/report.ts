import { Router, type IRouter } from "express";
import { db, hostsTable, attackPathsTable } from "@workspace/db";
import { getWeaknessesForPorts } from "../lib/weaknessRules";

const router: IRouter = Router();

router.get("/report", async (req, res): Promise<void> => {
  const hosts = await db.select().from(hostsTable);
  const attackPaths = await db.select().from(attackPathsTable);

  let totalOpenPorts = 0;
  let highRiskServices = 0;
  let easyTargets = 0;
  let mediumTargets = 0;
  let hardTargets = 0;

  const HIGH_RISK_PORTS = new Set([21, 23, 445, 3389, 389, 3306, 5432, 1433, 5985, 6379, 27017]);

  const reportHosts = hosts.map((h) => {
    const services = (h.services as { port: number; protocol: string; serviceName: string; product?: string | null; version?: string | null; riskLevel?: string | null }[]) ?? [];
    totalOpenPorts += services.length;
    highRiskServices += services.filter((s) => HIGH_RISK_PORTS.has(s.port)).length;
    if (h.difficultyScore === "easy") easyTargets++;
    else if (h.difficultyScore === "medium") mediumTargets++;
    else hardTargets++;

    const ports = services.map((s) => s.port);
    const weaknesses = getWeaknessesForPorts(ports);

    return {
      ip: h.ip,
      hostname: h.hostname ?? null,
      openPorts: services.length,
      services,
      weaknesses,
      difficultyScore: h.difficultyScore,
    };
  });

  const allRecs = new Set<string>();
  reportHosts.forEach((h) => h.weaknesses.forEach((w) => allRecs.add(w.recommendation)));

  const globalRecs = [
    "Implement a formal patch management program for all hosts",
    "Deploy MFA across all remote access services",
    "Conduct quarterly access reviews for all privileged accounts",
    "Implement network segmentation to reduce lateral movement risk",
    "Enable centralized logging and SIEM alerting",
    "Develop and test an incident response plan",
  ];
  globalRecs.forEach((r) => allRecs.add(r));

  res.json({
    generatedAt: new Date().toISOString(),
    scanSummary: {
      totalHosts: hosts.length,
      totalOpenPorts,
      highRiskServices,
      identityRisks: 0,
      easyTargets,
      mediumTargets,
      hardTargets,
      totalAttackPaths: attackPaths.length,
    },
    hosts: reportHosts,
    attackPaths: attackPaths.map((ap) => ({
      id: ap.id,
      startIdentity: ap.startIdentity,
      targetHost: ap.targetHost,
      steps: (ap.steps as object[]) ?? [],
      riskSummary: ap.riskSummary,
      controlWeaknesses: (ap.controlWeaknesses as string[]) ?? [],
      defensiveActions: (ap.defensiveActions as string[]) ?? [],
      createdAt: ap.createdAt.toISOString(),
    })),
    recommendations: [...allRecs],
  });
});

export default router;
