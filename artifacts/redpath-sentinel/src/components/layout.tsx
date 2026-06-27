import { Link, useLocation } from "wouter";
import { Activity, ShieldAlert, Users, Network, FileText, Server } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Activity },
  { name: "Graph", href: "/graph", icon: Network },
  { name: "Hosts", href: "/hosts", icon: Server },
  { name: "Identities", href: "/identities", icon: Users },
  { name: "Attack Paths", href: "/attack-paths", icon: ShieldAlert },
  { name: "Report", href: "/report", icon: FileText },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background text-foreground font-mono">
      <aside className="w-full md:w-64 border-b md:border-r border-border bg-card flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 font-bold text-xl text-primary mb-8 tracking-tight">
            <ShieldAlert className="w-6 h-6" />
            <span>REDPATH</span>
          </div>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto h-full">{children}</div>
      </main>
    </div>
  );
}