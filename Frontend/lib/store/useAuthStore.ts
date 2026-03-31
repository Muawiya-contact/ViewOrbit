"use client";

import { create } from "zustand";
import type { User as FirebaseUser } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import { ROUTES, ROLE_HOME_ROUTE } from "@/lib/constants/routes";
import { type AppRole, ROLES } from "@/lib/constants/roles";
import { debugLog } from "@/lib/config/env";
import { toAuthUser } from "@/lib/auth/user";
import { auth } from "@/lib/firebase";
import { clearFirebaseAuthCookie, setFirebaseAuthCookie } from "../auth/firebase-session";

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
  currentUser: SessionUser | null;
  isAuthenticated: boolean;
  role: AppRole | null;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (payload: RegisterPayload) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<AuthResult>;
  syncSession: () => Promise<void>;
  initializeAuthListener: () => () => void;
  getRoleHomeRoute: (role?: AppRole | null) => string;
}

const applyUserToState = (user: FirebaseUser | null) => {
  const mappedUser = toAuthUser(user);

  if (!mappedUser) {
    return {
      currentUser: null,
      isAuthenticated: false,
      role: null,
    };
  }

  return {
    currentUser: {
      id: mappedUser.id,
      fullName: mappedUser.fullName,
      email: mappedUser.email,
      role: mappedUser.role,
    },
    isAuthenticated: true,
    role: mappedUser.role,
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  role: null,
  hasHydrated: false,
  getRoleHomeRoute: (role) => {
    const resolvedRole = role ?? get().role ?? ROLES.VIEWER;
    return ROLE_HOME_ROUTE[resolvedRole] ?? ROUTES.HOME;
  },
  syncSession: async () => {
    const user = auth.currentUser;

    if (user) {
      await setFirebaseAuthCookie(user);
    } else {
      clearFirebaseAuthCookie();
    }

    set({
      ...applyUserToState(user),
      hasHydrated: true,
    });
  },
  initializeAuthListener: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await setFirebaseAuthCookie(user);
      } else {
        clearFirebaseAuthCookie();
      }

      set({
        ...applyUserToState(user),
        hasHydrated: true,
      });

      debugLog("auth-state-change", {
        userId: user?.uid,
      });
    });

    return () => unsubscribe();
  },
  register: async ({ email, password, fullName }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const parsedName = fullName?.trim();

    try {
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

      if (parsedName && parsedName.length > 1) {
        await updateFirebaseProfile(credential.user, {
          displayName: parsedName,
        });
      }

      await setFirebaseAuthCookie(credential.user);

      set({
        ...applyUserToState(credential.user),
        hasHydrated: true,
      });

      debugLog("register", { email: normalizedEmail, role: ROLES.VIEWER });

      return { success: true, message: "Registration successful." };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Registration failed.",
      };
    }
  },
  login: async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      await setFirebaseAuthCookie(credential.user);

      set({
        ...applyUserToState(credential.user),
        hasHydrated: true,
      });

      debugLog("login", { email: normalizedEmail, role: toAuthUser(credential.user)?.role });

      return { success: true, message: "Login successful." };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";

      if (message.toLowerCase().includes("invalid")) {
        return {
          success: false,
          message: "Invalid email or password for user login. If this is an admin account, use /admin/login.",
        };
      }

      return { success: false, message };
    }
  },
  logout: async () => {
    await signOut(auth);
    clearFirebaseAuthCookie();
    set({ currentUser: null, isAuthenticated: false, role: null, hasHydrated: true });
  },
  updateProfile: async ({ fullName, email }) => {
    const state = get();
    if (!state.currentUser || !auth.currentUser) {
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

    try {
      if (auth.currentUser.email !== normalizedEmail) {
        await updateEmail(auth.currentUser, normalizedEmail);
      }

      await updateFirebaseProfile(auth.currentUser, {
        displayName: normalizedName,
      });

      await get().syncSession();

      debugLog("profile-updated", { email: normalizedEmail });

      return { success: true, message: "Profile updated." };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update profile.",
      };
    }
  },
}));
