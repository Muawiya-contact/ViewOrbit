"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { Button } from "@/components/design-system/Button";
import { DASHBOARD_NAV_ITEMS } from "@/lib/constants/routes";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { cn } from "@/lib/utils";

function SidebarContent() {
  const pathname = usePathname();
  const authRole = useAuthStore((state) => state.role);
  const {
    sidebarCollapsed,
    toggleSidebar,
    closeMobileSidebar,
  } = useAppStore();

  const items = DASHBOARD_NAV_ITEMS.filter((item) => !authRole || item.roles.includes(authRole));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <p className={cn("text-base font-bold", sidebarCollapsed && "sr-only")}>ViewOrbit</p>
        <Button variant="ghost" size="sm" onClick={toggleSidebar} className="hidden md:inline-flex">
          {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </Button>
        <Button variant="ghost" size="sm" onClick={closeMobileSidebar} className="md:hidden">
          <X size={16} />
        </Button>
      </div>

      <nav className="space-y-1 p-3">
        <p className={cn("px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground", sidebarCollapsed && "sr-only")}>Main Zones</p>
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={closeMobileSidebar}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon size={16} />
              <span className={cn(sidebarCollapsed && "hidden")}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, closeMobileSidebar } = useAppStore();

  return (
    <>
      <aside
        className={cn(
          "hidden border-r border-border bg-card md:flex md:flex-col",
          sidebarCollapsed ? "md:w-20" : "md:w-72",
        )}
      >
        <SidebarContent />
      </aside>

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={closeMobileSidebar} />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-card transition-transform md:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
