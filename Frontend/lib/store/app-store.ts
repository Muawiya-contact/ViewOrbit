"use client";

import { create } from "zustand";
import { ROLES, type AppRole } from "@/lib/constants/roles";

interface AppState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  role: AppRole;
  isAuthenticated: boolean;
  token: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  setRole: (role: AppRole) => void;
  loginMock: (role: AppRole) => void;
  logoutMock: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  role: ROLES.VIEWER,
  isAuthenticated: false,
  token: null,
  user: null,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  setRole: (role) => set({ role }),
  loginMock: (role) =>
    set({
      role,
      isAuthenticated: true,
      token: "mock-jwt-token",
      user: {
        id: "mock-user-id",
        name: "ViewOrbit User",
        email: "user@vieworbit.com",
      },
    }),
  logoutMock: () =>
    set({
      isAuthenticated: false,
      token: null,
      user: null,
      mobileSidebarOpen: false,
    }),
}));
