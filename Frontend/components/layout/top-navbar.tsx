"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/viewer": "Viewer Dashboard",
  "/channel-owner": "Channel Owner Dashboard",
  "/admin": "Admin Dashboard",
};

export function TopNavbar() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Dashboard";

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Phase 1 Frontend</div>
    </header>
  );
}
