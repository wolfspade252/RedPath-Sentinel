import { useState, useCallback, useEffect, useRef } from "react";
import { useGetGraph, useUploadScan, useGetHost } from "@workspace/api-client-react";
import { ReactFlow, Controls, Background, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Network, AlertCircle, FileCode2, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function GraphView() {
  const [scanId, setScanId] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const { data: graphData, isLoading: graphLoading } = useGetGraph(
    { scanId: scanId || undefined },
    { query: { keepPreviousData: true } as any }
  );

  const uploadScan = useUploadScan();

  const processFile = useCallback((file: File) => {
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
            setTimeout(() => setUploadStatus("idle"), 3000);
          },
          onError: () => {
            setUploadStatus("error");
            setTimeout(() => setUploadStatus("idle"), 3000);
          },
        }
      );
    };
    reader.readAsText(file);
  }, [uploadScan]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setSelectedNodeType(node.data?.type as string);
  };

  // Page-level drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div
      className="h-[calc(100vh-2rem)] flex flex-col space-y-4 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag-and-drop overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary rounded-lg" />
          <div className="relative flex flex-col items-center gap-3 text-primary">
            <FileCode2 className="w-16 h-16 animate-pulse" />
            <p className="text-xl font-bold font-mono tracking-wide">Drop Nmap XML to scan</p>
            <p className="text-sm text-muted-foreground">Hosts will appear on the graph instantly</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Topology Graph</h1>
          <p className="text-muted-foreground text-sm">Interactive visualization of assets and paths.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Upload status badge */}
          {uploadStatus === "success" && (
            <div className="flex items-center gap-1.5 text-sm text-primary animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-mono">{uploadedFileName} loaded</span>
            </div>
          )}
          {uploadStatus === "error" && (
            <div className="flex items-center gap-1.5 text-sm text-destructive animate-in fade-in">
              <XCircle className="w-4 h-4" />
              <span>Invalid Nmap XML file</span>
            </div>
          )}
          {uploadScan.isPending && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground animate-in fade-in">
              <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="font-mono">Parsing {uploadedFileName}…</span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,application/xml,text/xml"
            onChange={handleFileInput}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadScan.isPending}
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploadScan.isPending ? "Uploading…" : "Upload Nmap XML"}
          </Button>
        </div>
      </div>

      {/* Drag hint bar */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded border border-border/30 bg-muted/10 text-xs text-muted-foreground">
        <FileCode2 className="w-3.5 h-3.5 shrink-0" />
        <span>Drag & drop an Nmap XML file anywhere on this page to import a scan — or use the upload button above.</span>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 border border-border/50 rounded-lg overflow-hidden bg-card/30 relative">
          {graphLoading && !graphData ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <Skeleton className="w-32 h-32 rounded-full" />
            </div>
          ) : graphData ? (
            <GraphCanvas data={graphData} onNodeClick={handleNodeClick} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-3">
                <Network className="w-12 h-12 mx-auto opacity-20" />
                <p className="text-sm">No graph data. Upload a scan or drop an XML file here.</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-80 shrink-0 flex flex-col gap-4 overflow-y-auto">
          {selectedNodeId && selectedNodeType === "host" ? (
            <HostDetailPanel id={parseInt(selectedNodeId)} />
          ) : selectedNodeId ? (
            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="text-lg capitalize">{selectedNodeType} Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm">ID: {selectedNodeId}</div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                Click a node to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function GraphCanvas({ data, onNodeClick }: { data: any; onNodeClick: (e: any, n: any) => void }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (!data) return;

    const newNodes = data.nodes.map((n: any, i: number) => {
      let bgColor = "hsl(var(--muted))";
      if (n.type === "host") bgColor = "hsl(var(--primary) / 0.2)";
      if (n.type === "service") bgColor = "hsl(var(--chart-4) / 0.2)";
      if (n.type === "user") bgColor = "hsl(var(--chart-2) / 0.2)";
      if (n.type === "group") bgColor = "hsl(var(--chart-5) / 0.2)";
      if (n.type === "admin") bgColor = "hsl(var(--destructive) / 0.2)";
      if (n.type === "weakness") bgColor = "hsl(var(--chart-2) / 0.2)";
      if (n.type === "target") bgColor = "hsl(var(--destructive) / 0.2)";

      let borderColor = "hsl(var(--border))";
      if (n.type === "host") borderColor = "hsl(var(--primary))";
      if (n.type === "service") borderColor = "hsl(var(--chart-4))";
      if (n.type === "user") borderColor = "hsl(var(--chart-2))";
      if (n.type === "group") borderColor = "hsl(var(--chart-5))";
      if (n.type === "admin") borderColor = "hsl(var(--destructive))";
      if (n.type === "target") borderColor = "hsl(var(--destructive))";

      return {
        id: n.id,
        position: { x: (i % 5) * 180, y: Math.floor(i / 5) * 110 },
        data: { label: n.label, type: n.type },
        style: {
          background: bgColor,
          border: `1px solid ${borderColor}`,
          color: "hsl(var(--foreground))",
          borderRadius: "4px",
          padding: "10px",
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
        },
      };
    });

    const newEdges = data.edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      style: { stroke: "hsl(var(--muted-foreground))" },
      labelStyle: { fill: "hsl(var(--muted-foreground))", fontSize: 10 },
      animated: e.label === "ATTACK_PATH",
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [data]);

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
      className="bg-background"
    >
      <Background color="hsl(var(--muted-foreground)/0.2)" gap={16} />
      <Controls className="bg-card border-border fill-foreground" />
    </ReactFlow>
  );
}

function HostDetailPanel({ id }: { id: number }) {
  const { data: host, isLoading } = useGetHost(id, { query: { enabled: !!id } });

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!host) return null;

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg font-mono text-primary break-all">{host.ip}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase block">OS</span>
            <span className="truncate block">{host.osGuess || "Unknown"}</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase block">Difficulty</span>
            <Badge
              variant="outline"
              className={
                host.difficultyScore === "easy"
                  ? "border-destructive text-destructive"
                  : host.difficultyScore === "medium"
                  ? "border-chart-2 text-chart-2"
                  : "border-primary text-primary"
              }
            >
              {host.difficultyScore.toUpperCase()}
            </Badge>
          </div>
        </div>

        {host.scoreReason && (
          <div className="text-xs bg-muted/30 p-2 rounded border border-border/50 text-muted-foreground">
            {host.scoreReason}
          </div>
        )}

        {host.weaknesses && host.weaknesses.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-destructive" /> Weaknesses
            </h4>
            <div className="space-y-2">
              {host.weaknesses.map((w, i) => (
                <div
                  key={i}
                  className="text-xs bg-destructive/10 border border-destructive/20 rounded p-2 text-muted-foreground"
                >
                  <div className="text-destructive font-mono mb-1">{w.serviceName}</div>
                  {w.observation}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
