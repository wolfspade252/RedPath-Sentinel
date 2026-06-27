import { useGetReport } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, FileJson, AlertCircle } from "lucide-react";

export default function Report() {
  const { data: report, isLoading, isError } = useGetReport();

  const handleExportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redpath-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    if (!report) return;
    const md = `# RedPath Sentinel Security Report\nGenerated: ${report.generatedAt}\n\n## Scan Summary\n- Total Hosts: ${report.scanSummary.totalHosts}\n- Total Attack Paths: ${report.scanSummary.totalAttackPaths}\n\n## Recommendations\n${report.recommendations.map((r) => `- ${r}`).join("\n")}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redpath-report-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isError) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-destructive text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Failed to generate report</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Report</h1>
          <p className="text-muted-foreground">Export tactical summaries and remediation plans.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportJson} disabled={isLoading || !report} className="border-border">
            <FileJson className="w-4 h-4 mr-2" />
            JSON
          </Button>
          <Button variant="default" onClick={handleExportMarkdown} disabled={isLoading || !report} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <FileDown className="w-4 h-4 mr-2" />
            Markdown
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : report ? (
            <div className="prose prose-invert max-w-none text-sm font-mono">
              <pre className="p-4 rounded-md bg-muted/30 border border-border/50 text-muted-foreground overflow-auto">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}