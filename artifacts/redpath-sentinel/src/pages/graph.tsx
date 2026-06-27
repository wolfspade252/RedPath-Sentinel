import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useGetGraph, useUploadScan, useGetHost } from "@workspace/api-client-react";
import { ReactFlow, Controls, Background, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Network, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function GraphView() {
  const [scanId, setScanId] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);

  const { data: graphData, isLoading: graphLoading } = useGetGraph(
    { scanId: scanId || undefined },
    { query: { keepPreviousData: true } as any }
  );

  const uploadScan = useUploadScan();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      uploadScan.mutate(
        { data: { name: file.name, xmlContent: content } },
        {
          onSuccess: (scan) => {
            setScanId(scan.id);
          }
        }
      );
    };
    reader.readAsText(file);
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setSelectedNodeType(node.data?.type as string);
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Topology Graph</h1>
          <p className="text-muted-foreground text-sm">Interactive visualization of assets and paths.</p>
        </div>
        <div className="flex items-center gap-4">
          <Input 
            type="file" 
            accept=".xml" 
            onChange={handleFileUpload}
            className="w-64"
            disabled={uploadScan.isPending}
          />
          <Button disabled={uploadScan.isPending} variant="outline" className="border-border">
            <Upload className="w-4 h-4 mr-2" />
            {uploadScan.isPending ? "Uploading..." : "Upload Nmap XML"}
          </Button>
        </div>
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
              <div className="text-center">
                <Network className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No graph data available. Upload a scan.</p>
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
                <div className="text-muted-foreground text-sm">
                  ID: {selectedNodeId}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-6 text-center text-muted-foreground">
                Click a node to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Separate component for the canvas to handle its own state
function GraphCanvas({ data, onNodeClick }: { data: any, onNodeClick: (e: any, n: any) => void }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Simple layout logic for demo purposes. In production, use dagre or elK
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
        position: { x: (i % 5) * 150, y: Math.floor(i / 5) * 100 },
        data: { label: n.label, type: n.type },
        style: {
          background: bgColor,
          border: `1px solid ${borderColor}`,
          color: "hsl(var(--foreground))",
          borderRadius: "4px",
          padding: "10px",
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
        }
      };
    });

    const newEdges = data.edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      style: { stroke: "hsl(var(--muted-foreground))" },
      labelStyle: { fill: "hsl(var(--muted-foreground))", fontSize: 10 },
      animated: e.label === "ATTACK_PATH"
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [data]);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

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
            <Badge variant="outline" className={
                  host.difficultyScore === "easy" ? "border-destructive text-destructive" :
                  host.difficultyScore === "medium" ? "border-chart-2 text-chart-2" :
                  "border-primary text-primary"
                }>
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
                <div key={i} className="text-xs bg-destructive/10 border border-destructive/20 rounded p-2 text-muted-foreground">
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