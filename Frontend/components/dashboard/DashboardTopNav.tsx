import { Bell } from "lucide-react";

interface DashboardTopNavProps {
  email: string;
}

export function DashboardTopNav({ email }: DashboardTopNavProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
        <button
          type="button"
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground"
          aria-label="User menu"
        >
          User ▾
        </button>
        <div className="hidden rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground md:block">
          {email}
        </div>
      </div>
    </header>
  );
}
