import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { requireAdminAccess } from "@/lib/server/admin-access";

export async function GET(request: NextRequest) {
  const admin = await requireAdminAccess(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshot = await getAdminDb().collection("channels").orderBy("createdAt", "desc").get();
  return NextResponse.json({ channels: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminAccess(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { channelName?: string; channelUrl?: string; status?: "active" | "inactive" };
  const channelName = String(body.channelName ?? "").trim();
  const channelUrl = String(body.channelUrl ?? "").trim();
  const status = body.status ?? "active";
  if (!channelName || !channelUrl) {
    return NextResponse.json({ error: "channelName and channelUrl are required" }, { status: 400 });
  }

  const db = getAdminDb();
  if (status === "active") {
    const active = await db.collection("channels").where("status", "==", "active").limit(4).get();
    if (active.size >= 3) {
      return NextResponse.json({ error: "Maximum 3 active channels allowed" }, { status: 400 });
    }
  }

  const ref = db.collection("channels").doc();
  await ref.set({
    channelId: ref.id,
    channelName,
    channelUrl,
    status,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: admin.adminId,
  });

  return NextResponse.json({ success: true, channelId: ref.id }, { status: 201 });
}
