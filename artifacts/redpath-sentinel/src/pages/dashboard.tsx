import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Server, Activity, ShieldAlert, Crosshair, Target } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useGetDashboard();

  if (isError) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-destructive text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Failed to load dashboard data</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Ops Center</h1>
        <p className="text-muted-foreground">Portfolio overview of security posture.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Hosts" value={stats?.totalHosts} icon={Server} isLoading={isLoading} />
        <StatCard title="Open Ports" value={stats?.totalOpenPorts} icon={Activity} isLoading={isLoading} />
        <StatCard title="High Risk Services" value={stats?.highRiskServices} icon={AlertCircle} className="text-destructive" isLoading={isLoading} />
        <StatCard title="Identity Risks" value={stats?.identityRisks} icon={ShieldAlert} className="text-chart-2" isLoading={isLoading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Easy Targets" value={stats?.easyTargets} icon={Target} className="text-destructive" isLoading={isLoading} />
        <StatCard title="Medium Targets" value={stats?.mediumTargets} icon={Target} className="text-chart-2" isLoading={isLoading} />
        <StatCard title="Hard Targets" value={stats?.hardTargets} icon={Target} className="text-primary" isLoading={isLoading} />
        <StatCard title="Attack Paths" value={stats?.totalAttackPaths} icon={Crosshair} isLoading={isLoading} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, className, isLoading }: { title: string; value?: number; icon: any; className?: string; isLoading: boolean }) {
  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${className || "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className={`text-2xl font-bold ${className || "text-foreground"}`}>{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
