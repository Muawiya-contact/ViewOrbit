"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { BottomTabNav } from "@/components/layout/BottomTabNav";
import { Topbar } from "@/components/layout/Topbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AppLayout>
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col border-x border-white/10">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4 sm:px-6">{children}</main>
        <BottomTabNav />
      </div>
    </AppLayout>
  );
}
