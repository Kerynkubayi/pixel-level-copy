import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Wand2, CalendarClock, Plus, Trash2, Mail, Search, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { breakDownGoal, planTasks } from "@/lib/ai.functions";
import { actions, useStore, addDays, today, isOverdue, errMsg, type Priority, type Task } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Task Planner — SmartWork AI" },
      { name: "description", content: "Break goals into tasks, prioritise with AI and track progress." },
      { property: "og:title", content: "AI Task Planner — SmartWork AI" },
      { property: "og:description", content: "AI turns big goals into prioritised, scheduled tasks." },
    ],
  }),
  component: TasksPage,
});

const prioClass: Record<Priority, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/15 text-accent-foreground border-warning/30",
  low: "bg-muted text-muted-foreground border-border",
};
const rank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function TasksPage() {
  const tasks = useStore((s) => s.tasks);
  const goalDraft = useStore((s) => s.goalDraft);
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState<"break" | "plan" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("open");
  const [q, setQ] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newPrio, setNewPrio] = useState<Priority>("medium");
  const breakdown = useServerFn(breakDownGoal);
  const plan = useServerFn(planTasks);
  const navigate = useNavigate();

  useEffect(() => {
    if (goalDraft) {
      setGoal(goalDraft);
      actions.setGoalDraft(null);
      toast.success("Content brought over — click “Break into tasks”.");
    }
  }, [goalDraft]);

  const visible = useMemo(() => {
    let list = tasks;
    if (filter === "open") list = list.filter((t) => !t.done);
    if (filter === "overdue") list = list.filter(isOverdue);
    if (filter === "done") list = list.filter((t) => t.done);
    if (q.trim()) list = list.filter((t) => t.title.toLowerCase().includes(q.toLowerCase()));
    return [...list].sort((a, b) => rank[a.priority] - rank[b.priority] || (a.due || "9999").localeCompare(b.due || "9999"));
  }, [tasks, filter, q]);

  async function doBreak() {
    if (!goal.trim()) return setError("Describe a goal first.");
    setBusy("break");
    setError(null);
    try {
      const r = await breakdown({ data: { goal } });
      actions.addTasks(r.tasks.map((t) => ({ title: t.title, priority: t.priority, due: addDays(t.dueInDays), minutes: t.minutes, source: "AI" })));
      toast.success(`Added ${r.tasks.length} tasks`);
      setGoal("");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  async function doPlan() {
    const open = tasks.filter((t) => !t.done);
    if (!open.length) return setError("Add some tasks first.");
    setBusy("plan");
    setError(null);
    try {
      const r = await plan({ data: { today: today(), tasks: open.slice(0, 60).map((t) => ({ id: t.id, title: t.title, due: t.due, priority: t.priority })) } });
      const rs: Record<string, string> = {};
      r.items.forEach((i) => {
        if (tasks.some((t) => t.id === i.id)) {
          actions.updateTask(i.id, { priority: i.priority });
          rs[i.id] = i.reason;
        }
      });
      setReasons(rs);
      setSchedule(r.schedule);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  const overdueCount = tasks.filter(isOverdue).length;

  return (
    <div>
      <PageHeader title="Task Planner" subtitle="Turn goals into tasks, let AI prioritise, and stay on schedule.">
        <Button variant="outline" onClick={doPlan} disabled={!!busy}>
          {busy === "plan" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />} Prioritise & schedule
        </Button>
        <Button
          variant="outline"
          disabled={!tasks.some((t) => !t.done)}
          onClick={() => {
            const open = tasks.filter((t) => !t.done);
            actions.setEmailDraft({
              purpose: "Status update on my current work",
              points: open.map((t) => `- ${t.title}${t.due ? ` (due ${t.due})` : ""}${isOverdue(t) ? " — overdue" : ""}`).join("\n"),
            });
            navigate({ to: "/email" });
          }}
        ><Mail className="h-4 w-4" />Email update</Button>
      </PageHeader>

      {overdueCount > 0 && (
        <p role="status" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {overdueCount} task{overdueCount > 1 ? "s are" : " is"} overdue.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-6">
          <Card className="space-y-3 p-6">
            <h2 className="font-display text-2xl">Break down a goal</h2>
            <label htmlFor="goal" className="sr-only">Goal</label>
            <Textarea id="goal" rows={5} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Launch the new client onboarding process by end of month" maxLength={6000} />
            <Button className="w-full" onClick={doBreak} disabled={!!busy}>
              {busy === "break" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Break into tasks
            </Button>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-2xl">Add a task</h2>
            <form
              className="mt-3 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTitle.trim()) return;
                actions.addTasks([{ title: newTitle.trim(), priority: newPrio, due: newDue || null }]);
                setNewTitle("");
                setNewDue("");
              }}
            >
              <Input aria-label="Task title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title" maxLength={300} />
              <div className="grid grid-cols-2 gap-3">
                <Input aria-label="Due date" type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} />
                <Select value={newPrio} onValueChange={(v) => setNewPrio(v as Priority)}>
                  <SelectTrigger aria-label="Priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" variant="secondary" className="w-full"><Plus className="h-4 w-4" />Add task</Button>
            </form>
          </Card>

          {schedule && (
            <Card className="p-6">
              <h2 className="font-display text-2xl">Suggested schedule</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{schedule}</p>
            </Card>
          )}
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
                <TabsTrigger value="done">Done</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search tasks" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="pl-9 sm:w-48" />
            </div>
          </div>
          <ul className="mt-4 divide-y">
            {visible.length === 0 && <li className="py-12 text-center text-sm text-muted-foreground">No tasks here.</li>}
            {visible.map((t) => <TaskRow key={t.id} task={t} reason={reasons[t.id]} />)}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function TaskRow({ task: t, reason }: { task: Task; reason?: string }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(t.title);
  const [due, setDue] = useState(t.due ?? "");
  const overdue = isOverdue(t);
  return (
    <li className="flex items-start gap-3 py-3">
      <Checkbox className="mt-1" checked={t.done} onCheckedChange={(v) => actions.updateTask(t.id, { done: !!v })} aria-label={`Mark "${t.title}" done`} />
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input aria-label="Edit title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input aria-label="Edit due date" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="sm:w-40" />
          </div>
        ) : (
          <>
            <p className={cn("text-sm font-medium", t.done && "text-muted-foreground line-through")}>{t.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className={prioClass[t.priority]}>{t.priority}</Badge>
              {t.due && <span className={overdue ? "font-semibold text-destructive" : ""}>{overdue ? "Overdue · " : ""}{t.due}</span>}
              {t.minutes ? <span>~{t.minutes} min</span> : null}
            </div>
            {reason && <p className="mt-1 text-xs italic text-muted-foreground">{reason}</p>}
          </>
        )}
      </div>
      {editing ? (
        <>
          <Button size="icon" variant="ghost" aria-label="Save" onClick={() => { actions.updateTask(t.id, { title: title.trim() || t.title, due: due || null }); setEditing(false); }}><Check className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" aria-label="Cancel" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
        </>
      ) : (
        <>
          <Button size="icon" variant="ghost" aria-label="Edit task" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" aria-label="Delete task" onClick={() => actions.deleteTask(t.id)}><Trash2 className="h-4 w-4" /></Button>
        </>
      )}
    </li>
  );
}
