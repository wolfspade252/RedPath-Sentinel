import { useState } from "react";
import { useListAttackPaths, useSimulateAttackPath } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, Play, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const identities = ["Low Privilege User", "Helpdesk User", "Dormant Account", "Service Account", "Local Admin", "Domain Admin"];
const targets = ["Workstation", "File Server", "Domain Controller", "Admin Group", "Sensitive Application"];

export default function AttackPaths() {
  const [startIdentity, setStartIdentity] = useState("");
  const [targetHost, setTargetHost] = useState("");

  const { data: paths, isLoading: pathsLoading, refetch } = useListAttackPaths();
  const simulate = useSimulateAttackPath();

  const handleSimulate = () => {
    if (!startIdentity || !targetHost) return;
    simulate.mutate(
      { data: { startIdentity, targetHost } },
      { onSuccess: () => refetch() }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Attack Path Simulator</h1>
        <p className="text-muted-foreground">Simulate identity-based attack paths to uncover hidden risks.</p>
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="text-lg">New Simulation</CardTitle>
          <CardDescription>Select a starting identity and target asset to trace possible attack routes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
            <div className="w-full sm:w-64 space-y-1.5">
              <label className="text-xs text-muted-foreground font-mono">START IDENTITY</label>
              <Select value={startIdentity} onValueChange={setStartIdentity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select identity..." />
                </SelectTrigger>
                <SelectContent>
                  {identities.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <ArrowRight className="hidden sm:block text-muted-foreground mb-2" />
            
            <div className="w-full sm:w-64 space-y-1.5">
              <label className="text-xs text-muted-foreground font-mono">TARGET ASSET</label>
              <Select value={targetHost} onValueChange={setTargetHost}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target..." />
                </SelectTrigger>
                <SelectContent>
                  {targets.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 mt-4 sm:mt-0"
              disabled={!startIdentity || !targetHost || simulate.isPending}
              onClick={handleSimulate}
            >
              {simulate.isPending ? "Simulating..." : <><Play className="w-4 h-4 mr-2" /> Run Simulation</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Recent Simulations</h2>
        {pathsLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : paths?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-border/50 rounded-lg bg-card/50">
            No simulations run yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {paths?.map((path) => (
              <Card key={path.id} className="border-border/50 bg-card overflow-hidden">
                <div className="bg-muted/30 px-4 py-3 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-3 font-mono text-sm">
                    <span className="text-chart-2">{path.startIdentity}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-destructive">{path.targetHost}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(path.createdAt).toLocaleDateString()}</span>
                </div>
                <CardContent className="p-4 space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 font-mono">Path Steps</h4>
                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border/50">
                      {path.steps.map((step, i) => (
                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-card border-2 border-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow ml-0.5 md:ml-0"></div>
                          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-md bg-muted/10 border border-border/30 text-sm shadow">
                            <div className="font-mono text-primary mb-1">{step.action}</div>
                            <div className="text-muted-foreground">{step.explanation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground font-mono flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-destructive" /> Weaknesses
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside pl-2">
                        {path.controlWeaknesses.map((cw, i) => <li key={i}>{cw}</li>)}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground font-mono flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-primary" /> Defensive Actions
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside pl-2">
                        {path.defensiveActions.map((da, i) => <li key={i}>{da}</li>)}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}