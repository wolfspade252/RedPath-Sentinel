import { Link, useLocation } from "wouter";
import { Activity, ShieldAlert, Users, Network, FileText, Server, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetDashboard } from "@workspace/api-client-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Activity },
  { name: "Network Graph", href: "/graph", icon: Network },
  { name: "Hosts", href: "/hosts", icon: Server },
  { name: "Identities", href: "/identities", icon: Users },
  { name: "Attack Paths", href: "/attack-paths", icon: ShieldAlert },
  { name: "Reports", href: "/report", icon: FileText },
];

function ScanSummaryCard() {
  const { data } = useGetDashboard();

  if (!data) return null;

  const items = [
    { label: "Hosts", value: data.totalHosts, color: "text-cyan-400" },
    { label: "Open Ports", value: data.openPorts, color: "text-blue-400" },
    { label: "High Risk", value: data.highRiskServices, color: "text-red-400" },
    { label: "Identity Risks", value: data.identityRisks, color: "text-orange-400" },
  ];

  return (
    <div className="mt-6 rounded-md border border-border/50 bg-muted/10 p-3 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Scan Summary</p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col">
            <span className={cn("text-base font-bold font-mono", item.color)}>{item.value}</span>
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="pt-1 border-t border-border/30 space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Easy targets</span>
          <span className="text-destructive font-mono">{data.easyTargets}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Medium targets</span>
          <span className="text-chart-2 font-mono">{data.mediumTargets}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Hard targets</span>
          <span className="text-primary font-mono">{data.hardTargets}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Attack paths</span>
          <span className="text-muted-foreground font-mono">{data.attackPaths}</span>
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background text-foreground font-mono">
      <aside className="w-full md:w-56 border-b md:border-r border-border bg-card flex-shrink-0 flex flex-col">
        <div className="p-5 flex-1">
          <div className="flex items-center gap-2 font-bold text-lg text-primary mb-6 tracking-tight">
            <ShieldAlert className="w-5 h-5" />
            <span>REDPATH</span>
          </div>
          <nav className="space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>
          <ScanSummaryCard />
        </div>
        <div className="p-5 border-t border-border/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            <Settings className="w-3.5 h-3.5" />
            Settings
          </div>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto h-full">{children}</div>
      </main>
    </div>
  );
}
