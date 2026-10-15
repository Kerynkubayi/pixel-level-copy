import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SmartWork AI" },
      { name: "description", content: "Personalise your SmartWork AI workspace." },
      { property: "og:title", content: "Settings — SmartWork AI" },
      { property: "og:description", content: "Set your name, default email tone and signature." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const s = useStore((st) => st.settings);
  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Changes save automatically." />
      <Card className="space-y-5 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" value={s.name} onChange={(e) => actions.setSettings({ name: e.target.value })} maxLength={60} />
        </div>
        <div className="space-y-1.5">
          <Label>Default email tone</Label>
          <Select value={s.defaultTone} onValueChange={(v) => actions.setSettings({ defaultTone: v })}>
            <SelectTrigger aria-label="Default email tone"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Professional", "Friendly", "Formal", "Persuasive", "Apologetic", "Concise"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sig">Email signature</Label>
          <Textarea id="sig" rows={4} value={s.signature} onChange={(e) => actions.setSettings({ signature: e.target.value })} placeholder={"Best regards,\nJane Doe"} maxLength={500} />
        </div>
      </Card>
      <Card className="mt-6 p-6">
        <h2 className="font-display text-2xl">Your data</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tasks, emails and research are stored in this browser only.</p>
        <Button
          variant="destructive"
          className="mt-4"
          onClick={() => {
            if (confirm("Delete all tasks, emails, research and settings?")) {
              actions.clearAll();
              toast("Workspace cleared");
            }
          }}
        >Clear all data</Button>
      </Card>
    </div>
  );
}
