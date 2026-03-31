import { NextResponse } from "next/server";
import type { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { requireAdminAccess } from "@/lib/server/admin-access";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const toIso = (value: unknown): string => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const maybeTimestamp = value as Timestamp;
  if (typeof maybeTimestamp?.toDate === "function") {
    return maybeTimestamp.toDate().toISOString();
  }
  return new Date().toISOString();
};

export async function GET(request: NextRequest) {
  const admin = await requireAdminAccess(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getAdminDb();
    const snapshot = await db.collection("users").get();

    const formattedUsers = snapshot.docs.map((doc) => {
      const data = doc.data() as {
        email?: string;
        role?: string;
        points?: number;
        streak?: number;
        walletType?: string;
        walletNumber?: string;
        createdAt?: unknown;
        status?: string;
      };

      return {
        id: doc.id,
        email: data.email ?? "",
        role: data.role ?? "user",
        points: Number(data.points ?? 0),
        streak: Number(data.streak ?? 0),
        walletType: data.walletType ?? "",
        walletNumber: data.walletNumber ?? "",
        status: data.status ?? "active",
        createdAt: toIso(data.createdAt),
      };
    });

    formattedUsers.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    return NextResponse.json({
      users: formattedUsers,
      count: formattedUsers.length,
    });
  } catch (error) {
    console.error("[admin.users] GET failed", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
