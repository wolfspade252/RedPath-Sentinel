import { Router, type IRouter } from "express";
import { db, hostsTable, identityUsersTable } from "@workspace/db";
import { eq, and, like, SQL } from "drizzle-orm";
import { getWeaknessesForPorts, calculateDifficultyScore } from "../lib/weaknessRules";
import { ListHostsQueryParams, GetHostParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/hosts", async (req, res): Promise<void> => {
  const qParams = ListHostsQueryParams.safeParse(req.query);
  if (!qParams.success) {
    res.status(400).json({ error: qParams.error.message });
    return;
  }

  const { ipFilter, hostnameFilter, scoreFilter, hostTypeFilter, scanId } = qParams.data;

  let hosts = await db.select().from(hostsTable);

  if (ipFilter) hosts = hosts.filter((h) => h.ip.includes(ipFilter));
  if (hostnameFilter) hosts = hosts.filter((h) => h.hostname?.toLowerCase().includes(hostnameFilter.toLowerCase()));
  if (scoreFilter) hosts = hosts.filter((h) => h.difficultyScore === scoreFilter);
  if (hostTypeFilter) hosts = hosts.filter((h) => h.hostType === hostTypeFilter);
  if (scanId !== undefined && scanId !== null) hosts = hosts.filter((h) => h.scanId === scanId);

  const { serviceFilter, portFilter, riskFilter } = qParams.data;

  if (serviceFilter || portFilter || riskFilter) {
    hosts = hosts.filter((h) => {
      const services = (h.services as { port: number; serviceName: string; riskLevel?: string | null }[]) ?? [];
      if (serviceFilter && !services.some((s) => s.serviceName.toLowerCase().includes(serviceFilter.toLowerCase()))) return false;
      if (portFilter && !services.some((s) => String(s.port) === portFilter)) return false;
      if (riskFilter && !services.some((s) => s.riskLevel === riskFilter)) return false;
      return true;
    });
  }

  const result = hosts.map((h) => {
    const services = (h.services as { port: number; protocol: string; serviceName: string; product?: string | null; version?: string | null; riskLevel?: string | null }[]) ?? [];
    return {
      id: h.id,
      ip: h.ip,
      hostname: h.hostname ?? null,
      status: h.status,
      osGuess: h.osGuess ?? null,
      macAddress: h.macAddress ?? null,
      openPorts: services.length,
      difficultyScore: h.difficultyScore,
      hostType: h.hostType,
      services,
      scanId: h.scanId ?? null,
      isDemo: h.isDemo,
    };
  });

  res.json(result);
});

router.get("/hosts/:id", async (req, res): Promise<void> => {
  const params = GetHostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [host] = await db.select().from(hostsTable).where(eq(hostsTable.id, params.data.id));
  if (!host) {
    res.status(404).json({ error: "Host not found" });
    return;
  }

  const services = (host.services as { port: number; protocol: string; serviceName: string; product?: string | null; version?: string | null; riskLevel?: string | null }[]) ?? [];
  const ports = services.map((s) => s.port);
  const weaknesses = getWeaknessesForPorts(ports);

  const allUsers = await db.select().from(identityUsersTable);
  const linkedUsers = allUsers.filter((u) => {
    const linkedHosts = (u.linkedHosts as string[]) ?? [];
    return linkedHosts.includes(host.ip) || linkedHosts.includes(host.hostname ?? "");
  });

  const hasDormant = linkedUsers.some((u) => u.accountType === "dormant");
  const hasPrivileged = linkedUsers.some((u) => u.privilegeLevel === "admin" || u.privilegeLevel === "high");
  const hasService = linkedUsers.some((u) => u.accountType === "service");
  const hasMfa = linkedUsers.every((u) => u.mfaEnabled);

  const { score, reason } = calculateDifficultyScore(ports, host.hostType, { hasDormant, hasPrivileged, hasService, hasMfa });

  const generalRecs = [
    "Apply the principle of least privilege to all accounts with access to this host",
    "Ensure all software on this host is patched and up to date",
    "Enable comprehensive logging and forward to a SIEM",
    "Conduct regular access reviews and remove unnecessary access",
    "Enforce MFA for all accounts that can authenticate to this host",
    "Apply network segmentation to limit exposure",
    "Monitor for unusual login times, locations, or volumes",
  ];

  const weaknessRecs = weaknesses.map((w) => w.recommendation);
  const recommendations = [...new Set([...weaknessRecs, ...generalRecs])].slice(0, 8);

  res.json({
    id: host.id,
    ip: host.ip,
    hostname: host.hostname ?? null,
    status: host.status,
    osGuess: host.osGuess ?? null,
    macAddress: host.macAddress ?? null,
    openPorts: services.length,
    difficultyScore: score,
    hostType: host.hostType,
    services,
    weaknesses,
    scoreReason: reason,
    recommendations,
    linkedUsers: linkedUsers.map((u) => ({
      id: u.id,
      username: u.username,
      privilegeLevel: u.privilegeLevel,
      mfaEnabled: u.mfaEnabled,
      accountType: u.accountType,
      groups: (u.groups as string[]) ?? [],
      linkedHosts: (u.linkedHosts as string[]) ?? [],
      riskFlags: (u.riskFlags as string[]) ?? [],
    })),
    isDemo: host.isDemo,
  });
});

export default router;
