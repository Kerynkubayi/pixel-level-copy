import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Copy, Save, Wand2, Minimize2, Maximize2, Sparkle, ListChecks, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateEmail, editEmail } from "@/lib/ai.functions";
import { actions, useStore, errMsg } from "@/lib/store";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Generator — SmartWork AI" },
      { name: "description", content: "Generate, refine and save professional emails with AI." },
      { property: "og:title", content: "Smart Email Generator — SmartWork AI" },
      { property: "og:description", content: "Turn a purpose and key points into a polished email in seconds." },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Professional", "Friendly", "Formal", "Persuasive", "Apologetic", "Concise"];

function EmailPage() {
  const settings = useStore((s) => s.settings);
  const draft = useStore((s) => s.emailDraft);
  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("");
  const [points, setPoints] = useState("");
  const [tone, setTone] = useState(settings.defaultTone || "Professional");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const gen = useServerFn(generateEmail);
  const edit = useServerFn(editEmail);
  const navigate = useNavigate();

  useEffect(() => {
    if (draft) {
      setPurpose(draft.purpose);
      setPoints(draft.points);
      actions.setEmailDraft(null);
      toast.success("Content brought over — review and generate.");
    }
  }, [draft]);

  async function run(label: string, fn: () => Promise<{ text: string }>) {
    setBusy(label);
    setError(null);
    try {
      const r = await fn();
      setOutput(settings.signature && label === "generate" ? `${r.text.trim()}\n\n${settings.signature}` : r.text.trim());
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  const doEdit = (action: "improve" | "shorten" | "expand" | "tone") =>
    run(action, () => edit({ data: { email: output, action, tone } }));

  return (
    <div>
      <PageHeader title="Email Generator" subtitle="Describe what you need; refine the result with one click." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="space-y-4 p-6">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!purpose.trim()) return setError("Please describe the purpose of the email.");
              run("generate", () => gen({ data: { purpose, points, tone, length, recipient } }));
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="purpose">Purpose *</Label>
              <Input id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Follow up on Tuesday's proposal meeting" maxLength={500} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recipient">Recipient</Label>
              <Input id="recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Client, manager, team…" maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="points">Key points</Label>
              <Textarea id="points" rows={6} value={points} onChange={(e) => setPoints(e.target.value)} placeholder={"- Thank them for their time\n- Attach revised pricing\n- Propose next call"} maxLength={4000} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger aria-label="Tone"><SelectValue /></SelectTrigger>
                  <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Length</Label>
                <Select value={length} onValueChange={(v) => setLength(v as typeof length)}>
                  <SelectTrigger aria-label="Length"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={!!busy}>
              {busy === "generate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate email
            </Button>
          </form>
        </Card>

        <Card className="flex flex-col p-6">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={!output || !!busy} onClick={() => doEdit("improve")}><Sparkle className="h-4 w-4" />Improve</Button>
            <Button variant="outline" size="sm" disabled={!output || !!busy} onClick={() => doEdit("shorten")}><Minimize2 className="h-4 w-4" />Shorten</Button>
            <Button variant="outline" size="sm" disabled={!output || !!busy} onClick={() => doEdit("expand")}><Maximize2 className="h-4 w-4" />Expand</Button>
            <Button variant="outline" size="sm" disabled={!output || !!busy} onClick={() => doEdit("tone")}>Apply “{tone}” tone</Button>
          </div>
          <Label htmlFor="output" className="sr-only">Generated email</Label>
          <div className="relative mt-4 flex-1">
            <Textarea
              id="output"
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder="Your email will appear here. You can edit it directly."
              className="min-h-[380px] h-full bg-background font-sans leading-relaxed"
            />
            {busy && (
              <div className="absolute inset-0 grid place-items-center rounded-md bg-background/70" aria-live="polite">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Writing…</span>
              </div>
            )}
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!output}
              onClick={async () => {
                await navigator.clipboard.writeText(output);
                toast.success("Copied to clipboard");
              }}
            ><Copy className="h-4 w-4" />Copy</Button>
            <Button
              disabled={!output}
              onClick={() => {
                const subj = output.match(/^Subject:\s*(.+)$/m)?.[1] || purpose || "Untitled email";
                actions.saveEmail({ title: subj.slice(0, 120), body: output, tone });
                toast.success("Email saved");
              }}
            ><Save className="h-4 w-4" />Save</Button>
            <Button
              variant="outline"
              disabled={!output}
              onClick={() => {
                actions.setGoalDraft(`Extract follow-up tasks from this email:\n\n${output}`);
                navigate({ to: "/tasks" });
              }}
            ><ListChecks className="h-4 w-4" />Create tasks</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
