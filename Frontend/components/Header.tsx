"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Coins, Flame, Settings, LogOut, ChevronDown } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, updateDoc, type Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserStats {
  points: number;
  lastActive: Date | null;
  streak: number;
}

type WalletType = "JazzCash" | "EasyPaisa";

interface UserDocShape {
  points?: number;
  lastActive?: Timestamp | Date | string | null;
  fullName?: string;
  displayName?: string;
  walletType?: WalletType;
  walletNumber?: string;
}

interface AccountFormState {
  displayName: string;
  walletType: WalletType;
  walletNumber: string;
}

const EMPTY_FORM: AccountFormState = {
  displayName: "",
  walletType: "JazzCash",
  walletNumber: "",
};

// Converts Firestore timestamp/date/string into a Date. Returns null when invalid.
function toDate(value: UserDocShape["lastActive"]): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const parsed = value.toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

// With only lastActive available, we can only infer if a streak is currently active.
// If active today or yesterday -> 1 day streak, otherwise 0.
function computeStreak(lastActive: Date | null): number {
  if (!lastActive) return 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
  const diffInDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays <= 1 && diffInDays >= 0) return 1;
  return 0;
}

// Firebase Auth hook for current user uid. Keeps header independent from external auth stores.
function useCurrentUid() {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });

    return () => unsubscribe();
  }, []);

  return uid;
}

// Real-time user stats + account form data from users/{uid} using onSnapshot.
function useUserStats(uid: string | null) {
  const [stats, setStats] = useState<UserStats>({ points: 0, lastActive: null, streak: 0 });
  const [formState, setFormState] = useState<AccountFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setStats({ points: 0, lastActive: null, streak: 0 });
      setFormState(EMPTY_FORM);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const userRef = doc(db, "users", uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        const data = (snapshot.data() ?? {}) as UserDocShape;
        const parsedLastActive = toDate(data.lastActive ?? null);

        setStats({
          points: Number(data.points ?? 0),
          lastActive: parsedLastActive,
          streak: computeStreak(parsedLastActive),
        });

        setFormState({
          displayName: data.displayName ?? data.fullName ?? "",
          walletType: data.walletType ?? "JazzCash",
          walletNumber: data.walletNumber ?? "",
        });

        setLoading(false);
      },
      (snapshotError) => {
        console.error("[Header] Failed to subscribe to user stats", snapshotError);
        setStats({ points: 0, lastActive: null, streak: 0 });
        setLoading(false);
        setError("Could not load live user stats.");
      },
    );

    return () => unsubscribe();
  }, [uid]);

  return {
    stats,
    formState,
    loading,
    error,
  };
}

// Encapsulates dropdown open/close, save profile, and logout behavior.
function useHeaderDropdown(uid: string | null, initialFormState: AccountFormState) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [formState, setFormState] = useState<AccountFormState>(initialFormState);

  useEffect(() => {
    setFormState(initialFormState);
  }, [initialFormState]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setOpen(false);
      setEditing(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const saveSettings = useCallback(async () => {
    if (!uid) {
      setActionError("You must be logged in.");
      return false;
    }

    try {
      setSaving(true);
      setActionError(null);

      await updateDoc(doc(db, "users", uid), {
        displayName: formState.displayName.trim(),
        fullName: formState.displayName.trim(),
        walletType: formState.walletType,
        walletNumber: formState.walletNumber.trim(),
      });

      setEditing(false);
      return true;
    } catch (saveError) {
      console.error("[Header] Failed to save account settings", saveError);
      setActionError("Failed to save account settings.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [formState.displayName, formState.walletNumber, formState.walletType, uid]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (logoutError) {
      console.error("[Header] Logout failed", logoutError);
      setActionError("Logout failed. Please try again.");
    }
  }, [router]);

  return {
    menuRef,
    open,
    setOpen,
    editing,
    setEditing,
    saving,
    actionError,
    formState,
    setFormState,
    saveSettings,
    logout,
  };
}

export default function Header() {
  const uid = useCurrentUid();
  const { stats, formState: syncedFormState, loading, error } = useUserStats(uid);

  const {
    menuRef,
    open,
    setOpen,
    editing,
    setEditing,
    saving,
    actionError,
    formState,
    setFormState,
    saveSettings,
    logout,
  } = useHeaderDropdown(uid, syncedFormState);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveSettings();
  };

  const initials = useMemo(() => {
    const source = formState.displayName.trim();
    if (!source) return "U";

    const pieces = source.split(/\s+/).filter(Boolean);
    return (pieces[0]?.[0] ?? "U").concat(pieces[1]?.[0] ?? "").toUpperCase();
  }, [formState.displayName]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 text-sm sm:text-base">
          <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
            <Coins className="h-4 w-4 text-amber-500" />
            <span className="font-semibold">{loading ? "..." : stats.points}</span>
            <span className="text-xs text-amber-800/80">Points</span>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-orange-700">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-semibold">{loading ? "..." : stats.streak}</span>
            <span className="text-xs text-orange-800/80">Streak</span>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {initials}
            </span>
            <span className="hidden sm:inline">Profile</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {open ? (
            <div className="absolute right-0 mt-2 w-[92vw] max-w-sm rounded-xl border border-slate-200 bg-white p-3 shadow-lg sm:w-96">
              {!editing ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    <Settings className="h-4 w-4" />
                    Account Settings
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <form className="space-y-3" onSubmit={handleSave}>
                  <h3 className="text-sm font-semibold text-slate-900">Account Settings</h3>

                  <label className="block text-xs font-medium text-slate-600">
                    Display Name
                    <input
                      type="text"
                      value={formState.displayName}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          displayName: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-500"
                      placeholder="Your display name"
                    />
                  </label>

                  <label className="block text-xs font-medium text-slate-600">
                    Wallet Type
                    <select
                      value={formState.walletType}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          walletType: event.target.value as WalletType,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-500"
                    >
                      <option value="JazzCash">JazzCash</option>
                      <option value="EasyPaisa">EasyPaisa</option>
                    </select>
                  </label>

                  <label className="block text-xs font-medium text-slate-600">
                    Wallet Number
                    <input
                      type="text"
                      value={formState.walletNumber}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          walletNumber: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-500"
                      placeholder="03XX1234567"
                    />
                  </label>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              )}

              {(error || actionError) ? (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error ?? actionError}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
