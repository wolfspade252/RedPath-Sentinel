export interface WeaknessRule {
  port: number;
  serviceName: string;
  riskLevel: "high" | "medium" | "low";
  observation: string;
  whyItMatters: string;
  recommendation: string;
}

export const WEAKNESS_RULES: WeaknessRule[] = [
  {
    port: 22,
    serviceName: "SSH",
    riskLevel: "medium",
    observation: "SSH remote access is exposed.",
    whyItMatters: "SSH allows remote command execution. If password authentication is enabled or keys are weak, an attacker with valid credentials could gain shell access.",
    recommendation: "Enforce key-based authentication only, disable password login, apply MFA where possible, restrict source IPs with firewall rules, and review failed login attempts regularly.",
  },
  {
    port: 21,
    serviceName: "FTP",
    riskLevel: "high",
    observation: "FTP service is exposed.",
    whyItMatters: "FTP transmits credentials and data in cleartext. Anonymous login may be enabled. An attacker could intercept credentials or access sensitive files.",
    recommendation: "Disable FTP if not required. Replace with SFTP or FTPS. Disable anonymous login. Review what files are accessible and apply strict access controls.",
  },
  {
    port: 23,
    serviceName: "Telnet",
    riskLevel: "high",
    observation: "Telnet remote access is exposed.",
    whyItMatters: "Telnet transmits all data including credentials in cleartext. This is a critical exposure on any network.",
    recommendation: "Disable Telnet immediately. Replace with SSH. Block port 23 at the firewall.",
  },
  {
    port: 80,
    serviceName: "HTTP",
    riskLevel: "medium",
    observation: "Unencrypted HTTP web service is exposed.",
    whyItMatters: "HTTP transmits data without encryption. Sensitive data, session tokens, and credentials may be intercepted. Default web pages may reveal software versions.",
    recommendation: "Redirect all HTTP to HTTPS. Check for default pages and admin panels. Keep web software patched. Remove version information from server headers.",
  },
  {
    port: 443,
    serviceName: "HTTPS",
    riskLevel: "low",
    observation: "HTTPS web service is exposed.",
    whyItMatters: "HTTPS is expected but weak TLS configurations, expired certificates, or exposed admin panels can still introduce risk.",
    recommendation: "Verify TLS version (TLS 1.2+ only), check certificate validity, remove or restrict admin panels, keep web software patched.",
  },
  {
    port: 445,
    serviceName: "SMB",
    riskLevel: "high",
    observation: "SMB file sharing is exposed.",
    whyItMatters: "SMB can expose file shares and lateral movement paths. Without SMB signing, traffic can be intercepted. Guest access may expose sensitive data. Historically vulnerable to exploits like EternalBlue.",
    recommendation: "Require SMB signing, disable guest access, review and restrict share permissions, disable SMBv1, patch Windows systems, and restrict SMB access to required hosts only.",
  },
  {
    port: 3389,
    serviceName: "RDP",
    riskLevel: "high",
    observation: "Remote Desktop Protocol is exposed.",
    whyItMatters: "RDP is a high-value target. Without MFA, a compromised account grants full desktop access. Exposed RDP has historically been a top ransomware entry point.",
    recommendation: "Restrict RDP access via firewall to specific IPs only. Enforce MFA. Apply account lockout policies. Use Network Level Authentication. Monitor and alert on RDP login attempts.",
  },
  {
    port: 389,
    serviceName: "LDAP",
    riskLevel: "high",
    observation: "LDAP directory service is exposed.",
    whyItMatters: "LDAP may allow anonymous binds that reveal directory structure, users, and groups. Unencrypted LDAP exposes authentication traffic.",
    recommendation: "Disable anonymous LDAP binds, enforce LDAP signing and channel binding, use LDAPS (port 636) instead, restrict LDAP access to required hosts.",
  },
  {
    port: 636,
    serviceName: "LDAPS",
    riskLevel: "low",
    observation: "LDAPS (encrypted LDAP) is exposed.",
    whyItMatters: "LDAPS is the correct approach but may still allow anonymous queries or reveal directory information.",
    recommendation: "Verify anonymous binds are disabled, enforce LDAP signing, and restrict access to required hosts.",
  },
  {
    port: 88,
    serviceName: "Kerberos",
    riskLevel: "medium",
    observation: "Kerberos authentication service is exposed.",
    whyItMatters: "Indicates a domain controller. Kerberoasting and AS-REP Roasting attacks target Kerberos to obtain password hashes offline.",
    recommendation: "Use long, random passwords for service accounts. Enable AES encryption for Kerberos. Disable Pre-authentication only where absolutely required. Monitor for unusual Kerberos ticket requests.",
  },
  {
    port: 53,
    serviceName: "DNS",
    riskLevel: "medium",
    observation: "DNS service is exposed.",
    whyItMatters: "DNS zone transfers may reveal the full network map. DNS recursion may be abused for amplification attacks. Misconfigured DNS can expose internal naming.",
    recommendation: "Restrict DNS zone transfers to authorized secondary servers only. Disable recursive queries for external clients. Monitor DNS query logs for unusual patterns.",
  },
  {
    port: 3306,
    serviceName: "MySQL",
    riskLevel: "high",
    observation: "MySQL database is exposed.",
    whyItMatters: "Database services exposed to the network risk direct access to sensitive data. Weak authentication or default credentials may grant full data access.",
    recommendation: "Bind MySQL to localhost or a private interface. Use strong authentication. Restrict remote root login. Apply least privilege to database accounts. Keep MySQL patched.",
  },
  {
    port: 5432,
    serviceName: "PostgreSQL",
    riskLevel: "high",
    observation: "PostgreSQL database is exposed.",
    whyItMatters: "Exposed database access can allow direct data exfiltration or command execution. Weak authentication may grant privileged access.",
    recommendation: "Restrict PostgreSQL to localhost or a private network. Use strong passwords and client certificate authentication. Apply role-based access control.",
  },
  {
    port: 1433,
    serviceName: "MSSQL",
    riskLevel: "high",
    observation: "Microsoft SQL Server is exposed.",
    whyItMatters: "MSSQL exposure may allow SQL injection escalation, xp_cmdshell abuse, or direct data access. Default sa accounts may not be secured.",
    recommendation: "Disable the sa account or use a strong password. Disable xp_cmdshell. Restrict access to required application servers only. Keep SQL Server patched.",
  },
  {
    port: 5985,
    serviceName: "WinRM",
    riskLevel: "high",
    observation: "Windows Remote Management is exposed.",
    whyItMatters: "WinRM allows remote PowerShell execution. If exposed broadly, an attacker with valid credentials can run commands remotely and move laterally.",
    recommendation: "Restrict WinRM to authorized management hosts only. Enforce HTTPS (port 5986). Apply MFA and monitor remote sessions.",
  },
  {
    port: 5986,
    serviceName: "WinRM-HTTPS",
    riskLevel: "medium",
    observation: "Windows Remote Management over HTTPS is exposed.",
    whyItMatters: "Encrypted WinRM is better but still exposes remote command execution if credentials are compromised.",
    recommendation: "Restrict to authorized management hosts. Apply MFA. Monitor remote sessions and log all WinRM activity.",
  },
  {
    port: 135,
    serviceName: "RPC",
    riskLevel: "medium",
    observation: "Microsoft RPC endpoint mapper is exposed.",
    whyItMatters: "RPC is used for DCOM, WMI, and other Windows services. Exposed RPC can be a lateral movement vector.",
    recommendation: "Restrict RPC access via firewall. Limit DCOM and WMI access to required hosts. Keep Windows patched.",
  },
  {
    port: 139,
    serviceName: "NetBIOS",
    riskLevel: "medium",
    observation: "NetBIOS session service is exposed.",
    whyItMatters: "NetBIOS is an older protocol that can expose computer names and facilitate SMB relay attacks.",
    recommendation: "Disable NetBIOS over TCP/IP on all interfaces where it is not required. Restrict via firewall.",
  },
  {
    port: 25,
    serviceName: "SMTP",
    riskLevel: "medium",
    observation: "SMTP mail service is exposed.",
    whyItMatters: "Open SMTP relays can be abused for spam. Misconfigured SMTP may reveal internal mail structure.",
    recommendation: "Restrict SMTP relay to authorized senders only. Use STARTTLS or SMTPS. Review mail server configuration for open relay status.",
  },
  {
    port: 110,
    serviceName: "POP3",
    riskLevel: "medium",
    observation: "POP3 mail retrieval is exposed.",
    whyItMatters: "Unencrypted POP3 transmits credentials in cleartext.",
    recommendation: "Disable POP3 and use POP3S (port 995) instead. Consider migrating to IMAP.",
  },
  {
    port: 8080,
    serviceName: "HTTP-Alt",
    riskLevel: "medium",
    observation: "Alternate HTTP port is exposed.",
    whyItMatters: "Admin panels, development servers, or proxy services on alternate ports may have weaker authentication or run outdated software.",
    recommendation: "Identify what is running on this port. Restrict access if it is an admin interface. Keep software patched. Do not expose development servers to the network.",
  },
  {
    port: 8443,
    serviceName: "HTTPS-Alt",
    riskLevel: "low",
    observation: "Alternate HTTPS port is exposed.",
    whyItMatters: "Services on non-standard ports may be admin panels or APIs that require authentication review.",
    recommendation: "Identify the service and restrict access as appropriate. Verify TLS configuration.",
  },
  {
    port: 6379,
    serviceName: "Redis",
    riskLevel: "high",
    observation: "Redis in-memory database is exposed.",
    whyItMatters: "Redis by default has no authentication. An exposed Redis instance allows reading all cached data and may allow configuration changes leading to code execution.",
    recommendation: "Never expose Redis to public networks. Bind to localhost only. Enable Redis AUTH. Use firewall rules to restrict access.",
  },
  {
    port: 27017,
    serviceName: "MongoDB",
    riskLevel: "high",
    observation: "MongoDB database is exposed.",
    whyItMatters: "Unauthenticated MongoDB instances have historically led to mass data breaches. Direct access to the database may expose all stored data.",
    recommendation: "Enable MongoDB authentication. Bind to a private interface only. Apply IP allowlisting. Regularly audit database access.",
  },
];

const HIGH_RISK_SERVICES = new Set([21, 23, 445, 3389, 389, 3306, 5432, 1433, 5985, 6379, 27017]);
const REMOTE_ACCESS_SERVICES = new Set([22, 23, 3389, 5985, 5986]);

export function getWeaknessesForPorts(ports: number[]): WeaknessRule[] {
  const weaknesses: WeaknessRule[] = [];
  for (const port of ports) {
    const rule = WEAKNESS_RULES.find((r) => r.port === port);
    if (rule) weaknesses.push(rule);
  }
  return weaknesses;
}

export interface ScoreResult {
  score: "easy" | "medium" | "hard";
  reason: string;
}

export function calculateDifficultyScore(
  ports: number[],
  hostType: string,
  linkedUserFlags?: { hasDormant: boolean; hasPrivileged: boolean; hasService: boolean; hasMfa: boolean }
): ScoreResult {
  const portSet = new Set(ports);
  const highRiskCount = ports.filter((p) => HIGH_RISK_SERVICES.has(p)).length;
  const remoteAccessCount = ports.filter((p) => REMOTE_ACCESS_SERVICES.has(p)).length;
  const flags = linkedUserFlags ?? { hasDormant: false, hasPrivileged: false, hasService: false, hasMfa: true };

  let easyPoints = 0;
  let hardPoints = 0;
  const reasons: string[] = [];

  if (highRiskCount >= 3) {
    easyPoints += 3;
    reasons.push(`${highRiskCount} high-risk services exposed`);
  } else if (highRiskCount >= 1) {
    easyPoints += 1;
    reasons.push(`${highRiskCount} high-risk service(s) exposed`);
  } else {
    hardPoints += 2;
    reasons.push("no high-risk services detected");
  }

  if (remoteAccessCount >= 2) {
    easyPoints += 2;
    reasons.push("multiple remote access services exposed");
  } else if (remoteAccessCount === 1) {
    easyPoints += 1;
    reasons.push("remote access service exposed");
  } else {
    hardPoints += 1;
    reasons.push("no direct remote access exposed");
  }

  if (hostType === "domain-controller") {
    easyPoints += 1;
    reasons.push("host is a domain controller (high-value target)");
  }

  if (flags.hasDormant) {
    easyPoints += 2;
    reasons.push("dormant accounts linked");
  }

  if (flags.hasPrivileged && !flags.hasMfa) {
    easyPoints += 2;
    reasons.push("privileged accounts without MFA");
  } else if (flags.hasPrivileged && flags.hasMfa) {
    hardPoints += 1;
    reasons.push("privileged accounts with MFA enabled");
  }

  if (flags.hasService) {
    easyPoints += 1;
    reasons.push("service accounts linked");
  }

  if (ports.length <= 2 && highRiskCount === 0) {
    hardPoints += 2;
    reasons.push("minimal attack surface");
  }

  const total = easyPoints - hardPoints;
  let score: "easy" | "medium" | "hard";
  let scoreLabel: string;

  if (total >= 4) {
    score = "easy";
    scoreLabel = "Easy target";
  } else if (total <= 0) {
    score = "hard";
    scoreLabel = "Hard target";
  } else {
    score = "medium";
    scoreLabel = "Medium difficulty target";
  }

  const reason = `${scoreLabel}: ${reasons.join(", ")}.`;
  return { score, reason };
}
