import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { getAdminDb } from "@/lib/server/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const adminContext = await requireAdminApiAuth(request);
    if (!adminContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getAdminDb();
    const snapshot = await db.collection("tasks").where("status", "==", "pending").get();

    const userIds = Array.from(
      new Set(
        snapshot.docs
          .map((doc) => {
            const data = doc.data() as { assignedUserId?: string; userId?: string };
            return data.assignedUserId ?? data.userId;
          })
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const users = new Map<string, { username?: string; email?: string }>();
    await Promise.all(
      userIds.map(async (userId) => {
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) return;
        const data = userDoc.data() as { username?: string; email?: string };
        users.set(userId, data);
      }),
    );

    const formattedTasks = snapshot.docs
      .map((doc) => {
        const task = doc.data() as {
          platform?: string;
          status?: string;
          rewardPoints?: number;
          progress?: number;
          watchProgress?: number;
          proofUrl?: string;
          assignedUserId?: string;
          userId?: string;
          approvedBy?: string;
          approvedAt?: { toDate?: () => Date };
          createdAt?: { toDate?: () => Date };
        };

        const userId = task.assignedUserId ?? task.userId ?? "";
        const userProfile = users.get(userId);

        return {
          id: doc.id,
          platform: task.platform ?? "youtube",
          status: task.status ?? "pending",
          rewardPoints: Number(task.rewardPoints ?? 0),
          progress: Number(task.progress ?? task.watchProgress ?? 0),
          proofUrl: task.proofUrl,
          userId,
          userName: userProfile?.username ?? userProfile?.email?.split("@")[0] ?? "Unknown",
          approvedBy: task.approvedBy,
          approvedAt: task.approvedAt?.toDate?.()?.toISOString() ?? null,
          createdAt: task.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        };
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    return NextResponse.json({
      tasks: formattedTasks,
      count: formattedTasks.length,
    });
  } catch (error) {
    console.error("[admin.tasks.pending] GET failed", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
