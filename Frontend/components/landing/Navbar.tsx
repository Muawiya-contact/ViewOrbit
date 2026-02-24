"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Instagram, Menu, Music2, X } from "lucide-react";
import { Button } from "@/components/design-system/Button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useWalletStore } from "@/lib/store/useWalletStore";
import { ROUTES } from "@/lib/constants/routes";

const navLinks = [
  { label: "Task Wall", href: "#task-wall" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Platforms", href: "#platforms" },
  { label: "Rewards", href: "#rewards" },
  { label: "Partner", href: "#partner" },
];

export function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const points = useWalletStore((state) => state.getPointsForUser(currentUser?.id));
  const estimatedPkr = Math.floor((points / 1000) * 100);

  const initials = useMemo(() => {
    const name = currentUser?.fullName?.trim();
    if (!name) return "VO";
    const parts = name.split(" ").filter(Boolean);
    return `${parts[0]?.[0] ?? "V"}${parts[1]?.[0] ?? "O"}`.toUpperCase();
  }, [currentUser?.fullName]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A192F]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 lg:px-20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
            VO
          </div>
          <span className="text-lg font-semibold text-white">ViewOrbit</span>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-slate-200 lg:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {currentUser ? (
            <>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Current Points</p>
                  <p className="text-sm font-semibold text-emerald-300">{points}</p>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Estimated PKR</p>
                  <p className="text-sm font-semibold text-white">{estimatedPkr}</p>
                </div>
              </div>
              <Bell className="h-5 w-5 text-slate-300" />
              <Instagram className="h-5 w-5 text-slate-300" />
              <Music2 className="h-5 w-5 text-slate-300" />
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {initials}
                </button>
                <AnimatePresence>
                  {dropdownOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 mt-3 w-60 rounded-2xl border border-white/10 bg-[#0F1B33]/95 p-4 text-sm text-slate-200 shadow-2xl"
                    >
                      <p className="font-semibold text-white">{currentUser.fullName}</p>
                      <p className="text-xs text-slate-400">{currentUser.email}</p>
                      <div className="my-3 h-px bg-white/10" />
                      <button className="block w-full text-left text-sm text-slate-200 hover:text-white">View Profile</button>
                      <button className="mt-2 block w-full text-left text-sm text-slate-200 hover:text-white">Account Settings</button>
                      <button className="mt-3 w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm text-white hover:bg-white/10" onClick={handleLogout}>
                        Logout
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link href={ROUTES.LOGIN} className="text-sm text-slate-200 hover:text-white">Login</Link>
              <Link href={ROUTES.REGISTER}>
                <Button className="h-10">Register</Button>
              </Link>
            </>
          )}
        </div>

        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white lg:hidden" onClick={() => setMenuOpen((prev) => !prev)}>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-white/10 bg-[#0A192F] px-6 pb-6 pt-4 lg:hidden"
          >
            <div className="flex flex-col gap-4 text-sm text-slate-200">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="hover:text-white" onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
              {currentUser ? (
                <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm font-semibold text-white">{currentUser.fullName}</p>
                  <p className="text-xs text-slate-400">{currentUser.email}</p>
                  <button className="mt-2 text-left text-sm text-slate-200">View Profile</button>
                  <button className="text-left text-sm text-slate-200">Account Settings</button>
                  <button className="mt-2 w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href={ROUTES.LOGIN} className="text-slate-200 hover:text-white">Login</Link>
                  <Link href={ROUTES.REGISTER} className="text-slate-200 hover:text-white">Register</Link>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
