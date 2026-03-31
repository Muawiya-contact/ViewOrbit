"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/store/useAdminStore";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const router = useRouter();
  const { isLoggedIn, restoreSession, isLoading } = useAdminStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isLoggedIn) {
      void restoreSession();
    }
  }, [isLoggedIn, mounted, restoreSession]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !isLoading && !isLoggedIn) {
      router.push("/admin/login");
    }
  }, [mounted, isLoading, isLoggedIn, router]);

  if (!mounted || isLoading) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  if (!isLoggedIn) {
    return null; // Will redirect
  }

  return <AdminDashboard />;
}
