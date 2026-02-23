"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/app-store";

const navItems = [
  { href: "/viewer", label: "Viewer", icon: LayoutDashboard },
  { href: "/channel-owner", label: "Channel Owner", icon: Users },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "border-r border-slate-200 bg-white transition-all duration-300",
        sidebarCollapsed ? "w-[84px]" : "w-[260px]",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        <span className={cn("font-bold text-slate-900", sidebarCollapsed && "sr-only")}>ViewOrbit</span>
        <Button variant="ghost" size="sm" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <PanelLeft size={16} />
        </Button>
      </div>

      <nav className="space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100",
                active && "bg-slate-900 text-white hover:bg-slate-900",
              )}
            >
              <Icon size={16} />
              <span className={cn(sidebarCollapsed && "hidden")}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
