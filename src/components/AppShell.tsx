import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Mail, ListChecks, BookOpen, Bookmark, Settings, Menu, X, Feather } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Assistant } from "./Assistant";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/email", label: "Email Generator", icon: Mail },
  { to: "/tasks", label: "Task Planner", icon: ListChecks },
  { to: "/research", label: "Research Assistant", icon: BookOpen },
  { to: "/saved", label: "Saved Items", icon: Bookmark },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {nav.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? path === "/" : path.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
        <Feather className="h-5 w-5" aria-hidden />
      </span>
      <span className="font-display text-2xl text-sidebar-foreground">SmartWork AI</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:pl-64">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-8 bg-sidebar p-5 lg:flex">
        <Brand />
        <NavLinks />
        <p className="mt-auto px-2 text-xs text-sidebar-foreground/60">Your work is saved in this browser.</p>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 lg:hidden">
        <Brand />
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {open && (
        <div className="sticky top-[60px] z-30 bg-sidebar px-4 pb-4 lg:hidden">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
      )}

      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
        {children}
      </main>
      <Assistant />
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
