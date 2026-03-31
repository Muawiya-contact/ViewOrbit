import { NextResponse } from "next/server";
import { withUserApiAuth } from "@/lib/server/api-auth";
import { acceptTaskAssignment, assignTaskToUser } from "@/lib/server/services/task-assignment-service";

export const POST = withUserApiAuth(async (request, context) => {
  try {
    const body = (await request.json()) as { assignmentId?: string; useNext?: boolean };

    if (body.assignmentId) {
      const accepted = await acceptTaskAssignment(context.uid, body.assignmentId);
      if (!accepted) {
        return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, assignmentId: body.assignmentId });
    }

    const task = await assignTaskToUser(context.uid, context.email);
    if (!task) {
      return NextResponse.json({ error: "No eligible videos available" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("[tasks.assign] POST failed", error);
    return NextResponse.json({ error: "Failed to assign task" }, { status: 500 });
  }
});
