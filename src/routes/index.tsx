import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, ListChecks, BookOpen, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useStore, isOverdue, today } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SmartWork AI" },
      { name: "description", content: "Your AI productivity overview: tasks, emails, research and progress in one place." },
      { property: "og:title", content: "SmartWork AI — AI Productivity Workspace" },
      { property: "og:description", content: "Write emails, plan tasks and research topics with AI in one connected workspace." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const tasks = useStore((s) => s.tasks);
  const emails = useStore((s) => s.emails);
  const research = useStore((s) => s.research);
  const name = useStore((s) => s.settings.name);
  const done = tasks.filter((t) => t.done).length;
  const open = tasks.filter((t) => !t.done);
  const overdue = open.filter(isOverdue);
  const dueToday = open.filter((t) => t.due === today());
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const tools = [
    { to: "/email" as const, icon: Mail, title: "Write an email", desc: "Purpose in, polished email out.", color: "text-email" },
    { to: "/tasks" as const, icon: ListChecks, title: "Plan your work", desc: "Turn goals into scheduled tasks.", color: "text-task" },
    { to: "/research" as const, icon: BookOpen, title: "Research a topic", desc: "Summaries, outlines and sources.", color: "text-research" },
  ];

  return (
    <div className="space-y-8">
      <section className="bg-hero rounded-2xl p-8 text-primary-foreground sm:p-10">
        <p className="text-sm opacity-80">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl">
          {greet}
          {name ? `, ${name}` : ""}.
        </h1>
        <p className="mt-3 max-w-lg opacity-85">
          {open.length === 0
            ? "Your slate is clean. Start with a goal, an email or a question."
            : `${open.length} open task${open.length === 1 ? "" : "s"}${overdue.length ? `, ${overdue.length} overdue` : ""}${dueToday.length ? `, ${dueToday.length} due today` : ""}.`}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Stats">
        <Stat label="Tasks completed" value={`${done}/${tasks.length}`}>
          <Progress value={pct} className="mt-3 h-1.5" aria-label={`${pct}% complete`} />
        </Stat>
        <Stat label="Overdue" value={String(overdue.length)} tone={overdue.length ? "text-destructive" : undefined} />
        <Stat label="Saved emails" value={String(emails.length)} />
        <Stat label="Research notes" value={String(research.length)} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {tools.map(({ to, icon: Icon, title, desc, color }) => (
          <Link key={to} to={to} className="group">
            <Card className="h-full p-6 shadow-soft transition-transform group-hover:-translate-y-0.5">
              <Icon className={`h-6 w-6 ${color}`} aria-hidden />
              <h2 className="mt-4 font-display text-2xl">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Up next</h2>
            <Link to="/tasks" className="text-sm font-semibold text-primary">All tasks</Link>
          </div>
          <ul className="mt-4 divide-y">
            {open.length === 0 && <li className="py-6 text-sm text-muted-foreground">No open tasks yet.</li>}
            {[...open]
              .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"))
              .slice(0, 6)
              .map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="flex items-center gap-2">
                    {isOverdue(t) ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
                    {t.title}
                  </span>
                  <span className={isOverdue(t) ? "text-destructive" : "text-muted-foreground"}>{t.due ?? "—"}</span>
                </li>
              ))}
          </ul>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Recently saved</h2>
            <Link to="/saved" className="text-sm font-semibold text-primary">Saved items</Link>
          </div>
          <ul className="mt-4 divide-y">
            {emails.length + research.length === 0 && <li className="py-6 text-sm text-muted-foreground">Nothing saved yet.</li>}
            {[
              ...emails.map((e) => ({ id: e.id, t: e.title, kind: "Email", at: e.createdAt })),
              ...research.map((r) => ({ id: r.id, t: r.topic, kind: "Research", at: r.createdAt })),
            ]
              .sort((a, b) => b.at - a.at)
              .slice(0, 6)
              .map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="truncate">{i.t}</span>
                  <span className={i.kind === "Email" ? "text-email" : "text-research"}>{i.kind}</span>
                </li>
              ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value, tone, children }: { label: string; value: string; tone?: string; children?: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-4xl ${tone ?? ""}`}>{value}</p>
      {children}
    </Card>
  );
}
