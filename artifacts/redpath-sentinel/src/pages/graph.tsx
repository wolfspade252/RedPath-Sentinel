import { useState, useCallback, useEffect, useRef } from "react";
import { useGetGraph, useUploadScan, useGetHost } from "@workspace/api-client-react";
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Node,
  Edge,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload,
  Network,
  FileCode2,
  CheckCircle2,
  XCircle,
  Search,
  AlertCircle,
  Shield,
  Server,
  Users,
  Layers,
  Zap,
  ExternalLink,
} from "lucide-react";
import { getMitreTechniques, difficultyToNumeric, numericDifficultyLabel } from "@/lib/mitre-mappings";
import { cn } from "@/lib/utils";

// ─── Node colour config ────────────────────────────────────────────────────
const NODE_STYLES: Record<string, { bg: string; border: string; dot: string }> = {
  host:      { bg: "rgba(6,182,212,0.12)",  border: "rgb(6,182,212)",   dot: "bg-cyan-400" },
  service:   { bg: "rgba(59,130,246,0.12)", border: "rgb(59,130,246)",  dot: "bg-blue-400" },
  user:      { bg: "rgba(34,197,94,0.12)",  border: "rgb(34,197,94)",   dot: "bg-green-400" },
  group:     { bg: "rgba(234,179,8,0.12)",  border: "rgb(234,179,8)",   dot: "bg-yellow-400" },
  admin:     { bg: "rgba(239,68,68,0.15)",  border: "rgb(239,68,68)",   dot: "bg-red-400" },
  weakness:  { bg: "rgba(249,115,22,0.12)", border: "rgb(249,115,22)",  dot: "bg-orange-400" },
  target:    { bg: "rgba(239,68,68,0.15)",  border: "rgb(239,68,68)",   dot: "bg-red-500" },
  default:   { bg: "rgba(100,116,139,0.12)",border: "rgb(100,116,139)", dot: "bg-slate-400" },
};

function nodeStyle(type: string) {
  const s = NODE_STYLES[type] ?? NODE_STYLES.default;
  return {
    background: s.bg,
    border: `1px solid ${s.border}`,
    color: "hsl(var(--foreground))",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "11px",
    fontFamily: "var(--font-mono)",
    minWidth: 110,
  };
}

// ─── Legend ───────────────────────────────────────────────────────────────
const LEGEND = [
  { label: "Host",        dot: "bg-cyan-400" },
  { label: "Service",     dot: "bg-blue-400" },
  { label: "User",        dot: "bg-green-400" },
  { label: "Group",       dot: "bg-yellow-400" },
  { label: "Weakness",    dot: "bg-orange-400" },
  { label: "High Risk",   dot: "bg-red-500" },
];

// ─── Difficulty bar ───────────────────────────────────────────────────────
function DifficultyBar({ score }: { score: "easy" | "medium" | "hard" }) {
  const numeric = difficultyToNumeric(score);
  const { label, color } = numericDifficultyLabel(numeric);
  const filled = Math.round((numeric / 10) * 10);
  const barColor =
    numeric >= 7 ? "bg-destructive" : numeric >= 4 ? "bg-chart-2" : "bg-primary";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Hack Difficulty Score</span>
        <span className={cn("text-xs font-bold font-mono", color)}>
          {numeric}/10 · {label}
        </span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={cn("h-1.5 flex-1 rounded-sm", i < filled ? barColor : "bg-muted/40")}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Host detail panel ────────────────────────────────────────────────────
function HostDetailPanel({ id }: { id: number }) {
  const { data: host, isLoading } = useGetHost(id, { query: { enabled: !!id } });

  if (isLoading) {
    return (
      <div className="space-y-3 p-1">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (!host) return null;

  const services = (host as any).services as Array<{ port: number; protocol: string; name: string; version?: string }> ?? [];
  const ports = services.map((s) => s.port);
  const allMitre = ports.flatMap((p) => getMitreTechniques(p));
  const uniqueMitre = allMitre.filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

  const roleLabel =
    host.hostType === "domain-controller"
      ? "Domain Controller"
      : host.hostType === "workstation"
      ? "Workstation"
      : host.hostType === "server"
      ? "Server"
      : host.hostType ?? "Unknown";

  return (
    <div className="space-y-4">
      {/* Identity */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-sm text-cyan-400 font-bold break-all">{host.hostname || host.ip}</p>
            {host.hostname && <p className="text-xs text-muted-foreground font-mono mt-0.5">{host.ip}</p>}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 text-[10px]",
              host.difficultyScore === "easy"
                ? "border-destructive text-destructive"
                : host.difficultyScore === "medium"
                ? "border-chart-2 text-chart-2"
                : "border-primary text-primary"
            )}
          >
            {host.difficultyScore?.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        {[
          { label: "OS", value: host.osGuess || "Unknown" },
          { label: "Role", value: roleLabel },
          { label: "Open Ports", value: ports.length || "—" },
          { label: "Risk Services", value: (host.weaknesses?.length ?? 0) },
        ].map(({ label, value }) => (
          <div key={label}>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">{label}</span>
            <span className="text-foreground">{String(value)}</span>
          </div>
        ))}
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Layers className="w-3 h-3" /> Services
          </p>
          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
            {services.map((svc, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-muted/20 rounded px-2 py-1">
                <span className="font-mono text-blue-400">{svc.port}/{svc.protocol}</span>
                <span className="text-muted-foreground truncate ml-2">{svc.name}{svc.version ? ` ${svc.version}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weaknesses */}
      {host.weaknesses && host.weaknesses.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-destructive" /> Potential Findings
          </p>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {host.weaknesses.map((w, i) => (
              <div key={i} className="text-xs bg-orange-500/10 border border-orange-500/20 rounded p-2 space-y-1">
                <div className="text-orange-400 font-mono font-semibold">{w.serviceName}</div>
                <div className="text-muted-foreground leading-relaxed">{w.observation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MITRE ATT&CK */}
      {uniqueMitre.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Shield className="w-3 h-3 text-red-400" /> MITRE ATT&CK (potential)
          </p>
          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
            {uniqueMitre.map((t) => (
              <a
                key={t.id}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-2 text-xs bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5 hover:bg-red-500/20 transition-colors group"
              >
                <div>
                  <span className="text-red-400 font-mono font-semibold">{t.id}</span>
                  <span className="text-muted-foreground ml-2">{t.name}</span>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground/60 italic">Based on service exposure only — not confirmed exploitation.</p>
        </div>
      )}

      {/* Score */}
      {host.difficultyScore && (
        <div className="pt-2 border-t border-border/40 space-y-2">
          <DifficultyBar score={host.difficultyScore as "easy" | "medium" | "hard"} />
          {host.scoreReason && (
            <p className="text-[10px] text-muted-foreground leading-relaxed">{host.scoreReason}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Generic node detail panel ────────────────────────────────────────────
function GenericNodePanel({ node }: { node: { id: string; label: string; type: string; data?: any } }) {
  const typeIcon: Record<string, React.ReactNode> = {
    user:     <Users className="w-4 h-4 text-green-400" />,
    group:    <Layers className="w-4 h-4 text-yellow-400" />,
    admin:    <Shield className="w-4 h-4 text-red-400" />,
    service:  <Server className="w-4 h-4 text-blue-400" />,
    weakness: <AlertCircle className="w-4 h-4 text-orange-400" />,
    target:   <Zap className="w-4 h-4 text-red-500" />,
  };

  const mitrePort = node.data?.port ? getMitreTechniques(Number(node.data.port)) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {typeIcon[node.type] ?? <Network className="w-4 h-4 text-muted-foreground" />}
        <div>
          <p className="text-sm font-mono text-foreground font-semibold break-all">{node.label}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider capitalize">{node.type}</p>
        </div>
      </div>

      {node.type === "user" && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          {[
            { label: "Type", value: "User Account" },
            { label: "Domain", value: node.data?.domain ?? "Unknown" },
            { label: "Privileged", value: node.data?.privileged ? "Yes" : "No" },
            { label: "MFA", value: node.data?.mfa ?? "Unknown" },
            { label: "Pwd Reuse", value: node.data?.passwordReuse ?? "Unknown" },
          ].map(({ label, value }) => (
            <div key={label}>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">{label}</span>
              <span className="text-foreground">{String(value)}</span>
            </div>
          ))}
        </div>
      )}

      {node.type === "weakness" && (
        <div className="space-y-2">
          <div className="text-xs bg-orange-500/10 border border-orange-500/20 rounded p-2 space-y-1">
            <p className="text-orange-400 font-mono font-semibold">{node.label}</p>
            <p className="text-muted-foreground text-[11px]">{node.data?.observation ?? "Potential security weakness detected based on service exposure."}</p>
          </div>
          {node.data?.recommendation && (
            <div className="text-xs bg-primary/5 border border-primary/20 rounded p-2 text-muted-foreground">
              <span className="text-primary font-semibold block mb-1">Remediation</span>
              {node.data.recommendation}
            </div>
          )}
        </div>
      )}

      {mitrePort.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">MITRE ATT&CK</p>
          {mitrePort.map((t) => (
            <a key={t.id} href={t.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between text-xs bg-red-500/10 border border-red-500/20 rounded px-2 py-1 hover:bg-red-500/20 transition-colors group">
              <span className="text-red-400 font-mono">{t.id}</span>
              <span className="text-muted-foreground ml-2 truncate">{t.name}</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0 ml-1" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Graph canvas ─────────────────────────────────────────────────────────
function GraphCanvas({
  data,
  searchQuery,
  onNodeClick,
}: {
  data: any;
  searchQuery: string;
  onNodeClick: (e: any, n: any) => void;
}) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (!data) return;

    const q = searchQuery.toLowerCase();

    const newNodes: Node[] = data.nodes.map((n: any, i: number) => {
      const style = nodeStyle(n.type);
      const matched = q && n.label.toLowerCase().includes(q);
      return {
        id: n.id,
        position: { x: (i % 6) * 190, y: Math.floor(i / 6) * 120 },
        data: { label: n.label, type: n.type, ...(n.data ?? {}) },
        style: {
          ...style,
          opacity: q && !matched ? 0.25 : 1,
          boxShadow: matched ? `0 0 0 2px rgb(6,182,212)` : undefined,
        },
      };
    });

    const newEdges: Edge[] = data.edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      style: {
        stroke: e.label === "ATTACK_PATH" ? "rgb(239,68,68)" : "hsl(var(--muted-foreground)/0.4)",
        strokeWidth: e.label === "ATTACK_PATH" ? 2 : 1,
      },
      labelStyle: { fill: "hsl(var(--muted-foreground))", fontSize: 9 },
      animated: e.label === "ATTACK_PATH",
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [data, searchQuery]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      className="bg-background"
    >
      <Background color="rgba(100,116,139,0.15)" gap={20} />
      <Controls className="bg-card border border-border/50 fill-foreground" />
      <MiniMap
        nodeColor={(n) => {
          const s = NODE_STYLES[n.data?.type as string] ?? NODE_STYLES.default;
          return s.border;
        }}
        className="bg-card border border-border/50 rounded"
        maskColor="rgba(0,0,0,0.6)"
      />
    </ReactFlow>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function GraphView() {
  const [scanId, setScanId] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ id: string; type: string; label: string; data?: any } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const { data: graphData, isLoading: graphLoading } = useGetGraph(
    { scanId: scanId || undefined },
    { query: { keepPreviousData: true } as any }
  );

  const uploadScan = useUploadScan();

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".xml") && file.type !== "text/xml" && file.type !== "application/xml") {
        setUploadStatus("error");
        setUploadedFileName(file.name);
        setTimeout(() => setUploadStatus("idle"), 3000);
        return;
      }
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        uploadScan.mutate(
          { data: { name: file.name, xmlContent: content } },
          {
            onSuccess: (scan) => {
              setScanId(scan.id);
              setUploadStatus("success");
              setTimeout(() => setUploadStatus("idle"), 4000);
            },
            onError: () => {
              setUploadStatus("error");
              setTimeout(() => setUploadStatus("idle"), 3000);
            },
          }
        );
      };
      reader.readAsText(file);
    },
    [uploadScan]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleNodeClick = (_e: React.MouseEvent, node: Node) => {
    setSelectedNode({
      id: node.id,
      type: node.data?.type as string,
      label: node.data?.label as string,
      data: node.data,
    });
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) setIsDraggingOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDraggingOver(false);
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDraggingOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div
      className="h-[calc(100vh-3rem)] flex flex-col gap-3 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-cyan-500/5 border-2 border-dashed border-cyan-500 rounded-lg" />
          <div className="relative flex flex-col items-center gap-3 text-cyan-400">
            <FileCode2 className="w-14 h-14 animate-pulse" />
            <p className="text-lg font-bold tracking-wide">Drop Nmap XML to import</p>
            <p className="text-sm text-muted-foreground">Hosts will appear on the graph instantly</p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-cyan-400">Network Graph</h1>
          <p className="text-muted-foreground text-xs">Live topology of hosts, services, identities and attack paths.</p>
        </div>

        {/* Search */}
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a host…"
            className="pl-8 h-8 text-xs bg-muted/20 border-border/50"
          />
        </div>

        {/* Upload status */}
        {uploadScan.isPending && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span className="font-mono">Parsing…</span>
          </div>
        )}
        {uploadStatus === "success" && (
          <div className="flex items-center gap-1.5 text-xs text-primary animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-mono">{uploadedFileName} loaded</span>
          </div>
        )}
        {uploadStatus === "error" && (
          <div className="flex items-center gap-1.5 text-xs text-destructive animate-in fade-in">
            <XCircle className="w-4 h-4" />
            <span>Invalid XML file</span>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept=".xml,application/xml,text/xml" onChange={handleFileInput} className="hidden" />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadScan.isPending}
          variant="outline"
          size="sm"
          className="h-8 text-xs border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500"
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          Upload Scan
        </Button>
      </div>

      {/* Main area */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Graph */}
        <div className="flex-1 border border-border/40 rounded-lg overflow-hidden bg-card/20 relative flex flex-col">
          {graphLoading && !graphData ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">Loading graph…</p>
              </div>
            </div>
          ) : graphData ? (
            <>
              <div className="flex-1">
                <GraphCanvas data={graphData} searchQuery={searchQuery} onNodeClick={handleNodeClick} />
              </div>
              {/* Legend */}
              <div className="shrink-0 flex items-center gap-4 px-4 py-2 border-t border-border/30 bg-card/40">
                {LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", item.dot)} />
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  </div>
                ))}
                <div className="ml-auto text-[10px] text-muted-foreground">
                  {graphData.nodes?.length ?? 0} nodes · {graphData.edges?.length ?? 0} edges
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-3">
                <Network className="w-10 h-10 mx-auto opacity-20" />
                <p className="text-xs">No data. Upload an Nmap XML or drop a file here.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right details panel */}
        <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">
          <Card className="border-border/40 bg-card/50 flex-1">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
                {selectedNode ? "Node Details" : "Select a Node"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {selectedNode ? (
                selectedNode.type === "host" ? (
                  <HostDetailPanel id={parseInt(selectedNode.id)} />
                ) : (
                  <GenericNodePanel node={selectedNode} />
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground/50">
                  <Network className="w-8 h-8" />
                  <p className="text-xs text-center">Click any node on the graph to view host details, weaknesses, and MITRE ATT&CK mappings.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Drag hint */}
          <div className="shrink-0 flex items-start gap-2 px-3 py-2 rounded border border-border/20 bg-muted/5 text-[10px] text-muted-foreground/60">
            <FileCode2 className="w-3 h-3 mt-0.5 shrink-0" />
            <span>Drag & drop an Nmap XML anywhere to import a new scan.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
