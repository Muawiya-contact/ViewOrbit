import { FieldValue } from "firebase-admin/firestore";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const adminContext = await requireAdminApiAuth(request);
    if (!adminContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getAdminDb();
    const taskId = params.taskId;
    const taskRef = db.collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const task = taskSnap.data() as {
      status?: string;
      assignedUserId?: string;
      userId?: string;
      rewardPoints?: number;
    };

    if ((task.status ?? "") !== 'pending') {
      return NextResponse.json(
        { error: 'Task is not in pending status' },
        { status: 400 }
      );
    }

    await taskRef.set({
      status: 'approved',
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: adminContext.adminId,
    }, { merge: true });

    const userId = task.assignedUserId ?? task.userId;
    const rewardPoints = Number(task.rewardPoints ?? 0);

    if (userId && rewardPoints > 0) {
      await db.collection("users").doc(userId).set({
        points: FieldValue.increment(rewardPoints),
        earnedPoints: FieldValue.increment(rewardPoints),
      }, { merge: true });
    }

    return NextResponse.json({
      success: true,
      message: 'Task approved and points awarded',
    });
  } catch (error) {
    console.error('[admin.tasks.approve] POST failed', error);
    return NextResponse.json(
      { error: 'Failed to approve task' },
      { status: 500 }
    );
  }
}
