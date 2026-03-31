"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";

const links = [
  { href: ROUTES.DASHBOARD, label: "Overview" },
  { href: ROUTES.DASHBOARD_TASKS, label: "Tasks" },
  { href: ROUTES.DASHBOARD_WALLET, label: "Wallet" },
  { href: ROUTES.DASHBOARD_PAYOUT, label: "Payout" },
  { href: ROUTES.DASHBOARD_NOTIFICATIONS, label: "Notifications" },
  { href: ROUTES.DASHBOARD_PROFILE, label: "Profile" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-border bg-card p-4 md:w-64 md:border-b-0 md:border-r md:p-5">
      <p className="mb-4 text-lg font-semibold">ViewOrbit</p>
      <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
