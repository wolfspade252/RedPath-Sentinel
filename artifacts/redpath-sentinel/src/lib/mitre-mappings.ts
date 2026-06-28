export interface MitreTechnique {
  id: string;
  name: string;
  url: string;
}

export interface PortMitreMapping {
  port: number;
  techniques: MitreTechnique[];
}

export const PORT_MITRE_MAPPINGS: PortMitreMapping[] = [
  {
    port: 445,
    techniques: [
      { id: "T1021.002", name: "SMB/Windows Admin Shares", url: "https://attack.mitre.org/techniques/T1021/002/" },
      { id: "T1550.002", name: "Pass the Hash", url: "https://attack.mitre.org/techniques/T1550/002/" },
      { id: "T1557", name: "Adversary-in-the-Middle", url: "https://attack.mitre.org/techniques/T1557/" },
    ],
  },
  {
    port: 389,
    techniques: [
      { id: "T1087", name: "Account Discovery", url: "https://attack.mitre.org/techniques/T1087/" },
      { id: "T1069", name: "Permission Groups Discovery", url: "https://attack.mitre.org/techniques/T1069/" },
    ],
  },
  {
    port: 636,
    techniques: [
      { id: "T1087", name: "Account Discovery", url: "https://attack.mitre.org/techniques/T1087/" },
      { id: "T1069", name: "Permission Groups Discovery", url: "https://attack.mitre.org/techniques/T1069/" },
    ],
  },
  {
    port: 88,
    techniques: [
      { id: "T1558", name: "Steal or Forge Kerberos Tickets", url: "https://attack.mitre.org/techniques/T1558/" },
      { id: "T1558.003", name: "Kerberoasting", url: "https://attack.mitre.org/techniques/T1558/003/" },
      { id: "T1558.004", name: "AS-REP Roasting", url: "https://attack.mitre.org/techniques/T1558/004/" },
    ],
  },
  {
    port: 5985,
    techniques: [
      { id: "T1021.006", name: "Windows Remote Management", url: "https://attack.mitre.org/techniques/T1021/006/" },
    ],
  },
  {
    port: 5986,
    techniques: [
      { id: "T1021.006", name: "Windows Remote Management", url: "https://attack.mitre.org/techniques/T1021/006/" },
    ],
  },
  {
    port: 53,
    techniques: [
      { id: "T1590", name: "Gather Victim Network Info", url: "https://attack.mitre.org/techniques/T1590/" },
      { id: "T1071.004", name: "DNS C2 Channel", url: "https://attack.mitre.org/techniques/T1071/004/" },
    ],
  },
  {
    port: 3389,
    techniques: [
      { id: "T1021.001", name: "Remote Desktop Protocol", url: "https://attack.mitre.org/techniques/T1021/001/" },
      { id: "T1110", name: "Brute Force", url: "https://attack.mitre.org/techniques/T1110/" },
    ],
  },
  {
    port: 22,
    techniques: [
      { id: "T1021.004", name: "SSH", url: "https://attack.mitre.org/techniques/T1021/004/" },
      { id: "T1110", name: "Brute Force", url: "https://attack.mitre.org/techniques/T1110/" },
    ],
  },
  {
    port: 21,
    techniques: [
      { id: "T1071.002", name: "File Transfer Protocols", url: "https://attack.mitre.org/techniques/T1071/002/" },
      { id: "T1048", name: "Exfiltration Over Alt Protocol", url: "https://attack.mitre.org/techniques/T1048/" },
    ],
  },
  {
    port: 23,
    techniques: [
      { id: "T1021", name: "Remote Services", url: "https://attack.mitre.org/techniques/T1021/" },
      { id: "T1040", name: "Network Sniffing", url: "https://attack.mitre.org/techniques/T1040/" },
    ],
  },
  {
    port: 3306,
    techniques: [
      { id: "T1190", name: "Exploit Public-Facing Application", url: "https://attack.mitre.org/techniques/T1190/" },
      { id: "T1005", name: "Data from Local System", url: "https://attack.mitre.org/techniques/T1005/" },
    ],
  },
  {
    port: 1433,
    techniques: [
      { id: "T1190", name: "Exploit Public-Facing Application", url: "https://attack.mitre.org/techniques/T1190/" },
      { id: "T1059.003", name: "Windows Command Shell via xp_cmdshell", url: "https://attack.mitre.org/techniques/T1059/003/" },
    ],
  },
  {
    port: 135,
    techniques: [
      { id: "T1021.003", name: "Distributed Component Object Model", url: "https://attack.mitre.org/techniques/T1021/003/" },
      { id: "T1047", name: "Windows Management Instrumentation", url: "https://attack.mitre.org/techniques/T1047/" },
    ],
  },
  {
    port: 139,
    techniques: [
      { id: "T1557", name: "Adversary-in-the-Middle", url: "https://attack.mitre.org/techniques/T1557/" },
      { id: "T1135", name: "Network Share Discovery", url: "https://attack.mitre.org/techniques/T1135/" },
    ],
  },
  {
    port: 6379,
    techniques: [
      { id: "T1190", name: "Exploit Public-Facing Application", url: "https://attack.mitre.org/techniques/T1190/" },
    ],
  },
  {
    port: 80,
    techniques: [
      { id: "T1190", name: "Exploit Public-Facing Application", url: "https://attack.mitre.org/techniques/T1190/" },
      { id: "T1040", name: "Network Sniffing", url: "https://attack.mitre.org/techniques/T1040/" },
    ],
  },
  {
    port: 8080,
    techniques: [
      { id: "T1190", name: "Exploit Public-Facing Application", url: "https://attack.mitre.org/techniques/T1190/" },
    ],
  },
];

const mitreByPort = new Map(PORT_MITRE_MAPPINGS.map((m) => [m.port, m.techniques]));

export function getMitreTechniques(port: number): MitreTechnique[] {
  return mitreByPort.get(port) ?? [];
}

export function difficultyToNumeric(score: "easy" | "medium" | "hard"): number {
  if (score === "easy") return 8;
  if (score === "medium") return 5;
  return 2;
}

export function numericDifficultyLabel(n: number): { label: string; color: string } {
  if (n >= 7) return { label: "High Risk", color: "text-destructive" };
  if (n >= 4) return { label: "Medium Risk", color: "text-chart-2" };
  return { label: "Low Risk", color: "text-primary" };
}
