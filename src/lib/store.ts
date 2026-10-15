import { useSyncExternalStore } from "react";
import type { ResearchResult } from "./ai.functions";

export type Priority = "high" | "medium" | "low";
export type Task = {
  id: string;
  title: string;
  priority: Priority;
  due: string | null; // YYYY-MM-DD
  minutes?: number;
  done: boolean;
  note?: string;
  source?: string;
  createdAt: number;
};
export type SavedEmail = { id: string; title: string; body: string; tone: string; createdAt: number };
export type SavedResearch = { id: string; topic: string; result: ResearchResult; createdAt: number };
export type Settings = { name: string; defaultTone: string; signature: string };
export type EmailDraft = { purpose: string; points: string };

type State = {
  tasks: Task[];
  emails: SavedEmail[];
  research: SavedResearch[];
  settings: Settings;
  emailDraft: EmailDraft | null;
  goalDraft: string | null;
};

const KEY = "smartwork-ai-v1";
const initial: State = {
  tasks: [],
  emails: [],
  research: [],
  settings: { name: "", defaultTone: "Professional", signature: "" },
  emailDraft: null,
  goalDraft: null,
};

let state: State = initial;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...initial, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}

export function setState(fn: (s: State) => State) {
  load();
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => {
      load();
      return sel(state);
    },
    () => sel(initial),
  );
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
export const isOverdue = (t: Task) => !t.done && !!t.due && t.due < today();

export const actions = {
  addTasks(items: Omit<Task, "id" | "createdAt" | "done">[]) {
    setState((s) => ({
      ...s,
      tasks: [...items.map((i) => ({ ...i, id: uid(), done: false, createdAt: Date.now() })), ...s.tasks],
    }));
  },
  updateTask(id: string, patch: Partial<Task>) {
    setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  },
  deleteTask(id: string) {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  },
  saveEmail(e: Omit<SavedEmail, "id" | "createdAt">) {
    setState((s) => ({ ...s, emails: [{ ...e, id: uid(), createdAt: Date.now() }, ...s.emails] }));
  },
  updateEmail(id: string, patch: Partial<SavedEmail>) {
    setState((s) => ({ ...s, emails: s.emails.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  },
  deleteEmail(id: string) {
    setState((s) => ({ ...s, emails: s.emails.filter((e) => e.id !== id) }));
  },
  saveResearch(topic: string, result: ResearchResult) {
    setState((s) => ({ ...s, research: [{ id: uid(), topic, result, createdAt: Date.now() }, ...s.research] }));
  },
  deleteResearch(id: string) {
    setState((s) => ({ ...s, research: s.research.filter((r) => r.id !== id) }));
  },
  setSettings(p: Partial<Settings>) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...p } }));
  },
  setEmailDraft(d: EmailDraft | null) {
    setState((s) => ({ ...s, emailDraft: d }));
  },
  setGoalDraft(g: string | null) {
    setState((s) => ({ ...s, goalDraft: g }));
  },
  clearAll() {
    setState(() => initial);
  },
};

export function researchToText(r: ResearchResult) {
  return [
    r.summary,
    "",
    "Key points:",
    ...r.keyPoints.map((k) => `- ${k}`),
  ].join("\n");
}

export function errMsg(e: unknown) {
  if (e instanceof Error) return e.message.slice(0, 300);
  return "Something went wrong. Please try again.";
}
