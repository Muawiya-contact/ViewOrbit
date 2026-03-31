import { NextResponse } from "next/server";
import { withUserApiAuth } from "@/lib/server/api-auth";
import { listAvailableTasksForUser } from "@/lib/server/services/task-assignment-service";

export const GET = withUserApiAuth(async (_request, context) => {
  try {
    const tasks = await listAvailableTasksForUser(context.uid, context.email);

    if (tasks.length === 0) {
      return NextResponse.json({ tasks: [] }, { status: 200 });
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("[tasks.available] GET failed", error);
    return NextResponse.json({ error: "Failed to load available tasks" }, { status: 500 });
  }
});
