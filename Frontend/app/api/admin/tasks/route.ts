import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { requireAdminAccess } from "@/lib/server/admin-access";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminContext = await requireAdminAccess(request);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getAdminDb();
    const snapshot = await db.collection("tasks").get();

    const tasks = snapshot.docs
      .map((doc) => {
        const data = doc.data() as {
          videoId?: string;
          channelId?: string;
          taskType?: string;
          rewardPoints?: number;
          maxUsers?: number;
          status?: string;
          createdAt?: { toDate?: () => Date };
        };

        return {
          id: doc.id,
          taskId: doc.id,
          videoId: data.videoId ?? "",
          channelId: data.channelId ?? "",
          taskType: data.taskType ?? "view",
          reward_points: Number(data.rewardPoints ?? 0),
          maxUsers: Number(data.maxUsers ?? 1),
          status: data.status ?? "active",
          created_at: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        };
      })
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("[admin.tasks] GET failed", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminContext = await requireAdminAccess(request);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const db = getAdminDb();
    const ref = db.collection("tasks").doc();

    const payload = {
      taskId: ref.id,
      videoId: String(body.videoId ?? ""),
      channelId: String(body.channelId ?? ""),
      taskType: String(body.taskType ?? "view").toLowerCase(),
      rewardPoints: Number(body.rewardPoints ?? 0),
      maxUsers: Number(body.maxUsers ?? 1),
      createdAt: FieldValue.serverTimestamp(),
      status: String(body.status ?? "active").toLowerCase(),
    };

    await ref.set(payload);

    return NextResponse.json({ task: { id: ref.id, ...payload } });
  } catch (error) {
    console.error("[admin.tasks] POST failed", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const adminContext = await requireAdminAccess(request);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const taskId = String(body.taskId ?? "");
    if (!taskId) return NextResponse.json({ error: "taskId is required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (body.videoId !== undefined) updates.videoId = String(body.videoId);
    if (body.channelId !== undefined) updates.channelId = String(body.channelId);
    if (body.taskType !== undefined) updates.taskType = String(body.taskType).toLowerCase();
    if (body.rewardPoints !== undefined) updates.rewardPoints = Number(body.rewardPoints);
    if (body.maxUsers !== undefined) updates.maxUsers = Number(body.maxUsers);
    if (body.status !== undefined) updates.status = String(body.status).toLowerCase();
    updates.updatedAt = FieldValue.serverTimestamp();

    const db = getAdminDb();
    await db.collection("tasks").doc(taskId).set(updates, { merge: true });

    return NextResponse.json({ task: { id: taskId, ...updates } });
  } catch (error) {
    console.error("[admin.tasks] PATCH failed", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const adminContext = await requireAdminAccess(request);
  if (!adminContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const taskId = request.nextUrl.searchParams.get("taskId");
    if (!taskId) return NextResponse.json({ error: "taskId is required" }, { status: 400 });

    const db = getAdminDb();
    await db.collection("tasks").doc(taskId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin.tasks] DELETE failed", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 400 });
  }
}
