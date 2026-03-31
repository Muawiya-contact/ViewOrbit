import { NextResponse } from "next/server";
import { withUserApiAuth } from "@/lib/server/api-auth";
import { completeTask } from "@/lib/server/services/platform-service";

export const POST = withUserApiAuth(async (request, context) => {
  try {
    const body = (await request.json()) as { assignmentId?: string; proof?: string };
    const assignmentId = String(body.assignmentId ?? "").trim();
    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
    }

    const result = await completeTask({
      assignmentId,
      userId: context.uid,
      proof: body.proof,
    });

    return NextResponse.json({
      success: true,
      rewardPoints: result.rewardPoints,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ASSIGNMENT_NOT_FOUND") {
        return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
      }
      if (error.message === "TASK_NOT_FOUND") {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    console.error("[complete-task] POST failed", error);
    return NextResponse.json({ error: "Failed to complete task" }, { status: 500 });
  }
});
