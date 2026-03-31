"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Coins, Flame, ChevronDown, LogOut, Settings, Plus, Trash2, X } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type Platform = "youtube" | "tiktok" | "instagram";

export interface PlatformAccount {
  id: string;
  name: string;
  channelId: string;
}

export interface UserStats {
  points: number;
  lastActive: Date | null;
  streak: number;
}

interface AccountSettingsForm {
  displayName: string;
  walletType: "JazzCash" | "EasyPaisa";
  phone: string;
}

interface AddAccountForm {
  name: string;
  channelId: string;
  includeWallet: boolean;
  walletType: "JazzCash" | "EasyPaisa";
  walletNumber: string;
}

interface UserDocShape {
  role?: "user" | "admin";
  points?: number;
  lastActive?: Timestamp | Date | string | null;
  displayName?: string;
  fullName?: string;
  walletType?: "JazzCash" | "EasyPaisa";
  walletNumber?: string;
  phone?: string;
}

interface PlatformAccountDoc {
  name?: string;
  channelId?: string;
}

interface TaskRewardDashboardProps {
  targetUserId?: string;
}

const PLATFORM_META: Record<Platform, { label: string; accent: string; bg: string }> = {
  youtube: {
    label: "YouTube",
    accent: "text-red-600",
    bg: "bg-red-50 border-red-200",
  },
  tiktok: {
    label: "TikTok",
    accent: "text-slate-900",
    bg: "bg-slate-50 border-slate-300",
  },
  instagram: {
    label: "Instagram",
    accent: "text-pink-600",
    bg: "bg-pink-50 border-pink-200",
  },
};

const EMPTY_SETTINGS: AccountSettingsForm = {
  displayName: "",
  walletType: "JazzCash",
  phone: "",
};

const EMPTY_ADD_FORM: AddAccountForm = {
  name: "",
  channelId: "",
  includeWallet: false,
  walletType: "JazzCash",
  walletNumber: "",
};

// Convert Firestore values safely for date math.
function parseDate(value: UserDocShape["lastActive"]): Date | null {
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

// Streak fallback when only lastActive exists.
function calculateStreak(lastActive: Date | null): number {
  if (!lastActive) return 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const activeDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
  const diffDays = Math.floor((today.getTime() - activeDate.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays < 0) return 0;
  return diffDays <= 1 ? 1 : 0;
}

// Auth and role gating. Admin can target any user, non-admin can only edit self.
function useDashboardAccess(targetUserId?: string) {
  const [authUid, setAuthUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [role, setRole] = useState<"user" | "admin">("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setAuthUid(user?.uid ?? null);
      if (!user) {
        setRole("user");
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authUid) return;

    const unsubUser = onSnapshot(
      doc(db, "users", authUid),
      (snapshot) => {
        const userDoc = (snapshot.data() ?? {}) as UserDocShape;
        setRole(userDoc.role === "admin" ? "admin" : "user");
        setLoading(false);
      },
      () => {
        setRole("user");
        setLoading(false);
      },
    );

    return () => unsubUser();
  }, [authUid]);

  const managedUid = useMemo(() => {
    if (!authUid) return null;
    if (role === "admin" && targetUserId) return targetUserId;
    return authUid;
  }, [authUid, role, targetUserId]);

  const canEdit = useMemo(() => {
    if (!authUid || !managedUid) return false;
    return role === "admin" || authUid === managedUid;
  }, [authUid, managedUid, role]);

  return { authUid, managedUid, role, canEdit, loading };
}

// Real-time user stats and account settings profile data.
function useUserStats(managedUid: string | null) {
  const [stats, setStats] = useState<UserStats>({ points: 0, lastActive: null, streak: 0 });
  const [settings, setSettings] = useState<AccountSettingsForm>(EMPTY_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!managedUid) {
      setStats({ points: 0, lastActive: null, streak: 0 });
      setSettings(EMPTY_SETTINGS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, "users", managedUid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        const data = (snapshot.data() ?? {}) as UserDocShape;
        const lastActive = parseDate(data.lastActive ?? null);

        setStats({
          points: Number(data.points ?? 0),
          lastActive,
          streak: calculateStreak(lastActive),
        });

        setSettings({
          displayName: data.displayName ?? data.fullName ?? "",
          walletType: data.walletType ?? "JazzCash",
          phone: data.phone ?? data.walletNumber ?? "",
        });

        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        console.error("[TaskRewardDashboard] Failed to subscribe user stats", snapshotError);
        setStats({ points: 0, lastActive: null, streak: 0 });
        setError("Unable to load user stats.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [managedUid]);

  return { stats, settings, loading, error };
}

// Real-time platform accounts subscription + add/remove handlers.
function usePlatformAccounts(managedUid: string | null, platform: Platform, role: "user" | "admin", canEdit: boolean) {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!managedUid) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const accountsRef = collection(db, "users", managedUid, "platforms", platform, "accounts");

    const unsubscribe = onSnapshot(
      accountsRef,
      (snapshot) => {
        const rows = snapshot.docs.map((item) => {
          const data = item.data() as PlatformAccountDoc;
          return {
            id: item.id,
            name: data.name ?? "Unnamed",
            channelId: data.channelId ?? "",
          } satisfies PlatformAccount;
        });

        setAccounts(rows);
        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        console.error("[TaskRewardDashboard] Failed to subscribe platform accounts", snapshotError);
        setAccounts([]);
        setLoading(false);
        setError("Unable to load platform accounts.");
      },
    );

    return () => unsubscribe();
  }, [managedUid, platform]);

  const addAccount = useCallback(
    async (form: AddAccountForm) => {
      if (!managedUid || !canEdit) {
        return { ok: false, message: "You do not have permission to add accounts." };
      }

      if (!form.name.trim() || !form.channelId.trim()) {
        return { ok: false, message: "Account Name and Channel ID are required." };
      }

      if (form.includeWallet && !form.walletNumber.trim()) {
        return { ok: false, message: "Wallet number is required when wallet info is enabled." };
      }

      if (role === "admin" && accounts.length >= 3) {
        return { ok: false, message: "Admin limit reached: max 3 accounts per platform." };
      }

      try {
        const accountsRef = collection(db, "users", managedUid, "platforms", platform, "accounts");

        await addDoc(accountsRef, {
          name: form.name.trim(),
          channelId: form.channelId.trim(),
          walletType: form.includeWallet ? form.walletType : null,
          walletNumber: form.includeWallet ? form.walletNumber.trim() : null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return { ok: true, message: "Account added." };
      } catch (writeError) {
        console.error("[TaskRewardDashboard] addAccount failed", writeError);
        return { ok: false, message: "Failed to add account." };
      }
    },
    [accounts.length, canEdit, managedUid, platform, role],
  );

  const removeAccount = useCallback(
    async (accountId: string) => {
      if (!managedUid || !canEdit) {
        return { ok: false, message: "You do not have permission to remove accounts." };
      }

      try {
        await deleteDoc(doc(db, "users", managedUid, "platforms", platform, "accounts", accountId));
        return { ok: true, message: "Account removed." };
      } catch (deleteError) {
        console.error("[TaskRewardDashboard] removeAccount failed", deleteError);
        return { ok: false, message: "Failed to remove account." };
      }
    },
    [canEdit, managedUid, platform],
  );

  return { accounts, loading, error, addAccount, removeAccount };
}

// Small hook for top-right dropdown behavior.
function useHeaderMenu() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const closeMenu = useCallback(() => {
    setEditing(false);
    setOpen(false);
  }, []);

  return { open, setOpen, editing, setEditing, closeMenu };
}

interface AddAccountModalProps {
  open: boolean;
  platform: Platform;
  saving: boolean;
  form: AddAccountForm;
  error: string | null;
  onClose: () => void;
  onChange: (next: AddAccountForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

// Reusable modal for adding platform accounts.
function AddAccountModal({ open, platform, saving, form, error, onClose, onChange, onSubmit }: AddAccountModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Add {PLATFORM_META[platform].label} Account</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Account Name
            <input
              value={form.name}
              onChange={(event) => onChange({ ...form, name: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
              placeholder="Creator account name"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Channel ID / Account ID
            <input
              value={form.channelId}
              onChange={(event) => onChange({ ...form, channelId: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
              placeholder="UCxxxx... or account id"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.includeWallet}
              onChange={(event) => onChange({ ...form, includeWallet: event.target.checked })}
            />
            Include wallet info for this platform account
          </label>

          {form.includeWallet ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Wallet Type
                <select
                  value={form.walletType}
                  onChange={(event) =>
                    onChange({
                      ...form,
                      walletType: event.target.value as "JazzCash" | "EasyPaisa",
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                >
                  <option value="JazzCash">JazzCash</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Wallet Number
                <input
                  value={form.walletNumber}
                  onChange={(event) => onChange({ ...form, walletNumber: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                  placeholder="03XX1234567"
                />
              </label>
            </div>
          ) : null}

          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TaskRewardDashboard({ targetUserId }: TaskRewardDashboardProps) {
  const router = useRouter();
  const [activePlatform, setActivePlatform] = useState<Platform>("youtube");
  const [settingsForm, setSettingsForm] = useState<AccountSettingsForm>(EMPTY_SETTINGS);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddAccountForm>(EMPTY_ADD_FORM);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const { managedUid, role, canEdit, loading: accessLoading } = useDashboardAccess(targetUserId);
  const { stats, settings, loading: statsLoading, error: statsError } = useUserStats(managedUid);
  const { open, setOpen, editing, setEditing, closeMenu } = useHeaderMenu();

  const { accounts, loading: accountsLoading, error: accountsError, addAccount, removeAccount } = usePlatformAccounts(
    managedUid,
    activePlatform,
    role,
    canEdit,
  );

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const initials = useMemo(() => {
    const source = settingsForm.displayName.trim();
    if (!source) return "U";
    const parts = source.split(/\s+/).filter(Boolean);
    return `${parts[0]?.[0] ?? "U"}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }, [settingsForm.displayName]);

  const saveAccountSettings = useCallback(async () => {
    if (!managedUid || !canEdit) {
      setSettingsMessage("You do not have permission to edit this account.");
      return;
    }

    if (!settingsForm.displayName.trim()) {
      setSettingsMessage("Display name is required.");
      return;
    }

    if (!settingsForm.phone.trim()) {
      setSettingsMessage("Phone is required.");
      return;
    }

    try {
      setSettingsSaving(true);
      setSettingsMessage(null);

      await updateDoc(doc(db, "users", managedUid), {
        displayName: settingsForm.displayName.trim(),
        fullName: settingsForm.displayName.trim(),
        walletType: settingsForm.walletType,
        phone: settingsForm.phone.trim(),
        walletNumber: settingsForm.phone.trim(),
        updatedAt: serverTimestamp(),
      });

      setSettingsMessage("Account settings updated.");
      setEditing(false);
    } catch (saveError) {
      console.error("[TaskRewardDashboard] save settings failed", saveError);
      setSettingsMessage("Failed to update account settings.");
    } finally {
      setSettingsSaving(false);
    }
  }, [canEdit, managedUid, setEditing, settingsForm.displayName, settingsForm.phone, settingsForm.walletType]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (logoutError) {
      console.error("[TaskRewardDashboard] logout failed", logoutError);
      setSettingsMessage("Logout failed. Please try again.");
    }
  }, [router]);

  const handleAddAccount = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setAddSaving(true);
      setAddError(null);

      const result = await addAccount(addForm);
      setAddSaving(false);

      if (!result.ok) {
        setAddError(result.message);
        return;
      }

      setAddModalOpen(false);
      setAddForm(EMPTY_ADD_FORM);
    },
    [addAccount, addForm],
  );

  const handleRemoveAccount = useCallback(
    async (accountId: string) => {
      const result = await removeAccount(accountId);
      if (!result.ok) {
        setAddError(result.message);
      }
    },
    [removeAccount],
  );

  const loading = accessLoading || statsLoading;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header: live stats + account dropdown */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5">
              <Coins className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold text-amber-700">{loading ? "..." : stats.points}</p>
              <p className="text-xs text-amber-800/80">Points</p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              <p className="text-sm font-semibold text-orange-700">{loading ? "..." : stats.streak}</p>
              <p className="text-xs text-orange-800/80">Streak</p>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {initials}
              </span>
              <span className="hidden sm:inline">Profile</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {open ? (
              <div className="absolute right-0 mt-2 w-[92vw] max-w-sm rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:w-96">
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
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-900">Account Settings</p>
                    <label className="block text-xs font-medium text-slate-600">
                      Name
                      <input
                        value={settingsForm.displayName}
                        onChange={(event) => setSettingsForm((prev) => ({ ...prev, displayName: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                        placeholder="Your name"
                      />
                    </label>
                    <label className="block text-xs font-medium text-slate-600">
                      Wallet
                      <select
                        value={settingsForm.walletType}
                        onChange={(event) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            walletType: event.target.value as "JazzCash" | "EasyPaisa",
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                      >
                        <option value="JazzCash">JazzCash</option>
                        <option value="EasyPaisa">EasyPaisa</option>
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-slate-600">
                      Phone
                      <input
                        value={settingsForm.phone}
                        onChange={(event) => setSettingsForm((prev) => ({ ...prev, phone: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                        placeholder="03XX1234567"
                      />
                    </label>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeMenu}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={settingsSaving}
                        onClick={saveAccountSettings}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {settingsSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}

                {settingsMessage ? (
                  <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">{settingsMessage}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Platform management area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {(statsError || accountsError) ? (
          <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{statsError ?? accountsError}</p>
        ) : null}

        {/* Platform tabs/cards */}
        <section className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(PLATFORM_META) as Platform[]).map((platform) => {
            const isActive = platform === activePlatform;
            return (
              <button
                key={platform}
                type="button"
                onClick={() => setActivePlatform(platform)}
                className={[
                  "rounded-xl border p-4 text-left transition",
                  PLATFORM_META[platform].bg,
                  isActive ? "ring-2 ring-slate-900 shadow-md" : "hover:shadow-sm hover:translate-y-[-1px]",
                ].join(" ")}
              >
                <p className={`text-sm font-semibold ${PLATFORM_META[platform].accent}`}>{PLATFORM_META[platform].label}</p>
                <p className="mt-1 text-xs text-slate-500">Manage linked accounts and IDs</p>
              </button>
            );
          })}
        </section>

        {/* Active platform account list */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{PLATFORM_META[activePlatform].label} Accounts</h2>
              <p className="text-xs text-slate-500">
                {role === "admin" ? "Admin mode: max 3 accounts per platform." : "You can manage your linked accounts."}
              </p>
            </div>
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => {
                setAddError(null);
                setAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Account
            </button>
          </div>

          {accountsLoading ? <p className="text-sm text-slate-500">Loading accounts...</p> : null}

          {!accountsLoading && accounts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No accounts linked yet.</p>
          ) : null}

          <div className="space-y-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{account.name}</p>
                  <p className="text-xs text-slate-500">ID: {account.channelId || "-"}</p>
                </div>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => void handleRemoveAccount(account.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2.5 py-1.5 text-xs text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove Account
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <AddAccountModal
        open={addModalOpen}
        platform={activePlatform}
        saving={addSaving}
        form={addForm}
        error={addError}
        onClose={() => {
          setAddModalOpen(false);
          setAddForm(EMPTY_ADD_FORM);
        }}
        onChange={setAddForm}
        onSubmit={handleAddAccount}
      />

      {/* Security note: client checks are UX guards only; enforce ownership and admin logic in Firestore rules. */}
      {loading ? <div className="pointer-events-none fixed inset-0 z-10" /> : null}
    </div>
  );
}
