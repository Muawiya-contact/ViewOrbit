import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyRequestUser } from "@/lib/server/firebase-admin";

export async function GET(request: NextRequest) {
  const user = await verifyRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const snapshot = await db.collection("notifications").where("userId", "==", user.uid).get();

  return NextResponse.json({
    notifications: snapshot.docs
      .map((doc) => {
        const notification = doc.data() as {
          type?: string;
          message?: string;
          isRead?: boolean;
          createdAt?: { toDate?: () => Date };
        };

        return {
          id: doc.id,
          type: notification.type ?? "system",
          message: notification.message ?? "",
          isRead: Boolean(notification.isRead),
          createdAt: notification.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        };
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
  });
}

export async function PATCH(request: NextRequest) {
  const user = await verifyRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { notificationId } = await request.json();

  if (!notificationId || typeof notificationId !== "string") {
    return NextResponse.json({ error: "notificationId is required" }, { status: 400 });
  }

  const db = getAdminDb();
  const notificationRef = db.collection("notifications").doc(notificationId);
  const notificationSnap = await notificationRef.get();

  if (!notificationSnap.exists) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  const notification = notificationSnap.data() as { userId?: string };
  if (notification.userId !== user.uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await notificationRef.set({ isRead: true }, { merge: true });

  return NextResponse.json({ success: true });
}
