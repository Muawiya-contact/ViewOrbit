import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminContext = await requireAdminApiAuth(request);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getAdminDb();
    const snapshot = await db.collection("notifications").limit(200).get();

    const notifications = snapshot.docs
      .map((doc) => {
        const data = doc.data() as {
          userId?: string;
          type?: string;
          message?: string;
          isRead?: boolean;
          createdAt?: { toDate?: () => Date };
        };

        return {
          id: doc.id,
          user_id: data.userId ?? "",
          type: data.type ?? "system",
          message: data.message ?? "",
          is_read: Boolean(data.isRead),
          created_at: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        };
      })
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("[admin.notifications] GET failed", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminContext = await requireAdminApiAuth(request);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const userId = String(body.userId ?? "");
  const message = String(body.message ?? "").trim();
  const type = String(body.type ?? "system").toLowerCase();

  if (!userId || !message) {
    return NextResponse.json({ error: "userId and message are required" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const ref = db.collection("notifications").doc();
    await ref.set({
      notificationId: ref.id,
      userId,
      message,
      type,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: adminContext.adminId,
    });

    return NextResponse.json({
      notification: {
        id: ref.id,
        user_id: userId,
        message,
        type,
        is_read: false,
      },
    });
  } catch (error) {
    console.error("[admin.notifications] POST failed", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 400 });
  }
}
