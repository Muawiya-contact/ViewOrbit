import { NextResponse } from "next/server";
import { completeTaskAndReward } from "@/lib/server/task-engine";
import { withUserApiAuth } from "@/lib/server/api-auth";

export const POST = withUserApiAuth(async (request, context) => {
  const body = (await request.json()) as { taskId?: string; assignmentId?: string };
  const taskId = typeof body.assignmentId === "string"
    ? body.assignmentId
    : typeof body.taskId === "string"
      ? body.taskId
      : "";

  if (!taskId) {
    return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
  }

  try {
    const result = await completeTaskAndReward(context.uid, taskId);

    return NextResponse.json({
      success: true,
      alreadyRewarded: result.alreadyRewarded,
      pointsAwarded: result.pointsAwarded,
      message: result.alreadyRewarded
        ? "Task already rewarded"
        : "Task completed and reward credited",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Task not found") {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (error.message === "Task is not complete") {
        return NextResponse.json({ error: "Task is not complete" }, { status: 400 });
      }
    }

    console.error("[tasks.complete] POST failed", error);
    return NextResponse.json({ error: "Failed to process task completion" }, { status: 500 });
  }
});
