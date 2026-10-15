import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Trash2, Copy, Pencil, ListChecks, Mail, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ResearchView } from "@/components/ResearchView";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { actions, useStore, researchToText, type SavedEmail } from "@/lib/store";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Items — SmartWork AI" },
      { name: "description", content: "Search, edit and reuse your saved emails and research." },
      { property: "og:title", content: "Saved Items — SmartWork AI" },
      { property: "og:description", content: "All your saved AI emails and research in one library." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const emails = useStore((s) => s.emails);
  const research = useStore((s) => s.research);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const ql = q.toLowerCase();
  const fe = emails.filter((e) => (e.title + e.body).toLowerCase().includes(ql));
  const fr = research.filter((r) => (r.topic + r.result.summary).toLowerCase().includes(ql));

  return (
    <div>
      <PageHeader title="Saved Items" subtitle="Your library of emails and research.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search saved items" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search saved" className="pl-9 sm:w-64" />
        </div>
      </PageHeader>
      <Tabs defaultValue="emails">
        <TabsList>
          <TabsTrigger value="emails">Emails ({fe.length})</TabsTrigger>
          <TabsTrigger value="research">Research ({fr.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="emails" className="mt-4 space-y-3">
          {fe.length === 0 && <Empty text="No saved emails." />}
          {fe.map((e) => <EmailCard key={e.id} e={e} />)}
        </TabsContent>
        <TabsContent value="research" className="mt-4">
          {fr.length === 0 && <Empty text="No saved research." />}
          <Accordion type="multiple" className="space-y-3">
            {fr.map((r) => (
              <AccordionItem key={r.id} value={r.id} className="rounded-xl border bg-card px-5">
                <AccordionTrigger className="text-left">
                  <span>
                    <span className="block font-display text-xl font-normal">{r.topic}</span>
                    <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mb-5 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => { actions.setGoalDraft(`Create action tasks based on this research about "${r.topic}":\n\n${researchToText(r.result)}`); navigate({ to: "/tasks" }); }}><ListChecks className="h-4 w-4" />To tasks</Button>
                    <Button size="sm" variant="outline" onClick={() => { actions.setEmailDraft({ purpose: `Share research findings on ${r.topic}`, points: r.result.keyPoints.map((k) => `- ${k}`).join("\n") }); navigate({ to: "/email" }); }}><Mail className="h-4 w-4" />To email</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { actions.deleteResearch(r.id); toast("Research deleted"); }}><Trash2 className="h-4 w-4" />Delete</Button>
                  </div>
                  <ResearchView r={r.result} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmailCard({ e }: { e: SavedEmail }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(e.body);
  const navigate = useNavigate();
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl">{e.title}</h2>
          <p className="text-xs text-muted-foreground">{e.tone} · {new Date(e.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {editing ? (
            <Button size="sm" onClick={() => { actions.updateEmail(e.id, { body }); setEditing(false); toast.success("Saved"); }}><Check className="h-4 w-4" />Done</Button>
          ) : (
            <Button size="icon" variant="ghost" aria-label="Edit email" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button>
          )}
          <Button size="icon" variant="ghost" aria-label="Copy email" onClick={() => { navigator.clipboard.writeText(e.body); toast.success("Copied"); }}><Copy className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" aria-label="Create tasks from email" onClick={() => { actions.setGoalDraft(`Extract follow-up tasks from this email:\n\n${e.body}`); navigate({ to: "/tasks" }); }}><ListChecks className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" aria-label="Delete email" onClick={() => { actions.deleteEmail(e.id); toast("Email deleted"); }}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      {editing ? (
        <Textarea aria-label="Email body" className="mt-3 min-h-60" value={body} onChange={(ev) => setBody(ev.target.value)} />
      ) : (
        <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">{e.body}</p>
      )}
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">{text}</p>;
}
