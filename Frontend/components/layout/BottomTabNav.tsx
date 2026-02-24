"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_NAV_ITEMS } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-none -translate-x-1/2 border-t border-white/10 bg-card/85 px-3 pb-4 pt-2 backdrop-blur-xl md:max-w-md">
      <div className="grid grid-cols-4 gap-2">
        {DASHBOARD_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-14 flex-col items-center justify-center rounded-xl text-[11px] font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon size={17} />
              <span className="mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
