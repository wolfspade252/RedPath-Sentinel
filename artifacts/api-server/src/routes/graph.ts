import { Router, type IRouter } from "express";
import { db, hostsTable, identityUsersTable, identityGroupsTable } from "@workspace/db";
import { GetGraphQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const HIGH_RISK_PORTS = new Set([21, 23, 445, 3389, 389, 3306, 5432, 1433, 5985, 6379, 27017]);

router.get("/graph", async (req, res): Promise<void> => {
  const qParams = GetGraphQueryParams.safeParse(req.query);
  if (!qParams.success) {
    res.status(400).json({ error: qParams.error.message });
    return;
  }

  const { scanId } = qParams.data;

  let hosts = await db.select().from(hostsTable);
  if (scanId !== undefined && scanId !== null) {
    hosts = hosts.filter((h) => h.scanId === scanId);
  }

  const users = await db.select().from(identityUsersTable);
  const groups = await db.select().from(identityGroupsTable);

  const nodes: {
    id: string;
    type: string;
    label: string;
    data: Record<string, unknown>;
    riskLevel: string | null;
  }[] = [];

  const edges: {
    id: string;
    source: string;
    target: string;
    label: string;
  }[] = [];

  for (const host of hosts) {
    const services = (host.services as { port: number; serviceName: string; riskLevel?: string | null }[]) ?? [];
    const hasHighRisk = services.some((s) => HIGH_RISK_PORTS.has(s.port));
    const hasMediumRisk = services.some((s) => s.riskLevel === "medium");

    const riskLevel = hasHighRisk ? "high" : hasMediumRisk ? "medium" : "low";

    const nodeType = host.hostType === "domain-controller" ? "target" : "host";
    nodes.push({
      id: `host-${host.id}`,
      type: nodeType,
      label: host.hostname ?? host.ip,
      data: { ip: host.ip, hostname: host.hostname, hostType: host.hostType, difficultyScore: host.difficultyScore, isDemo: host.isDemo },
      riskLevel,
    });

    for (const svc of services) {
      const svcId = `svc-${host.id}-${svc.port}`;
      const svcRisk = HIGH_RISK_PORTS.has(svc.port) ? "high" : (svc.riskLevel ?? "low");
      nodes.push({
        id: svcId,
        type: "service",
        label: `${svc.serviceName}:${svc.port}`,
        data: { port: svc.port, protocol: svc.serviceName, riskLevel: svcRisk },
        riskLevel: svcRisk,
      });
      edges.push({
        id: `edge-host-svc-${host.id}-${svc.port}`,
        source: `host-${host.id}`,
        target: svcId,
        label: "exposes",
      });

      if (svcRisk === "high") {
        const weakId = `weak-${host.id}-${svc.port}`;
        nodes.push({
          id: weakId,
          type: "weakness",
          label: `Weakness: ${svc.serviceName}`,
          data: { port: svc.port, serviceName: svc.serviceName },
          riskLevel: "high",
        });
        edges.push({
          id: `edge-svc-weak-${host.id}-${svc.port}`,
          source: svcId,
          target: weakId,
          label: "may indicate",
        });
      }
    }
  }

  for (const user of users) {
    const userType = user.privilegeLevel === "admin" ? "admin" : "user";
    nodes.push({
      id: `user-${user.id}`,
      type: userType,
      label: user.username,
      data: {
        privilegeLevel: user.privilegeLevel,
        mfaEnabled: user.mfaEnabled,
        accountType: user.accountType,
        riskFlags: (user.riskFlags as string[]) ?? [],
      },
      riskLevel: user.accountType === "dormant" ? "high" : user.privilegeLevel === "admin" ? "medium" : "low",
    });

    const userGroups = (user.groups as string[]) ?? [];
    for (const grpName of userGroups) {
      const grp = groups.find((g) => g.name === grpName);
      if (grp) {
        edges.push({
          id: `edge-user-grp-${user.id}-${grp.id}`,
          source: `user-${user.id}`,
          target: `group-${grp.id}`,
          label: "member of",
        });
      }
    }

    const linkedHosts = (user.linkedHosts as string[]) ?? [];
    for (const hostRef of linkedHosts) {
      const host = hosts.find((h) => h.ip === hostRef || h.hostname === hostRef);
      if (host) {
        edges.push({
          id: `edge-user-host-${user.id}-${host.id}`,
          source: `user-${user.id}`,
          target: `host-${host.id}`,
          label: "can authenticate to",
        });
      }
    }
  }

  for (const group of groups) {
    nodes.push({
      id: `group-${group.id}`,
      type: "group",
      label: group.name,
      data: { memberCount: group.memberCount, accessLevel: group.accessLevel, permissions: (group.permissions as string[]) ?? [] },
      riskLevel: group.accessLevel === "admin" ? "high" : "medium",
    });
  }

  res.json({ nodes, edges });
});

export default router;
