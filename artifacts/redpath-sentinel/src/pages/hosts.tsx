import { useState } from "react";
import { useListHosts, useGetHost } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Server, Activity, ShieldAlert, Cpu } from "lucide-react";

export default function Hosts() {
  const [ipFilter, setIpFilter] = useState("");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [selectedHostId, setSelectedHostId] = useState<number | null>(null);

  const { data: hosts, isLoading } = useListHosts(
    {
      ipFilter: ipFilter || undefined,
      scoreFilter: scoreFilter !== "all" ? (scoreFilter as any) : undefined,
    },
    { query: { keepPreviousData: true } as any }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Hosts</h1>
        <p className="text-muted-foreground">Inventory of discovered assets.</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Filter by IP..."
              value={ipFilter}
              onChange={(e) => setIpFilter(e.target.value)}
              className="max-w-xs font-mono"
            />
            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Difficulty Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>IP Address</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Open Ports</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : hosts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hosts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  hosts?.map((host) => (
                    <TableRow
                      key={host.id}
                      className="cursor-pointer hover:bg-muted/50 border-border/50 transition-colors"
                      onClick={() => setSelectedHostId(host.id)}
                    >
                      <TableCell className="font-mono">{host.ip}</TableCell>
                      <TableCell>{host.hostname || "Unknown"}</TableCell>
                      <TableCell>{host.osGuess || "Unknown"}</TableCell>
                      <TableCell>{host.openPorts}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          host.difficultyScore === "easy" ? "border-destructive text-destructive" :
                          host.difficultyScore === "medium" ? "border-chart-2 text-chart-2" :
                          "border-primary text-primary"
                        }>
                          {host.difficultyScore.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">{host.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <HostDetailDrawer id={selectedHostId} onClose={() => setSelectedHostId(null)} />
    </div>
  );
}

function HostDetailDrawer({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data: host, isLoading } = useGetHost(id as number, { query: { enabled: !!id } });

  return (
    <Sheet open={!!id} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto border-l-border/50 bg-card">
        {isLoading ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : host ? (
          <>
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl font-mono text-primary flex items-center gap-2">
                <Server className="w-5 h-5" />
                {host.ip}
              </SheetTitle>
              <SheetDescription>
                {host.hostname || "No hostname available"}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase">OS</span>
                  <div className="font-medium">{host.osGuess || "Unknown"}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase">Score</span>
                  <div>
                    <Badge variant="outline" className={
                          host.difficultyScore === "easy" ? "border-destructive text-destructive" :
                          host.difficultyScore === "medium" ? "border-chart-2 text-chart-2" :
                          "border-primary text-primary"
                        }>
                          {host.difficultyScore.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {host.scoreReason && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4"/> Assessment</h3>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-border/50">{host.scoreReason}</p>
                </div>
              )}

              {host.weaknesses && host.weaknesses.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-destructive"/> Weaknesses</h3>
                  <div className="space-y-3">
                    {host.weaknesses.map((w, i) => (
                      <div key={i} className="bg-destructive/5 border border-destructive/20 rounded-md p-3 space-y-2 text-sm">
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-destructive">{w.serviceName} (Port {w.port})</span>
                          <Badge variant="destructive" className="text-[10px] h-5">{w.riskLevel.toUpperCase()}</Badge>
                        </div>
                        <p className="text-muted-foreground">{w.observation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}