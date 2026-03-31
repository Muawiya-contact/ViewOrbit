import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { requireAdminAccess } from "@/lib/server/admin-access";

export async function GET(request: NextRequest) {
  const admin = await requireAdminAccess(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const snapshot = await getAdminDb().collection("redemptions").orderBy("createdAt", "desc").limit(300).get();
    const redemptions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ redemptions });
  } catch (error) {
    console.error("[admin.redemptions] GET failed", error);
    return NextResponse.json({ error: "Failed to fetch redemptions" }, { status: 500 });
  }
}
