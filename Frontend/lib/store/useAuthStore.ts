"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ROUTES } from "@/lib/constants/routes";
import { type AppRole, ROLES } from "@/lib/constants/roles";
import { debugLog, isLocalMode } from "@/lib/config/env";

interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: AppRole;
}

interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
}

interface RegisterPayload {
  email: string;
  password: string;
  fullName?: string;
}

interface UpdateProfilePayload {
  fullName: string;
  email: string;
}

interface AuthResult {
  success: boolean;
  message: string;
}

interface AuthState {
  users: StoredUser[];
  currentUser: SessionUser | null;
  isAuthenticated: boolean;
  role: AppRole | null;
  hasHydrated: boolean;
  register: (payload: RegisterPayload) => AuthResult;
  login: (email: string, password: string) => AuthResult;
  logout: () => void;
  updateProfile: (payload: UpdateProfilePayload) => AuthResult;
  getRoleHomeRoute: (role?: AppRole | null) => string;
  setHasHydrated: (value: boolean) => void;
}

const toSessionUser = (user: StoredUser): SessionUser => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
});

const seededUsers: StoredUser[] = isLocalMode
  ? [
      {
        id: "admin@vieworbit.local",
        fullName: "Local Admin",
        email: "admin@vieworbit.local",
        password: "admin123",
        role: ROLES.ADMIN,
      },
    ]
  : [];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: seededUsers,
      currentUser: null,
      isAuthenticated: false,
      role: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      getRoleHomeRoute: () => ROUTES.HOME,
      register: ({ email, password, fullName }) => {
        const normalizedEmail = email.trim().toLowerCase();
        const exists = get().users.some((user) => user.email.toLowerCase() === normalizedEmail);

        if (exists) {
          return { success: false, message: "Email already exists." };
        }

        const parsedName = fullName?.trim();
        const fallbackName = normalizedEmail.split("@")[0] || "User";

        const newUser: StoredUser = {
          id: normalizedEmail,
          fullName: parsedName && parsedName.length > 1 ? parsedName : fallbackName,
          email: normalizedEmail,
          password,
          role: ROLES.VIEWER,
        };

        set((state) => ({
          users: [...state.users, newUser],
          currentUser: toSessionUser(newUser),
          isAuthenticated: true,
          role: ROLES.VIEWER,
        }));

        debugLog("register", { email: normalizedEmail, role: ROLES.VIEWER });

        return { success: true, message: "Registration successful." };
      },
      login: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const user = get().users.find(
          (candidate) =>
            candidate.email.toLowerCase() === normalizedEmail &&
            candidate.password === password,
        );

        if (!user) {
          return { success: false, message: "Invalid email or password." };
        }

        set({
          currentUser: toSessionUser(user),
          isAuthenticated: true,
          role: user.role,
        });

        debugLog("login", { email: normalizedEmail, role: user.role });

        return { success: true, message: "Login successful." };
      },
      logout: () => set({ currentUser: null, isAuthenticated: false, role: null }),
      updateProfile: ({ fullName, email }) => {
        const state = get();
        if (!state.currentUser) {
          return { success: false, message: "No active session." };
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = fullName.trim();

        if (!normalizedEmail.includes("@")) {
          return { success: false, message: "Enter a valid email." };
        }

        if (normalizedName.length < 2) {
          return { success: false, message: "Name must be at least 2 characters." };
        }

        const emailTaken = state.users.some(
          (user) =>
            user.email.toLowerCase() === normalizedEmail &&
            user.id !== state.currentUser?.id,
        );

        if (emailTaken) {
          return { success: false, message: "Email already in use." };
        }

        const nextUsers = state.users.map((user) => {
          if (user.id !== state.currentUser?.id) return user;
          return {
            ...user,
            id: normalizedEmail,
            fullName: normalizedName,
            email: normalizedEmail,
          };
        });

        set({
          users: nextUsers,
          currentUser: {
            ...state.currentUser,
            id: normalizedEmail,
            fullName: normalizedName,
            email: normalizedEmail,
          },
        });

        debugLog("profile-updated", { email: normalizedEmail });

        return { success: true, message: "Profile updated." };
      },
    }),
    {
      name: "vieworbit-auth-store",
      partialize: (state) => ({
        users: state.users,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
