import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/admin-access";
import { createTask } from "@/lib/server/services/platform-service";
import type { TaskType } from "@/lib/types/platform";

const isTaskType = (value: unknown): value is TaskType =>
  value === "view" || value === "like" || value === "subscribe" || value === "comment";

export async function POST(request: NextRequest) {
  const admin = await requireAdminAccess(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as {
      videoId?: string;
      videoUrl?: string;
      channelId?: string;
      taskType?: TaskType;
      rewardPoints?: number;
      maxUsers?: number;
    };

    if (!body.videoId || !body.videoUrl || !body.channelId || !isTaskType(body.taskType)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const task = await createTask({
      videoId: body.videoId,
      videoUrl: body.videoUrl,
      channelId: body.channelId,
      taskType: body.taskType,
      rewardPoints: Number(body.rewardPoints ?? 1),
      maxUsers: Number(body.maxUsers ?? 1),
      createdBy: admin.adminId,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "MAX_ACTIVE_CHANNELS_EXCEEDED") {
      return NextResponse.json({ error: "Maximum 3 active channels allowed" }, { status: 400 });
    }

    console.error("[create-task] POST failed", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
