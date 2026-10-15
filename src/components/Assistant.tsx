import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Send, Loader2, Feather } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askAssistant } from "@/lib/ai.functions";
import { useStore, errMsg, isOverdue } from "@/lib/store";

type Msg = { role: "user" | "assistant"; content: string };

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ask = useServerFn(askAssistant);
  const tasks = useStore((s) => s.tasks);
  const emails = useStore((s) => s.emails);
  const research = useStore((s) => s.research);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs, loading]);

  const context = [
    `Today: ${new Date().toDateString()}`,
    `Open tasks (${tasks.filter((t) => !t.done).length}):`,
    ...tasks
      .filter((t) => !t.done)
      .slice(0, 25)
      .map((t) => `- ${t.title} [${t.priority}${t.due ? `, due ${t.due}` : ""}${isOverdue(t) ? ", OVERDUE" : ""}]`),
    `Saved emails: ${emails.slice(0, 10).map((e) => e.title).join("; ") || "none"}`,
    `Saved research: ${research.slice(0, 10).map((r) => r.topic).join("; ") || "none"}`,
  ].join("\n");

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const r = await ask({ data: { context, messages: next.slice(-20) } });
      setMsgs([...next, { role: "assistant", content: r.text }]);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="fixed bottom-5 right-5 z-40 h-14 rounded-full px-5 shadow-soft"
        aria-label="Open AI assistant"
      >
        <MessageCircle className="h-5 w-5" /> Ask AI
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b p-5">
            <SheetTitle className="flex items-center gap-2 font-display text-2xl font-normal">
              <Feather className="h-5 w-5 text-primary" /> Workspace assistant
            </SheetTitle>
            <SheetDescription>Knows your tasks, emails and research.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
            {msgs.length === 0 && (
              <div className="space-y-2">
                {["What should I focus on today?", "Summarise my overdue tasks", "Draft a status update from my tasks"].map((q) => (
                  <button key={q} onClick={() => setInput(q)} className="block w-full rounded-lg border bg-card p-3 text-left text-sm hover:bg-muted">
                    {q}
                  </button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    : "max-w-[95%] whitespace-pre-wrap text-sm leading-relaxed"
                }
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </p>
            )}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div ref={endRef} />
          </div>
          <form
            className="flex items-end gap-2 border-t p-4"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <label htmlFor="assistant-input" className="sr-only">Message</label>
            <Textarea
              id="assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask anything about your work…"
              className="min-h-11 resize-none"
              rows={1}
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
