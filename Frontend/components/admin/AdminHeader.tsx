"use client";

import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/store/useAdminStore";
import { LogOut, Shield } from "lucide-react";

export default function AdminHeader() {
  const router = useRouter();
  const { admin, logout } = useAdminStore();

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-400 text-sm">
                {admin?.fullName} • {admin?.email}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-200 rounded-lg hover:bg-red-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
