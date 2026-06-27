export interface AttackPathStep {
  stepNumber: number;
  actor: string;
  action: string;
  target: string;
  explanation: string;
}

export interface SimulatedAttackPath {
  steps: AttackPathStep[];
  riskSummary: string;
  controlWeaknesses: string[];
  defensiveActions: string[];
}

interface PathTemplate {
  identityMatch: string[];
  targetMatch: string[];
  steps: Omit<AttackPathStep, "stepNumber">[];
  riskSummary: string;
  controlWeaknesses: string[];
  defensiveActions: string[];
}

const PATH_TEMPLATES: PathTemplate[] = [
  {
    identityMatch: ["dormant account", "dormant"],
    targetMatch: ["file server", "FILE01"],
    steps: [
      {
        actor: "Dormant Account",
        action: "credentials remain valid",
        target: "Active Directory",
        explanation: "The dormant account has not been disabled. Its credentials may still be valid if the password has not expired or been rotated.",
      },
      {
        actor: "Dormant Account",
        action: "is member of",
        target: "File Share Admins Group",
        explanation: "Dormant accounts often retain group memberships accumulated over time, including access to sensitive shares.",
      },
      {
        actor: "File Share Admins Group",
        action: "has access to",
        target: "File Server (FILE01)",
        explanation: "Group membership grants SMB access to the file server. Without review, this path remains open.",
      },
      {
        actor: "File Server (FILE01)",
        action: "exposes SMB shares with",
        target: "Sensitive Data",
        explanation: "SMB shares on the file server may contain sensitive data accessible to anyone with valid group credentials.",
      },
    ],
    riskSummary: "A dormant account with active group memberships creates a silent entry path to sensitive file shares. Because the account is not monitored, access may go undetected.",
    controlWeaknesses: [
      "Dormant account not disabled after inactivity period",
      "No regular review of group memberships for stale accounts",
      "SMB shares lack fine-grained permission controls",
      "No alerting on dormant account login attempts",
    ],
    defensiveActions: [
      "Implement an automated policy to disable accounts inactive for 30+ days",
      "Conduct quarterly access reviews to remove stale group memberships",
      "Apply file share permissions based on least privilege",
      "Enable alerts for login attempts from dormant accounts",
      "Enable SMB signing to prevent relay attacks on this path",
    ],
  },
  {
    identityMatch: ["helpdesk user", "helpdesk"],
    targetMatch: ["domain controller", "DC01"],
    steps: [
      {
        actor: "Helpdesk User",
        action: "has password reset rights over",
        target: "Domain Admin Account",
        explanation: "Helpdesk accounts are often granted broad password reset rights including over privileged accounts, violating the principle of least privilege.",
      },
      {
        actor: "Helpdesk User",
        action: "resets password for",
        target: "Domain Admin Account",
        explanation: "If a helpdesk account is compromised, an attacker can reset the Domain Admin password and take full control.",
      },
      {
        actor: "Domain Admin Account",
        action: "authenticates to",
        target: "Domain Controller (DC01)",
        explanation: "Domain Admin credentials grant full access to the domain controller, the highest privilege target in the environment.",
      },
    ],
    riskSummary: "A helpdesk account with overly broad password reset delegation creates a privilege escalation path to Domain Admin access through the domain controller.",
    controlWeaknesses: [
      "Helpdesk accounts have password reset rights over privileged accounts",
      "No tiered administration model enforced",
      "Privileged Account Management (PAM) not in use",
      "No alerting on password resets for admin accounts",
    ],
    defensiveActions: [
      "Implement a tiered administration model — helpdesk accounts should only reset non-privileged user passwords",
      "Use a Privileged Access Management (PAM) solution for admin account credential management",
      "Alert on any password reset targeting accounts in privileged groups",
      "Require MFA for all privileged account authentication",
      "Audit and limit delegation of password reset rights in Active Directory",
    ],
  },
  {
    identityMatch: ["service account", "svc_backup"],
    targetMatch: ["domain controller", "sensitive application", "DC01"],
    steps: [
      {
        actor: "Service Account (svc_backup)",
        action: "runs with high privilege on",
        target: "Multiple Hosts",
        explanation: "The service account has been granted high privileges across multiple systems to perform backup operations.",
      },
      {
        actor: "Service Account (svc_backup)",
        action: "password is static and long-lived on",
        target: "Active Directory",
        explanation: "Service accounts often have passwords that are rarely rotated, making them persistent targets if the hash is obtained.",
      },
      {
        actor: "Service Account",
        action: "has access to",
        target: "Domain Controller (DC01)",
        explanation: "Backup service accounts may need access to domain controllers. This grants a path to the highest-value target.",
      },
    ],
    riskSummary: "A high-privilege service account with a static long-lived password and broad host access creates a persistent, high-value attack target.",
    controlWeaknesses: [
      "Service account uses a static password without rotation policy",
      "Service account has broader privileges than required for its function",
      "No monitoring for unusual service account activity",
      "Service account may be susceptible to Kerberoasting if SPN is registered",
    ],
    defensiveActions: [
      "Migrate to Group Managed Service Accounts (gMSA) for automatic password rotation",
      "Apply least privilege to service account permissions — limit access to required systems only",
      "Monitor and alert on service account logins outside expected patterns",
      "Audit SPNs registered to service accounts and remove unnecessary ones",
      "Use Managed Identity or similar modern authentication where possible",
    ],
  },
  {
    identityMatch: ["low privilege user", "low privilege"],
    targetMatch: ["workstation", "WORKSTATION01"],
    steps: [
      {
        actor: "Low Privilege User",
        action: "authenticates via RDP to",
        target: "Workstation (WORKSTATION01)",
        explanation: "Low privilege users may have RDP access to workstations for remote work. If MFA is not enforced, credential theft is sufficient.",
      },
      {
        actor: "Low Privilege User",
        action: "accesses cached credentials on",
        target: "Workstation",
        explanation: "If administrative tools or cached credentials are present on the workstation, privilege escalation may be possible.",
      },
      {
        actor: "Workstation",
        action: "has path to",
        target: "File Server via SMB",
        explanation: "From the workstation, the attacker can pivot to other network resources using the authenticated session.",
      },
    ],
    riskSummary: "A low privilege user with RDP access and no MFA requirement provides an initial foothold on workstations, from which lateral movement is possible.",
    controlWeaknesses: [
      "RDP access not restricted to required users only",
      "MFA not enforced for RDP sessions",
      "Cached credentials present on workstations",
      "No session monitoring for RDP connections",
    ],
    defensiveActions: [
      "Restrict RDP access to required users via Group Policy and firewall rules",
      "Enforce MFA for all remote desktop sessions",
      "Enable Credential Guard to protect cached credentials on workstations",
      "Enable session recording and alerting for RDP connections",
      "Apply account lockout policies to limit brute force attempts",
    ],
  },
  {
    identityMatch: ["local admin"],
    targetMatch: ["file server", "domain controller", "FILE01", "DC01"],
    steps: [
      {
        actor: "Local Admin Account",
        action: "shares the same password across",
        target: "Multiple Hosts",
        explanation: "If local admin accounts share the same password across workstations and servers, a single credential compromise affects all hosts.",
      },
      {
        actor: "Local Admin",
        action: "authenticates to",
        target: "File Server (FILE01)",
        explanation: "Using pass-the-hash or direct authentication, the compromised local admin credential provides access to additional servers.",
      },
      {
        actor: "File Server",
        action: "allows privilege escalation to",
        target: "Domain Admin via cached tokens",
        explanation: "From a server with admin access, domain admin tokens may be cached in memory, providing a path to full domain control.",
      },
    ],
    riskSummary: "Shared local admin passwords enable lateral movement across the environment, potentially reaching domain admin level through cached credential harvesting.",
    controlWeaknesses: [
      "Local admin passwords are not unique per host",
      "LAPS (Local Admin Password Solution) not deployed",
      "Pass-the-hash attacks possible without credential protection",
      "Domain admin tokens cached on member servers",
    ],
    defensiveActions: [
      "Deploy Microsoft LAPS (Local Administrator Password Solution) to randomize local admin passwords per host",
      "Enable Protected Users security group for admin accounts to prevent credential caching",
      "Enable Windows Credential Guard",
      "Apply tiered administration — Domain Admins should only log in to Domain Controllers",
      "Enable SMB signing to prevent pass-the-hash relay attacks",
    ],
  },
  {
    identityMatch: ["domain admin"],
    targetMatch: ["sensitive application", "file server", "domain controller"],
    steps: [
      {
        actor: "Domain Admin",
        action: "logs into workstation for email",
        target: "Workstation (WORKSTATION01)",
        explanation: "Domain Admins using their privileged account for everyday tasks like email leave domain admin tokens in memory on workstations.",
      },
      {
        actor: "Domain Admin credentials",
        action: "cached in memory on",
        target: "Workstation",
        explanation: "Once domain admin credentials are in memory, any local admin or SYSTEM-level access can extract them.",
      },
      {
        actor: "Domain Admin credentials",
        action: "provide full access to",
        target: "All Domain Resources",
        explanation: "Domain Admin credentials grant unrestricted access to all domain-joined systems, including domain controllers and all data.",
      },
    ],
    riskSummary: "Domain Admin credentials used on non-Tier 0 systems (workstations, member servers) leave privileged tokens exposed, creating paths to total domain compromise.",
    controlWeaknesses: [
      "Domain Admin accounts used for daily tasks on non-privileged systems",
      "No separation between privileged and non-privileged accounts",
      "Tiered administration model not enforced",
      "No alerting on Domain Admin interactive logons to workstations",
    ],
    defensiveActions: [
      "Implement tiered administration — Domain Admins must only use Privileged Access Workstations (PAWs)",
      "Create separate accounts for daily tasks — never use Domain Admin for email or browsing",
      "Enable alerting for any Domain Admin logon to a non-Tier-0 system",
      "Apply Protected Users group to all Domain Admin accounts",
      "Consider just-in-time (JIT) admin access using PAM solutions",
    ],
  },
];

export function simulateAttackPath(
  startIdentity: string,
  targetHost: string
): SimulatedAttackPath {
  const startLower = startIdentity.toLowerCase();
  const targetLower = targetHost.toLowerCase();

  let best: PathTemplate | undefined;
  let bestScore = -1;

  for (const template of PATH_TEMPLATES) {
    let score = 0;
    for (const id of template.identityMatch) {
      if (startLower.includes(id) || id.includes(startLower)) score += 2;
    }
    for (const tgt of template.targetMatch) {
      if (targetLower.includes(tgt.toLowerCase()) || tgt.toLowerCase().includes(targetLower)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = template;
    }
  }

  if (!best) {
    best = PATH_TEMPLATES[0];
  }

  const steps: AttackPathStep[] = best.steps.map((s, i) => ({
    ...s,
    stepNumber: i + 1,
    actor: s.actor.includes("Dormant") ? startIdentity : s.actor,
    target: i === best!.steps.length - 1 ? targetHost : s.target,
  }));

  return {
    steps,
    riskSummary: best.riskSummary,
    controlWeaknesses: best.controlWeaknesses,
    defensiveActions: best.defensiveActions,
  };
}
