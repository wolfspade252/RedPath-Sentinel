import { XMLParser } from "fast-xml-parser";
import { calculateDifficultyScore } from "./weaknessRules";

export interface ParsedService {
  port: number;
  protocol: string;
  serviceName: string;
  product: string | null;
  version: string | null;
  riskLevel: string | null;
}

export interface ParsedHost {
  ip: string;
  hostname: string | null;
  status: string;
  osGuess: string | null;
  macAddress: string | null;
  hostType: string;
  difficultyScore: string;
  services: ParsedService[];
}

const HIGH_RISK_PORTS = new Set([21, 23, 445, 3389, 389, 3306, 5432, 1433, 5985, 6379, 27017]);
const MEDIUM_RISK_PORTS = new Set([22, 80, 88, 135, 139, 53, 25, 8080]);

function getRiskLevel(port: number): string | null {
  if (HIGH_RISK_PORTS.has(port)) return "high";
  if (MEDIUM_RISK_PORTS.has(port)) return "medium";
  return "low";
}

function guessHostType(services: ParsedService[], osGuess: string | null): string {
  const ports = services.map((s) => s.port);
  const portSet = new Set(ports);
  const osLower = (osGuess ?? "").toLowerCase();

  if (portSet.has(389) || portSet.has(88) || portSet.has(3268)) return "domain-controller";
  if (portSet.has(445) && portSet.has(135)) return "server";
  if (portSet.has(3389) && !portSet.has(389)) return "workstation";
  if (portSet.has(80) || portSet.has(443) || portSet.has(8080)) return "server";
  if (osLower.includes("windows server") || osLower.includes("linux")) return "server";
  return "unknown";
}

export function parseNmapXml(xmlContent: string): ParsedHost[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["host", "port", "hostname", "osmatch", "address"].includes(name),
  });

  const result = parser.parse(xmlContent);
  const nmapRun = result?.nmaprun;
  if (!nmapRun) return [];

  const hosts = Array.isArray(nmapRun.host) ? nmapRun.host : nmapRun.host ? [nmapRun.host] : [];
  const parsedHosts: ParsedHost[] = [];

  for (const host of hosts) {
    const stateEl = host?.status;
    const status = stateEl?.["@_state"] ?? "unknown";
    if (status !== "up") continue;

    let ip = "";
    let macAddress: string | null = null;
    const addresses = Array.isArray(host.address) ? host.address : host.address ? [host.address] : [];
    for (const addr of addresses) {
      if (addr["@_addrtype"] === "ipv4") ip = addr["@_addr"] ?? "";
      if (addr["@_addrtype"] === "mac") macAddress = addr["@_addr"] ?? null;
    }

    if (!ip) continue;

    let hostname: string | null = null;
    const hostnames = host.hostnames?.hostname;
    if (hostnames) {
      const hostnameArr = Array.isArray(hostnames) ? hostnames : [hostnames];
      hostname = hostnameArr[0]?.["@_name"] ?? null;
    }

    let osGuess: string | null = null;
    const osMatches = host?.os?.osmatch;
    if (osMatches) {
      const osArr = Array.isArray(osMatches) ? osMatches : [osMatches];
      osGuess = osArr[0]?.["@_name"] ?? null;
    }

    const services: ParsedService[] = [];
    const portsEl = host?.ports?.port;
    if (portsEl) {
      const portArr = Array.isArray(portsEl) ? portsEl : [portsEl];
      for (const p of portArr) {
        if (p?.state?.["@_state"] !== "open") continue;
        const portNum = parseInt(p["@_portid"] ?? "0", 10);
        const proto = p["@_protocol"] ?? "tcp";
        const svcEl = p?.service ?? {};
        const serviceName = svcEl["@_name"] ?? "unknown";
        const product = svcEl["@_product"] ?? null;
        const version = svcEl["@_version"] ?? null;

        services.push({
          port: portNum,
          protocol: proto,
          serviceName,
          product,
          version,
          riskLevel: getRiskLevel(portNum),
        });
      }
    }

    const hostType = guessHostType(services, osGuess);
    const ports = services.map((s) => s.port);
    const { score } = calculateDifficultyScore(ports, hostType);

    parsedHosts.push({
      ip,
      hostname,
      status,
      osGuess,
      macAddress,
      hostType,
      difficultyScore: score,
      services,
    });
  }

  return parsedHosts;
}
