// context/AuthContext.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, increment, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { clearFirebaseAuthCookie, setFirebaseAuthCookie } from "@/lib/auth/firebase-session";
import {
  createUserProfileDoc,
  getUserProfile,
  loginUser,
  logoutUser,
  registerUser,
  type UserProfile,
} from "@/lib/auth";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  register: (
    email: string,
    password: string,
    walletType: "JazzCash" | "EasyPaisa",
    walletNumber: string,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addPoint: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        clearFirebaseAuthCookie();
        setProfile(null);
        setLoading(false);
        return;
      }

      await setFirebaseAuthCookie(firebaseUser);

      const fallbackEmail = firebaseUser.email ?? "";

      try {
        let existingProfile = await getUserProfile(firebaseUser.uid);

        if (!existingProfile) {
          await createUserProfileDoc({
            uid: firebaseUser.uid,
            email: fallbackEmail,
            walletType: "JazzCash",
            walletNumber: "",
          });

          existingProfile = {
            email: fallbackEmail,
            points: 0,
          };
        }

        setProfile(existingProfile);
      } catch (error) {
        console.error("[auth] onAuthStateChanged read/write failed", error);
        setProfile((prev) => ({
          email: prev?.email ?? fallbackEmail,
          points: prev?.points ?? 0,
        }));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      walletType: "JazzCash" | "EasyPaisa",
      walletNumber: string,
    ) => {
      try {
        await registerUser(email, password, walletType, walletNumber);
      } catch (error) {
        console.error("[auth] register failed", error);
        throw error;
      }
    },
    [],
  );

  const login = useCallback(async (email: string, password: string) => {
    try {
      await loginUser(email, password);
    } catch (error) {
      console.error("[auth] login failed", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    clearFirebaseAuthCookie();
  }, []);

  const addPoint = useCallback(async () => {
    if (!user || !profile) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        points: increment(1),
      });

      setProfile((prev) => {
        if (!prev) return prev;
        return { ...prev, points: prev.points + 1 };
      });
    } catch (error) {
      console.error("[auth] addPoint Firestore write failed", error);
      throw error;
    }
  }, [profile, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      register,
      login,
      logout,
      addPoint,
    }),
    [user, profile, loading, register, login, logout, addPoint],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used inside AuthContextProvider");
  }

  return context;
}