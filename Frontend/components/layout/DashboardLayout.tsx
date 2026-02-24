"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { BottomTabNav } from "@/components/layout/BottomTabNav";
import { Topbar } from "@/components/layout/Topbar";
import { DASHBOARD_ROUTE_ROLES, ROUTES } from "@/lib/constants/routes";
import { useAuthStore } from "@/lib/store/useAuthStore";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  const getRoleHomeRoute = useAuthStore((state) => state.getRoleHomeRoute);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    const allowedRoles = DASHBOARD_ROUTE_ROLES[pathname];
    if (allowedRoles && role && !allowedRoles.includes(role)) {
      router.replace(getRoleHomeRoute(role));
    }
  }, [getRoleHomeRoute, hasHydrated, isAuthenticated, pathname, role, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <AppLayout className="flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </AppLayout>
    );
  }

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
