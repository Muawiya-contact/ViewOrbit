import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getAdminDb, verifyRequestUser } from "@/lib/server/firebase-admin";

export async function GET(request: NextRequest) {
  const user = await verifyRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const userDoc = await db.collection("users").doc(user.uid).get();
  const walletData = userDoc.exists
    ? (userDoc.data() as { points?: number; earnedPoints?: number; updatedAt?: { toDate?: () => Date } })
    : null;

  return NextResponse.json({
    wallet: walletData
      ? {
          userId: user.uid,
          points: Number(walletData.points ?? 0),
          lifetimeEarned: Number(walletData.earnedPoints ?? walletData.points ?? 0),
          updatedAt: walletData.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        }
      : null,
  });
}
