import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";
import type { WalletType, UserRole } from "@/lib/types/user";

interface CreateUserProfileInput {
  uid: string;
  email: string;
  walletType: WalletType;
  walletNumber: string;
  role?: UserRole;
}

export async function createUserProfile(input: CreateUserProfileInput): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection("users").doc(input.uid);

  await ref.set({
    uid: input.uid,
    email: input.email,
    role: input.role ?? "user",
    walletType: input.walletType,
    walletNumber: input.walletNumber,
    points: 10,
    streak: 0,
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    lastLogin: FieldValue.serverTimestamp(),
  });
}

export async function markUserLastLogin(uid: string): Promise<void> {
  const db = getAdminDb();
  await db.collection("users").doc(uid).set(
    {
      lastLogin: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getUserProfile(uid: string): Promise<{
  uid: string;
  email: string;
  points: number;
  walletType: WalletType;
  walletNumber: string;
  streak: number;
  role: UserRole;
  status: "active";
  createdAt: Timestamp | null;
  lastLogin: Timestamp | null;
} | null> {
  const db = getAdminDb();
  const snapshot = await db.collection("users").doc(uid).get();
  if (!snapshot.exists) return null;

  const data = snapshot.data() as {
    uid?: string;
    email?: string;
    points?: number;
    walletType?: WalletType;
    walletNumber?: string;
    streak?: number;
    role?: UserRole;
    status?: "active";
    createdAt?: Timestamp;
    lastLogin?: Timestamp;
  };

  return {
    uid: data.uid ?? uid,
    email: data.email ?? "",
    points: Number(data.points ?? 10),
    walletType: data.walletType ?? "JazzCash",
    walletNumber: data.walletNumber ?? "",
    streak: Number(data.streak ?? 0),
    role: data.role ?? "user",
    status: data.status ?? "active",
    createdAt: data.createdAt ?? null,
    lastLogin: data.lastLogin ?? null,
  };
}
