"use client";

import { create } from "zustand";
import type { Role } from "@/lib/types";

interface AppState {
  sidebarCollapsed: boolean;
  role: Role;
  toggleSidebar: () => void;
  setRole: (role: Role) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  role: "viewer",
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setRole: (role) => set({ role }),
}));
