import type { ResearchResult } from "@/lib/ai.functions";
import { Badge } from "@/components/ui/badge";

export function ResearchView({ r }: { r: ResearchResult }) {
  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <Section title="Summary"><p>{r.summary}</p></Section>
      <Section title="Key points">
        <ul className="list-disc space-y-1 pl-5">{r.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ul>
      </Section>
      <Section title="Notes"><p className="whitespace-pre-wrap">{r.notes}</p></Section>
      <Section title="Outline">
        <ol className="list-decimal space-y-1 pl-5">{r.outline.map((k, i) => <li key={i}>{k}</li>)}</ol>
      </Section>
      <Section title="Keywords">
        <div className="flex flex-wrap gap-2">{r.keywords.map((k) => <Badge key={k} variant="secondary">{k}</Badge>)}</div>
      </Section>
      <Section title="Suggested sources">
        <ul className="space-y-2">
          {r.sources.map((s, i) => (
            <li key={i}><span className="font-semibold">{s.title}</span> — <span className="text-muted-foreground">{s.note}</span></li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">AI-suggested — verify sources before citing.</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-research">{title}</h3>
      {children}
    </section>
  );
}
