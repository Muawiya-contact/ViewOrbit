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

    const task = taskSnap.data() as { status?: string };

    if ((task.status ?? "") !== 'pending') {
      return NextResponse.json(
        { error: 'Task is not in pending status' },
        { status: 400 }
      );
    }

    await taskRef.set({
      status: 'in-progress',
      approvedAt: null,
      approvedBy: adminContext.adminId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Task rejected and reset to in-progress',
    });
  } catch (error) {
    console.error('[admin.tasks.reject] POST failed', error);
    return NextResponse.json(
      { error: 'Failed to reject task' },
      { status: 500 }
    );
  }
}
