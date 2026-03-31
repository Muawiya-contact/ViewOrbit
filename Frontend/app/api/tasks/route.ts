import { NextResponse } from "next/server";
import {
  updateTaskProgress,
} from "@/lib/server/task-engine";
import { withUserApiAuth } from "@/lib/server/api-auth";
import { assignTaskToUser } from "@/lib/server/services/task-assignment-service";

export const GET = withUserApiAuth(async (_request, context) => {
  try {
    const task = await assignTaskToUser(context.uid, context.email);

    if (!task) {
      return NextResponse.json({ error: "No eligible videos available" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("[tasks] GET failed", error);
    return NextResponse.json({ error: "Failed to assign task" }, { status: 500 });
  }
});

export const POST = withUserApiAuth(async (_request, context) => {
  try {
    const task = await assignTaskToUser(context.uid, context.email);

    if (!task) {
      return NextResponse.json({ error: "No more videos available" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("[tasks] POST failed", error);
    return NextResponse.json({ error: "Unable to fetch next task" }, { status: 500 });
  }
});

export const PATCH = withUserApiAuth(async (request, context) => {
  try {
    const body = (await request.json()) as {
      taskId?: string;
      watchProgress?: number;
      likeCompleted?: boolean;
      commentCompleted?: boolean;
      subscribeCompleted?: boolean;
      commentText?: string;
    };

    if (!body.taskId || typeof body.taskId !== "string") {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const task = await updateTaskProgress({
      uid: context.uid,
      taskId: body.taskId,
      watchProgress: body.watchProgress,
      likeCompleted: body.likeCompleted,
      commentCompleted: body.commentCompleted,
      subscribeCompleted: body.subscribeCompleted,
      commentText: body.commentText,
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("[tasks] PATCH failed", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
});
