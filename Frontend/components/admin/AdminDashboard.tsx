"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminStore } from "@/lib/store/useAdminStore";
import AdminHeader from "./AdminHeader";
import PendingTasksView from "./PendingTasksView";
import UsersView from "./UsersView";
import { ShieldCheck, Users, ListChecks, Bell, Wallet, Settings2 } from "lucide-react";

type ViewType = "tasks" | "users" | "settings";

export default function AdminDashboard() {
  const [view, setView] = useState<ViewType>("tasks");
  const { fetchPendingTasks, fetchAllUsers, pendingTasksCount, users } = useAdminStore();

  useEffect(() => {
    fetchPendingTasks();
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase text-slate-400">Pending Tasks</p>
            <p className="mt-2 text-2xl font-semibold text-white">{pendingTasksCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase text-slate-400">Total Users</p>
            <p className="mt-2 text-2xl font-semibold text-white">{users.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase text-slate-400">Admin Access</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">Active</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase text-slate-400">Mode</p>
            <p className="mt-2 text-2xl font-semibold text-white">Full Control</p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Site Management</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10">
              <ShieldCheck className="h-4 w-4" /> Overview
            </Link>
            <Link href="/admin/tasks" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10">
              <ListChecks className="h-4 w-4" /> Tasks
            </Link>
            <Link href="/admin/users" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10">
              <Users className="h-4 w-4" /> Users
            </Link>
            <Link href="/admin/payouts" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10">
              <Wallet className="h-4 w-4" /> Payouts
            </Link>
            <Link href="/admin/notifications" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10">
              <Bell className="h-4 w-4" /> Notifications
            </Link>
            <Link href="/admin/rules" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10">
              <Settings2 className="h-4 w-4" /> Rules
            </Link>
            <Link href="/admin/settings" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10">
              <Settings2 className="h-4 w-4" /> Settings
            </Link>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button
            onClick={() => setView("tasks")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              view === "tasks"
                ? "text-blue-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tasks
            {pendingTasksCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-200 text-xs rounded-full">
                {pendingTasksCount}
              </span>
            )}
            {view === "tasks" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>

          <button
            onClick={() => setView("users")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              view === "users"
                ? "text-blue-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Users
            {view === "users" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>

          <button
            onClick={() => setView("settings")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              view === "settings"
                ? "text-blue-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Settings
            {view === "settings" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        </div>

        {/* Content Views */}
        {view === "tasks" && <PendingTasksView />}
        {view === "users" && <UsersView />}
        {view === "settings" && (
          <div className="text-slate-400">Settings coming soon...</div>
        )}
      </main>
    </div>
  );
}
