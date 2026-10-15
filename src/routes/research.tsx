import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Search, Save, ListChecks, Mail, Copy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ResearchView } from "@/components/ResearchView";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { researchTopic, type ResearchResult } from "@/lib/ai.functions";
import { actions, errMsg, researchToText } from "@/lib/store";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Assistant — SmartWork AI" },
      { name: "description", content: "Research any topic: summaries, key points, outlines, keywords and sources." },
      { property: "og:title", content: "AI Research Assistant — SmartWork AI" },
      { property: "og:description", content: "Get structured research briefings and turn them into tasks or emails." },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<"brief" | "standard" | "deep">("standard");
  const [result, setResult] = useState<{ topic: string; r: ResearchResult } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const research = useServerFn(researchTopic);
  const navigate = useNavigate();

  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return setError("Enter a topic to research.");
    setBusy(true);
    setError(null);
    try {
      const r = await research({ data: { topic, depth } });
      setResult({ topic, r });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Research Assistant" subtitle="Ask about any topic and get a structured briefing you can act on." />
      <Card className="p-6">
        <form onSubmit={go} className="flex flex-col gap-3 md:flex-row md:items-center">
          <label htmlFor="topic" className="sr-only">Topic</label>
          <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Four-day work week productivity evidence" className="h-11 flex-1" maxLength={2000} />
          <Tabs value={depth} onValueChange={(v) => setDepth(v as typeof depth)}>
            <TabsList aria-label="Depth">
              <TabsTrigger value="brief">Brief</TabsTrigger>
              <TabsTrigger value="standard">Standard</TabsTrigger>
              <TabsTrigger value="deep">Deep</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button type="submit" className="h-11" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Research
          </Button>
        </form>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      </Card>

      {busy && (
        <Card className="mt-6 space-y-3 p-6" aria-live="polite" aria-busy>
          <p className="text-sm text-muted-foreground">Researching…</p>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      )}

      {result && !busy && (
        <Card className="mt-6 p-6">
          <div className="mb-6 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-3xl">{result.topic}</h2>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => { actions.saveResearch(result.topic, result.r); toast.success("Research saved"); }}><Save className="h-4 w-4" />Save</Button>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(researchToText(result.r)); toast.success("Copied"); }}><Copy className="h-4 w-4" />Copy</Button>
              <Button size="sm" variant="outline" onClick={() => {
                actions.setGoalDraft(`Create action tasks based on this research about "${result.topic}":\n\n${researchToText(result.r)}\n\nOutline:\n${result.r.outline.join("\n")}`);
                navigate({ to: "/tasks" });
              }}><ListChecks className="h-4 w-4" />To tasks</Button>
              <Button size="sm" variant="outline" onClick={() => {
                actions.setEmailDraft({ purpose: `Share research findings on ${result.topic}`, points: result.r.keyPoints.map((k) => `- ${k}`).join("\n") });
                navigate({ to: "/email" });
              }}><Mail className="h-4 w-4" />To email</Button>
            </div>
          </div>
          <ResearchView r={result.r} />
        </Card>
      )}
    </div>
  );
}
