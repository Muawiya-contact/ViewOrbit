import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
