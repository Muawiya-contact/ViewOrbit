"use client";

/**
 * Admin authentication and dashboard state store
 * Handles admin session, login state, and admin dashboard data
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminTask {
  id: string;
  platform: string;
  status: "available" | "in-progress" | "pending" | "approved" | "rejected";
  rewardPoints: number;
  progress: number;
  proofUrl?: string;
  userId?: string;
  approvedBy?: string;
  approvedAt?: string;
  userName?: string;
  userEmail?: string;
}

interface AdminState {
  // Auth state
  admin: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  isLoggedIn: boolean;

  // Dashboard data
  tasks: AdminTask[];
  users: Record<string, any>[];
  pendingTasksCount: number;

  // Task filter
  taskFilter: "all" | "pending" | "approved" | "in-progress";

  // Actions
  setAdmin: (admin: AdminUser | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTasks: (tasks: AdminTask[]) => void;
  setUsers: (users: any[]) => void;
  setTaskFilter: (filter: "all" | "pending" | "approved" | "in-progress") => void;
  logout: () => void;
  restoreSession: () => Promise<boolean>;

  // Async actions
  login: (email: string, password: string) => Promise<boolean>;
  fetchPendingTasks: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  approveTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;
  rejectTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      admin: null,
      isLoading: false,
      error: null,
      isLoggedIn: false,
      tasks: [],
      users: [],
      pendingTasksCount: 0,
      taskFilter: "all",

      setAdmin: (admin) => {
        set({ admin, isLoggedIn: !!admin });
      },

      setIsLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      setTasks: (tasks) => {
        const pendingCount = tasks.filter((t) => t.status === "pending").length;
        set({ tasks, pendingTasksCount: pendingCount });
      },

      setUsers: (users: Record<string, any>[]) => set({ users }),

      setTaskFilter: (filter) => set({ taskFilter: filter }),

      logout: () => {
        void fetch("/api/admin/auth/logout", {
          method: "POST",
        }).catch(() => undefined);

        set({
          admin: null,
          isLoggedIn: false,
          tasks: [],
          users: [],
          pendingTasksCount: 0,
          taskFilter: "all",
          error: null,
        });
      },

      restoreSession: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch("/api/admin/auth/session", {
            cache: "no-store",
          });

          if (!response.ok) {
            set({ admin: null, isLoggedIn: false, isLoading: false });
            return false;
          }

          const data = (await response.json()) as { admin?: AdminUser };
          if (!data.admin) {
            set({ admin: null, isLoggedIn: false, isLoading: false });
            return false;
          }

          set({
            admin: data.admin,
            isLoggedIn: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (err) {
          set({
            admin: null,
            isLoggedIn: false,
            isLoading: false,
            error: err instanceof Error ? err.message : "Session restore failed",
          });
          return false;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/admin/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            set({ error: data.error || "Login failed", isLoading: false });
            return false;
          }

          set({
            admin: data.admin,
            isLoggedIn: true,
            isLoading: false,
          });
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Login error";
          set({ error: message, isLoading: false });
          return false;
        }
      },

      fetchPendingTasks: async () => {
        try {
          const response = await fetch("/api/admin/tasks/pending");
          if (response.ok) {
            const data = await response.json();
            get().setTasks(data.tasks || []);
          }
        } catch (err) {
          console.error("Failed to fetch pending tasks:", err);
        }
      },

      fetchAllUsers: async () => {
        try {
          const response = await fetch("/api/admin/users");
          if (response.ok) {
            const data = (await response.json()) as { users?: Record<string, any>[] };
            get().setUsers(data.users || []);
          }
        } catch (err) {
          console.error("Failed to fetch users:", err);
        }
      },

      approveTask: async (taskId: string) => {
        try {
          const response = await fetch(`/api/admin/tasks/${taskId}/approve`, {
            method: "POST",
          });

          if (response.ok) {
            await get().fetchPendingTasks();
            return { success: true };
          }
          const data = await response.json();
          return { success: false, error: data.error || "Approval failed" };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : "Error",
          };
        }
      },

      rejectTask: async (taskId: string) => {
        try {
          const response = await fetch(`/api/admin/tasks/${taskId}/reject`, {
            method: "POST",
          });

          if (response.ok) {
            await get().fetchPendingTasks();
            return { success: true };
          }
          const data = await response.json();
          return { success: false, error: data.error || "Rejection failed" };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : "Error",
          };
        }
      },
    }),
    {
      name: "admin-store",
      partialize: (state) => ({
        admin: state.admin,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);
